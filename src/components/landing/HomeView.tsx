'use client'

import { useEffect, useRef, useState } from 'react'
import { ALL_ORACLE_IDS, oracles, OracleId } from '@/data/oracles'
import ParticleBackground from './ParticleBackground'

interface Props {
  slideUp: boolean
  animated: boolean
  onOpenOracle: (id: OracleId) => void
  onStartFortune: (id?: OracleId) => void
  // Only oracles in this list are rendered (CMS isActive). Defaults to all.
  activeIds?: OracleId[]
}

export default function HomeView({ slideUp, animated, onOpenOracle, onStartFortune, activeIds }: Props) {
  const [previewId, setPreviewId] = useState<0 | OracleId>(0)
  const prevPreviewRef = useRef<0 | OracleId>(0)
  const ids = activeIds && activeIds.length > 0 ? activeIds : ALL_ORACLE_IDS

  function showPreview(id: 0 | OracleId) {
    prevPreviewRef.current = previewId
    setPreviewId(id)
  }

  const eyebrowFor = (id: OracleId) =>
    id === 1
      ? 'Thai Astrology · Navagraha'
      : id === 2
        ? 'Korean Saju · 사주팔자'
        : 'Tarot · Major Arcana XXII'

  const descFor = (id: OracleId) =>
    id === 1
      ? 'โหราศาสตร์ไทยแท้ ดาวประจำตัว ทิศมงคล'
      : id === 2
        ? 'ซาจู 4 เสา แผนภูมิธาตุ 5 ดวงชะตา 10 ปี'
        : 'ไพ่ทาโรต์ 22 ใบ เชื่อมดาวเกิดและชะตา'

  const previewMeta: Record<OracleId, { tag: string; sub: string; symbol: string }> = {
    1: { tag: 'Oracle I · Thai Astrology', sub: 'อบอุ่น เมตตา เหมือนแม่พูด', symbol: '☽' },
    2: { tag: 'Oracle II · Korean Saju', sub: 'ตรงไปตรงมา กวนนิดๆ', symbol: '☯' },
    3: { tag: 'Oracle III · Tarot', sub: 'เย็นชา ลึกลับ ทุกคำมีความหมาย', symbol: '✦' },
  }

  const firstId = ids[0]

  return (
    <div className={`view-home${slideUp ? ' slide-up' : ''}`}>

      {/* LEFT: cream + dot grid */}
      <div className="hero-left">
        <ParticleBackground />
        <div className="hero-left-content">
          <p className={`hero-eyebrow thai-font${animated ? ' animate' : ''}`}>
            ✦ &nbsp; มาหาหมอดู · Thailand &nbsp; ✦
          </p>
          <h1 className={`hero-title${animated ? ' animate' : ''}`}>
            MAHA<br />MORDO
          </h1>
          <p className={`hero-subtitle${animated ? ' animate' : ''}`}>
            มาหาหมอดู — The Grand Oracle of Thailand
          </p>
          <div className={`hero-divider${animated ? ' animate' : ''}`} />
          <p className={`hero-body${animated ? ' animate' : ''}`}>
            โหราศาสตร์ไทย &nbsp;·&nbsp; ซาจูเกาหลี &nbsp;·&nbsp; ไพ่ทาโรต์
          </p>
          <div className={`hero-buttons${animated ? ' animate' : ''}`}>
            <button className="btn-primary" onClick={() => onStartFortune()}>
              เริ่มดูดวง &nbsp;✦
            </button>
            {firstId && (
              <button className="btn-outline" onClick={() => onOpenOracle(firstId)}>เรียนรู้เพิ่ม</button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: dark oracle panel */}
      <div className="hero-right">
        <ParticleBackground />
        <p className={`panel-label${animated ? ' animate' : ''}`}>
          The Oracles <span>[ {ids.length} ]</span>
        </p>

        <div className="oracle-list">
          {ids.map((id) => {
            const o = oracles[id]
            return (
              <div
                key={id}
                className="oracle-item animate"
                onMouseEnter={() => showPreview(id)}
                onMouseLeave={() => showPreview(0)}
                onClick={() => onOpenOracle(id)}
              >
                <p className="oracle-roman">{o.number} &nbsp;·&nbsp; {eyebrowFor(id)}</p>
                <p className="oracle-name">{o.name}</p>
                <p className="oracle-system">{o.subtitle}</p>
                <p className="oracle-desc">{descFor(id)}</p>
              </div>
            )
          })}
        </div>

        {/* Preview cards */}
        <div className="oracle-preview">
          <div className={`preview-card preview-card-default${previewId === 0 ? ' active' : ''}`}>
            <div className="preview-dots"><span /><span /><span /></div>
            <p className="preview-hint thai-font">เลือกหมอดู</p>
          </div>
          {ids.map((id) => {
            const o = oracles[id]
            const meta = previewMeta[id]
            return (
              <div
                key={id}
                className={`preview-card preview-card-${id}${previewId === id ? ' active' : ''}`}
              >
                <div className="preview-symbol">{meta.symbol}</div>
                <p className="preview-tag">{meta.tag}</p>
                <p className="preview-name thai-font">{o.name}</p>
                <p className="preview-sub">{meta.sub}</p>
                <button className="preview-action thai-font" onClick={() => onOpenOracle(id)}>
                  ดูดวงเลย <span className="preview-action-arrow" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
