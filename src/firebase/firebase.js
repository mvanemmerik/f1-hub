// ─────────────────────────────────────────────────────────────────────────────
// firebase.js  —  App initialization
//
// LESSON: Firebase uses a single app instance. We initialize it once here
// and import the services (auth, firestore) from this file everywhere else.
// The config values come from Vite's env system (import.meta.env.*) which
// reads from your .env file at build time. This keeps secrets out of source.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase — only one instance per app
const app = initializeApp(firebaseConfig);

// Export the services we'll use throughout the app
export const auth = getAuth(app);
export const db   = getFirestore(app);

// GoogleAuthProvider is a helper that handles the Google Sign-In popup/redirect
export const googleProvider = new GoogleAuthProvider();
