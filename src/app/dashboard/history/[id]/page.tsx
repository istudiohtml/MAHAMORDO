import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { formatThaiDateTime } from '@/lib/format-date'
import { getOracleTemplateAvatar } from '@/lib/oracle-assets'
import {
  getEffectiveSessionStatus,
  getSessionStatusLabel,
  getSessionStatusDescription,
} from '@/lib/session-status'

export const metadata = {
  title: 'รายละเอียดประวัติดูดวง — MAHAMORDO',
}

type Params = { params: Promise<{ id: string }> }

// Map DB oracle slugs to the static numeric IDs used by /fortune/[id].
const SLUG_TO_ORACLE_ID: Record<string, number> = {
  'mae-mor-jan': 1,
  'mother-moon': 1,
  'por-mor-son': 2,
  'father-sun': 2,
  'ajarn-rahu': 3,
  'master-rahu': 3,
}

export default async function HistoryDetailPage({ params }: Params) {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value
  if (!token) redirect('/auth/login?redirect=/dashboard/history')
  const payload = await verifyAccessToken(token)
  if (!payload) redirect('/auth/login?redirect=/dashboard/history')

  const { id } = await params

  const session = await prisma.fortuneSession.findUnique({
    where: { id },
    include: {
      oracle: {
        select: { id: true, name: true, speciality: true, slug: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  })

  if (!session || session.userId !== payload.userId) notFound()

  const oracleAvatar = getOracleTemplateAvatar(session.oracle.slug ?? '') ?? null

  const effectiveStatus = getEffectiveSessionStatus(session.status, session.expiresAt)
  const statusLabel = getSessionStatusLabel(effectiveStatus)
  const statusDescription = getSessionStatusDescription(effectiveStatus)

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <Link href="/dashboard/history" className="dash-back-link">
          ← ย้อนกลับไปประวัติ
        </Link>
        <p className="dash-page-eyebrow">Session detail</p>
        <h1 className="dash-page-title thai-font">รายละเอียดการดูดวง</h1>
      </div>

      <section className="dash-section history-meta-card">
        <div className="history-meta-card-head">
          {oracleAvatar && (
            <img
              src={oracleAvatar}
              alt={session.oracle.name}
              className="history-meta-avatar"
            />
          )}
          <div>
            <p className="history-meta-oracle">{session.oracle.name}</p>
            <p className="history-meta-speciality">
              {session.oracle.speciality}
            </p>
          </div>
          <span
            className={`dash-session-status thai-font ${effectiveStatus.toLowerCase()} history-meta-status`}
            title={statusDescription}
          >
            {statusLabel}
          </span>
        </div>
        {statusDescription && (
          <p className="history-meta-status-hint">{statusDescription}</p>
        )}
        <div className="history-meta-info">
          {session.topic && (
            <div className="history-meta-info-row">
              <span className="history-meta-info-label">หัวข้อ</span>
              <span className="history-meta-info-value">{session.topic}</span>
            </div>
          )}
          <div className="history-meta-info-row">
            <span className="history-meta-info-label">เริ่มเมื่อ</span>
            <span className="history-meta-info-value">
              {formatThaiDateTime(session.createdAt)}
            </span>
          </div>
          <div className="history-meta-info-row">
            <span className="history-meta-info-label">จำนวนข้อความ</span>
            <span className="history-meta-info-value">
              {session.messages.length}
            </span>
          </div>
        </div>
      </section>

      <section className="dash-section">
        <h2 className="dash-section-title thai-font">บทสนทนา</h2>
        {session.messages.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-text">ยังไม่มีข้อความในเซสชันนี้</p>
          </div>
        ) : (
          <div className="history-thread">
            {session.messages.map((m) => {
              const isUser = m.role === 'USER'
              return (
                <div
                  key={m.id}
                  className={`history-bubble ${isUser ? 'is-user' : 'is-oracle'}`}
                >
                  <div className="history-bubble-meta">
                    <span className="history-bubble-author">
                      {isUser ? 'คุณ' : session.oracle.name}
                    </span>
                    <span className="history-bubble-time">
                      {formatThaiDateTime(m.createdAt)}
                    </span>
                  </div>
                  <div className="history-bubble-body">
                    {m.content.split('\n').map((line, idx) => (
                      <p key={idx}>{line || '\u00a0'}</p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {effectiveStatus === 'ACTIVE' && (
        <section className="dash-section">
          <p className="dash-section-text">
            เซสชันนี้ยัง active อยู่ — คุยต่อกับ{session.oracle.name}ได้เลย
            (จะโหลดบทสนทนาเดิมมาให้)
          </p>
          <Link
            href={`/fortune/${SLUG_TO_ORACLE_ID[session.oracle.slug ?? ''] ?? 1}?session=${session.id}`}
            className="dash-btn dash-btn-outline"
          >
            คุยต่อ →
          </Link>
        </section>
      )}
    </div>
  )
}
