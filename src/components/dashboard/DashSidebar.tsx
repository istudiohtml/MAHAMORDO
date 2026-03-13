'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface User {
  name?: string | null
  email: string
  credits: number
}

interface Props {
  user: User
}

const navItems = [
  { href: '/dashboard', label: 'หน้าหลัก', icon: '◈' },
  { href: '/dashboard/history', label: 'ประวัติดูดวง', icon: '◎' },
  { href: '/dashboard/credits', label: 'เครดิต', icon: '✦' },
  { href: '/dashboard/profile', label: 'ข้อมูลส่วนตัว', icon: '○' },
]

export default function DashSidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/user/auth/logout', { method: 'POST' })
    router.replace('/auth/login')
  }

  return (
    <aside className="dash-sidebar">
      {/* Logo */}
      <Link href="/" className="dash-logo">
        <span className="dash-logo-dot" />
        Mahamordo
      </Link>

      {/* User info */}
      <div className="dash-user">
        <div className="dash-user-avatar">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="dash-user-info">
          <p className="dash-user-name">{user.name ?? 'Guest'}</p>
          <p className="dash-user-email">{user.email}</p>
        </div>
      </div>

      {/* Credits */}
      <div className="dash-credits">
        <span className="dash-credits-icon">✦</span>
        <div>
          <p className="dash-credits-count">{user.credits} เครดิต</p>
          <p className="dash-credits-label">คงเหลือ</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="dash-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`dash-nav-item${pathname === item.href ? ' active' : ''}`}
          >
            <span className="dash-nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Start fortune CTA */}
      <Link href="/" className="dash-start-btn">
        เริ่มดูดวง &nbsp;✦
      </Link>

      {/* Logout */}
      <button className="dash-logout" onClick={handleLogout}>
        ออกจากระบบ
      </button>
    </aside>
  )
}
