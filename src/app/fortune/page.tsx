import Link from 'next/link'
import { oracles, OracleId } from '@/data/oracles'

export default function FortuneSelectPage() {
  const romanNumerals: Record<OracleId, string> = { 1: 'I', 2: 'II', 3: 'III' }

  return (
    <div className="fortune-select-page">
      {/* Header */}
      <div className="fortune-select-header">
        <Link href="/" className="fortune-select-back">← กลับหน้าหลัก</Link>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '8px', letterSpacing: '4px', color: 'rgba(184,134,11,0.5)', textTransform: 'uppercase' }}>
          Maha Mordo
        </span>
      </div>

      {/* Hero */}
      <div className="fortune-select-hero">
        <p className="fortune-select-eyebrow">✦ &nbsp; Choose Your Oracle &nbsp; ✦</p>
        <h1 className="fortune-select-title">MAHA<br />MORDO</h1>
        <p className="fortune-select-sub">เลือกหมอดูของคุณ — Select your fortune teller</p>
      </div>

      {/* Oracle Grid */}
      <div className="fortune-oracle-grid">
        {([1, 2, 3] as OracleId[]).map((id) => {
          const o = oracles[id]
          return (
            <Link key={id} href={`/fortune/${id}`} className="fortune-oracle-card">
              <p className="fortune-oracle-card-num">Oracle {romanNumerals[id]}</p>
              <div className="fortune-oracle-card-avatar">{o.avatar}</div>
              <p className="fortune-oracle-card-name">{o.name}</p>
              <p className="fortune-oracle-card-sub">{o.subtitle}</p>
              <p className="fortune-oracle-card-desc">
                {o.desc.replace(/\n/g, ' ')}
              </p>
              <div className="fortune-oracle-card-footer">
                <span className="fortune-oracle-card-cost">{o.creditCost} เครดิต / session</span>
                <span className="fortune-oracle-card-arrow">เริ่มเลย →</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
