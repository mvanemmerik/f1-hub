// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute.jsx  —  Client-side auth guard
//
// LESSON: This component wraps any route that requires authentication.
// If the user is not signed in, they are redirected to the home page.
//
// Note: This is CLIENT-SIDE protection only — it prevents unauthenticated
// users from seeing the UI. The REAL security enforcement lives in
// Firestore Security Rules, which we cover in firestore.rules.
// Never rely solely on client-side guards for sensitive data.
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // Replace so the user can't hit "Back" to sneak into the protected page
    return <Navigate to="/" replace />;
  }

  return children;
}
