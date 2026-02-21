// ─────────────────────────────────────────────────────────────────────────────
// Calendar.jsx  —  2026 Race Calendar
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRaces } from '../firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Calendar() {
  const [races,   setRaces]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRaces().then(data => { setRaces(data); setLoading(false); });
  }, []);

  if (loading) return <LoadingSpinner message="Loading calendar..." />;

  const today = new Date();

  return (
    <div className="page">
      <div className="page-header">
        <h1>2026 Race Calendar</h1>
        <p className="page-subtitle">{races.length} rounds across {new Set(races.map(r => r.country)).size} countries</p>
      </div>

      <div className="race-list">
        {races.map(race => {
          const raceDate  = new Date(race.date);
          const isPast    = raceDate < today;
          const isNext    = !isPast && races.find(r => new Date(r.date) >= today)?.id === race.id;

          return (
            <Link
              key={race.id}
              to={`/race/${race.id}`}
              className={`race-row ${isPast ? 'past' : ''} ${isNext ? 'next-race' : ''}`}
            >
              <div className="race-row-round">
                <span className="round-num">R{String(race.round).padStart(2, '0')}</span>
                {isNext && <span className="next-badge">NEXT</span>}
              </div>

              <div className="race-row-flag">{race.countryFlag}</div>

              <div className="race-row-info">
                <span className="race-row-name">{race.name}</span>
                <span className="race-row-circuit">{race.circuit}</span>
              </div>

              <div className="race-row-date">
                {raceDate.toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </div>

              <div className="race-row-status">
                {isPast
                  ? <span className="badge-done">Completed</span>
                  : <span className="badge-upcoming">Upcoming</span>
                }
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
