# 🏁 F1 2026 Fan Hub

A fictitious Formula 1 fan site for the 2026 season — built as a hands-on learning project covering **GCP Firebase**, **Firestore**, **Google Authentication**, and **security rules**.

Live site: **[f1.vanemmerik.ai](https://f1.vanemmerik.ai)**

> Built with [OpenCode](https://opencode.ai)

---

## What it does

| Feature | Details |
|---|---|
| **Driver Grid** | All 22 official 2026 drivers across 11 teams, filterable by team |
| **Race Calendar** | All 24 rounds with circuits, dates, and status |
| **Next Race Countdown** | Live countdown timer on the home page |
| **Race Detail** | Session schedule + real-time fan comments |
| **Predictions** | Pick race winners before each round (sign-in required) |
| **Profile** | View your full prediction history |
| **Google Auth** | One-click sign-in with Google |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Hosting | Firebase Hosting |
| Database | Cloud Firestore |
| Authentication | Firebase Auth (Google Sign-In) |
| Security | Firestore Security Rules |
| Styling | Vanilla CSS — dark F1 theme |

---

## Project Structure

```
f1-fan-hub/
├── src/
│   ├── firebase/
│   │   ├── firebase.js          # App init — exports auth + db
│   │   ├── auth.js              # Google sign-in / sign-out
│   │   └── firestore.js         # All DB queries
│   ├── context/
│   │   └── AuthContext.jsx      # Global auth state via React Context
│   ├── components/
│   │   ├── Navbar.jsx           # Sticky nav with auth button
│   │   ├── DriverCard.jsx       # Team-coloured driver card
│   │   ├── CommentSection.jsx   # Real-time comments via onSnapshot
│   │   ├── ProtectedRoute.jsx   # Client-side auth guard
│   │   ├── Footer.jsx
│   │   └── LoadingSpinner.jsx
│   └── pages/
│       ├── Home.jsx             # Hero + next race countdown
│       ├── Drivers.jsx          # Full grid with team filter
│       ├── Calendar.jsx         # All 24 rounds
│       ├── RaceDetail.jsx       # Race info + live comments
│       ├── Predictions.jsx      # Pick race winners (auth required)
│       └── Profile.jsx          # Prediction history (auth required)
├── firestore.rules              # Server-side security rules
├── firestore.indexes.json       # Composite query indexes
├── firebase.json                # Hosting + Firestore config
└── scripts/
    └── seed.js                  # Populates all 2026 F1 data
```

---

## Firestore Data Model

```
/drivers/{driverId}       ← Public read  | All 22 official 2026 drivers
/teams/{teamId}           ← Public read  | All 11 constructors
/races/{raceId}           ← Public read  | All 24 rounds
/users/{userId}           ← Owner only   | Profile (created on first sign-in)
/comments/{commentId}     ← Auth read    | Race comments (owner create)
/predictions/{predId}     ← Auth read    | Race predictions (owner create)
```

---

## Security Rules

Rules are enforced **server-side** by Firebase — they cannot be bypassed by the client.

```
drivers / teams / races  →  anyone can read, nobody can write (admin SDK only)
users/{userId}           →  only that user can read or write their own profile
comments                 →  signed-in users can read; only owner can create (validated)
predictions              →  signed-in users can read; only owner can create (validated)
```

Key validations enforced by rules:
- Comment `text` must be 1–500 characters
- All required fields must be present on create
- `userId` on new documents must match `request.auth.uid` — you can't write as someone else

---

## Local Development

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

### Setup

```bash
# 1. Clone and install
git clone git@github.com:mvanemmerik/f1-hub.git
cd f1-hub
npm install

# 2. Copy env template and fill in your Firebase config
cp .env.example .env

# 3. Start dev server
npm run dev
```

Your `.env` should look like:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Get these values from: **Firebase Console → Project Settings → Your Apps → SDK setup**

### Seeding Firestore

The seed script populates all drivers, teams, and races using the Firebase Admin SDK.

```bash
# 1. Download a service account key from:
#    Firebase Console → Project Settings → Service Accounts → Generate new private key
# 2. Save it as scripts/serviceAccountKey.json  (already in .gitignore)

npm run seed
```

---

## Deployment

```bash
# Build and deploy everything
npm run build
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

---

## Key Learning Concepts

This project was built as a teaching exercise. Each file is commented with lessons explaining the *why* behind implementation decisions.

| Concept | Where to look |
|---|---|
| Firebase app initialization | `src/firebase/firebase.js` |
| Auth helpers + user profile creation | `src/firebase/auth.js` |
| Firestore queries + real-time listeners | `src/firebase/firestore.js` |
| React Context for global state | `src/context/AuthContext.jsx` |
| Client-side vs server-side auth guards | `src/components/ProtectedRoute.jsx` + `firestore.rules` |
| Firestore Security Rules | `firestore.rules` |
| Composite index requirements | `firestore.indexes.json` |
| Seed script with Admin SDK | `scripts/seed.js` |

---

## Environment Notes

- Firebase web API keys are **not secret** — they identify your project but access is controlled by Security Rules
- Never commit `.env` or `scripts/serviceAccountKey.json` — both are in `.gitignore`
- The Admin SDK (seed script) bypasses Security Rules entirely — keep service account keys private

---

*Fictitious fan site — not affiliated with Formula 1, Formula One World Championship Ltd, or the FIA.*
