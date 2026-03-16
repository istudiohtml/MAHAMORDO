'use client'

export type NavMode = 'home' | 'detail'

interface Props {
  mode: NavMode
  ready: boolean
  onHome: () => void
}

export default function Nav({ mode, ready, onHome }: Props) {
  const isDetail = mode === 'detail'

  return (
    <nav className={`site-nav${ready ? ' ready' : ''}`}>
      <div className={`nav-logo${isDetail ? ' light' : ''}`} onClick={onHome}>
        <span className="nav-logo-dot" />
        <div className="nav-logo-text">
          <div className="nav-logo-en">Mahamordo</div>
          <div className="nav-logo-th">มหาหมอดู</div>
        </div>
      </div>
      <div className="nav-right">
        <a href="/fortune" className={`nav-link${isDetail ? ' hidden-link' : ''}`}>หมอดู</a>
        <a href="/pricing" className={`nav-link${isDetail ? ' hidden-link' : ''}`}>ราคา</a>
        {isDetail && (
          <button className="nav-back visible" onClick={onHome}>
            <span className="nav-back-line" />
            กลับหน้าหลัก
          </button>
        )}
        <button
          className={`nav-menu-btn${isDetail ? ' light' : ''}`}
          onClick={onHome}
        >
          <span className="nav-menu-dot" />
          {isDetail ? 'Home' : 'Menu'}
        </button>
      </div>
    </nav>
  )
}
