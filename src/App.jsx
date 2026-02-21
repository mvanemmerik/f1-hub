// ─────────────────────────────────────────────────────────────────────────────
// App.jsx  —  Root component: routing and layout
//
// LESSON: React Router v6 uses <Routes> and <Route> to map URL paths to
// components. <BrowserRouter> (in main.jsx) provides the routing context.
//
// Protected routes are wrapped in <ProtectedRoute> which redirects
// unauthenticated users to "/" rather than showing them a blank/error page.
// ─────────────────────────────────────────────────────────────────────────────

import { Routes, Route } from 'react-router-dom';
import Navbar         from './components/Navbar';
import Footer         from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home           from './pages/Home';
import Drivers        from './pages/Drivers';
import Calendar       from './pages/Calendar';
import RaceDetail     from './pages/RaceDetail';
import Predictions    from './pages/Predictions';
import Profile        from './pages/Profile';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public routes — no auth required */}
          <Route path="/"             element={<Home />}       />
          <Route path="/drivers"      element={<Drivers />}    />
          <Route path="/calendar"     element={<Calendar />}   />
          <Route path="/race/:raceId" element={<RaceDetail />} />

          {/* Protected routes — require sign-in */}
          <Route path="/predictions" element={
            <ProtectedRoute><Predictions /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
