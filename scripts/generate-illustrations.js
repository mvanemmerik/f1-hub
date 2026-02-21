// ─────────────────────────────────────────────────────────────────────────────
// generate-illustrations.js
//
// Uses Gemini 2.0 Flash image generation to create comic/manga-style
// illustrated portraits of all 22 F1 2026 drivers, then uploads them to
// Firebase Storage and updates each driver's Firestore document.
//
// Run with:  node scripts/generate-illustrations.js
//
// For 4 newer drivers we pass a reference photo so Gemini can capture likeness.
// For the remaining 18, Gemini generates from text description alone.
//
// LESSON: Admin SDK bypasses Firestore + Storage security rules — this is
// intentional for trusted server-side scripts. Never run admin code client-side.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, cert }    from 'firebase-admin/app';
import { getFirestore }           from 'firebase-admin/firestore';
import { getStorage }             from 'firebase-admin/storage';
import { GoogleGenerativeAI }     from '@google/generative-ai';
import { readFileSync }           from 'fs';
import { fileURLToPath }          from 'url';
import { dirname, join }          from 'path';

const __dirname      = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

// ── Firebase init ─────────────────────────────────────────────────────────────
initializeApp({
  credential:  cert(serviceAccount),
  storageBucket: 'f1-fan-hub-b9098.firebasestorage.app',
});
const db     = getFirestore();
const bucket = getStorage().bucket();

// ── Gemini init ───────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp-image-generation' });

// ── Helpers ───────────────────────────────────────────────────────────────────

// Fetch a remote image and return base64 + mimeType
async function fetchImageAsBase64(url) {
  const res    = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime   = res.headers.get('content-type') || 'image/webp';
  return { data: buffer.toString('base64'), mimeType: mime };
}

// Upload a base64 PNG to Firebase Storage, make it public, return URL
async function uploadToStorage(driverId, base64Data) {
  const path = `driver-illustrations/${driverId}.png`;
  const file = bucket.file(path);
  await file.save(Buffer.from(base64Data, 'base64'), {
    metadata: { contentType: 'image/png' },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

// Sleep between requests to respect rate limits
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Build the text prompt for a driver
function buildPrompt(driver) {
  return (
    `Dynamic comic book / manga-style illustrated portrait of Formula 1 racing driver ` +
    `${driver.name}. Wearing a ${driver.team} F1 racing suit. ` +
    `Bold ink outlines, dramatic top-down lighting, intense focused expression, ` +
    `dark background with subtle speed lines radiating outward, ` +
    `vibrant ${driver.teamColor} color accents on the suit. ` +
    `High contrast digital illustration. Upper body portrait, square crop. ` +
    `No text, no watermarks, no logos.`
  );
}

// ── Driver list ───────────────────────────────────────────────────────────────
// referenceUrl = F1 photo to pass as input for likeness accuracy
const drivers = [
  // Alpine
  { id: 'gasly',      name: 'Pierre Gasly',      team: 'Alpine',          teamColor: '#0090FF' },
  { id: 'colapinto',  name: 'Franco Colapinto',  team: 'Alpine',          teamColor: '#0090FF',
    referenceUrl: 'https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/v1740000000/common/f1/2025/alpine/fracol01/2025alpinefracol01right.webp' },
  // Aston Martin
  { id: 'alonso',     name: 'Fernando Alonso',   team: 'Aston Martin',    teamColor: '#229971' },
  { id: 'stroll',     name: 'Lance Stroll',      team: 'Aston Martin',    teamColor: '#229971' },
  // Audi
  { id: 'hulkenberg', name: 'Nico Hulkenberg',   team: 'Audi',            teamColor: '#9B0000' },
  { id: 'bortoleto',  name: 'Gabriel Bortoleto', team: 'Audi',            teamColor: '#9B0000',
    referenceUrl: 'https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/v1740000000/common/f1/2026/audi/gabbor01/2026audigabbor01right.webp' },
  // Cadillac
  { id: 'perez',      name: 'Sergio Perez',      team: 'Cadillac',        teamColor: '#1966D6' },
  { id: 'bottas',     name: 'Valtteri Bottas',   team: 'Cadillac',        teamColor: '#1966D6' },
  // Ferrari
  { id: 'leclerc',    name: 'Charles Leclerc',   team: 'Ferrari',         teamColor: '#E8002D' },
  { id: 'hamilton',   name: 'Lewis Hamilton',    team: 'Ferrari',         teamColor: '#E8002D' },
  // Haas
  { id: 'ocon',       name: 'Esteban Ocon',      team: 'Haas F1 Team',    teamColor: '#B6BABD' },
  { id: 'bearman',    name: 'Oliver Bearman',    team: 'Haas F1 Team',    teamColor: '#B6BABD' },
  // McLaren
  { id: 'norris',     name: 'Lando Norris',      team: 'McLaren',         teamColor: '#FF8000' },
  { id: 'piastri',    name: 'Oscar Piastri',     team: 'McLaren',         teamColor: '#FF8000' },
  // Mercedes
  { id: 'russell',    name: 'George Russell',    team: 'Mercedes',        teamColor: '#00D2BE' },
  { id: 'antonelli',  name: 'Kimi Antonelli',    team: 'Mercedes',        teamColor: '#00D2BE' },
  // Racing Bulls
  { id: 'lawson',     name: 'Liam Lawson',       team: 'Racing Bulls',    teamColor: '#6692FF' },
  { id: 'lindblad',   name: 'Arvid Lindblad',    team: 'Racing Bulls',    teamColor: '#6692FF',
    referenceUrl: 'https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000000/common/f1/2026/racingbulls/arvlin01/2026racingbullsarvlin01right.webp' },
  // Red Bull
  { id: 'verstappen', name: 'Max Verstappen',    team: 'Red Bull Racing', teamColor: '#3671C6' },
  { id: 'hadjar',     name: 'Isack Hadjar',      team: 'Red Bull Racing', teamColor: '#3671C6',
    referenceUrl: 'https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000000/common/f1/2026/redbullracing/isahad01/2026redbullracingisahad01right.webp' },
  // Williams
  { id: 'sainz',      name: 'Carlos Sainz',      team: 'Williams',        teamColor: '#00A3E0' },
  { id: 'albon',      name: 'Alexander Albon',   team: 'Williams',        teamColor: '#00A3E0' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function generateIllustration(driver) {
  const prompt = buildPrompt(driver);
  let contents;

  if (driver.referenceUrl) {
    // Pass reference photo for likeness accuracy
    console.log(`  🖼  Fetching reference photo for ${driver.name}...`);
    const ref = await fetchImageAsBase64(driver.referenceUrl);
    contents  = [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: ref.mimeType, data: ref.data } },
        { text: `Using the person in this photo as the face reference, ${prompt}` },
      ],
    }];
  } else {
    contents = [{ role: 'user', parts: [{ text: prompt }] }];
  }

  const result = await model.generateContent({
    contents,
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  const parts     = result.response.candidates[0].content.parts;
  const imagePart = parts.find(p => p.inlineData);
  if (!imagePart) throw new Error('No image returned by Gemini');

  return imagePart.inlineData.data; // base64 PNG
}

async function main() {
  console.log('\n🏎  F1 2026 Driver Illustration Generator\n');
  console.log(`   Model : gemini-2.0-flash-exp-image-generation`);
  console.log(`   Style : Comic / Manga`);
  console.log(`   Count : ${drivers.length} drivers\n`);

  const failed = [];

  for (let i = 0; i < drivers.length; i++) {
    const driver = drivers[i];
    const tag    = driver.referenceUrl ? '📸 ref' : '✏️  text';
    console.log(`[${i + 1}/${drivers.length}] ${tag}  ${driver.name} (${driver.team})`);

    try {
      const base64 = await generateIllustration(driver);
      const url    = await uploadToStorage(driver.id, base64);
      await db.collection('drivers').doc(driver.id).update({ photoUrl: url });
      console.log(`          ✓  ${url}`);
    } catch (err) {
      console.error(`          ✗  ${err.message}`);
      failed.push(driver.name);
    }

    // Pause between requests to stay within rate limits
    if (i < drivers.length - 1) await sleep(3000);
  }

  console.log('\n─────────────────────────────────────');
  if (failed.length === 0) {
    console.log('✅  All 22 illustrations generated and uploaded!\n');
  } else {
    console.log(`⚠️  Done with ${drivers.length - failed.length} successes.`);
    console.log(`   Failed: ${failed.join(', ')}\n`);
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
