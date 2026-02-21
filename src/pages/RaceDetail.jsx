// ─────────────────────────────────────────────────────────────────────────────
// RaceDetail.jsx  —  Individual race page with comments
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRace } from '../firebase/firestore';
import CommentSection from '../components/CommentSection';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RaceDetail() {
  const { raceId }            = useParams();
  const [race,    setRace]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRace(raceId).then(data => { setRace(data); setLoading(false); });
  }, [raceId]);

  if (loading) return <LoadingSpinner message="Loading race details..." />;
  if (!race)   return <div className="page"><p>Race not found. <Link to="/calendar">Back to calendar</Link></p></div>;

  const raceDate = new Date(race.date);
  const isPast   = raceDate < new Date();

  return (
    <div className="page">
      {/* Breadcrumb */}
      <p className="breadcrumb">
        <Link to="/calendar">Calendar</Link> / Round {race.round}
      </p>

      {/* Race header */}
      <div className="race-detail-header">
        <div className="race-detail-flag">{race.countryFlag}</div>
        <div>
          <span className="race-round-badge">Round {race.round} — 2026</span>
          <h1 className="race-detail-title">{race.name}</h1>
          <p className="race-detail-circuit">{race.circuit} · {race.country}</p>
          <p className="race-detail-date">
            {raceDate.toLocaleDateString('en-GB', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
          <span className={`badge ${isPast ? 'badge-done' : 'badge-upcoming'}`}>
            {isPast ? 'Completed' : 'Upcoming'}
          </span>
        </div>
      </div>

      {/* Weekend schedule */}
      <section className="section">
        <h2 className="section-title">Weekend Schedule</h2>
        <div className="schedule-grid">
          {[
            { session: 'Practice 1',  day: 'Friday',   time: '13:30' },
            { session: 'Practice 2',  day: 'Friday',   time: '17:00' },
            { session: 'Practice 3',  day: 'Saturday',  time: '12:30' },
            { session: 'Qualifying',  day: 'Saturday',  time: '16:00' },
            { session: 'Race',        day: 'Sunday',   time: '15:00' },
          ].map(s => (
            <div key={s.session} className={`session-card ${s.session === 'Race' ? 'race-session' : ''}`}>
              <span className="session-name">{s.session}</span>
              <span className="session-day">{s.day}</span>
              <span className="session-time">{s.time} local</span>
            </div>
          ))}
        </div>
      </section>

      {/* Comments */}
      <section className="section">
        <CommentSection raceId={raceId} />
      </section>
    </div>
  );
}
