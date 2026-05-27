import Link from 'next/link'

export const metadata = {
  title: 'เงื่อนไขการใช้บริการ — MAHAMORDO',
  description: 'เงื่อนไขและข้อตกลงการใช้บริการ MAHAMORDO',
}

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-back">← กลับหน้าหลัก</Link>
        <p className="legal-eyebrow">Terms of Service</p>
        <h1 className="legal-title">เงื่อนไขการใช้บริการ</h1>
        <p className="legal-meta">อัปเดต 25 พฤษภาคม 2569</p>
      </header>

      <article className="legal-content">
        <section className="legal-section">
          <h2>1. การยอมรับเงื่อนไข</h2>
          <p>
            เมื่อท่านสมัครสมาชิกหรือใช้บริการ MAHAMORDO ถือว่าท่านได้อ่าน
            ทำความเข้าใจ และยอมรับเงื่อนไขทั้งหมดนี้แล้ว
            หากไม่ยอมรับโปรดหยุดใช้บริการ
          </p>
        </section>

        <section className="legal-section">
          <h2>2. ลักษณะของบริการ</h2>
          <p>
            MAHAMORDO ให้บริการดูดวง AI โดยใช้โมเดล Claude ของ Anthropic
            <strong> เพื่อความบันเทิงเท่านั้น (For entertainment only)</strong>
            ไม่ใช่คำแนะนำทางการแพทย์ การเงิน กฎหมาย หรือการตัดสินใจสำคัญในชีวิต
          </p>
        </section>

        <section className="legal-section">
          <h2>3. คุณสมบัติของผู้ใช้</h2>
          <ul className="legal-list">
            <li>ต้องมีอายุ 13 ปีบริบูรณ์ขึ้นไป</li>
            <li>ผู้ที่อายุต่ำกว่า 20 ปี ต้องได้รับความยินยอมจากผู้ปกครอง</li>
            <li>ให้ข้อมูลที่เป็นความจริงในการสมัครสมาชิก</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. เครดิตและการชำระเงิน</h2>
          <ul className="legal-list">
            <li>เครดิตที่ซื้อแล้วไม่สามารถขอเงินคืนได้</li>
            <li>สมาชิกแบบรายเดือน/รายปี ยกเลิกได้ตลอดเวลา</li>
            <li>การชำระเงินทั้งหมดผ่าน Stripe (PCI DSS Level 1)</li>
            <li>ราคาอาจเปลี่ยนแปลงได้ — แจ้งล่วงหน้า 30 วัน</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. สิ่งที่ห้ามทำ</h2>
          <ul className="legal-list">
            <li>ใช้บริการเพื่อกิจกรรมที่ผิดกฎหมาย</li>
            <li>พยายามเจาะระบบ / ทดสอบช่องโหว่ด้านความปลอดภัย</li>
            <li>ใช้ bot, scraper, หรือ automation เพื่อข้ามระบบเครดิต</li>
            <li>ส่งข้อความที่ผิดกฎหมาย หยาบคาย หรือล่วงละเมิดผู้อื่น</li>
            <li>คัดลอกหรือเผยแพร่เนื้อหา AI ที่ผลิตจากระบบเพื่อการค้า</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. ทรัพย์สินทางปัญญา</h2>
          <p>
            ภาพ, โลโก้, code, content บนเว็บไซต์เป็นกรรมสิทธิ์ของ MAHAMORDO
            ส่วนผลลัพธ์ AI ที่ท่านสร้างผ่านบริการ ท่านสามารถใช้ส่วนตัวได้
            แต่ห้ามอ้างกรรมสิทธิ์หรือใช้ในเชิงพาณิชย์
          </p>
        </section>

        <section className="legal-section">
          <h2>7. ข้อจำกัดความรับผิด</h2>
          <p>
            บริการของเราใช้เพื่อความบันเทิง MAHAMORDO ไม่รับผิดชอบต่อ
            การตัดสินใจหรือผลที่เกิดจากการนำคำทำนายไปปฏิบัติ
            ผู้ใช้ตัดสินใจด้วยตนเองและรับความเสี่ยงเอง
          </p>
        </section>

        <section className="legal-section">
          <h2>8. การระงับหรือยกเลิกบัญชี</h2>
          <p>
            เราขอสงวนสิทธิในการระงับหรือลบบัญชีหากพบว่าผู้ใช้ละเมิดเงื่อนไข
            โดยจะแจ้งล่วงหน้าทางอีเมลเมื่อเป็นไปได้
          </p>
        </section>

        <section className="legal-section">
          <h2>9. กฎหมายที่ใช้บังคับ</h2>
          <p>
            เงื่อนไขนี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย
            ข้อพิพาทใด ๆ อยู่ในเขตอำนาจของศาลไทย
          </p>
        </section>
      </article>

      <footer className="legal-footer">
        <Link href="/pdpa" className="legal-footer-link">
          นโยบายความเป็นส่วนตัว (PDPA)
        </Link>
        <span className="legal-footer-sep">·</span>
        <Link href="/" className="legal-footer-link">
          หน้าหลัก
        </Link>
      </footer>
    </div>
  )
}
