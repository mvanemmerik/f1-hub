// ─────────────────────────────────────────────────────────────────────────────
// DriverCard.jsx  —  Single driver display card
// ─────────────────────────────────────────────────────────────────────────────

export default function DriverCard({ driver }) {
  return (
    <div
      className="driver-card"
      style={{ borderTop: `4px solid ${driver.teamColor || '#e10600'}` }}
    >
      <div className="driver-number">#{driver.number}</div>
      <div className="driver-flag">{driver.flag}</div>
      <h3 className="driver-name">{driver.name}</h3>
      <p className="driver-team" style={{ color: driver.teamColor || '#e10600' }}>
        {driver.team}
      </p>
      <p className="driver-nationality">{driver.nationality}</p>
    </div>
  );
}
