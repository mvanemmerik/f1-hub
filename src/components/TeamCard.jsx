export default function TeamCard({ team, drivers = [] }) {
  return (
    <div className="team-card" style={{ borderTop: `4px solid ${team.color}` }}>
      <div className="team-card-header">
        <div className="team-color-dot" style={{ background: team.color }} />
        <h3 className="team-name">{team.name}</h3>
      </div>
      <p className="team-base">{team.base}</p>
      <div className="team-drivers">
        {drivers.map(d => (
          <div key={d.id} className="team-driver-row">
            <span className="team-driver-flag">{d.flag}</span>
            <span className="team-driver-name">{d.name}</span>
            <span className="team-driver-number" style={{ color: team.color }}>#{d.number}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
