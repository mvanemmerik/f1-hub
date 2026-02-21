// ─────────────────────────────────────────────────────────────────────────────
// Navbar.jsx  —  Top navigation bar
//
// Shows site links and a Sign In / Sign Out button.
// Reads auth state from AuthContext — reacts automatically to login/logout.
// ─────────────────────────────────────────────────────────────────────────────

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, signOut } from '../firebase/auth';

export default function Navbar() {
  const { user }   = useAuth();
  const location   = useLocation();

  const navLinks = [
    { to: '/',            label: 'Home'       },
    { to: '/drivers',     label: 'Drivers'    },
    { to: '/calendar',    label: 'Calendar'   },
    { to: '/predictions', label: 'Predictions' },
  ];

  return (
    <nav className="navbar">
      {/* Logo / Brand */}
      <Link to="/" className="navbar-brand">
        <span className="brand-flag">🏁</span>
        <span className="brand-name">F1 <span className="brand-year">2026</span></span>
      </Link>

      {/* Nav links */}
      <ul className="navbar-links">
        {navLinks.map(link => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Auth section */}
      <div className="navbar-auth">
        {user ? (
          <div className="user-info">
            <img src={user.photoURL} alt={user.displayName} className="avatar" />
            <Link to="/profile" className="user-name">{user.displayName.split(' ')[0]}</Link>
            <button className="btn-ghost" onClick={signOut}>Sign Out</button>
          </div>
        ) : (
          <button className="btn-primary" onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        )}
      </div>
    </nav>
  );
}
