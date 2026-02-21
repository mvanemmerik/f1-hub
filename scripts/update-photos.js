// ─────────────────────────────────────────────────────────────────────────────
// update-photos.js  —  Add photoUrl to existing driver documents in Firestore
//
// Run with:  node scripts/update-photos.js
//
// Uses the F1 media CDN for official driver headshots.
// The fallback image (d_driver_fallback_image.png) is shown if a code is wrong.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore }        from 'firebase-admin/firestore';
import { readFileSync }        from 'fs';
import { fileURLToPath }       from 'url';
import { dirname, join }       from 'path';

const __dirname      = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// F1 CDN base — d_driver_fallback_image.png is the fallback if code doesn't resolve
const CDN = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers';

function photoUrl(initial, code) {
  return `${CDN}/${initial}/${code}/${code.toLowerCase()}.png`;
}

// Map: driverId → [lastNameInitial, F1_IMAGE_CODE]
const photos = {
  gasly:      ['G', 'PIEGAS01'],
  colapinto:  ['C', 'FRACOL01'],
  alonso:     ['A', 'FERALO01'],
  stroll:     ['S', 'LANSTR01'],
  hulkenberg: ['H', 'NICHUL01'],
  bortoleto:  ['B', 'GABBOR01'],
  perez:      ['P', 'SERPER01'],
  bottas:     ['B', 'VALBOT01'],
  leclerc:    ['L', 'CHALEC01'],
  hamilton:   ['H', 'LEWHAM01'],
  ocon:       ['O', 'ESTOCO01'],
  bearman:    ['B', 'OLIBEA01'],
  norris:     ['N', 'LANNOR01'],
  piastri:    ['P', 'OSCPIA01'],
  russell:    ['R', 'GEORUS01'],
  antonelli:  ['A', 'KIMANT01'],
  lawson:     ['L', 'LIALAW01'],
  lindblad:   ['L', 'ARVLIN01'],
  verstappen: ['V', 'MAXVER01'],
  hadjar:     ['H', 'ISAHAD01'],
  sainz:      ['S', 'CARSAI01'],
  albon:      ['A', 'ALEALB01'],
};

async function main() {
  console.log('\n📸  Updating driver photos\n');
  const batch = db.batch();
  for (const [id, [initial, code]] of Object.entries(photos)) {
    const ref = db.collection('drivers').doc(id);
    batch.update(ref, { photoUrl: photoUrl(initial, code) });
    console.log(`  ${id} → ${code}`);
  }
  await batch.commit();
  console.log('\n✅  Photos updated!\n');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
