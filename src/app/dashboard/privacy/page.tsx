import { cookies } from 'next/headers'
import Link from 'next/link'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { formatThaiDateTime } from '@/lib/format-date'
import PrivacyControls from '@/components/dashboard/PrivacyControls'

export const metadata = {
  title: 'ความเป็นส่วนตัว — MAHAMORDO',
}

export default async function DashboardPrivacyPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value!
  const payload = await verifyAccessToken(token)

  const user = await prisma.user.findUnique({
    where: { id: payload!.userId },
    select: {
      email: true,
      consentVersion: true,
      consentAcceptedAt: true,
      marketingConsent: true,
      dataExportRequestedAt: true,
      deletionRequestedAt: true,
      createdAt: true,
    },
  })

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">Privacy & PDPA</p>
        <h1 className="dash-page-title thai-font">ความเป็นส่วนตัว</h1>
        <p className="dash-page-sub">
          จัดการข้อมูลส่วนบุคคลของคุณตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
        </p>
      </div>

      <section className="dash-section">
        <h2 className="dash-section-title thai-font">สถานะการยินยอม</h2>
        <div className="dash-info-grid">
          <div className="dash-info-row">
            <span className="dash-info-label">บัญชี</span>
            <span className="dash-info-value">{user?.email}</span>
          </div>
          <div className="dash-info-row">
            <span className="dash-info-label">สมัครเมื่อ</span>
            <span className="dash-info-value">
              {formatThaiDateTime(user?.createdAt)}
            </span>
          </div>
          <div className="dash-info-row">
            <span className="dash-info-label">นโยบายฉบับที่ยอมรับ</span>
            <span className="dash-info-value">
              {user?.consentVersion ?? '—'}
            </span>
          </div>
          <div className="dash-info-row">
            <span className="dash-info-label">ยอมรับเมื่อ</span>
            <span className="dash-info-value">
              {formatThaiDateTime(user?.consentAcceptedAt)}
            </span>
          </div>
          <div className="dash-info-row">
            <span className="dash-info-label">Marketing email</span>
            <span className="dash-info-value">
              {user?.marketingConsent ? 'เปิดอยู่' : 'ปิดอยู่'}
            </span>
          </div>
          {user?.dataExportRequestedAt && (
            <div className="dash-info-row">
              <span className="dash-info-label">ขอ export ล่าสุด</span>
              <span className="dash-info-value">
                {formatThaiDateTime(user.dataExportRequestedAt)}
              </span>
            </div>
          )}
          {user?.deletionRequestedAt && (
            <div className="dash-info-row">
              <span className="dash-info-label">คำขอลบบัญชี</span>
              <span className="dash-info-value dash-info-warning">
                {formatThaiDateTime(user.deletionRequestedAt)}
              </span>
            </div>
          )}
        </div>
      </section>

      <PrivacyControls
        initialMarketing={user?.marketingConsent ?? false}
        hasDeletionRequest={Boolean(user?.deletionRequestedAt)}
      />

      <section className="dash-section">
        <h2 className="dash-section-title thai-font">เอกสาร</h2>
        <div className="dash-links-list">
          <Link href="/pdpa" className="dash-link-item">
            <span className="dash-link-item-icon">◈</span>
            <div>
              <p className="dash-link-item-title">นโยบายความเป็นส่วนตัว (PDPA)</p>
              <p className="dash-link-item-sub">
                อ่านนโยบายฉบับเต็ม — เก็บอะไรบ้าง, แชร์กับใคร, สิทธิของท่าน
              </p>
            </div>
          </Link>
          <Link href="/terms" className="dash-link-item">
            <span className="dash-link-item-icon">◇</span>
            <div>
              <p className="dash-link-item-title">เงื่อนไขการใช้บริการ</p>
              <p className="dash-link-item-sub">
                ข้อตกลงและเงื่อนไขในการใช้ MAHAMORDO
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
