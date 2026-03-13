'use client'

import { useEffect, useRef, useState } from 'react'
import { oracles, OracleId } from '@/data/oracles'

interface Props {
  slideUp: boolean
  animated: boolean
  onOpenOracle: (id: OracleId) => void
}

export default function HomeView({ slideUp, animated, onOpenOracle }: Props) {
  const [previewId, setPreviewId] = useState<0 | OracleId>(0)
  const prevPreviewRef = useRef<0 | OracleId>(0)

  function showPreview(id: 0 | OracleId) {
    prevPreviewRef.current = previewId
    setPreviewId(id)
  }

  return (
    <div className={`view-home${slideUp ? ' slide-up' : ''}`}>

      {/* LEFT: cream + dot grid */}
      <div className="hero-left">
        <div className="hero-left-content">
          <p className={`hero-eyebrow${animated ? ' animate' : ''}`}>
            ✦ &nbsp; มหาหมอดู · Thailand &nbsp; ✦
          </p>
          <h1 className={`hero-title${animated ? ' animate' : ''}`}>
            MAHA<br />MORDO
          </h1>
          <p className={`hero-subtitle${animated ? ' animate' : ''}`}>
            มหาหมอดู — The Grand Oracle of Thailand
          </p>
          <div className={`hero-divider${animated ? ' animate' : ''}`} />
          <p className={`hero-body${animated ? ' animate' : ''}`}>
            โหราศาสตร์ไทย &nbsp;·&nbsp; ซาจูเกาหลี &nbsp;·&nbsp; ไพ่ทาโรต์
          </p>
          <div className={`hero-buttons${animated ? ' animate' : ''}`}>
            <button className="btn-primary" onClick={() => onOpenOracle(1)}>
              เริ่มดูดวง &nbsp;✦
            </button>
            <button className="btn-outline">เรียนรู้เพิ่ม</button>
          </div>
        </div>
        <div className={`scroll-hint${animated ? ' animate' : ''}`}>
          <span className="scroll-hint-text">เลื่อนลง</span>
          <div className="scroll-hint-line" />
        </div>
      </div>

      {/* RIGHT: dark oracle panel */}
      <div className="hero-right">
        <p className={`panel-label${animated ? ' animate' : ''}`}>
          The Three Oracles <span>[ 3 ]</span>
        </p>

        <div className="oracle-list">
          {([1, 2, 3] as OracleId[]).map((id) => {
            const o = oracles[id]
            return (
              <div
                key={id}
                className="oracle-item animate"
                onMouseEnter={() => showPreview(id)}
                onMouseLeave={() => showPreview(0)}
                onClick={() => onOpenOracle(id)}
              >
                <p className="oracle-roman">{o.number} &nbsp;·&nbsp; {
                  id === 1 ? 'Thai Astrology · Navagraha' :
                  id === 2 ? 'Korean Saju · 사주팔자' :
                  'Tarot · Major Arcana XXII'
                }</p>
                <p className="oracle-name">{o.name}</p>
                <p className="oracle-system">{o.subtitle}</p>
                <p className="oracle-desc">{
                  id === 1 ? 'โหราศาสตร์ไทยแท้ ดาวประจำตัว ทิศมงคล' :
                  id === 2 ? 'ซาจู 4 เสา แผนภูมิธาตุ 5 ดวงชะตา 10 ปี' :
                  'ไพ่ทาโรต์ 22 ใบ เชื่อมดาวเกิดและชะตา'
                }</p>
              </div>
            )
          })}
        </div>

        {/* Preview cards */}
        <div className="oracle-preview">
          <div className={`preview-card preview-card-default${previewId === 0 ? ' active' : ''}`}>
            <div className="preview-dots"><span /><span /><span /></div>
            <p className="preview-hint">เลือกหมอดู</p>
          </div>
          {([1, 2, 3] as OracleId[]).map((id) => {
            const o = oracles[id]
            const symbols = { 1: '☽', 2: '☯', 3: '✦' }
            const previews = {
              1: { tag: 'Oracle I · Thai Astrology', sub: 'อบอุ่น เมตตา เหมือนแม่พูด' },
              2: { tag: 'Oracle II · Korean Saju', sub: 'ตรงไปตรงมา กวนนิดๆ' },
              3: { tag: 'Oracle III · Tarot', sub: 'เย็นชา ลึกลับ ทุกคำมีความหมาย' },
            }
            return (
              <div
                key={id}
                className={`preview-card preview-card-${id}${previewId === id ? ' active' : ''}`}
              >
                <div className="preview-symbol">{symbols[id]}</div>
                <p className="preview-tag">{previews[id].tag}</p>
                <p className="preview-name">{o.name}</p>
                <p className="preview-sub">{previews[id].sub}</p>
                <button className="preview-action" onClick={() => onOpenOracle(id)}>
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
