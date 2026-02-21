// ─────────────────────────────────────────────────────────────────────────────
// AuthContext.jsx  —  Global authentication state
//
// LESSON: React Context lets us share state across the entire component tree
// without "prop drilling" (passing props through every level).
//
// Pattern:
//   1. Create a Context object
//   2. Wrap the app in a Provider that holds the state
//   3. Any component can call useAuth() to access the current user
//
// onAuthStateChanged is Firebase's listener that fires whenever the user
// logs in or out. We store the result in React state so the whole app
// reactively updates.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';

// The Context object — components will import useAuth() to read this
const AuthContext = createContext(null);

// The Provider component — wraps the whole app in main.jsx
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // Firebase User object or null
  const [loading, setLoading] = useState(true);   // true while Firebase checks session

  useEffect(() => {
    // onAuthStateChanged fires immediately with the current session, then on every change.
    // It returns an unsubscribe function we call on cleanup to avoid memory leaks.
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe; // cleanup when component unmounts
  }, []);

  const value = { user, loading };

  // Don't render children until Firebase resolves the session — prevents flash
  // of logged-out UI when the user is actually already signed in.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook — cleaner than importing useContext + AuthContext everywhere
export function useAuth() {
  return useContext(AuthContext);
}
