export default function DriverCard({ driver }) {
  return (
    <div
      className="driver-card"
      style={{ borderTop: `4px solid ${driver.teamColor || '#e10600'}` }}
    >
      <div className="driver-card-top">
        <span className="driver-number" style={{ color: driver.teamColor }}>
          #{driver.number}
        </span>
        {driver.photoUrl && (
          <img
            src={driver.photoUrl}
            alt={driver.name}
            className="driver-photo"
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
      <div className="driver-flag">{driver.flag}</div>
      <h3 className="driver-name">{driver.name}</h3>
      <p className="driver-team" style={{ color: driver.teamColor || '#e10600' }}>
        {driver.team}
      </p>
      <p className="driver-nationality">{driver.nationality}</p>
    </div>
  );
}
