import Link from 'next/link'
import FortuneSelectBg from '@/components/fortune/FortuneSelectBg'
import FortuneSelectCards from '@/components/fortune/FortuneSelectCards'

export default function FortuneSelectPage() {
  return (
    <div className="fs-page">
      <FortuneSelectBg />

      <div className="fs-container">
        {/* Header */}
        <header className="fs-header">
          <Link href="/dashboard" className="fs-back">← Dashboard</Link>
          <span className="fs-brand">Maha Mordo</span>
        </header>

        {/* Hero */}
        <div className="fs-hero">
          <p className="fs-eyebrow">✦ &nbsp; The Grand Oracle &nbsp; ✦</p>
          <h1 className="fs-title">MAHA<br />MORDO</h1>
          <p className="fs-sub thai-font">เลือกหมอดูของคุณ</p>
        </div>

        {/* Poster Grid */}
        <FortuneSelectCards />
      </div>
    </div>
  )
}
