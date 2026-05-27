import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Pagination from '@/components/dashboard/Pagination'
import { formatThaiDate } from '@/lib/format-date'
import {
  getEffectiveSessionStatus,
  getSessionStatusLabel,
  getSessionStatusDescription,
} from '@/lib/session-status'

const SESSIONS_PER_PAGE = 10

type SearchParams = Promise<{ page?: string }>

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value!
  const payload = await verifyAccessToken(token)

  const sp = await searchParams
  const rawPage = Number(sp?.page ?? '1')
  const currentPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1

  const where = {
    userId: payload!.userId,
    // Hide sessions that have no real conversation (user opened the oracle
    // page but bailed before asking) and any greeting-only sessions.
    messages: { some: { role: 'USER' as const } },
  }

  const totalCount = await prisma.fortuneSession.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / SESSIONS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)

  const sessions = await prisma.fortuneSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * SESSIONS_PER_PAGE,
    take: SESSIONS_PER_PAGE,
    include: {
      oracle: { select: { name: true, speciality: true } },
      _count: { select: { messages: true } },
    },
  })

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">History</p>
        <h1 className="dash-page-title thai-font">ประวัติดูดวง</h1>
        <p className="dash-page-sub">
          บันทึกการดูดวงทั้งหมดของคุณ — กดที่รายการเพื่อดูบทสนทนาย้อนหลัง
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="dash-empty">
          <p className="dash-empty-icon">◎</p>
          <p className="dash-empty-text">ยังไม่มีประวัติการดูดวง</p>
          <Link href="/" className="dash-empty-cta">เริ่มดูดวงเลย</Link>
        </div>
      ) : (
        <>
          <div className="dash-session-list full" id="history-list">
            {sessions.map((s) => {
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
                    <span>{s._count.messages} ข้อความ</span>
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

          {totalPages > 1 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={SESSIONS_PER_PAGE}
              basePath="/dashboard/history"
              paramName="page"
              anchor="history-list"
              unitLabel="ครั้ง"
            />
          )}
        </>
      )}
    </div>
  )
}
