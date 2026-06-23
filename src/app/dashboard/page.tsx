import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import OracleTiltCards from '@/components/dashboard/OracleTiltCard'
import DailyBonusBanner from '@/components/dashboard/DailyBonusBanner'
import { formatThaiDate } from '@/lib/format-date'
import {
  getEffectiveSessionStatus,
  getSessionStatusLabel,
  getSessionStatusDescription,
} from '@/lib/session-status'

type DashboardSearchParams = { bonus?: string; bonus_amount?: string }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>
}) {
  const params = await searchParams
  const showBonus = params.bonus === '1'
  const bonusAmount = Math.max(
    1,
    Number.parseInt(params.bonus_amount ?? '1', 10) || 1
  )

  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value!
  const payload = await verifyAccessToken(token)
  const user = await prisma.user.findUnique({
    where: { id: payload!.userId },
    select: { name: true, credits: true, createdAt: true },
  })

  const recentSessions = await prisma.fortuneSession.findMany({
    where: {
      userId: payload!.userId,
      // Only show sessions where the user actually asked something — skip
      // accidentally-opened-then-closed empty ones.
      messages: { some: { role: 'USER' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { oracle: { select: { name: true, speciality: true } } },
  })

  return (
    <div className="dash-page">
      {showBonus && <DailyBonusBanner amount={bonusAmount} />}

      <div className="dash-page-header">
        <p className="dash-page-eyebrow">Overview</p>
        <h1 className="dash-page-title thai-font">สวัสดี{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="dash-page-sub">พร้อมรับรู้ชะตากรรมของคุณแล้วหรือยัง?</p>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <Link href="/pricing" className="dash-stat-card dash-stat-link">
          <p className="dash-stat-label thai-font">เครดิตคงเหลือ</p>
          <p className="dash-stat-value">{user?.credits ?? 0}</p>
          <p className="dash-stat-unit">ซื้อเครดิตเพิ่ม →</p>
        </Link>
        <div className="dash-stat-card">
          <p className="dash-stat-label thai-font">การดูดวงทั้งหมด</p>
          <p className="dash-stat-value">{recentSessions.length}</p>
          <p className="dash-stat-unit">ครั้ง</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-label thai-font">สมาชิกตั้งแต่</p>
          <p className="dash-stat-value thai-font">
            {user?.createdAt.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
          </p>
          <p className="dash-stat-unit">&nbsp;</p>
        </div>
      </div>

      {/* Daily Fortune Banner */}
      <div className="dash-section">
        <Link href="/fortune/daily" className="dash-daily-banner">
          <span className="dash-daily-icon">✦</span>
          <div className="dash-daily-text">
            <p className="dash-daily-title thai-font">ดวงวันนี้ของคุณ</p>
            <p className="dash-daily-sub thai-font">ดูดวงรายวันฟรี · รีเซตทุกเที่ยงคืน</p>
          </div>
          <span className="dash-daily-arrow">→</span>
        </Link>
      </div>

      {/* Recent sessions */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title thai-font">การดูดวงล่าสุด</h2>
          <Link href="/dashboard/history" className="dash-section-link thai-font">ดูทั้งหมด →</Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-icon">✦</p>
            <p className="dash-empty-text">ยังไม่มีประวัติการดูดวง</p>
            <Link href="/" className="dash-empty-cta">เริ่มดูดวงเลย</Link>
          </div>
        ) : (
          <div className="dash-session-list">
            {recentSessions.map((s) => {
              const effective = getEffectiveSessionStatus(s.status, s.expiresAt)
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/history/${s.id}`}
                  className="dash-session-item dash-session-item-link"
                >
                  <div className="dash-session-oracle">{s.oracle.name}</div>
                  <div className="dash-session-meta thai-font">
                    <span>{s.oracle.speciality}</span>
                    {s.topic && <span className="dash-session-topic">{s.topic}</span>}
                  </div>
                  <div className="dash-session-date thai-font">
                    {formatThaiDate(s.createdAt)}
                  </div>
                  <span
                    className={`dash-session-status thai-font ${effective.toLowerCase()}`}
                    title={getSessionStatusDescription(effective)}
                  >
                    {getSessionStatusLabel(effective)}
                  </span>
                  <span className="dash-session-chevron" aria-hidden>›</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Oracles CTA */}
      <div className="dash-section">
        <h2 className="dash-section-title thai-font">หมอดูของเรา</h2>
        <OracleTiltCards />
      </div>
    </div>
  )
}
