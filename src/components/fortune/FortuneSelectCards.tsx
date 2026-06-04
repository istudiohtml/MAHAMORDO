'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
import { oracles, OracleId } from '@/data/oracles'
import { getOracleTemplateAvatar } from '@/lib/oracle-assets'
import { useOraclePosters } from '@/hooks/useOraclePosters'
import { useActiveOracleIds } from '@/hooks/useActiveOracleIds'

const themes: Record<OracleId, string> = { 1: 'moon', 2: 'saju', 3: 'rahu' }
const numerals: Record<OracleId, string> = { 1: 'I', 2: 'II', 3: 'III' }

function TiltPoster({ id, index, posterUrl }: { id: OracleId; index: number; posterUrl?: string }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const sheenRef = useRef<HTMLDivElement>(null)
  const o = oracles[id]

  const handleMove = useCallback((e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const card = cardRef.current
    const sheen = sheenRef.current
    if (!card || !sheen) return

    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const rotateY = (x - 0.5) * 16
    const rotateX = (0.5 - y) * 12

    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    sheen.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(184,134,11,0.25) 0%, transparent 60%)`
    sheen.style.opacity = '1'
  }, [])

  const handleLeave = useCallback(() => {
    const card = cardRef.current
    const sheen = sheenRef.current
    if (!card || !sheen) return
    card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)'
    sheen.style.opacity = '0'
  }, [])

  return (
    <div
      className="fs-poster-wrap"
      style={{ animationDelay: `${0.2 + index * 0.15}s` }}
    >
      <Link
        ref={cardRef}
        href={`/fortune/${id}`}
        className={`fs-poster fs-theme-${themes[id]}`}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div ref={sheenRef} className="fs-poster-sheen" aria-hidden="true" />
        <img src={getOracleTemplateAvatar(o.slug, posterUrl)} alt={o.name} className="fs-poster-img" />
        <div className="fs-poster-overlay" aria-hidden="true" />

        <div className="fs-poster-top">
          <span className="fs-poster-num">Oracle {numerals[id]}</span>
          <span className="fs-poster-icon">{o.avatar}</span>
        </div>

        <div className="fs-poster-bottom">
          <h2 className="fs-poster-name">{o.name}</h2>
          <p className="fs-poster-subtitle">{o.subtitle}</p>
          <p className="fs-poster-desc">{o.desc.replace(/\n/g, ' ')}</p>
          <div className="fs-poster-footer">
            <span className="fs-poster-cost thai-font">{o.creditCost} เครดิต</span>
            <span className="fs-poster-cta thai-font">เริ่มเลย →</span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function FortuneSelectCards() {
  const { posters } = useOraclePosters()
  const { ids: activeIds, loaded } = useActiveOracleIds()

  if (loaded && activeIds.length === 0) {
    return (
      <div className="fs-empty thai-font">
        ยังไม่มีหมอดูเปิดให้บริการในขณะนี้
      </div>
    )
  }

  return (
    <div className="fs-grid">
      {activeIds.map((id, i) => (
        <TiltPoster key={id} id={id} index={i} posterUrl={posters[oracles[id].slug]} />
      ))}
    </div>
  )
}
