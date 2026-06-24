import Link from 'next/link'
import { CURRENT_POLICY_VERSION } from '@/lib/pdpa'

export const metadata = {
  title: 'นโยบายความเป็นส่วนตัว (PDPA) — MAHAMORDO',
  description:
    'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของผู้ใช้ MAHAMORDO ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
}

const LAST_UPDATED = '25 พฤษภาคม 2569'

export default function PdpaPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-back">← กลับหน้าหลัก</Link>
        <p className="legal-eyebrow">PDPA · Privacy Policy</p>
        <h1 className="legal-title">นโยบายความเป็นส่วนตัว</h1>
        <p className="legal-meta">
          ฉบับที่ {CURRENT_POLICY_VERSION} · อัปเดต {LAST_UPDATED}
        </p>
      </header>

      <article className="legal-content">
        <section className="legal-section">
          <h2>1. ผู้ควบคุมข้อมูลส่วนบุคคล</h2>
          <p>
            <strong>MAHAMORDO (มาหาหมอดู)</strong> ("เรา" / "ผู้ให้บริการ")
            เป็นผู้ควบคุมข้อมูลส่วนบุคคลของท่านตาม
            พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            สามารถติดต่อเราได้ที่{' '}
            <a href="mailto:privacy@mahamordo.app">privacy@mahamordo.app</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>2. ข้อมูลที่เราเก็บรวบรวม</h2>
          <ul className="legal-list">
            <li>
              <strong>ข้อมูลบัญชี:</strong> อีเมล, ชื่อ, รหัสผ่าน
              (เข้ารหัสด้วย bcrypt) หรือ Google account ID
            </li>
            <li>
              <strong>ข้อมูลโปรไฟล์:</strong> ชื่อจริง, นามสกุล, วัน-เวลา-สถานที่เกิด
              (ใช้สำหรับการดูดวง)
            </li>
            <li>
              <strong>ข้อมูลการใช้งาน:</strong> ประวัติการดูดวง, ข้อความสนทนากับ AI,
              เครดิตคงเหลือ, แพ็คเก็จที่ใช้
            </li>
            <li>
              <strong>ข้อมูลการชำระเงิน:</strong> ประวัติคำสั่งซื้อ (Stripe customer ID)
              — <em>ไม่เก็บเลขบัตรเครดิตในระบบของเรา</em>
            </li>
            <li>
              <strong>คุกกี้:</strong> session token, refresh token, การตั้งค่า UI
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. วัตถุประสงค์ในการเก็บข้อมูล</h2>
          <ul className="legal-list">
            <li>ให้บริการดูดวงและสร้างคำทำนายเฉพาะบุคคล</li>
            <li>ยืนยันตัวตนและรักษาความปลอดภัยของบัญชี</li>
            <li>ประมวลผลคำสั่งซื้อและสมาชิกภาพผ่าน Stripe</li>
            <li>ปรับปรุงคุณภาพบริการและสร้างคำตอบ AI ที่แม่นยำขึ้น</li>
            <li>ส่งอีเมลแจ้งเตือนเกี่ยวกับบัญชี (เช่น reset password)</li>
            <li>(ทางเลือก) ส่งข่าวสาร โปรโมชั่น หากคุณยินยอม</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. ฐานทางกฎหมาย (Legal Basis)</h2>
          <ul className="legal-list">
            <li>
              <strong>การปฏิบัติตามสัญญา:</strong> บริการดูดวง, การชำระเงิน,
              การจัดการบัญชี
            </li>
            <li>
              <strong>ความยินยอม:</strong> Marketing email, Analytics cookies
              (ยกเลิกได้ทุกเมื่อ)
            </li>
            <li>
              <strong>ประโยชน์โดยชอบด้วยกฎหมาย:</strong> การปรับปรุงบริการ,
              การป้องกันการทุจริต
            </li>
            <li>
              <strong>การปฏิบัติตามกฎหมาย:</strong> เก็บใบเสร็จ-ภาษีตามที่กฎหมายกำหนด
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. การเปิดเผยข้อมูลให้บุคคลที่สาม</h2>
          <p>เราเปิดเผยข้อมูลเฉพาะกับผู้ให้บริการที่จำเป็นต่อการดำเนินงาน:</p>
          <ul className="legal-list">
            <li>
              <strong>Stripe (USA):</strong> ประมวลผลการชำระเงิน — ดู{' '}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe Privacy Policy
              </a>
            </li>
            <li>
              <strong>Anthropic Claude (USA):</strong> สร้างคำทำนาย AI
              — ส่งเฉพาะข้อความสนทนา ไม่ส่งข้อมูลบัญชี
            </li>
            <li>
              <strong>OpenAI (USA):</strong> สร้างรูปภาพประกอบ (DALL-E)
              — ส่งเฉพาะ prompt ข้อความ ไม่ส่งข้อมูลผู้ใช้
            </li>
            <li>
              <strong>Google (USA):</strong> ยืนยันตัวตน OAuth — เก็บเฉพาะ email และชื่อ
            </li>
            <li>
              <strong>Resend (USA):</strong> ส่งอีเมลธุรกรรม (reset password)
            </li>
          </ul>
          <p>
            <em>เราไม่ขายข้อมูลส่วนบุคคลของท่านให้กับบุคคลที่สามใด ๆ</em>
          </p>
        </section>

        <section className="legal-section">
          <h2>6. ระยะเวลาในการเก็บข้อมูล</h2>
          <ul className="legal-list">
            <li>ข้อมูลบัญชีและประวัติดูดวง: ตลอดที่บัญชีเปิดอยู่</li>
            <li>หลังลบบัญชี: ลบข้อมูลส่วนบุคคลภายใน 30 วัน</li>
            <li>ใบเสร็จ/บันทึกการชำระเงิน: เก็บ 5 ปี ตามกฎหมายภาษี</li>
            <li>Log ความปลอดภัย: 90 วัน</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. สิทธิของเจ้าของข้อมูล</h2>
          <p>ท่านมีสิทธิตาม PDPA ดังนี้:</p>
          <ul className="legal-list">
            <li>
              <strong>สิทธิเข้าถึง (Right of Access):</strong>{' '}
              ขอ export ข้อมูลทั้งหมดได้ที่หน้า{' '}
              <Link href="/dashboard/privacy" className="legal-link">
                ความเป็นส่วนตัว
              </Link>
            </li>
            <li>
              <strong>สิทธิแก้ไข (Right to Rectification):</strong>{' '}
              แก้ไขข้อมูลโปรไฟล์ได้ที่หน้า{' '}
              <Link href="/dashboard/profile" className="legal-link">
                ข้อมูลส่วนตัว
              </Link>
            </li>
            <li>
              <strong>สิทธิลบ (Right to Erasure):</strong>{' '}
              ขอลบบัญชีและข้อมูลทั้งหมดได้ที่{' '}
              <Link href="/dashboard/privacy" className="legal-link">
                หน้าจัดการความเป็นส่วนตัว
              </Link>{' '}
              หรือส่งอีเมลถึงเราหากเข้าระบบไม่ได้ — เราจะดำเนินการภายใน 30 วัน
              (ข้อมูลชำระเงินจะถูกเก็บไว้ 5 ปีตามกฎหมายภาษี)
            </li>
            <li>
              <strong>สิทธิถอนความยินยอม:</strong> ปิด analytics/marketing
              ได้ทุกเมื่อ
            </li>
            <li>
              <strong>สิทธิคัดค้านการประมวลผล</strong> และ
              <strong>สิทธิร้องเรียน</strong> ต่อสำนักงานคณะกรรมการคุ้มครอง
              ข้อมูลส่วนบุคคล (สคส.)
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. มาตรการรักษาความปลอดภัย</h2>
          <ul className="legal-list">
            <li>รหัสผ่านเข้ารหัสด้วย bcrypt (cost 10+)</li>
            <li>การเชื่อมต่อทั้งหมดใช้ HTTPS/TLS</li>
            <li>Session token หมดอายุ + refresh token rotation</li>
            <li>Database backup รายวัน, retention 30 วัน</li>
            <li>เข้าถึงข้อมูล production ผ่าน role-based access control</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. การเปลี่ยนแปลงนโยบาย</h2>
          <p>
            เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว เมื่อมีการเปลี่ยนแปลงสำคัญ
            ผู้ใช้จะได้รับการแจ้งเตือนผ่านแบนเนอร์บนเว็บไซต์
            และต้องยืนยันการยอมรับฉบับใหม่ก่อนใช้งานต่อ
          </p>
        </section>

        <section className="legal-section">
          <h2>10. ติดต่อเรา</h2>
          <p>
            หากมีคำถามเกี่ยวกับนโยบายนี้ หรือต้องการใช้สิทธิ์ตาม PDPA
            <br />
            อีเมล:{' '}
            <a href="mailto:privacy@mahamordo.app">privacy@mahamordo.app</a>
            <br />
            หรือไปที่หน้า{' '}
            <Link href="/dashboard/privacy" className="legal-link">
              จัดการความเป็นส่วนตัว
            </Link>
          </p>
        </section>
      </article>

      <footer className="legal-footer">
        <Link href="/terms" className="legal-footer-link">
          เงื่อนไขการใช้บริการ
        </Link>
        <span className="legal-footer-sep">·</span>
        <Link href="/" className="legal-footer-link">
          หน้าหลัก
        </Link>
      </footer>
    </div>
  )
}
