// ─────────────────────────────────────────────────────────────────────────────
// Predictions.jsx  —  Race winner predictions (requires auth)
//
// LESSON: This page is wrapped in <ProtectedRoute> in App.jsx, so unauthenticated
// users are redirected before they ever get here. But even if they did reach it,
// the Firestore Security Rules would reject any write attempt.
// Client-side guards = UX. Security Rules = actual security.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getRaces, getDrivers, addPrediction, getUserPredictionForRace } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Predictions() {
  const { user }                      = useAuth();
  const { showToast }                 = useToast();
  const [races,       setRaces]       = useState([]);
  const [drivers,     setDrivers]     = useState([]);
  const [predictions, setPredictions] = useState({}); // { raceId: prediction }
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(null); // raceId being saved
  const [selections,  setSelections]  = useState({});   // { raceId: driverName }

  useEffect(() => {
    async function load() {
      const [raceData, driverData] = await Promise.all([getRaces(), getDrivers()]);
      setRaces(raceData);
      setDrivers(driverData);

      // Load existing predictions for all upcoming races
      const upcoming = raceData.filter(r => new Date(r.date) >= new Date());
      const preds    = {};
      await Promise.all(
        upcoming.map(async race => {
          const p = await getUserPredictionForRace(user.uid, race.id);
          if (p) preds[race.id] = p;
        })
      );
      setPredictions(preds);
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSubmit(race) {
    const winner = selections[race.id];
    if (!winner) return;
    setSaving(race.id);
    try {
      await addPrediction(user.uid, user.displayName, race.id, race.name, winner);
      setPredictions(prev => ({
        ...prev,
        [race.id]: { predictedWinner: winner },
      }));
      setSelections(prev => ({ ...prev, [race.id]: '' }));
      showToast(`Prediction locked in for ${race.name}!`);
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading predictions..." />;

  const upcomingRaces = races.filter(r => new Date(r.date) >= new Date());

  return (
    <div className="page">
      <div className="page-header">
        <h1>Race Predictions</h1>
        <p className="page-subtitle">
          Signed in as <strong>{user.displayName}</strong> — pick your winners before each race weekend
        </p>
      </div>

      {upcomingRaces.length === 0 && (
        <p className="empty-state">Season is complete. See you in 2027!</p>
      )}

      <div className="predictions-list">
        {upcomingRaces.map(race => {
          const existing = predictions[race.id];
          return (
            <div key={race.id} className="prediction-card">
              <div className="prediction-race-info">
                <span className="prediction-flag">{race.countryFlag}</span>
                <div>
                  <span className="prediction-round">Round {race.round}</span>
                  <h3 className="prediction-name">{race.name}</h3>
                  <p className="prediction-date">
                    {new Date(race.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="prediction-form">
                {existing ? (
                  <div className="prediction-existing">
                    <span className="prediction-check">✓</span>
                    <span>Your pick: <strong>{existing.predictedWinner}</strong></span>
                  </div>
                ) : (
                  <div className="prediction-select-row">
                    <select
                      className="prediction-select"
                      value={selections[race.id] || ''}
                      onChange={e => setSelections(prev => ({ ...prev, [race.id]: e.target.value }))}
                    >
                      <option value="">— Select a driver —</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.name}>{d.name} ({d.team})</option>
                      ))}
                    </select>
                    <button
                      className="btn-primary"
                      disabled={!selections[race.id] || saving === race.id}
                      onClick={() => handleSubmit(race)}
                    >
                      {saving === race.id ? 'Saving…' : 'Lock In'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
