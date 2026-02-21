// ─────────────────────────────────────────────────────────────────────────────
// Teams.jsx  —  2026 Constructor grid
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getTeams, getDrivers } from '../firebase/firestore';
import TeamCard from '../components/TeamCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Teams() {
  const [teams,   setTeams]   = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTeams(), getDrivers()]).then(([t, d]) => {
      setTeams(t.sort((a, b) => a.name.localeCompare(b.name)));
      setDrivers(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner message="Loading teams..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>2026 Constructors</h1>
        <p className="page-subtitle">{teams.length} teams competing in the 2026 World Championship</p>
      </div>

      <div className="team-grid">
        {teams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
            drivers={drivers.filter(d => d.teamId === team.id)}
          />
        ))}
      </div>
    </div>
  );
}
