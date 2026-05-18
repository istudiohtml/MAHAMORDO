'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
import { oracles, OracleId } from '@/data/oracles'
import { getOracleTemplateAvatar } from '@/lib/oracle-assets'

interface OracleCardData {
  num: string
  name: string
  sub: string
  icon: string
  cost: number
  id: number
  avatar: string
  theme: string
}

const ORACLE_CARD_META: Record<OracleId, { num: string; sub: string; theme: string }> = {
  1: { num: 'I', sub: 'Thai Astrology', theme: 'moon' },
  2: { num: 'II', sub: 'Korean Saju', theme: 'saju' },
  3: { num: 'III', sub: 'Tarot', theme: 'rahu' },
}

const oracleCards: OracleCardData[] = ([1, 2, 3] as OracleId[]).map((id) => {
  const o = oracles[id]
  const meta = ORACLE_CARD_META[id]
  return {
    num: meta.num,
    name: o.name,
    sub: meta.sub,
    icon: o.avatar,
    cost: o.creditCost,
    id,
    avatar: getOracleTemplateAvatar(o.slug),
    theme: meta.theme,
  }
})

function TiltCard({ o }: { o: OracleCardData }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const sheenRef = useRef<HTMLDivElement>(null)

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
    <Link
      ref={cardRef}
      href={`/fortune/${o.id}`}
      className={`dash-oracle-card oracle-theme-${o.theme}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div ref={sheenRef} className="oracle-sheen" aria-hidden="true" />
      <div className="oracle-card-avatar">
        <img src={o.avatar} alt={o.name} className="oracle-card-avatar-img" />
      </div>
      <span className="oracle-card-icon">{o.icon}</span>
      <p className="dash-oracle-num">Oracle {o.num}</p>
      <p className="dash-oracle-name">{o.name}</p>
      <p className="dash-oracle-sub">{o.sub}</p>
      <p className="dash-oracle-cost">{o.cost} เครดิต ✦</p>
    </Link>
  )
}

export default function OracleTiltCards() {
  return (
    <div className="dash-oracle-cards">
      {oracleCards.map((o) => (
        <TiltCard key={o.num} o={o} />
      ))}
    </div>
  )
}
