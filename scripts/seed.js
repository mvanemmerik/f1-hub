// ─────────────────────────────────────────────────────────────────────────────
// seed.js  —  Populate Firestore with 2026 F1 data
//
// Run with:  node scripts/seed.js
//
// LESSON: This script uses the Firebase Admin SDK, which bypasses Security
// Rules entirely. That's why it needs a service account key, not the browser
// SDK config. Admin SDK is only ever used server-side (scripts, Cloud Functions).
// NEVER include your service account key in your frontend code.
//
// Prerequisites:
//   1. npm install firebase-admin (already in package.json after setup)
//   2. Download a service account key from:
//      Firebase Console → Project Settings → Service Accounts → Generate new private key
//   3. Save it as scripts/serviceAccountKey.json  (already in .gitignore)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore }        from 'firebase-admin/firestore';
import { readFileSync }        from 'fs';
import { fileURLToPath }       from 'url';
import { dirname, join }       from 'path';

const __dirname    = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Helper: batch write ───────────────────────────────────────────────────────
// Firestore batches support max 500 operations. We split large arrays.
async function batchWrite(collectionName, records) {
  const chunks = [];
  for (let i = 0; i < records.length; i += 499) {
    chunks.push(records.slice(i, i + 499));
  }
  for (const chunk of chunks) {
    const batch = db.batch();
    for (const { id, ...data } of chunk) {
      batch.set(db.collection(collectionName).doc(id), data);
    }
    await batch.commit();
  }
  console.log(`  ✓  Wrote ${records.length} documents to "${collectionName}"`);
}

// ── Teams ─────────────────────────────────────────────────────────────────────
const teams = [
  { id: 'alpine',       name: 'Alpine',          base: 'Enstone, UK',          color: '#0090FF' },
  { id: 'aston-martin', name: 'Aston Martin',     base: 'Silverstone, UK',      color: '#229971' },
  { id: 'audi',         name: 'Audi',             base: 'Hinwil, Switzerland',  color: '#9B0000' },
  { id: 'cadillac',     name: 'Cadillac',         base: 'Banbury, UK',          color: '#1966D6' },
  { id: 'ferrari',      name: 'Ferrari',          base: 'Maranello, Italy',     color: '#E8002D' },
  { id: 'haas',         name: 'Haas F1 Team',     base: 'Kannapolis, USA',      color: '#B6BABD' },
  { id: 'mclaren',      name: 'McLaren',          base: 'Woking, UK',           color: '#FF8000' },
  { id: 'mercedes',     name: 'Mercedes',         base: 'Brackley, UK',         color: '#00D2BE' },
  { id: 'racing-bulls', name: 'Racing Bulls',     base: 'Faenza, Italy',        color: '#6692FF' },
  { id: 'red-bull',     name: 'Red Bull Racing',  base: 'Milton Keynes, UK',    color: '#3671C6' },
  { id: 'williams',     name: 'Williams',         base: 'Grove, UK',            color: '#00A3E0' },
];

// ── Drivers — official 2026 grid ──────────────────────────────────────────────
// Source: https://www.formula1.com/en/drivers
const drivers = [
  // Alpine
  { id: 'gasly',      name: 'Pierre Gasly',      number: 10, nationality: 'French',       flag: '🇫🇷', team: 'Alpine',         teamId: 'alpine',       teamColor: '#0090FF' },
  { id: 'colapinto',  name: 'Franco Colapinto',  number: 43, nationality: 'Argentine',    flag: '🇦🇷', team: 'Alpine',         teamId: 'alpine',       teamColor: '#0090FF' },
  // Aston Martin
  { id: 'alonso',     name: 'Fernando Alonso',   number: 14, nationality: 'Spanish',      flag: '🇪🇸', team: 'Aston Martin',   teamId: 'aston-martin', teamColor: '#229971' },
  { id: 'stroll',     name: 'Lance Stroll',      number: 18, nationality: 'Canadian',     flag: '🇨🇦', team: 'Aston Martin',   teamId: 'aston-martin', teamColor: '#229971' },
  // Audi
  { id: 'hulkenberg',  name: 'Nico Hulkenberg',  number: 27, nationality: 'German',       flag: '🇩🇪', team: 'Audi',           teamId: 'audi',         teamColor: '#9B0000' },
  { id: 'bortoleto',  name: 'Gabriel Bortoleto', number:  5, nationality: 'Brazilian',    flag: '🇧🇷', team: 'Audi',           teamId: 'audi',         teamColor: '#9B0000' },
  // Cadillac
  { id: 'perez',      name: 'Sergio Perez',      number: 11, nationality: 'Mexican',      flag: '🇲🇽', team: 'Cadillac',       teamId: 'cadillac',     teamColor: '#1966D6' },
  { id: 'bottas',     name: 'Valtteri Bottas',   number: 77, nationality: 'Finnish',      flag: '🇫🇮', team: 'Cadillac',       teamId: 'cadillac',     teamColor: '#1966D6' },
  // Ferrari
  { id: 'leclerc',    name: 'Charles Leclerc',   number: 16, nationality: 'Monégasque',   flag: '🇲🇨', team: 'Ferrari',        teamId: 'ferrari',      teamColor: '#E8002D' },
  { id: 'hamilton',   name: 'Lewis Hamilton',    number: 44, nationality: 'British',      flag: '🇬🇧', team: 'Ferrari',        teamId: 'ferrari',      teamColor: '#E8002D' },
  // Haas
  { id: 'ocon',       name: 'Esteban Ocon',      number: 31, nationality: 'French',       flag: '🇫🇷', team: 'Haas F1 Team',   teamId: 'haas',         teamColor: '#B6BABD' },
  { id: 'bearman',    name: 'Oliver Bearman',    number: 87, nationality: 'British',      flag: '🇬🇧', team: 'Haas F1 Team',   teamId: 'haas',         teamColor: '#B6BABD' },
  // McLaren
  { id: 'norris',     name: 'Lando Norris',      number:  4, nationality: 'British',      flag: '🇬🇧', team: 'McLaren',        teamId: 'mclaren',      teamColor: '#FF8000' },
  { id: 'piastri',    name: 'Oscar Piastri',     number: 81, nationality: 'Australian',   flag: '🇦🇺', team: 'McLaren',        teamId: 'mclaren',      teamColor: '#FF8000' },
  // Mercedes
  { id: 'russell',    name: 'George Russell',    number: 63, nationality: 'British',      flag: '🇬🇧', team: 'Mercedes',       teamId: 'mercedes',     teamColor: '#00D2BE' },
  { id: 'antonelli',  name: 'Kimi Antonelli',    number: 12, nationality: 'Italian',      flag: '🇮🇹', team: 'Mercedes',       teamId: 'mercedes',     teamColor: '#00D2BE' },
  // Racing Bulls
  { id: 'lawson',     name: 'Liam Lawson',       number: 30, nationality: 'New Zealander',flag: '🇳🇿', team: 'Racing Bulls',   teamId: 'racing-bulls', teamColor: '#6692FF' },
  { id: 'lindblad',   name: 'Arvid Lindblad',    number:  6, nationality: 'British',      flag: '🇬🇧', team: 'Racing Bulls',   teamId: 'racing-bulls', teamColor: '#6692FF' },
  // Red Bull Racing
  { id: 'verstappen', name: 'Max Verstappen',    number:  1, nationality: 'Dutch',        flag: '🇳🇱', team: 'Red Bull Racing',teamId: 'red-bull',     teamColor: '#3671C6' },
  { id: 'hadjar',     name: 'Isack Hadjar',      number: 22, nationality: 'French',       flag: '🇫🇷', team: 'Red Bull Racing',teamId: 'red-bull',     teamColor: '#3671C6' },
  // Williams
  { id: 'sainz',      name: 'Carlos Sainz',      number: 55, nationality: 'Spanish',      flag: '🇪🇸', team: 'Williams',       teamId: 'williams',     teamColor: '#00A3E0' },
  { id: 'albon',      name: 'Alexander Albon',   number: 23, nationality: 'Thai',         flag: '🇹🇭', team: 'Williams',       teamId: 'williams',     teamColor: '#00A3E0' },
];

// ── Races — official 2026 calendar ────────────────────────────────────────────
// Source: https://www.formula1.com/en/racing/2026
// date = Sunday race day
const races = [
  { id: 'aus-2026', round:  1, name: 'Australian Grand Prix',         circuit: 'Albert Park Circuit',            country: 'Australia',    countryFlag: '🇦🇺', date: '2026-03-08' },
  { id: 'chn-2026', round:  2, name: 'Chinese Grand Prix',            circuit: 'Shanghai International Circuit',  country: 'China',        countryFlag: '🇨🇳', date: '2026-03-15' },
  { id: 'jpn-2026', round:  3, name: 'Japanese Grand Prix',           circuit: 'Suzuka Circuit',                  country: 'Japan',        countryFlag: '🇯🇵', date: '2026-03-29' },
  { id: 'bhr-2026', round:  4, name: 'Bahrain Grand Prix',            circuit: 'Bahrain International Circuit',   country: 'Bahrain',      countryFlag: '🇧🇭', date: '2026-04-12' },
  { id: 'ksa-2026', round:  5, name: 'Saudi Arabian Grand Prix',      circuit: 'Jeddah Corniche Circuit',         country: 'Saudi Arabia', countryFlag: '🇸🇦', date: '2026-04-19' },
  { id: 'mia-2026', round:  6, name: 'Miami Grand Prix',              circuit: 'Miami International Autodrome',   country: 'USA',          countryFlag: '🇺🇸', date: '2026-05-03' },
  { id: 'can-2026', round:  7, name: 'Canadian Grand Prix',           circuit: 'Circuit Gilles Villeneuve',       country: 'Canada',       countryFlag: '🇨🇦', date: '2026-05-24' },
  { id: 'mon-2026', round:  8, name: 'Monaco Grand Prix',             circuit: 'Circuit de Monaco',               country: 'Monaco',       countryFlag: '🇲🇨', date: '2026-06-07' },
  { id: 'esp-2026', round:  9, name: 'Spanish Grand Prix',            circuit: 'Circuit de Barcelona-Catalunya',  country: 'Spain',        countryFlag: '🇪🇸', date: '2026-06-14' },
  { id: 'aut-2026', round: 10, name: 'Austrian Grand Prix',           circuit: 'Red Bull Ring',                   country: 'Austria',      countryFlag: '🇦🇹', date: '2026-06-28' },
  { id: 'gbr-2026', round: 11, name: 'British Grand Prix',            circuit: 'Silverstone Circuit',             country: 'Great Britain',countryFlag: '🇬🇧', date: '2026-07-05' },
  { id: 'bel-2026', round: 12, name: 'Belgian Grand Prix',            circuit: 'Circuit de Spa-Francorchamps',    country: 'Belgium',      countryFlag: '🇧🇪', date: '2026-07-19' },
  { id: 'hun-2026', round: 13, name: 'Hungarian Grand Prix',          circuit: 'Hungaroring',                     country: 'Hungary',      countryFlag: '🇭🇺', date: '2026-07-26' },
  { id: 'ned-2026', round: 14, name: 'Dutch Grand Prix',              circuit: 'Circuit Zandvoort',               country: 'Netherlands',  countryFlag: '🇳🇱', date: '2026-08-23' },
  { id: 'ita-2026', round: 15, name: 'Italian Grand Prix',            circuit: 'Autodromo Nazionale Monza',       country: 'Italy',        countryFlag: '🇮🇹', date: '2026-09-06' },
  { id: 'mad-2026', round: 16, name: 'Madrid Grand Prix',             circuit: 'IFEMA Madrid Circuit',            country: 'Spain',        countryFlag: '🇪🇸', date: '2026-09-13' },
  { id: 'aze-2026', round: 17, name: 'Azerbaijan Grand Prix',         circuit: 'Baku City Circuit',               country: 'Azerbaijan',   countryFlag: '🇦🇿', date: '2026-09-26' },
  { id: 'sgp-2026', round: 18, name: 'Singapore Grand Prix',          circuit: 'Marina Bay Street Circuit',       country: 'Singapore',    countryFlag: '🇸🇬', date: '2026-10-11' },
  { id: 'usa-2026', round: 19, name: 'United States Grand Prix',      circuit: 'Circuit of the Americas',         country: 'USA',          countryFlag: '🇺🇸', date: '2026-10-25' },
  { id: 'mex-2026', round: 20, name: 'Mexico City Grand Prix',        circuit: 'Autodromo Hermanos Rodriguez',    country: 'Mexico',       countryFlag: '🇲🇽', date: '2026-11-01' },
  { id: 'bra-2026', round: 21, name: 'São Paulo Grand Prix',          circuit: 'Autodromo Jose Carlos Pace',      country: 'Brazil',       countryFlag: '🇧🇷', date: '2026-11-08' },
  { id: 'lvg-2026', round: 22, name: 'Las Vegas Grand Prix',          circuit: 'Las Vegas Strip Circuit',         country: 'USA',          countryFlag: '🇺🇸', date: '2026-11-21' },
  { id: 'qat-2026', round: 23, name: 'Qatar Grand Prix',              circuit: 'Lusail International Circuit',    country: 'Qatar',        countryFlag: '🇶🇦', date: '2026-11-29' },
  { id: 'abu-2026', round: 24, name: 'Abu Dhabi Grand Prix',          circuit: 'Yas Marina Circuit',              country: 'UAE',          countryFlag: '🇦🇪', date: '2026-12-06' },
];

// ── Run ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏁  F1 2026 Seed Script\n');
  await batchWrite('teams',   teams);
  await batchWrite('drivers', drivers);
  await batchWrite('races',   races);
  console.log('\n✅  Seeding complete!\n');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
