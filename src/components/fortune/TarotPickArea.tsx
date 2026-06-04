'use client'

import { useEffect, useMemo, useState } from 'react'
import { TarotCard } from '@/data/tarot-cards'

export type TarotPosition = 'past' | 'present' | 'future'

export interface SelectedTarotCard {
  position: TarotPosition
  card: TarotCard
}

interface TarotPickAreaProps {
  cards: TarotCard[]
  selected: SelectedTarotCard[]
  onSelect: (card: TarotCard, position: TarotPosition) => void | Promise<void>
}

const POSITIONS: Array<{ key: TarotPosition; label: string; thai: string }> = [
  { key: 'past', label: 'PAST', thai: 'อดีต' },
  { key: 'present', label: 'PRESENT', thai: 'ปัจจุบัน' },
  { key: 'future', label: 'FUTURE', thai: 'อนาคต' },
]

const BACK_GLYPHS = ['☽', '✦', '☉', '✧', '⚜', '✺']

// Shuffle once per mount so each session feels fresh.
function useShuffled(cards: TarotCard[]): TarotCard[] {
  return useMemo(() => {
    const arr = [...cards]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [cards])
}

export default function TarotPickArea({ cards, selected, onSelect }: TarotPickAreaProps) {
  const deck = useShuffled(cards)
  const [flyingId, setFlyingId] = useState<number | null>(null)

  // Reset flying state if selection externally resets.
  useEffect(() => {
    if (selected.length === 0) setFlyingId(null)
  }, [selected.length])

  const nextPosition: TarotPosition | null =
    selected.length < POSITIONS.length ? POSITIONS[selected.length].key : null

  const total = deck.length
  // Fan spans roughly -42deg .. +42deg across the deck.
  const SPREAD_DEG = 84

  function fanTransform(index: number): string {
    const ratio = total <= 1 ? 0 : index / (total - 1) - 0.5
    const angle = ratio * SPREAD_DEG
    const lift = Math.abs(ratio) * 18
    // Pure transform string — no scale here so :hover can append translateY/scale via var().
    return `translateY(${lift}px) rotate(${angle}deg)`
  }

  async function handlePick(card: TarotCard) {
    if (!nextPosition) return
    if (flyingId !== null) return
    if (selected.some((s) => s.card.id === card.id)) return

    setFlyingId(card.id)
    // Let the fly animation play before notifying the parent — the parent
    // will then render the card inside the slot with cardLand animation.
    await new Promise((r) => setTimeout(r, 420))
    await onSelect(card, nextPosition)
    setFlyingId(null)
  }

  return (
    <>
      {/* Position slots */}
      <div className="vn-tarot-slots" aria-label="ตำแหน่งไพ่">
        {POSITIONS.map((pos, idx) => {
          const filled = selected.find((s) => s.position === pos.key)
          const isActive = !filled && idx === selected.length
          return (
            <div
              key={pos.key}
              className={`vn-tarot-slot${filled ? ' is-filled' : ''}${isActive ? ' is-active' : ''}`}
            >
              {filled ? (
                <div className="vn-tarot-slot-card" key={filled.card.id}>
                  <div className="vn-card-front">
                    <span className="vn-card-front-pos">{pos.label}</span>
                    <span className="vn-card-front-art" aria-hidden>
                      {filled.card.emoji}
                    </span>
                    <span className="vn-card-front-name">{filled.card.nameThai}</span>
                    <span className="vn-card-front-num">{romanize(filled.card.id)}</span>
                  </div>
                  <span className="vn-tarot-sparkle" aria-hidden>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i} />
                    ))}
                  </span>
                </div>
              ) : (
                <>
                  <span className="vn-tarot-slot-label">{pos.label}</span>
                  <span className="vn-tarot-slot-empty" aria-hidden>
                    ✦
                  </span>
                  <span className="vn-tarot-slot-name">{pos.thai}</span>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Fan deck */}
      <div className="vn-tarot-fan-wrap">
        <div className="vn-tarot-fan" role="listbox" aria-label="สำรับไพ่ทาโรต์">
          {deck.map((card, i) => {
            const restTransform = fanTransform(i)
            const isPicked = selected.some((s) => s.card.id === card.id)
            const isFlying = flyingId === card.id
            const disabled = isPicked || flyingId !== null || nextPosition === null
            const dealDelay = `${i * 28}ms`
            return (
              <button
                key={card.id}
                type="button"
                role="option"
                aria-label={`เลือกไพ่ ${card.nameThai}`}
                aria-selected={isPicked}
                disabled={disabled}
                onClick={() => handlePick(card)}
                className={`vn-tarot-fan-card${isFlying ? ' is-flying' : ''}`}
                style={
                  {
                    zIndex: isFlying ? 100 : i,
                    animationDelay: dealDelay,
                    ['--fan-rest' as string]: restTransform,
                  } as React.CSSProperties
                }
              >
                <span className="vn-card-back" aria-hidden>
                  <span className="vn-card-back-star tl">✦</span>
                  <span className="vn-card-back-star tr">✦</span>
                  <span className="vn-card-back-star bl">✦</span>
                  <span className="vn-card-back-star br">✦</span>
                  <span className="vn-card-back-mandala">
                    <span className="vn-card-back-glyph">
                      {BACK_GLYPHS[i % BACK_GLYPHS.length]}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// Lightweight roman numeral for the front-of-card num plate (0..21).
function romanize(num: number): string {
  if (num === 0) return '0'
  const map: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let n = num
  let out = ''
  for (const [v, s] of map) {
    while (n >= v) {
      out += s
      n -= v
    }
  }
  return out
}
