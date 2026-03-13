import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function HistoryPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value!
  const payload = await verifyAccessToken(token)

  const sessions = await prisma.fortuneSession.findMany({
    where: { userId: payload!.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      oracle: { select: { name: true, speciality: true } },
      _count: { select: { messages: true } },
    },
  })

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">History</p>
        <h1 className="dash-page-title">ประวัติดูดวง</h1>
        <p className="dash-page-sub">บันทึกการดูดวงทั้งหมดของคุณ</p>
      </div>

      {sessions.length === 0 ? (
        <div className="dash-empty">
          <p className="dash-empty-icon">◎</p>
          <p className="dash-empty-text">ยังไม่มีประวัติการดูดวง</p>
          <Link href="/" className="dash-empty-cta">เริ่มดูดวงเลย</Link>
        </div>
      ) : (
        <div className="dash-session-list full">
          {sessions.map((s) => (
            <div key={s.id} className="dash-session-item">
              <div className="dash-session-oracle">{s.oracle.name}</div>
              <div className="dash-session-meta">
                <span>{s.oracle.speciality}</span>
                {s.topic && <span className="dash-session-topic">{s.topic}</span>}
                <span>{s._count.messages} ข้อความ</span>
              </div>
              <div className="dash-session-date">
                {s.createdAt.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <span className={`dash-session-status ${s.status.toLowerCase()}`}>
                {s.status === 'ACTIVE' ? 'กำลังดำเนินการ' : s.status === 'COMPLETED' ? 'เสร็จสิ้น' : 'หมดอายุ'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
