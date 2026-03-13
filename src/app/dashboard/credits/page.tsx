import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export default async function CreditsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value!
  const payload = await verifyAccessToken(token)

  const user = await prisma.user.findUnique({
    where: { id: payload!.userId },
    select: { credits: true },
  })

  const logs = await prisma.creditLog.findMany({
    where: { userId: payload!.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const reasonLabel: Record<string, string> = {
    signup_bonus: 'โบนัสสมาชิกใหม่',
    session_start: 'เริ่มการดูดวง',
    purchase: 'ซื้อเครดิต',
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">Credits</p>
        <h1 className="dash-page-title">เครดิตของฉัน</h1>
        <p className="dash-page-sub">ดูยอดเครดิตและประวัติการใช้งาน</p>
      </div>

      {/* Balance */}
      <div className="dash-credit-balance">
        <span className="dash-credit-balance-icon">✦</span>
        <div>
          <p className="dash-credit-balance-count">{user?.credits ?? 0}</p>
          <p className="dash-credit-balance-label">เครดิตคงเหลือ</p>
        </div>
      </div>

      {/* Buy packages — placeholder */}
      <div className="dash-section">
        <h2 className="dash-section-title">ซื้อเครดิตเพิ่ม</h2>
        <div className="dash-credit-packages">
          {[
            { credits: 5, price: 49, label: 'Starter' },
            { credits: 15, price: 129, label: 'Popular', highlight: true },
            { credits: 30, price: 239, label: 'Value' },
          ].map((pkg) => (
            <div key={pkg.credits} className={`dash-credit-pkg${pkg.highlight ? ' highlight' : ''}`}>
              {pkg.highlight && <span className="dash-credit-pkg-badge">แนะนำ</span>}
              <p className="dash-credit-pkg-label">{pkg.label}</p>
              <p className="dash-credit-pkg-count">{pkg.credits}</p>
              <p className="dash-credit-pkg-unit">เครดิต</p>
              <p className="dash-credit-pkg-price">฿{pkg.price}</p>
              <button className="dash-credit-pkg-btn" disabled>เร็วๆ นี้</button>
            </div>
          ))}
        </div>
      </div>

      {/* Log */}
      <div className="dash-section">
        <h2 className="dash-section-title">ประวัติการใช้เครดิต</h2>
        {logs.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-text">ยังไม่มีประวัติ</p>
          </div>
        ) : (
          <div className="dash-credit-log">
            {logs.map((log) => (
              <div key={log.id} className="dash-credit-log-item">
                <div className="dash-credit-log-reason">
                  {reasonLabel[log.reason] ?? log.reason}
                </div>
                <div className="dash-credit-log-date">
                  {log.createdAt.toLocaleDateString('th-TH')}
                </div>
                <div className={`dash-credit-log-amount ${log.amount > 0 ? 'positive' : 'negative'}`}>
                  {log.amount > 0 ? '+' : ''}{log.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
