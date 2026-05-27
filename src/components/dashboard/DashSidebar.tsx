'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ParticleBackground from '@/components/landing/ParticleBackground'
import { formatThaiDate, isExpired } from '@/lib/format-date'

interface User {
  name?: string | null
  email: string
  credits: number
  subscriptionPlan?: string | null
  subscriptionExpiresAt?: Date | null
  role?: string
}

const isAdminRole = (role?: string) =>
  role === 'ADMIN' || role === 'SUPERADMIN'

interface Props {
  user: User
}

const navItems = [
  { href: '/dashboard', label: 'หน้าหลัก', icon: '◈' },
  { href: '/dashboard/history', label: 'ประวัติดูดวง', icon: '◎' },
  { href: '/articles', label: 'บทความ', icon: '❑' },
  { href: '/dashboard/credits', label: 'เครดิต', icon: '✦' },
  { href: '/pricing', label: 'ราคา & แพ็คเก็จ', icon: '◇' },
  { href: '/dashboard/profile', label: 'ข้อมูลส่วนตัว', icon: '○' },
  { href: '/dashboard/privacy', label: 'ความเป็นส่วนตัว', icon: '◐' },
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
      <ParticleBackground />

      {/* Logo */}
      <Link href="/" className="dash-logo">
        <span className="dash-logo-dot" />
        Mahamordo
      </Link>

      {/* User info */}
      <div className="dash-user">
        <div className="dash-user-avatar thai-font">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="dash-user-info">
          <p className="dash-user-name">{user.name ?? 'Guest'}</p>
          <p className="dash-user-email">{user.email}</p>
        </div>
      </div>

      {/* Credits or Subscription */}
      {user.subscriptionPlan && user.subscriptionPlan !== 'NONE' ? (
        <div className="dash-credits subscription">
          <span className="dash-credits-icon">✦</span>
          <div>
            <p className="dash-credits-count thai-font">
              {user.subscriptionPlan === 'YEARLY' ? 'รายปี' : 'รายเดือน'}
            </p>
            <p className="dash-credits-label thai-font">
              {isExpired(user.subscriptionExpiresAt) ? (
                <span className="dash-credits-expired">
                  หมดอายุแล้ว ({formatThaiDate(user.subscriptionExpiresAt)})
                </span>
              ) : (
                <>หมดอายุ {formatThaiDate(user.subscriptionExpiresAt)}</>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="dash-credits">
          <span className="dash-credits-icon">✦</span>
          <div>
            <p className="dash-credits-count">
              {user.credits >= 1000000 ? '∞' : user.credits}
            </p>
            <p className="dash-credits-label thai-font">เครดิต</p>
          </div>
        </div>
      )}

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
        {isAdminRole(user.role) && (
          <Link href="/cms" className="dash-nav-item dash-nav-item-admin">
            <span className="dash-nav-icon">⚙</span>
            หลังบ้าน (CMS)
          </Link>
        )}
      </nav>

      {/* Start fortune CTA */}
      <Link href="/" className="dash-start-btn">
        เริ่มดูดวง &nbsp;✦
      </Link>

      {/* Logout */}
      <button className="dash-logout thai-font" onClick={handleLogout}>
        ออกจากระบบ
      </button>
    </aside>
  )
}
