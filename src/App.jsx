// ─────────────────────────────────────────────────────────────────────────────
// App.jsx  —  Root layout + route definitions
//
// LESSON: Auth gate pattern
// We check the user at the very top of the component tree. If there is no
// signed-in user, we render a login wall instead of the entire app.
// This is cleaner than protecting every route individually because:
//   1. One place to change if auth requirements evolve
//   2. No redirect loops (no route exists to "bounce" to)
//   3. The user always sees a proper, branded experience
//
// AuthContext already holds off rendering until Firebase resolves the session
// (the "loading" gate), so by the time App renders, we know for certain
// whether the user is logged in or not.
// ─────────────────────────────────────────────────────────────────────────────

import { Routes, Route } from 'react-router-dom';
import { useAuth }        from './context/AuthContext';
import { signInWithGoogle } from './firebase/auth';
import Navbar         from './components/Navbar';
import Footer         from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home           from './pages/Home';
import Drivers        from './pages/Drivers';
import Teams          from './pages/Teams';
import Calendar       from './pages/Calendar';
import RaceDetail     from './pages/RaceDetail';
import Predictions    from './pages/Predictions';
import Profile        from './pages/Profile';
import News           from './pages/News';
import Standings      from './pages/Standings';
import NotFound       from './pages/NotFound';

export default function App() {
  const { user } = useAuth();

  // ── Login wall ────────────────────────────────────────────────────────────
  // If no authenticated user, show a full-page login screen.
  // Nothing else in the app renders — no routes, no navbar, nothing.
  if (!user) {
    return (
      <div className="login-wall">
        <div className="login-card">
          <div className="login-logo">
            <span className="brand-flag">🏁</span>
            <span className="login-title">F1 <span className="brand-year">2026</span></span>
          </div>
          <p className="login-subtitle">Fan Hub</p>
          <p className="login-desc">
            Sign in to access driver stats, race predictions,<br />
            fan discussion, and the full 2026 season.
          </p>
          <button className="btn-primary btn-google" onClick={signInWithGoogle}>
            <GoogleIcon />
            Sign in with Google
          </button>
          <p className="login-disclaimer">
            Fan-made site. Not affiliated with Formula 1.
          </p>
        </div>
      </div>
    );
  }

  // ── Authenticated app ─────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* All routes are now effectively protected by the gate above.
              ProtectedRoute wrappers below are kept as explicit documentation
              of which pages require auth for educational purposes. */}
          <Route path="/"             element={<Home />}       />
          <Route path="/drivers"      element={<Drivers />}    />
          <Route path="/teams"        element={<Teams />}      />
          <Route path="/calendar"     element={<Calendar />}   />
          <Route path="/race/:raceId" element={<RaceDetail />} />
          <Route path="/news"         element={<News />}       />
          <Route path="/standings"    element={<Standings />}  />
          <Route path="/predictions"  element={
            <ProtectedRoute><Predictions /></ProtectedRoute>
          } />
          <Route path="/profile"      element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="*"             element={<NotFound />}   />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

// Simple inline Google "G" SVG — avoids an extra dependency just for an icon
function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
