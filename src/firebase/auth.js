// ─────────────────────────────────────────────────────────────────────────────
// auth.js  —  Authentication helpers
//
// LESSON: We wrap Firebase auth functions in our own helpers for two reasons:
//   1. Components stay clean — they call signInWithGoogle(), not Firebase APIs
//   2. Easy to swap auth providers later without touching every component
// ─────────────────────────────────────────────────────────────────────────────

import {
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

// ── Sign in with Google popup ─────────────────────────────────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user   = result.user;

  // After first sign-in, create a user document in Firestore if it doesn't exist.
  // LESSON: We use setDoc with { merge: true } so we don't overwrite data on
  // subsequent logins — it only adds fields that are missing.
  const userRef = doc(db, 'users', user.uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName,
      email:       user.email,
      photoURL:    user.photoURL,
      createdAt:   serverTimestamp(),
    });
  }

  return user;
}

// ── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut() {
  await firebaseSignOut(auth);
}
