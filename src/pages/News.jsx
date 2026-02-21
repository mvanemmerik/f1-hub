// ─────────────────────────────────────────────────────────────────────────────
// News.jsx  —  Latest F1 news via RSS feed
//
// LESSON: We can't fetch RSS directly from the browser due to CORS restrictions
// (the server at motorsport.com doesn't allow cross-origin requests from our
// domain). Instead we use rss2json.com as a proxy — it fetches the RSS on the
// server side and returns clean JSON that our browser can consume.
//
// This is a common pattern for working with RSS in frontend apps.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';

const RSS_FEED = 'https://www.motorsport.com/rss/f1/news/';
const API_URL  = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEED)}`;

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok') {
          setArticles(data.items);
        } else {
          setError('Could not load news feed.');
        }
      })
      .catch(() => setError('Could not load news feed.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading latest news..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Latest F1 News</h1>
        <p className="page-subtitle">
          Via <a href="https://www.motorsport.com/f1/" target="_blank" rel="noopener noreferrer" className="subtle-link">Motorsport.com</a>
        </p>
      </div>

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <a href="https://www.motorsport.com/f1/news/" target="_blank" rel="noopener noreferrer" className="btn-primary">
            Visit Motorsport.com →
          </a>
        </div>
      ) : (
        <div className="news-grid">
          {articles.map((article, i) => (
            <NewsCard key={i} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
