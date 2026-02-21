import { Routes, Route } from 'react-router-dom';
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
import NotFound       from './pages/NotFound';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/"             element={<Home />}       />
          <Route path="/drivers"      element={<Drivers />}    />
          <Route path="/teams"        element={<Teams />}      />
          <Route path="/calendar"     element={<Calendar />}   />
          <Route path="/race/:raceId" element={<RaceDetail />} />
          <Route path="/news"         element={<News />}       />

          {/* Protected routes */}
          <Route path="/predictions" element={
            <ProtectedRoute><Predictions /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
