# F1 2026 Fan Hub — Agent Context & Session Handoff

This file is the single source of truth for AI coding assistants resuming work on
this project. Read it fully before making any changes.

---

## What this project is

A **fictitious F1 2026 fan site** built as a hands-on Firebase learning project.
Not affiliated with Formula 1. Teaching goals:

- Firebase Hosting (static SPA deployment)
- Cloud Firestore (real-time database + security rules)
- Firebase Auth (Google Sign-In)
- Firebase Storage (driver illustration images)
- Firestore Security Rules
- Cloud Functions (scheduled serverless functions)
- Cloud Scheduler (managed cron)

---

## Tech stack

| Layer          | Technology                                                   |
|----------------|--------------------------------------------------------------|
| Frontend       | React 19 + Vite                                              |
| Styling        | Vanilla CSS — dark F1 theme, accent `#e10600`                |
| Database       | Cloud Firestore                                              |
| Auth           | Firebase Auth — Google Sign-In only                          |
| Storage        | Firebase Storage — driver illustrations                      |
| Hosting        | Firebase Hosting                                             |
| Functions      | Cloud Functions Gen 2 (Node.js 20) — scheduled data sync     |
| Scheduler      | Cloud Scheduler — cron trigger for syncF1Data                |
| Illustrations  | Gemini 2.0 Flash image generation (comic/manga style)        |
| F1 data        | Jolpica F1 API (free, no key) — results + standings          |

---

## Firebase project

- **Project ID**: `f1-fan-hub-b9098` (Blaze pay-as-you-go plan)
- **Project number**: `604992256674`
- **Firebase CLI alias**: configured in `.firebaserc`
- **Firestore region**: `nam5` (us-central1)
- **Functions region**: `us-central1`

---

## Live URLs

- **Primary**: https://f1.vanemmerik.ai (Cloudflare DNS → Firebase Hosting, SSL active)
- **Firebase default**: https://f1-fan-hub-b9098.web.app
- **Architecture diagram**: https://f1.vanemmerik.ai/architecture.html

---

## Repository

https://github.com/mvanemmerik/f1-hub  
Local path: `/Users/monty/Desktop/f1-fan-hub`

---

## Firestore collections

| Collection     | Who reads          | Who writes                          |
|----------------|--------------------|-------------------------------------|
| `drivers`      | anyone (public)    | Admin SDK only (seed.js)            |
| `teams`        | anyone (public)    | Admin SDK only (seed.js)            |
| `races`        | anyone (public)    | Admin SDK only (seed.js)            |
| `results`      | signed-in users    | Admin SDK only (syncF1Data function)|
| `standings`    | signed-in users    | Admin SDK only (syncF1Data function)|
| `users`        | own doc only       | own doc only                        |
| `comments`     | signed-in users    | signed-in users (validated)         |
| `predictions`  | signed-in users    | signed-in users (validated)         |

### results document ID format
`{year}_{round padded to 2 digits}` — e.g. `2026_01`, `2026_12`

### standings documents
Two fixed documents: `standings/drivers` and `standings/constructors`

---

## Cloud Function — syncF1Data

- **File**: `functions/index.js`
- **Trigger**: Cloud Scheduler cron `0 6 * * *` (daily 06:00 UTC)
- **What it does**: Fetches from Jolpica F1 API in parallel:
  - `https://api.jolpi.ca/ergast/f1/2026/last/results/`
  - `https://api.jolpi.ca/ergast/f1/2026/driverStandings/`
  - `https://api.jolpi.ca/ergast/f1/2026/constructorStandings/`
- **Writes**: `results/{year_round}`, `standings/drivers`, `standings/constructors`
- **Atomic**: uses Firestore batch commit — all writes succeed or all fail
- **Pre-season behaviour**: if no races have happened, logs a message and writes nothing
- **Deploy**: `firebase deploy --only functions`
- **Season constant**: hardcoded `const SEASON = 2026` in `functions/index.js`

### First race
**Race 1 — Australian Grand Prix — 8 March 2026, Melbourne**  
The function will write its first real data the morning of 9 March 2026 (06:00 UTC).

### If the function fails after a race
Check Cloud Function logs:
```
firebase functions:log --project f1-fan-hub-b9098
```
Or in GCP Console → Cloud Functions → syncF1Data → Logs.

Common failure causes:
- Jolpica API timeout (10s limit in code) — retry is fine, just run manually if urgent
- Firestore write permission (Admin SDK should never fail this — check initializeApp)
- New season / API endpoint changes

To trigger manually (no UI for this — use gcloud or test locally):
```bash
# Run the sync logic locally as a one-off using the admin SDK
node -e "
const { initializeApp, cert } = require('firebase-admin/app');
const { readFileSync } = require('fs');
// ... paste function body here or create a standalone script
"
```
Better: create `scripts/sync-now.js` (same logic as the function, runnable with node).

---

## Season data status

- **22 drivers** seeded — all official 2026 grid (formula1.com)
- **11 teams** seeded
- **24 races** seeded
- **Driver illustrations** — all 22 generated by Gemini, stored in Firebase Storage
- **Race results** — none yet (season starts 8 March 2026)
- **Standings** — none yet (will appear after Race 1)

---

## Key files

```
.env                               # Firebase + Gemini API keys — gitignored, NEVER commit
.env.example                       # Template — safe to commit (blank values)
.firebaserc                        # Firebase project alias
firebase.json                      # Hosting + Firestore + Storage + Functions config
firestore.rules                    # Firestore Security Rules
firestore.indexes.json             # Composite indexes
storage.rules                      # Firebase Storage Security Rules
public/architecture.html           # Architecture diagram (served by Hosting)

functions/
  index.js                         # syncF1Data Cloud Function
  package.json                     # Node.js 20, firebase-admin + firebase-functions

scripts/
  seed.js                          # Seeds Firestore (drivers, teams, races)
  generate-illustrations.js        # Gemini AI illustration generator → Firebase Storage
  update-photos.js                 # Updates driver photoUrl fields
  serviceAccountKey.json           # Firebase Admin key — gitignored, NEVER commit

src/
  firebase/
    firebase.js                    # Firebase app init
    auth.js                        # Google sign-in / sign-out, user doc creation
    firestore.js                   # All Firestore queries + real-time listeners
  context/
    AuthContext.jsx                # Global auth state (useAuth hook)
  components/
    Navbar.jsx                     # Sticky nav + mobile hamburger menu
    Footer.jsx                     # Footer with GitHub link
    CommentSection.jsx             # Real-time comments via onSnapshot
    ProtectedRoute.jsx             # Client-side auth guard (Predictions, Profile)
    DriverCard.jsx                 # Driver card with AI illustration
    TeamCard.jsx                   # Team card
    Toast.jsx                      # Toast notification system (useToast hook)
    LoadingSpinner.jsx             # Loading state
  pages/
    Home.jsx                       # Hero, countdown, news widget
    Drivers.jsx                    # Full driver grid with team filter
    Teams.jsx                      # Constructor grid
    Calendar.jsx                   # 24-race calendar
    RaceDetail.jsx                 # Race info + results (if available) + comments
    Standings.jsx                  # Driver + constructor championship tables
    Predictions.jsx                # Pick race winners — auth required
    Profile.jsx                    # Prediction history — auth required
    News.jsx                       # F1 news via Motorsport.com RSS
    NotFound.jsx                   # 404
```

---

## Auth behaviour

The **entire app** is gated behind Google sign-in. `App.jsx` checks `useAuth()` at
the top level — if no user, it renders a full-page login wall instead of any routes.
`onAuthStateChanged` in `AuthContext.jsx` holds off rendering until Firebase resolves
the session, so there is no flash of logged-out UI for returning users.

---

## Deployment workflow

```bash
# Frontend only (most common)
npm run build
firebase deploy --only hosting

# Functions only (after editing functions/index.js)
firebase deploy --only functions

# Rules only (after editing firestore.rules or storage.rules)
firebase deploy --only firestore:rules,storage

# Everything
firebase deploy
```

---

## Chatbot architecture — askF1Expert

`askF1Expert` is a **Gen 1 Cloud Function** (`firebase-functions/v1`) using `onCall`.
`syncF1Data` is Gen 2 (`firebase-functions/v2`). Both coexist in `functions/index.js`.

### Why Gen 1 for the chatbot?

This GCP project has an **org policy that blocks `allUsers` and `allAuthenticatedUsers`
IAM bindings** on both Cloud Run and Cloud Functions. Gen 2 functions run on Cloud Run
and inherit this restriction. Gen 1 functions are a separate resource type and allow
granting specific service accounts (not allUsers) the `cloudfunctions.invoker` role.

### How the request flows

```
Browser (f1.vanemmerik.ai)
  └─ httpsCallableFromURL → /api/askF1Expert  (same-origin, no CORS preflight)
       └─ Firebase Hosting `function` rewrite
            └─ App Engine SA (f1-fan-hub-b9098@appspot.gserviceaccount.com)
                 └─ Gen 1 Cloud Function (askF1Expert) — context.auth auto-populated
                      └─ Gemini 2.0 Flash + Google Search grounding
```

### IAM binding (must be re-applied after function delete/recreate)

```bash
gcloud functions add-iam-policy-binding askF1Expert \
  --region=us-central1 \
  --project=f1-fan-hub-b9098 \
  --member="serviceAccount:f1-fan-hub-b9098@appspot.gserviceaccount.com" \
  --role=roles/cloudfunctions.invoker
```

### Key lessons from debugging

- **Firebase Hosting `run` rewrite** (Gen 2 / Cloud Run): does NOT add authentication.
  Requests arrive at Cloud Run unauthenticated → org policy blocks them.
- **Firebase Hosting `function` rewrite** (Gen 1): DOES authenticate using the App Engine
  service account AND preserves the client's Firebase ID token so `context.auth` works.
- **Firebase Hosting strips the Authorization header** when proxying — the client's ID token
  cannot reach the function via the Authorization header through a Hosting proxy.
- **`httpsCallable` calls `cloudfunctions.net` directly** (cross-origin) — blocked by org
  policy since allUsers is not permitted. Use `httpsCallableFromURL` pointed at the Hosting
  URL instead so the request stays same-origin.
- **Changing between `onCall` and `onRequest`** requires deleting and recreating the function.
  Firebase CLI will error if you try to change type in-place.
- **Every time the function is deleted and recreated**, you must re-run the IAM binding above.

---

## Gotchas & lessons learned

- Firebase web API keys are **not secret** — security is Firestore Security Rules, server-side
- Admin SDK **bypasses all security rules** — only run from trusted scripts / Cloud Functions
- `rss2json.com` free tier: omit `count` param (not supported on free tier — returns 10 by default)
- Firebase Storage requires Blaze (pay-as-you-go) plan
- Firestore composite indexes required for multi-field queries (`where` + `orderBy` on different fields)
- `onAuthStateChanged` fires immediately on load — always wait for it before rendering
- Bust Firebase Storage / browser cache by changing the filename on re-upload
- `.firebase/` CLI cache directory is gitignored
- Cloud Functions Gen 2 first deploy requires granting IAM roles to the Cloud Build service account
  (`604992256674@cloudbuild.gserviceaccount.com`) — already done, documented here for reference:
  - `roles/artifactregistry.admin`
  - `roles/storage.objectAdmin`
  - `roles/logging.logWriter`
  - `roles/run.admin`
  - `roles/iam.serviceAccountUser` on the compute SA
- Artifact cleanup policy set: images older than 1 day auto-deleted from `gcf-artifacts` repo

---

## Coding conventions

- Inline comments explaining the **why** in every file — this is a learning project
- All CSS in `src/index.css` — no CSS framework
- No TypeScript — plain JSX throughout
- Secrets always via `import.meta.env.VITE_*` (Vite env vars) — never hardcoded
- `showToast(message, type)` — use `useToast()` hook for user feedback (`success`, `error`, `info`)
- Firestore helpers all live in `src/firebase/firestore.js` — add new queries there, not in components
