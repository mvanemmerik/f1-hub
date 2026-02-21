// ─────────────────────────────────────────────────────────────────────────────
// Profile.jsx  —  User profile and prediction history
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPredictions } from '../firebase/firestore';
import { signOut } from '../firebase/auth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user }                      = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    getPredictions(user.uid).then(data => {
      setPredictions(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingSpinner message="Loading your profile..." />;

  return (
    <div className="page">
      {/* Profile header */}
      <div className="profile-header">
        <img src={user.photoURL} alt={user.displayName} className="avatar-lg" />
        <div>
          <h1 className="profile-name">{user.displayName}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-stats">{predictions.length} prediction{predictions.length !== 1 ? 's' : ''} made</p>
        </div>
        <button className="btn-ghost" onClick={signOut} style={{ marginLeft: 'auto' }}>
          Sign Out
        </button>
      </div>

      {/* Prediction history */}
      <section className="section">
        <h2 className="section-title">Your Predictions</h2>

        {predictions.length === 0 ? (
          <p className="empty-state">No predictions yet — head to the Predictions page to make your picks!</p>
        ) : (
          <div className="prediction-history">
            {predictions.map(p => (
              <div key={p.id} className="history-row">
                <span className="history-race">{p.raceName}</span>
                <span className="history-winner">
                  <span className="trophy">🏆</span> {p.predictedWinner}
                </span>
                <span className="history-date">
                  {p.createdAt
                    ? new Date(p.createdAt.seconds * 1000).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
