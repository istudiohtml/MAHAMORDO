import Link from 'next/link'

export const metadata = {
  title: 'ราคา - MAHAMORDO',
  description: 'ดูราคาเครดิตและแพ็คเก็จสมาชิกของ MAHAMORDO',
}

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1 className="pricing-title">ราคา & แพ็คเก็จ</h1>
        <p className="pricing-subtitle">เลือกแพ็คเก็จที่เหมาะสำหรับคุณ</p>
      </div>

      {/* How Credits Work */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">เครดิตทำงานอย่างไร?</h2>
        <div className="pricing-explanation">
          <div className="pricing-explain-item">
            <div className="pricing-explain-number">1</div>
            <div className="pricing-explain-content">
              <h3>สมัครสมาชิก</h3>
              <p>สมัครบัญชีและรับเครดิตฟรี 3 เครดิต</p>
            </div>
          </div>

          <div className="pricing-explain-item">
            <div className="pricing-explain-number">2</div>
            <div className="pricing-explain-content">
              <h3>เลือกหมอดู</h3>
              <p>เลือกจากหมอดู 3 คนที่มีความเชี่ยวชาญต่างกัน</p>
            </div>
          </div>

          <div className="pricing-explain-item">
            <div className="pricing-explain-number">3</div>
            <div className="pricing-explain-content">
              <h3>สอบถาม & เรียนรู้</h3>
              <p>ถามคำถามได้หลายครั้ง แต่ละครั้งใช้ 1 เครดิต</p>
            </div>
          </div>

          <div className="pricing-explain-item">
            <div className="pricing-explain-number">4</div>
            <div className="pricing-explain-content">
              <h3>ซื้อเพิ่มเติม</h3>
              <p>เมื่อเครดิตหมด ซื้อแพ็คเก็จเพิ่มหรือสมัครสมาชิก</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tier */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">ทดลองฟรี</h2>
        <p className="pricing-section-desc">สมัครฟรี ใช้งานจำกัด</p>

        <div className="pricing-packages">
          <div className="pricing-card highlight">
            <div className="pricing-badge">ฟรี</div>
            <div className="pricing-card-header">
              <p className="pricing-card-label">Free Tier</p>
              <p className="pricing-card-count">ทดลอง</p>
            </div>
            <p className="pricing-card-price">฿0</p>
            <p className="pricing-card-desc">สมัครฟรี</p>
            <Link href="/auth/register" className="pricing-card-btn">
              เริ่มต้น
            </Link>
            <div className="pricing-card-features">
              <p>✓ ดู 4 เสา + บุคลิกเบื้องต้น</p>
              <p>✓ AI ภาพรวม 2 ครั้ง/วัน</p>
              <p>✓ ดวงรายวัน (สุขภาพเท่านั้น)</p>
              <p>✕ ดวงความเข้ากัน</p>
              <p>✕ พยากรณ์รายปี/ทศวรรษ</p>
            </div>
          </div>
        </div>
      </section>

      {/* One-Time Packages */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">ซื้อเครดิต (ครั้งเดียว)</h2>
        <p className="pricing-section-desc">ลองใช้งานแบบจ่ายครั้งเดียว</p>

        <div className="pricing-packages">
          <div className="pricing-card">
            <div className="pricing-badge">เริ่มต้น</div>
            <div className="pricing-card-header">
              <p className="pricing-card-label">ทดลองใช้</p>
              <p className="pricing-card-count">5 เครดิต</p>
            </div>
            <p className="pricing-card-price">฿39</p>
            <p className="pricing-card-desc">สำหรับลองใช้งาน</p>
            <Link href="/auth/register" className="pricing-card-btn">
              ซื้อเลย
            </Link>
          </div>
        </div>
      </section>

      {/* Subscriptions */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">สมาชิก (เครดิตไม่จำกัด)</h2>
        <p className="pricing-section-desc">สมัครสมาชิกเพื่อใช้เครดิตไม่จำกัด</p>

        <div className="pricing-packages">
          <div className="pricing-subscription">
            <div className="pricing-sub-header">
              <p className="pricing-sub-name">รายเดือน</p>
              <p className="pricing-sub-credits">ไม่จำกัด</p>
            </div>
            <p className="pricing-sub-unit">เครดิต</p>
            <p className="pricing-sub-price">
              ฿129<span className="pricing-sub-period">/เดือน</span>
            </p>
            <p className="pricing-sub-desc">อัปเดตอัตโนมัติแต่ละเดือน</p>
            <Link href="/auth/register" className="pricing-sub-btn">
              สมัครเลย
            </Link>
          </div>

          <div className="pricing-subscription highlight">
            <div className="pricing-badge">ประหยัด 36%</div>
            <div className="pricing-sub-header">
              <p className="pricing-sub-name">รายปี</p>
              <p className="pricing-sub-credits">ไม่จำกัด</p>
            </div>
            <p className="pricing-sub-unit">เครดิต</p>
            <p className="pricing-sub-price">
              ฿999<span className="pricing-sub-period">/ปี</span>
            </p>
            <p className="pricing-sub-desc">อัปเดตอัตโนมัติแต่ละปี</p>
            <Link href="/auth/register" className="pricing-sub-btn">
              สมัครเลย
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pricing-section pricing-faq">
        <h2 className="pricing-section-title">คำถามที่พบบ่อย</h2>

        <div className="pricing-faq-item">
          <h3>ฉันได้เครดิตฟรีเท่าไหร่?</h3>
          <p>เมื่อสมัครสมาชิกใหม่ คุณจะได้เครดิตฟรี 1 เครดิต เพื่อลองใช้งานก่อน หากต้องการเครดิตเพิ่มเติม สามารถซื้อแพ็คเก็จหรือสมัครสมาชิก</p>
        </div>

        <div className="pricing-faq-item">
          <h3>เครดิตจะหมดอายุไหม?</h3>
          <p>เครดิตที่ซื้อจะไม่หมดอายุ แต่หากบัญชีไม่มีการใช้งานนาน สามารถลบบัญชีได้</p>
        </div>

        <div className="pricing-faq-item">
          <h3>สมาชิกคืออะไร?</h3>
          <p>สมาชิกให้คุณใช้เครดิตไม่จำกัด ทำให้คุณสามารถดูดวงได้หลายครั้งโดยไม่ต้องซื้อเครดิตเพิ่มเติม</p>
        </div>

        <div className="pricing-faq-item">
          <h3>ฉันสามารถยกเลิกสมาชิกได้หรือไม่?</h3>
          <p>ได้ คุณสามารถยกเลิกสมาชิกได้ตลอดเวลา เครดิตที่เหลือจะยังคงอยู่ในบัญชี</p>
        </div>

        <div className="pricing-faq-item">
          <h3>ยกเลิกสมาชิกแล้วใช้เครดิตได้อีกไหม?</h3>
          <p>ได้ เมื่อยกเลิกสมาชิก คุณสามารถใช้เครดิตที่มีอยู่ได้ต่อไป</p>
        </div>
      </section>

      {/* CTA */}
      <section className="pricing-cta">
        <h2>พร้อมเริ่มต้นหรือยัง?</h2>
        <Link href="/auth/register" className="pricing-cta-btn">
          สมัครสมาชิกฟรีวันนี้ ✦
        </Link>
      </section>
    </div>
  )
}
