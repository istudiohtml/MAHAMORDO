import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'

export const metadata = {
  title: 'ราคา - MAHAMORDO',
  description: 'ดูราคาเครดิตและแพ็คเก็จสมาชิกของ MAHAMORDO',
}

const CREDITS_PATH = '/dashboard/credits'

async function getIsLoggedIn(): Promise<boolean> {
  const store = await cookies()
  const token = store.get('user_token')?.value
  if (!token) return false
  try {
    const payload = await verifyAccessToken(token)
    return Boolean(payload?.userId)
  } catch {
    return false
  }
}

export default async function PricingPage() {
  const isLoggedIn = await getIsLoggedIn()

  // Buttons for paid plans / credits → if logged in, jump straight to /dashboard/credits.
  // Otherwise, send to /auth/login (with redirect back) so existing users don't get forced
  // through registration just to top up.
  const buyHref = isLoggedIn
    ? CREDITS_PATH
    : `/auth/login?redirect=${encodeURIComponent(CREDITS_PATH)}`
  const registerHref = isLoggedIn
    ? '/dashboard'
    : `/auth/register?redirect=${encodeURIComponent('/dashboard')}`

  return (
    <div className="pricing-page">
      {/* Nav */}
      <nav className="pricing-nav">
        <Link href="/dashboard" className="pricing-back">
          <span className="pricing-back-line" />
          Dashboard
        </Link>
        <Link href="/" className="pricing-brand">
          <span className="pricing-brand-dot" />
          Maha Mordo
        </Link>
      </nav>

      {/* Hero — editorial left-aligned */}
      <header className="pricing-hero">
        <p className="pricing-eyebrow">Pricing &amp; Membership</p>
        <h1 className="pricing-title thai-font">ราคา &<br />แพ็คเก็จ</h1>
        <p className="pricing-subtitle">เลือกเส้นทางที่เหมาะกับการเดินทางของคุณ</p>
        <div className="pricing-hero-divider" />
      </header>

      {/* How Credits Work — horizontal ruled steps */}
      <section className="pricing-steps">
        <p className="pricing-section-label">How It Works</p>
        <div className="pricing-steps-list">
          <div className="pricing-step">
            <span className="pricing-step-num">I</span>
            <div className="pricing-step-body">
              <h3>สมัครสมาชิก</h3>
              <p>สร้างบัญชีและรับเครดิตฟรี</p>
            </div>
          </div>
          <div className="pricing-step">
            <span className="pricing-step-num">II</span>
            <div className="pricing-step-body">
              <h3>เลือกหมอดู</h3>
              <p>เลือกจาก 3 หมอดูที่มีศาสตร์ต่างกัน</p>
            </div>
          </div>
          <div className="pricing-step">
            <span className="pricing-step-num">III</span>
            <div className="pricing-step-body">
              <h3>สนทนา</h3>
              <p>ถามคำถาม แต่ละเซสชันใช้เครดิตตามหมอดู</p>
            </div>
          </div>
          <div className="pricing-step">
            <span className="pricing-step-num">IV</span>
            <div className="pricing-step-body">
              <h3>เติมเครดิต</h3>
              <p>ซื้อเพิ่มหรือสมัครสมาชิกไม่จำกัด</p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans — editorial row layout */}
      <section className="pricing-plans">
        <p className="pricing-section-label">Choose Your Path</p>

        {/* Free Tier */}
        <div className="pricing-plan">
          <div className="pricing-plan-left">
            <span className="pricing-plan-tag thai-font">ทดลองฟรี</span>
            <span className="pricing-plan-price">
              <span className="pricing-plan-amount">฿0</span>
            </span>
          </div>
          <div className="pricing-plan-right">
            <h3 className="pricing-plan-name">Free Tier</h3>
            <p className="pricing-plan-desc">สมัครฟรี ทดลองก่อนตัดสินใจ</p>
            <div className="pricing-plan-features">
              <span className="pricing-feature included">ดู 4 เสา + บุคลิกเบื้องต้น</span>
              <span className="pricing-feature included">AI ภาพรวม 2 ครั้ง/วัน</span>
              <span className="pricing-feature included">ดวงรายวัน (สุขภาพ)</span>
              <span className="pricing-feature excluded">ดวงความเข้ากัน</span>
              <span className="pricing-feature excluded">พยากรณ์รายปี/ทศวรรษ</span>
            </div>
            <Link href={registerHref} className="pricing-plan-btn">
              {isLoggedIn ? 'ไปแดชบอร์ด' : 'เริ่มต้นฟรี'}
            </Link>
          </div>
        </div>

        {/* One-Time Credits */}
        <div className="pricing-plan">
          <div className="pricing-plan-left">
            <span className="pricing-plan-tag thai-font">ครั้งเดียว</span>
            <span className="pricing-plan-price">
              <span className="pricing-plan-amount">฿39</span>
            </span>
            <span className="pricing-plan-unit">5 เครดิต</span>
          </div>
          <div className="pricing-plan-right">
            <h3 className="pricing-plan-name">Starter Pack</h3>
            <p className="pricing-plan-desc">สำหรับทดลองใช้งาน ซื้อครั้งเดียวไม่ผูกมัด</p>
            <div className="pricing-plan-features">
              <span className="pricing-feature included">เข้าถึงหมอดูทั้ง 3 คน</span>
              <span className="pricing-feature included">เครดิตไม่มีวันหมดอายุ</span>
              <span className="pricing-feature included">ทุกฟีเจอร์พรีเมียม</span>
            </div>
            <Link href={buyHref} className="pricing-plan-btn">
              ซื้อเครดิต
            </Link>
          </div>
        </div>

        {/* Monthly */}
        <div className="pricing-plan">
          <div className="pricing-plan-left">
            <span className="pricing-plan-tag thai-font">สมาชิก</span>
            <span className="pricing-plan-price">
              <span className="pricing-plan-amount">฿129</span>
              <span className="pricing-plan-period">/เดือน</span>
            </span>
            <span className="pricing-plan-unit">เครดิตไม่จำกัด</span>
          </div>
          <div className="pricing-plan-right">
            <h3 className="pricing-plan-name">Monthly</h3>
            <p className="pricing-plan-desc">ดูดวงไม่จำกัด อัปเดตอัตโนมัติแต่ละเดือน</p>
            <div className="pricing-plan-features">
              <span className="pricing-feature included">เครดิตไม่จำกัดตลอดเดือน</span>
              <span className="pricing-feature included">ทุกฟีเจอร์พรีเมียม</span>
              <span className="pricing-feature included">ยกเลิกได้ตลอดเวลา</span>
            </div>
            <Link href={buyHref} className="pricing-plan-btn">
              สมัครรายเดือน
            </Link>
          </div>
        </div>

        {/* Yearly — recommended */}
        <div className="pricing-plan pricing-plan-featured">
          <div className="pricing-plan-recommend thai-font">ประหยัด 36%</div>
          <div className="pricing-plan-left">
            <span className="pricing-plan-tag thai-font">สมาชิก</span>
            <span className="pricing-plan-price">
              <span className="pricing-plan-amount">฿999</span>
              <span className="pricing-plan-period">/ปี</span>
            </span>
            <span className="pricing-plan-unit">เครดิตไม่จำกัด</span>
          </div>
          <div className="pricing-plan-right">
            <h3 className="pricing-plan-name">Yearly</h3>
            <p className="pricing-plan-desc">คุ้มค่าที่สุด เฉลี่ยเพียง ฿83/เดือน</p>
            <div className="pricing-plan-features">
              <span className="pricing-feature included">เครดิตไม่จำกัดตลอดปี</span>
              <span className="pricing-feature included">ทุกฟีเจอร์พรีเมียม</span>
              <span className="pricing-feature included">ยกเลิกได้ตลอดเวลา</span>
            </div>
            <Link href={buyHref} className="pricing-plan-btn pricing-plan-btn-gold">
              สมัครรายปี
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ — ruled rows */}
      <section className="pricing-faq-section">
        <p className="pricing-section-label thai-font">คำถามที่พบบ่อย</p>

        <div className="pricing-faq-row">
          <h3>ฉันได้เครดิตฟรีเท่าไหร่?</h3>
          <p>สมัครใหม่ได้เครดิตฟรี 1 เครดิต เพื่อทดลองใช้งาน หากต้องการเพิ่มเติม สามารถซื้อแพ็คเก็จหรือสมัครสมาชิก</p>
        </div>

        <div className="pricing-faq-row">
          <h3>เครดิตจะหมดอายุไหม?</h3>
          <p>เครดิตที่ซื้อจะไม่หมดอายุ ใช้ได้ตลอดตราบที่บัญชียังเปิดอยู่</p>
        </div>

        <div className="pricing-faq-row">
          <h3>สมาชิกต่างจากซื้อเครดิตอย่างไร?</h3>
          <p>สมาชิกให้คุณใช้เครดิตไม่จำกัดตลอดรอบบิล ดูดวงได้หลายครั้งโดยไม่ต้องคิดเรื่องเครดิต</p>
        </div>

        <div className="pricing-faq-row">
          <h3>ยกเลิกสมาชิกได้ไหม?</h3>
          <p>ยกเลิกได้ตลอดเวลา เครดิตที่เหลือยังคงอยู่ในบัญชีของคุณ</p>
        </div>

        <div className="pricing-faq-row">
          <h3>หมอดูแต่ละคนใช้เครดิตต่างกันไหม?</h3>
          <p>แม่หมอจันทร์ และ พ่อหมอซอน ใช้ 1 เครดิต/เซสชัน ส่วนอาจารย์ราหู ใช้ 2 เครดิต/เซสชัน</p>
        </div>
      </section>

      {/* CTA — editorial */}
      <section className="pricing-cta">
        <div className="pricing-cta-inner">
          <p className="pricing-cta-eyebrow">
            {isLoggedIn ? 'Top Up Your Credits' : 'Begin Your Journey'}
          </p>
          <h2 className="pricing-cta-title thai-font">
            {isLoggedIn ? (
              <>พร้อมต่อยอด<br />การเดินทาง?</>
            ) : (
              <>พร้อมรับรู้<br />ชะตากรรม?</>
            )}
          </h2>
          <Link
            href={isLoggedIn ? CREDITS_PATH : registerHref}
            className="pricing-cta-btn"
          >
            {isLoggedIn ? 'ไปหน้าเติมเครดิต' : 'สมัครฟรีวันนี้'}
            <span className="pricing-cta-arrow" />
          </Link>
        </div>
      </section>
    </div>
  )
}
