// ─────────────────────────────────────────────────────────────────────────────
// functions/index.js  —  Firebase Cloud Functions
//
// LESSON: Cloud Functions let you run server-side Node.js code without
// managing any servers. Firebase handles scaling, uptime, and execution.
//
// This file exports two functions:
//
//   syncF1Data    — Scheduled. Runs every day at 06:00 UTC via Cloud Scheduler.
//                   Fetches the latest race results and standings from the
//                   Jolpica F1 API and writes them into Firestore.
//
//   askF1Expert   — HTTP Callable. Called from the React frontend chatbot UI.
//                   Receives a conversation history + user context, builds an
//                   F1-expert system prompt, and queries Gemini 2.0 Flash with
//                   native Google Search grounding enabled so it can look up
//                   live standings, news, and race results in real time.
//
// Why use onCall (Callable) instead of onRequest (plain HTTP)?
//   onCall automatically:
//     • Verifies the Firebase Auth ID token — no manual auth header parsing
//     • Handles CORS — no cors() middleware needed
//     • Wraps errors in a standard HttpsError format the client SDK understands
//
// Jolpica F1 API docs: https://github.com/jolpica/jolpica-f1
// It is the maintained successor to the retired Ergast Developer API.
// No API key required — free and open.
// ─────────────────────────────────────────────────────────────────────────────

const { onSchedule }               = require('firebase-functions/v2/scheduler');
const { onRequest }                = require('firebase-functions/v2/https');
const { logger }                   = require('firebase-functions');
const { initializeApp }            = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth }                  = require('firebase-admin/auth');
const { GoogleGenerativeAI }       = require('@google/generative-ai');

initializeApp();
const db    = getFirestore();
const auth  = getAuth();

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

// ── askF1Expert ───────────────────────────────────────────────────────────────
//
// LESSON: This is an HTTP function (onRequest) rather than a Callable (onCall).
// We route it through Firebase Hosting rewrites (/api/askF1Expert → Cloud Run)
// which lets Firebase Hosting act as an authenticated internal proxy — this is
// the recommended pattern when a GCP org policy blocks allUsers IAM bindings.
//
// Because we use onRequest, we handle three things that onCall does automatically:
//   1. CORS — we set Access-Control-Allow-* headers manually
//   2. Auth — we extract the Firebase ID token from the Authorization header
//              and verify it using the Admin SDK's auth().verifyIdToken()
//   3. Response format — we call res.json() directly
//
// The function itself:
//   1. Validates the caller is authenticated via Firebase ID token
//   2. Builds a rich F1-expert system prompt with the user's known preferences
//   3. Sends the full conversation history to Gemini (short-term memory)
//   4. Enables Gemini's native googleSearch tool for live data lookups
//   5. Parses any new user facts the model extracted for long-term memory
//
// Google Search grounding is a first-class Gemini feature — no extra API keys.
// The model decides autonomously when to search Google vs answer from training.

// Allowed origins for CORS — only our own domains can call this endpoint
const ALLOWED_ORIGINS = [
  'https://f1.vanemmerik.ai',
  'https://f1-fan-hub-b9098.web.app',
  'https://f1-fan-hub-b9098.firebaseapp.com',
  'http://localhost:5173',  // Vite dev server for local testing
];

exports.askF1Expert = onRequest(
  {
    region:         'us-central1',
    memory:         '512MiB',
    timeoutSeconds: 60,   // longer than default — search + inference can take ~10–20 s
  },
  async (req, res) => {

    // ── CORS ──────────────────────────────────────────────────────────────────
    // LESSON: CORS (Cross-Origin Resource Sharing) is a browser security feature.
    // When a web page calls an API on a different domain, the browser first sends
    // an OPTIONS "preflight" request to check permission. We must respond with the
    // correct headers or the browser will block the real request.
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age',       '3600');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // ── Auth — verify Firebase ID token ──────────────────────────────────────
    // LESSON: The client sends the user's Firebase ID token in the Authorization
    // header as a Bearer token. The Admin SDK's verifyIdToken() validates that
    // the token is genuine (signed by Google, not expired, not revoked).
    // This is the server-side counterpart of the client's user.getIdToken().
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header.' });
      return;
    }
    const idToken = authHeader.slice(7); // strip 'Bearer '

    let uid;
    try {
      const decoded = await auth.verifyIdToken(idToken);
      uid           = decoded.uid;
    } catch (err) {
      logger.warn('askF1Expert: invalid token', err.message);
      res.status(401).json({ error: 'Unauthorized — invalid token.' });
      return;
    }

    // ── Parse request body ────────────────────────────────────────────────────
    const { messages, userContext } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required.' });
      return;
    }

    // ── Initialise Gemini ─────────────────────────────────────────────────────
    // LESSON: The API key lives in functions/.env which Firebase loads at deploy
    // time into process.env. Never hardcode secrets — always use env vars.
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Build the system instruction — injecting the user's known preferences so
    // the model can give personalised answers from the very first message.
    const favouriteDriver = userContext?.favouriteDriver || null;
    const knownFacts      = userContext?.facts           || [];

    const systemInstruction = `You are an expert F1 assistant on the F1 2026 Fan Hub — a fan-made site dedicated to the 2026 Formula 1 season.

SEASON CONTEXT:
- Season: 2026 Formula 1 World Championship
- First race: Australian Grand Prix, 8 March 2026, Melbourne
- 24 races total, 22 drivers, 11 teams
- Key teams: Red Bull, Ferrari, Mercedes, McLaren, Aston Martin, Alpine, Williams, Haas, VCARB, Kick Sauber
- New rules: 2026 is a major regulation reset year (new power unit regs, new aerodynamic rules)

USER CONTEXT:
${favouriteDriver ? `- Favourite driver: ${favouriteDriver}` : '- Favourite driver: not set yet'}
${knownFacts.length > 0 ? `- Known facts about this user:\n${knownFacts.map(f => `  • ${f}`).join('\n')}` : '- No saved preferences yet'}

BEHAVIOUR:
- Use Google Search to find current standings, race results, breaking news, driver transfers, and any live F1 data.
- Be conversational, enthusiastic, and knowledgeable — like talking to a fellow F1 fan who also happens to be an expert.
- Personalise responses using the user's favourite driver and known facts when relevant.
- Keep responses concise but complete. Use bullet points for lists (standings, results).
- If asked about the user's favourite driver, give extra depth and enthusiasm.

MEMORY EXTRACTION:
Append a JSON block in the exact format {"newFacts": ["fact about user preference 1", "fact about user preference 2"]} ONLY when you learn something genuinely new and useful about this specific user's preferences. Do NOT wrap it in markdown code fences (e.g., \`\`\`json). Only include facts that are personal preferences or interests (favourite driver, favourite team, topics they care about). Do NOT include facts about F1 itself. If there are no new user facts, do not include the JSON block at all. This means your response should either end with your natural language reply, or with your natural language reply followed by the JSON block. Do NOT include an empty JSON block if there are no new facts.`;

    // ── Prepare conversation history ──────────────────────────────────────────
    // LESSON: Gemini's multi-turn API expects history as an array of Content
    // objects: { role: 'user'|'model', parts: [{ text: '...' }] }
    // We separate the last user message from the history because startChat()
    // takes prior history, then sendMessage() sends the new turn.
    const history = messages.slice(0, -1).map(m => ({
      role:  m.role,
      parts: [{ text: m.text }],
    }));
    const lastMsg = messages[messages.length - 1].text;

    // ── Call Gemini with Google Search grounding ──────────────────────────────
    // LESSON: Enabling the googleSearch tool is a single line. Gemini decides
    // autonomously when a question needs a live search vs can be answered from
    // training data. You don't write any search logic yourself.
    const model = genAI.getGenerativeModel({
      model:             'gemini-2.0-flash',
      systemInstruction,
      tools:             [{ googleSearch: {} }],
    });

    let result;
    try {
      const chat = model.startChat({ history });
      result     = await chat.sendMessage(lastMsg);
    } catch (err) {
      logger.error('Gemini API error:', err);
      res.status(500).json({ error: 'AI service error. Please try again.' });
      return;
    }

    const candidate = result.response.candidates?.[0];
    if (!candidate) {
      res.status(500).json({ error: 'No response from AI. Please try again.' });
      return;
    }

    // ── Extract reply text ────────────────────────────────────────────────────
    let replyText = candidate.content.parts.map(p => p.text || '').join('');

    // ── Extract newFacts the model may have appended ──────────────────────────
    // The system prompt instructs the model to append {"newFacts":[...]} when
    // it learns something about the user. We parse it out here and strip it
    // from the visible reply so users don't see raw JSON.
    let newFacts = [];
    // Regex to find the JSON block at the end, optionally wrapped in markdown code fences.
    // This more robust regex will capture either the full ```json ... ``` block or a raw { "newFacts": [...] } at the end.
    const factsMatch = replyText.match(/(```json\n?([\s\S]*?)\n?```\s*$|\{"newFacts":\s*\[[\s\S]*?\]\}\s*$)/);

    if (factsMatch) {
      try {
        // Group 2 is the content inside ```json, Group 1 is the full match including fences if found, Group 0 is the full match
        const jsonContent = factsMatch[2] || factsMatch[1]; // Prioritize content inside fences
        const parsed = JSON.parse(jsonContent);
        if (parsed && parsed.newFacts && Array.isArray(parsed.newFacts)) {
          newFacts = parsed.newFacts;
        }
        replyText = replyText.replace(factsMatch[0], '').trim();
      } catch {
        // Malformed JSON from model or unexpected structure — safe to ignore, facts just won't be saved
      }
    }

    // ── Extract grounding sources ─────────────────────────────────────────────
    // When Gemini uses Google Search, groundingMetadata contains the web sources
    // it retrieved. We pass these back to the client to show as citations.
    // LESSON: groundingChunks is an array where each entry has a web.uri and
    // web.title. The client renders them as clickable source links.
    const groundingChunks = candidate.groundingMetadata?.groundingChunks ?? [];
    const sources = groundingChunks
      .filter(c => c.web?.uri)
      .map(c => ({ url: c.web.uri, title: c.web.title || c.web.uri }))
      .filter((s, i, arr) => arr.findIndex(x => x.url === s.url) === i) // deduplicate
      .slice(0, 5); // cap at 5 sources to keep the UI clean

    logger.info(`askF1Expert: uid=${uid} | searched=${sources.length > 0} | newFacts=${newFacts.length}`);

    res.status(200).json({ reply: replyText, sources, newFacts });
  }
);
