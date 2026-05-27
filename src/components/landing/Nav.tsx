'use client'

export type NavMode = 'home' | 'detail'

interface Props {
  mode: NavMode
  ready: boolean
  onHome: () => void
  isLoggedIn?: boolean
}

export default function Nav({ mode, ready, onHome, isLoggedIn }: Props) {
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
        <a href="/fortune" className={`nav-link thai-font${isDetail ? ' hidden-link' : ''}`}>หมอดู</a>
        <a href="/articles" className={`nav-link thai-font${isDetail ? ' hidden-link' : ''}`}>บทความ</a>
        <a href="/pricing" className={`nav-link thai-font${isDetail ? ' hidden-link' : ''}`}>ราคา</a>
        <a
          href={isLoggedIn ? '/dashboard' : '/auth/login'}
          className={`nav-link thai-font${isDetail ? ' hidden-link' : ''}`}
        >
          {isLoggedIn ? 'แดชบอร์ด' : 'เข้าสู่ระบบ'}
        </a>
        {isDetail && (
          <button className="nav-back thai-font visible" onClick={onHome}>
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
