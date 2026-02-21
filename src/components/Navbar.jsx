// ─────────────────────────────────────────────────────────────────────────────
// Navbar.jsx  —  Top navigation bar with mobile hamburger menu
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, signOut } from '../firebase/auth';

export default function Navbar() {
  const { user }            = useAuth();
  const location            = useLocation();
  const [menuOpen, setMenu] = useState(false);

  const navLinks = [
    { to: '/',            label: 'Home'        },
    { to: '/drivers',     label: 'Drivers'     },
    { to: '/teams',       label: 'Teams'       },
    { to: '/calendar',    label: 'Calendar'    },
    { to: '/news',        label: 'News'        },
    { to: '/predictions', label: 'Predictions' },
  ];

  function close() { setMenu(false); }

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <Link to="/" className="navbar-brand" onClick={close}>
          <span className="brand-flag">🏁</span>
          <span className="brand-name">F1 <span className="brand-year">2026</span></span>
        </Link>

        {/* Desktop links */}
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

        {/* Desktop auth */}
        <div className="navbar-auth desktop-only">
          {user ? (
            <div className="user-info">
              <img src={user.photoURL} alt={user.displayName} className="avatar" />
              <Link to="/profile" className="user-name" onClick={close}>
                {user.displayName.split(' ')[0]}
              </Link>
              <button className="btn-ghost" onClick={signOut}>Sign Out</button>
            </div>
          ) : (
            <button className="btn-primary" onClick={signInWithGoogle}>
              Sign in with Google
            </button>
          )}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="hamburger"
          onClick={() => setMenu(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-menu">
          <ul className="mobile-links">
            {navLinks.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`mobile-link ${location.pathname === link.to ? 'active' : ''}`}
                  onClick={close}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mobile-auth">
            {user ? (
              <div className="mobile-user">
                <img src={user.photoURL} alt={user.displayName} className="avatar" />
                <Link to="/profile" className="user-name" onClick={close}>
                  {user.displayName}
                </Link>
                <button className="btn-ghost" onClick={() => { signOut(); close(); }}>Sign Out</button>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => { signInWithGoogle(); close(); }}>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
