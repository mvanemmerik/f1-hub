// ─────────────────────────────────────────────────────────────────────────────
// Home.jsx  —  Landing page
// Shows season intro, next upcoming race countdown, and quick stats
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRaces } from '../firebase/firestore';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';

const RSS_FEED = 'https://www.motorsport.com/rss/f1/news/';
const NEWS_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEED)}`;

function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(calcTime(targetDate));

  function calcTime(date) {
    const diff = new Date(date) - new Date();
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTime(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <p className="countdown-done">Race weekend is here!</p>;

  return (
    <div className="countdown">
      {[['Days', timeLeft.days], ['Hrs', timeLeft.hours], ['Min', timeLeft.minutes], ['Sec', timeLeft.seconds]].map(([label, val]) => (
        <div key={label} className="countdown-unit">
          <span className="countdown-value">{String(val).padStart(2, '0')}</span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [races,   setRaces]   = useState([]);
  const [news,    setNews]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRaces().then(data => { setRaces(data); setLoading(false); });
    fetch(NEWS_API)
      .then(r => r.json())
      .then(d => { if (d.status === 'ok') setNews(d.items.slice(0, 3)); })
      .catch(() => {});
  }, []);

  if (loading) return <LoadingSpinner message="Loading season data..." />;

  const today     = new Date();
  const upcoming  = races.find(r => new Date(r.date) >= today);
  const completed = races.filter(r => new Date(r.date) < today);

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Formula 1 — Fan Hub</p>
          <h1 className="hero-title">
            2026 <span className="text-red">Season</span>
          </h1>
          <p className="hero-subtitle">
            New era. New regulations. 11 teams, 22 drivers, {races.length} races.
            <br />Follow every lap, predict every winner, debate every move.
          </p>
          <div className="hero-cta">
            <Link to="/calendar" className="btn-primary">View Calendar</Link>
            <Link to="/drivers" className="btn-outline">Meet the Drivers</Link>
          </div>
        </div>
      </section>

      {/* Next Race */}
      {upcoming && (
        <section className="section">
          <h2 className="section-title">Next Race</h2>
          <div className="next-race-card">
            <div className="next-race-info">
              <span className="race-round">Round {upcoming.round}</span>
              <h3 className="next-race-name">{upcoming.name}</h3>
              <p className="next-race-circuit">{upcoming.circuit}</p>
              <p className="next-race-date">
                {new Date(upcoming.date).toLocaleDateString('en-GB', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              <Link to={`/race/${upcoming.id}`} className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Race Details &amp; Comments →
              </Link>
            </div>
            <div className="next-race-countdown">
              <p className="countdown-label-top">Race starts in</p>
              <Countdown targetDate={upcoming.date} />
            </div>
          </div>
        </section>
      )}

      {/* Season Stats */}
      <section className="section">
        <h2 className="section-title">Season at a Glance</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{races.length}</span>
            <span className="stat-label">Races</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">11</span>
            <span className="stat-label">Teams</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">22</span>
            <span className="stat-label">Drivers</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{completed.length}</span>
            <span className="stat-label">Races Done</span>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {news.length > 0 && (
        <section className="section">
          <div className="section-title-row">
            <h2 className="section-title">Latest News</h2>
            <Link to="/news" className="section-more">All news →</Link>
          </div>
          <div className="news-grid news-grid-home">
            {news.map((article, i) => (
              <NewsCard key={i} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
