import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-number">404</div>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-sub">Looks like this page retired from the race.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
