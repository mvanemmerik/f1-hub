// ─────────────────────────────────────────────────────────────────────────────
// firestore.js  —  Database query helpers
//
// LESSON: All Firestore queries live here. This keeps our components focused
// on rendering, not data fetching. It also makes queries easy to find and
// change in one place.
//
// Key Firestore concepts:
//   collection(db, 'name')        → reference to a collection
//   doc(db, 'collection', 'id')   → reference to a specific document
//   getDocs(query)                → one-time fetch of multiple docs
//   getDoc(ref)                   → one-time fetch of a single doc
//   addDoc(ref, data)             → add a new doc with auto-generated ID
//   onSnapshot(query, callback)   → real-time listener (updates live!)
//   orderBy / where               → query modifiers
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Drivers ───────────────────────────────────────────────────────────────────

export async function getDrivers() {
  const snap = await getDocs(query(collection(db, 'drivers'), orderBy('number')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export async function getTeams() {
  const snap = await getDocs(collection(db, 'teams'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Races ─────────────────────────────────────────────────────────────────────

export async function getRaces() {
  const snap = await getDocs(query(collection(db, 'races'), orderBy('round')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getRace(raceId) {
  const snap = await getDoc(doc(db, 'races', raceId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Comments ─────────────────────────────────────────────────────────────────
// LESSON: onSnapshot sets up a real-time listener. Every time data changes in
// Firestore, the callback fires automatically — no polling needed.

export function subscribeToComments(raceId, callback) {
  const q = query(
    collection(db, 'comments'),
    where('raceId', '==', raceId),
    orderBy('createdAt', 'asc')
  );
  // onSnapshot returns an unsubscribe function — call it to stop listening
  return onSnapshot(q, snap => {
    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(comments);
  });
}

export async function addComment(raceId, userId, displayName, photoURL, text) {
  await addDoc(collection(db, 'comments'), {
    raceId,
    userId,
    displayName,
    photoURL,
    text,
    createdAt: serverTimestamp(),
  });
}

// ── Predictions ───────────────────────────────────────────────────────────────

export async function getPredictions(userId) {
  const q    = query(
    collection(db, 'predictions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPrediction(userId, displayName, raceId, raceName, predictedWinner) {
  await addDoc(collection(db, 'predictions'), {
    userId,
    displayName,
    raceId,
    raceName,
    predictedWinner,
    createdAt: serverTimestamp(),
  });
}

export async function getUserPredictionForRace(userId, raceId) {
  const q    = query(
    collection(db, 'predictions'),
    where('userId', '==', userId),
    where('raceId', '==', raceId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}
