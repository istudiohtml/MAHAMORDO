import Link from 'next/link'

/**
 * Minimal footer that lives on pages without a full DetailView footer
 * (pricing, articles, dashboard…). Ensures PDPA + Terms links are
 * reachable from every public surface.
 */
export default function LegalFooter() {
  return (
    <footer className="mini-legal-footer">
      <div className="mini-legal-footer-inner">
        <span className="mini-legal-footer-brand">
          © {new Date().getFullYear()} Mahamordo
        </span>
        <div className="mini-legal-footer-links">
          <Link href="/pdpa" className="mini-legal-footer-link">
            ความเป็นส่วนตัว
          </Link>
          <span className="mini-legal-footer-sep">·</span>
          <Link href="/terms" className="mini-legal-footer-link">
            เงื่อนไขการใช้
          </Link>
          <span className="mini-legal-footer-sep">·</span>
          <a
            href="mailto:hello@mahamordo.com"
            className="mini-legal-footer-link"
          >
            ติดต่อ
          </a>
        </div>
      </div>
    </footer>
  )
}
