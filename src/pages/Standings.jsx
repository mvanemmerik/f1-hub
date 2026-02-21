// ─────────────────────────────────────────────────────────────────────────────
// Standings.jsx  —  Driver and Constructor Championship Standings
//
// LESSON: This data is written to Firestore by the syncF1Data Cloud Function
// (functions/index.js) which runs daily. The client just reads two documents:
//   standings/drivers       → driver championship table
//   standings/constructors  → constructor championship table
//
// Before the 2026 season starts (first race: March 8, 2026) both documents
// will be absent from Firestore. We handle that gracefully with an empty state.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getStandings }        from '../firebase/firestore';
import LoadingSpinner          from '../components/LoadingSpinner';

export default function Standings() {
  const [tab,          setTab]          = useState('drivers');      // active tab
  const [drivers,      setDrivers]      = useState(null);
  const [constructors, setConstructors] = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    // Fetch both in parallel — no dependency between them
    Promise.all([getStandings('drivers'), getStandings('constructors')]).then(
      ([d, c]) => {
        setDrivers(d);
        setConstructors(c);
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <LoadingSpinner message="Loading standings..." />;

  const noData = !drivers && !constructors;

  return (
    <div className="page">
      <div className="page-header">
        <h1>2026 Championship Standings</h1>
        <p className="page-subtitle">
          Updated daily after each race weekend via the Jolpica F1 API
        </p>
      </div>

      {/* Tab switcher */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${tab === 'drivers' ? 'active' : ''}`}
          onClick={() => setTab('drivers')}
        >
          Drivers
        </button>
        <button
          className={`filter-btn ${tab === 'constructors' ? 'active' : ''}`}
          onClick={() => setTab('constructors')}
        >
          Constructors
        </button>
      </div>

      {/* No data yet — season hasn't started */}
      {noData && (
        <div className="standings-empty">
          <p className="empty-state">
            No standings data yet — the 2026 season begins on{' '}
            <strong>8 March 2026</strong> in Melbourne.
          </p>
          <p className="standings-empty-sub">
            Standings will appear here automatically after Race 1.
          </p>
        </div>
      )}

      {/* ── Driver standings ─────────────────────────────────────────────── */}
      {tab === 'drivers' && drivers && (
        <>
          <p className="standings-meta">
            After Round {drivers.round} · {drivers.standings.length} drivers
          </p>
          <div className="standings-table">
            <div className="standings-header standings-row-drivers">
              <span>Pos</span>
              <span>Driver</span>
              <span>Constructor</span>
              <span>Wins</span>
              <span>Points</span>
            </div>
            {drivers.standings.map(s => (
              <div key={s.driverCode} className="standings-row standings-row-drivers">
                <span className={`standings-pos ${s.position <= 3 ? `pos-${s.position}` : ''}`}>
                  {s.position}
                </span>
                <span className="standings-driver">
                  <span className="standings-code">{s.driverCode}</span>
                  <span className="standings-name">{s.driverName}</span>
                </span>
                <span className="standings-constructor">{s.constructor}</span>
                <span className="standings-wins">{s.wins}</span>
                <span className="standings-points">{s.points} <span className="pts-label">pts</span></span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Constructor standings ────────────────────────────────────────── */}
      {tab === 'constructors' && constructors && (
        <>
          <p className="standings-meta">
            After Round {constructors.round} · {constructors.standings.length} constructors
          </p>
          <div className="standings-table">
            <div className="standings-header standings-row-constructors">
              <span>Pos</span>
              <span>Constructor</span>
              <span>Wins</span>
              <span>Points</span>
            </div>
            {constructors.standings.map(s => (
              <div key={s.name} className="standings-row standings-row-constructors">
                <span className={`standings-pos ${s.position <= 3 ? `pos-${s.position}` : ''}`}>
                  {s.position}
                </span>
                <span className="standings-constructor-name">{s.name}</span>
                <span className="standings-wins">{s.wins}</span>
                <span className="standings-points">{s.points} <span className="pts-label">pts</span></span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab selected but doc missing */}
      {tab === 'drivers'      && !drivers      && !noData && (
        <p className="empty-state">Driver standings not yet available.</p>
      )}
      {tab === 'constructors' && !constructors && !noData && (
        <p className="empty-state">Constructor standings not yet available.</p>
      )}
    </div>
  );
}
