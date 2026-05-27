import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import CreditPackages from '@/components/dashboard/CreditPackages'
import CancelSubscriptionButton from '@/components/dashboard/CancelSubscriptionButton'
import Pagination from '@/components/dashboard/Pagination'
import { formatThaiDate, isExpired } from '@/lib/format-date'

const LOGS_PER_PAGE = 5

type SearchParams = Promise<{ logPage?: string }>

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value!
  const payload = await verifyAccessToken(token)

  const sp = await searchParams
  const rawPage = Number(sp?.logPage ?? '1')
  const currentPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1

  const user = await prisma.user.findUnique({
    where: { id: payload!.userId },
    select: {
      credits: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      stripeCustomerId: true,
    },
  })

  // Check if subscription is scheduled for cancellation
  const lastSubscriptionLog = await prisma.subscriptionLog.findFirst({
    where: { userId: payload!.userId },
    orderBy: { createdAt: 'desc' },
    select: { event: true },
  })

  const isCancelledAtPeriodEnd = lastSubscriptionLog?.event === 'cancel_requested'

  const now = new Date()
  const hasActiveSubscription =
    user &&
    user.subscriptionPlan !== 'NONE' &&
    user.subscriptionExpiresAt !== null &&
    user.subscriptionExpiresAt > now

  const totalLogs = await prisma.creditLog.count({
    where: { userId: payload!.userId },
  })
  const totalPages = Math.max(1, Math.ceil(totalLogs / LOGS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)

  const logs = await prisma.creditLog.findMany({
    where: { userId: payload!.userId },
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * LOGS_PER_PAGE,
    take: LOGS_PER_PAGE,
  })

  const reasonLabel: Record<string, string> = {
    signup_bonus: 'โบนัสสมาชิกใหม่',
    session_start: 'เริ่มการดูดวง',
    purchase: 'ซื้อเครดิต',
    'session_start:subscription': 'เริ่มการดูดวง (สมาชิก)',
  }

  // Extract purchase prefix for dynamic labels
  const getReasonLabel = (reason: string) => {
    if (reasonLabel[reason]) return reasonLabel[reason]
    if (reason.startsWith('purchase_stripe_')) return 'ซื้อเครดิต'
    if (reason.startsWith('subscription_')) return `สมาชิก - ${reason.split('_').slice(1).join(' ')}`
    return reason
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">Credits</p>
        <h1 className="dash-page-title thai-font">เครดิตของฉัน</h1>
        <p className="dash-page-sub">ดูยอดเครดิตและประวัติการใช้งาน</p>
      </div>

      {/* Balance or Subscription */}
      {hasActiveSubscription ? (
        <div className="dash-credit-balance subscription">
          <span className="dash-credit-balance-icon">✦</span>
          <div>
            <p className="dash-credit-balance-count thai-font">
              {user?.subscriptionPlan === 'YEARLY' ? 'รายปี' : 'รายเดือน'}
            </p>
            <p className="dash-credit-balance-label thai-font">
              {isExpired(user?.subscriptionExpiresAt) ? (
                <span className="dash-credits-expired">
                  หมดอายุแล้ว ({formatThaiDate(user?.subscriptionExpiresAt)})
                </span>
              ) : (
                <>หมดอายุ {formatThaiDate(user?.subscriptionExpiresAt)}</>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="dash-credit-balance">
          <span className="dash-credit-balance-icon">✦</span>
          <div>
            <p className="dash-credit-balance-count">{user?.credits ?? 0}</p>
            <p className="dash-credit-balance-label thai-font">เครดิตคงเหลือ</p>
          </div>
        </div>
      )}

      {/* Subscription Cancel Button */}
      {hasActiveSubscription && (
        <div className="dash-section">
          <h2 className="dash-section-title thai-font">การสมัครสมาชิก</h2>
          <div className="dash-subscription-info">
            <p>คุณกำลังใช้สมาชิก {user?.subscriptionPlan === 'YEARLY' ? 'รายปี' : 'รายเดือน'}</p>
            <p>หมดอายุ {formatThaiDate(user?.subscriptionExpiresAt)}</p>
          </div>
          <CancelSubscriptionButton userId={payload!.userId} isCancelledAtPeriodEnd={isCancelledAtPeriodEnd} />
        </div>
      )}

      {/* Buy packages - only show if no active subscription */}
      {!hasActiveSubscription && (
        <div className="dash-section">
          <h2 className="dash-section-title thai-font">ซื้อเครดิตเพิ่ม</h2>
          <CreditPackages initialCredits={user?.credits ?? 0} />
        </div>
      )}

      {/* Log */}
      <div className="dash-section" id="credit-log">
        <h2 className="dash-section-title thai-font">ประวัติการใช้เครดิต</h2>
        {logs.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-text">ยังไม่มีประวัติ</p>
          </div>
        ) : (
          <>
            <div className="dash-credit-log">
              {logs.map((log) => (
                <div key={log.id} className="dash-credit-log-item">
                  <div className="dash-credit-log-reason">
                    {getReasonLabel(log.reason)}
                  </div>
                  <div className="dash-credit-log-date thai-font">
                    {formatThaiDate(log.createdAt)}
                  </div>
                  <div className={`dash-credit-log-amount ${log.amount > 0 ? 'positive' : 'negative'}`}>
                    {log.amount > 0 ? '+' : ''}{log.amount}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalCount={totalLogs}
                pageSize={LOGS_PER_PAGE}
                basePath="/dashboard/credits"
                paramName="logPage"
                anchor="credit-log"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
