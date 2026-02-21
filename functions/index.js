// ─────────────────────────────────────────────────────────────────────────────
// functions/index.js  —  Firebase Cloud Functions
//
// LESSON: Cloud Functions let you run server-side Node.js code without
// managing any servers. Firebase handles scaling, uptime, and execution.
//
// This file exports one scheduled function:
//   syncF1Data — runs every day at 06:00 UTC via Cloud Scheduler (cron).
//                Fetches the latest race results and standings from the
//                Jolpica F1 API and writes them into Firestore.
//
// Why server-side instead of fetching from the browser?
//   1. The browser can't reliably schedule recurring tasks.
//   2. Centralising the write in a trusted environment means we can use
//      the Admin SDK, which bypasses Firestore Security Rules — safe because
//      the client never touches these documents directly.
//   3. Rate limiting / caching lives in one place, not spread across clients.
//
// Jolpica F1 API docs: https://github.com/jolpica/jolpica-f1
// It is the maintained successor to the retired Ergast Developer API.
// No API key required — free and open.
// ─────────────────────────────────────────────────────────────────────────────

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger }     = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// ── Constants ─────────────────────────────────────────────────────────────────

const SEASON  = 2026;
const API     = 'https://api.jolpi.ca/ergast/f1';

// ── Helper: fetch JSON with timeout ──────────────────────────────────────────
//
// LESSON: The native fetch() is available in Node.js 18+ (which Cloud Functions
// Node 20 supports). No extra packages needed.
// We wrap it to add a timeout so a slow API doesn't hang the function forever.

async function fetchJSON(url) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), 10_000); // 10 s timeout
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── The scheduled function ────────────────────────────────────────────────────
//
// LESSON: onSchedule uses Cloud Scheduler under the hood (Google's managed cron
// service). The schedule string is a standard Unix cron expression:
//   '0 6 * * *'  =  "at 06:00 UTC every day"
//
// Most F1 races finish by ~15:00–18:00 local time on Sundays, which is
// typically 13:00–17:00 UTC. Running at 06:00 UTC catches any race that
// finished the previous day, and picks up Monday-finish races the next morning.

exports.syncF1Data = onSchedule(
  {
    schedule:  '0 6 * * *',   // daily at 06:00 UTC
    timeZone:  'UTC',
    region:    'us-central1', // must match your Firestore region (nam5)
    memory:    '256MiB',
  },
  async (event) => {
    logger.info(`syncF1Data — syncing ${SEASON} F1 data`);

    try {
      // Run all three API calls in parallel — no reason to wait sequentially
      const [resultsData, driverData, constructorData] = await Promise.all([
        fetchJSON(`${API}/${SEASON}/last/results/`),
        fetchJSON(`${API}/${SEASON}/driverStandings/`),
        fetchJSON(`${API}/${SEASON}/constructorStandings/`),
      ]);

      // Use a Firestore batch so all writes succeed or fail together
      // LESSON: Batched writes are atomic — you never end up with partial data.
      const batch = db.batch();

      // ── Race results ────────────────────────────────────────────────────────

      const races = resultsData?.MRData?.RaceTable?.Races ?? [];

      if (races.length > 0) {
        const race  = races[0]; // /last/ always returns exactly one race
        const docId = `${SEASON}_${String(race.round).padStart(2, '0')}`; // e.g. "2026_01"

        const results = (race.Results ?? []).map(r => ({
          position:    Number(r.position),
          driverCode:  r.Driver.code,
          driverName:  `${r.Driver.givenName} ${r.Driver.familyName}`,
          constructor: r.Constructor.name,
          grid:        Number(r.grid),
          laps:        Number(r.laps),
          status:      r.status,
          points:      Number(r.points),
          time:        r.Time?.time ?? null,
          fastestLap:  r.FastestLap?.Time?.time ?? null,
        }));

        batch.set(db.collection('results').doc(docId), {
          season:    Number(race.season),
          round:     Number(race.round),
          raceName:  race.raceName,
          date:      race.date,
          circuit:   race.Circuit.circuitName,
          results,
          updatedAt: FieldValue.serverTimestamp(),
        });

        logger.info(`Wrote results for Round ${race.round}: ${race.raceName}`);
      } else {
        // No races completed yet — season hasn't started or API has no data
        logger.info('No race results available yet — season may not have started');
      }

      // ── Driver standings ────────────────────────────────────────────────────

      const driverLists = driverData?.MRData?.StandingsTable?.StandingsLists ?? [];

      if (driverLists.length > 0) {
        const list     = driverLists[0];
        const standings = (list.DriverStandings ?? []).map(s => ({
          position:    Number(s.position),
          driverCode:  s.Driver.code,
          driverName:  `${s.Driver.givenName} ${s.Driver.familyName}`,
          nationality: s.Driver.nationality,
          constructor: s.Constructors[0]?.name ?? '—',
          points:      Number(s.points),
          wins:        Number(s.wins),
        }));

        batch.set(db.collection('standings').doc('drivers'), {
          season:     Number(list.season),
          round:      Number(list.round),
          standings,
          updatedAt:  FieldValue.serverTimestamp(),
        });

        logger.info(`Wrote driver standings — Round ${list.round}, ${standings.length} drivers`);
      }

      // ── Constructor standings ───────────────────────────────────────────────

      const constructorLists = constructorData?.MRData?.StandingsTable?.StandingsLists ?? [];

      if (constructorLists.length > 0) {
        const list     = constructorLists[0];
        const standings = (list.ConstructorStandings ?? []).map(s => ({
          position: Number(s.position),
          name:     s.Constructor.name,
          nationality: s.Constructor.nationality,
          points:   Number(s.points),
          wins:     Number(s.wins),
        }));

        batch.set(db.collection('standings').doc('constructors'), {
          season:     Number(list.season),
          round:      Number(list.round),
          standings,
          updatedAt:  FieldValue.serverTimestamp(),
        });

        logger.info(`Wrote constructor standings — ${standings.length} constructors`);
      }

      // Commit everything atomically
      await batch.commit();
      logger.info('syncF1Data complete ✓');

    } catch (err) {
      logger.error('syncF1Data failed:', err);
      throw err; // re-throw so Cloud Functions marks the invocation as failed
    }
  }
);
