export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-copy">© 2026 F1 Fan Hub — Fictional fan site, not affiliated with Formula 1</span>
        <span className="footer-divider">·</span>
        <span className="footer-built">
          Built with{' '}
          <a href="https://opencode.ai" target="_blank" rel="noopener noreferrer" className="footer-link">
            OpenCode
          </a>
        </span>
        <span className="footer-divider">·</span>
        <a
          href="https://github.com/mvanemmerik/f1-hub"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          GitHub ↗
        </a>
      </div>
    </footer>
  );
}
