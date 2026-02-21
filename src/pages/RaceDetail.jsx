// ─────────────────────────────────────────────────────────────────────────────
// RaceDetail.jsx  —  Individual race page with results + comments
//
// LESSON: We fetch the race document and its result document in parallel.
// The result document may not exist yet (race hasn't happened, or the Cloud
// Function hasn't run). We always handle the null case gracefully.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRace, getRaceResult } from '../firebase/firestore';
import CommentSection from '../components/CommentSection';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RaceDetail() {
  const { raceId }              = useParams();
  const [race,    setRace]      = useState(null);
  const [result,  setResult]    = useState(null);  // may be null if race not yet run
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const raceData = await getRace(raceId);
      setRace(raceData);

      if (raceData) {
        // Try to load the result — docId format is "2026_01", "2026_02", etc.
        const res = await getRaceResult(2026, raceData.round);
        setResult(res);
      }
      setLoading(false);
    }
    load();
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

      {/* Race results — shown only when the Cloud Function has written data */}
      {result && (
        <section className="section">
          <h2 className="section-title">Race Result</h2>
          <div className="result-table">
            <div className="result-header result-row">
              <span>Pos</span>
              <span>Driver</span>
              <span>Constructor</span>
              <span>Pts</span>
              <span>Time / Status</span>
            </div>
            {result.results.map(r => (
              <div key={r.position} className="result-row">
                <span className={`standings-pos ${r.position <= 3 ? `pos-${r.position}` : ''}`}>
                  {r.position}
                </span>
                <span className="result-driver">
                  <span className="standings-code">{r.driverCode}</span>
                  <span className="standings-name">{r.driverName}</span>
                </span>
                <span className="result-constructor">{r.constructor}</span>
                <span className="result-pts">{r.points}</span>
                <span className="result-time">{r.time ?? r.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="section">
        <CommentSection raceId={raceId} />
      </section>
    </div>
  );
}
