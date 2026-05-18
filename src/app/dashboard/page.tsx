import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import OracleTiltCards from '@/components/dashboard/OracleTiltCard'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value!
  const payload = await verifyAccessToken(token)
  const user = await prisma.user.findUnique({
    where: { id: payload!.userId },
    select: { name: true, credits: true, createdAt: true },
  })

  const recentSessions = await prisma.fortuneSession.findMany({
    where: { userId: payload!.userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { oracle: { select: { name: true, speciality: true } } },
  })

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">Overview</p>
        <h1 className="dash-page-title">สวัสดี{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="dash-page-sub">พร้อมรับรู้ชะตากรรมของคุณแล้วหรือยัง?</p>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <Link href="/pricing" className="dash-stat-card dash-stat-link">
          <p className="dash-stat-label">เครดิตคงเหลือ</p>
          <p className="dash-stat-value">{user?.credits ?? 0}</p>
          <p className="dash-stat-unit">ซื้อเครดิตเพิ่ม →</p>
        </Link>
        <div className="dash-stat-card">
          <p className="dash-stat-label">การดูดวงทั้งหมด</p>
          <p className="dash-stat-value">{recentSessions.length}</p>
          <p className="dash-stat-unit">ครั้ง</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-label">สมาชิกตั้งแต่</p>
          <p className="dash-stat-value">
            {user?.createdAt.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
          </p>
          <p className="dash-stat-unit">&nbsp;</p>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">การดูดวงล่าสุด</h2>
          <Link href="/dashboard/history" className="dash-section-link">ดูทั้งหมด →</Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-icon">✦</p>
            <p className="dash-empty-text">ยังไม่มีประวัติการดูดวง</p>
            <Link href="/" className="dash-empty-cta">เริ่มดูดวงเลย</Link>
          </div>
        ) : (
          <div className="dash-session-list">
            {recentSessions.map((s) => (
              <div key={s.id} className="dash-session-item">
                <div className="dash-session-oracle">{s.oracle.name}</div>
                <div className="dash-session-meta">
                  <span>{s.oracle.speciality}</span>
                  {s.topic && <span className="dash-session-topic">{s.topic}</span>}
                </div>
                <div className="dash-session-date">
                  {s.createdAt.toLocaleDateString('th-TH')}
                </div>
                <span className={`dash-session-status ${s.status.toLowerCase()}`}>
                  {s.status === 'ACTIVE' ? 'กำลังดำเนินการ' : s.status === 'COMPLETED' ? 'เสร็จสิ้น' : 'หมดอายุ'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Oracles CTA */}
      <div className="dash-section">
        <h2 className="dash-section-title">หมอดูของเรา</h2>
        <OracleTiltCards />
      </div>
    </div>
  )
}
