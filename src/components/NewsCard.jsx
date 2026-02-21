export default function NewsCard({ article }) {
  const date = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card"
    >
      {article.thumbnail && (
        <div className="news-card-img-wrap">
          <img src={article.thumbnail} alt={article.title} className="news-card-img" loading="lazy" />
        </div>
      )}
      <div className="news-card-body">
        <p className="news-card-date">{date}</p>
        <h3 className="news-card-title">{article.title}</h3>
        <p className="news-card-desc">
          {article.description?.replace(/<[^>]+>/g, '').slice(0, 120)}…
        </p>
        <span className="news-card-link">Read more →</span>
      </div>
    </a>
  );
}
