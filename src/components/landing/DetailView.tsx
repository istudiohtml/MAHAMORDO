'use client'

import { useEffect, useRef } from 'react'
import { oracles, OracleId } from '@/data/oracles'

interface Props {
  slideIn: boolean
  contentVisible: boolean
  oracleId: OracleId
  onNavigate: (dir: -1 | 1) => void
  onScrollTop: () => void
  onStartFortune: () => void
}

export default function DetailView({
  slideIn,
  contentVisible,
  oracleId,
  onNavigate,
  onScrollTop,
  onStartFortune,
}: Props) {
  const viewRef = useRef<HTMLDivElement>(null)
  const o = oracles[oracleId]

  // Reset scroll when oracle changes
  useEffect(() => {
    viewRef.current?.scrollTo({ top: 0 })
  }, [oracleId])

  return (
    <>
      <div
        ref={viewRef}
        className={`view-detail${slideIn ? ' slide-in' : ''}`}
      >
        <div className="detail-inner">

          {/* MAIN: sticky split panel */}
          <div className="detail-main">

            {/* LEFT: oracle info */}
            <div className="detail-left" data-oracle={oracleId}>
              <div className="detail-oracle-number">{o.number}</div>
              <div className="detail-content">
                <p className={`detail-eyebrow${contentVisible ? ' visible' : ''}`}>
                  {o.eyebrow}
                </p>
                <h2 className={`detail-name${contentVisible ? ' visible' : ''}`}>
                  {o.name}
                </h2>
                <p className={`detail-subtitle${contentVisible ? ' visible' : ''}`}>
                  {o.subtitle}
                </p>
                <div className={`detail-divider${contentVisible ? ' visible' : ''}`} />
                <p
                  className={`detail-desc${contentVisible ? ' visible' : ''}`}
                  dangerouslySetInnerHTML={{ __html: o.desc.replace(/\n/g, '<br>') }}
                />
                <button className={`detail-btn${contentVisible ? ' visible' : ''}`} onClick={onStartFortune}>
                  เริ่มดูดวงเลย &nbsp;✦
                </button>
              </div>
            </div>

            {/* RIGHT: oracle profile panel */}
            <div className={`detail-right${contentVisible ? ' visible' : ''}`}>
              <div className="profile-title">
                <p className="profile-oracle-id">{o.profile.id}</p>
                <h2 className="profile-name">{o.profile.name}</h2>
              </div>

              <div className="profile-rows">
                {o.profile.rows.map((row, i) => (
                  <div
                    key={i}
                    className={`profile-row${contentVisible ? ' visible' : ''}`}
                    style={{ transitionDelay: contentVisible ? `${0.55 + i * 0.07}s` : '0s' }}
                  >
                    <div className="profile-label">{row.label}</div>
                    {row.tags ? (
                      <div className="profile-tags">
                        {row.tags.map((tag) => (
                          <span key={tag} className="profile-tag">{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="profile-value"
                        dangerouslySetInnerHTML={{ __html: row.value }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="profile-cta">
                <button className="profile-cta-btn" onClick={onStartFortune}>เริ่มดูดวงกับหมอดูนี้ &nbsp;✦</button>
              </div>
            </div>

          </div>{/* /.detail-main */}

          {/* FOOTER */}
          <footer className="detail-footer">
            <div className="footer-top">
              <div>
                <p className="footer-contact-label">ติดต่อ</p>
                <a href="mailto:hello@mahamordo.com" className="footer-email">
                  hello@mahamordo.com
                </a>
                <div className="footer-btns">
                  <button className="footer-btn footer-btn-primary" onClick={onStartFortune}>→ &nbsp;เริ่มดูดวง</button>
                  <a href="/auth/register" className="footer-btn footer-btn-outline">✦ &nbsp;สมัครสมาชิก</a>
                </div>
              </div>
              <div className="footer-socials">
                <a href="#" className="footer-social-link">Facebook</a>
                <a href="#" className="footer-social-link">Instagram</a>
                <a href="#" className="footer-social-link">Line Official</a>
              </div>
            </div>

            <div className="footer-bottom">
              <span className="footer-tagline">มหาหมอดู · โหราศาสตร์ไทย</span>
              <div className="footer-nav-group">
                <button className="footer-nav-btn" onClick={() => onNavigate(-1)}>
                  &lt;&lt; &nbsp;หมอดูก่อนหน้า
                </button>
                <button className="footer-nav-btn footer-back-top" onClick={onScrollTop}>
                  <div className="footer-back-top-arrow" />
                  กลับขึ้น
                </button>
                <button className="footer-nav-btn" onClick={() => onNavigate(1)}>
                  หมอดูถัดไป &nbsp;&gt;&gt;
                </button>
              </div>
              <span className="footer-copyright">© 2026 &nbsp;Mahamordo</span>
            </div>
          </footer>

        </div>{/* /.detail-inner */}
      </div>

      {/* SIDE NAV */}
      <div
        className={`detail-nav-side nav-prev${slideIn ? ' visible' : ''}`}
        onClick={() => onNavigate(-1)}
      >
        <div className="side-nav-line" />
        <span className="side-nav-label">Backward</span>
      </div>
      <div
        className={`detail-nav-side nav-next${slideIn ? ' visible' : ''}`}
        onClick={() => onNavigate(1)}
      >
        <span className="side-nav-label">Forward</span>
        <div className="side-nav-line" />
      </div>
    </>
  )
}
