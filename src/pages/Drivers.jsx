// ─────────────────────────────────────────────────────────────────────────────
// Drivers.jsx  —  Full 2026 driver grid
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getDrivers } from '../firebase/firestore';
import DriverCard from '../components/DriverCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Drivers() {
  const [drivers,  setDrivers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('All');

  useEffect(() => {
    getDrivers().then(data => { setDrivers(data); setLoading(false); });
  }, []);

  if (loading) return <LoadingSpinner message="Loading drivers..." />;

  // Build team filter list from the data itself
  const teams = ['All', ...new Set(drivers.map(d => d.team))].sort((a, b) =>
    a === 'All' ? -1 : a.localeCompare(b)
  );

  const visible = filter === 'All' ? drivers : drivers.filter(d => d.team === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h1>2026 Drivers</h1>
        <p className="page-subtitle">The full grid — {drivers.length} drivers across {teams.length - 1} teams</p>
      </div>

      {/* Team filter tabs */}
      <div className="filter-bar">
        {teams.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`filter-btn ${filter === t ? 'active' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Driver grid */}
      <div className="driver-grid">
        {visible.map(driver => (
          <DriverCard key={driver.id} driver={driver} />
        ))}
      </div>
    </div>
  );
}
