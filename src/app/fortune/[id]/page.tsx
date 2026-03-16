'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { oracles, OracleId } from '@/data/oracles'

const ORACLE_THEME: Record<OracleId, string> = {
  1: 'theme-maemor',
  2: 'theme-son',
  3: 'theme-rahu',
}

const ORACLE_BG: Record<OracleId, string> = {
  1: 'linear-gradient(135deg, #1E0F04 0%, #2A1C0C 100%)',
  2: 'linear-gradient(135deg, #080F1A 0%, #0D1A2E 100%)',
  3: 'linear-gradient(135deg, #100820 0%, #1A0D30 100%)',
}

const TEMPLATE_AVATAR_BY_SLUG: Record<string, string> = {
  'yai-kham': '/avatars/template-mae-mor-jan.jpg',
  'nang-fah': '/avatars/template-por-mor-son.jpg',
  'mor-dum': '/avatars/template-ajarn-rahu.jpg',
  'mae-mor-jan': '/avatars/template-mae-mor-jan.jpg',
  'por-mor-son': '/avatars/template-por-mor-son.jpg',
  'ajarn-rahu': '/avatars/template-ajarn-rahu.jpg',
}

// Fixed star positions to avoid hydration mismatch
const STARS = [
  { left: '8%',  top: '12%', size: 1.5, dur: 3.2, delay: 0.4 },
  { left: '23%', top: '5%',  size: 1,   dur: 2.5, delay: 1.1 },
  { left: '45%', top: '18%', size: 2,   dur: 4.1, delay: 0.7 },
  { left: '67%', top: '8%',  size: 1.5, dur: 3.6, delay: 1.9 },
  { left: '82%', top: '22%', size: 1,   dur: 2.8, delay: 0.2 },
  { left: '91%', top: '6%',  size: 2,   dur: 3.9, delay: 1.4 },
  { left: '14%', top: '35%', size: 1,   dur: 4.3, delay: 0.9 },
  { left: '78%', top: '42%', size: 1.5, dur: 2.7, delay: 0.5 },
  { left: '56%', top: '55%', size: 1,   dur: 3.4, delay: 2.1 },
  { left: '34%', top: '68%', size: 2,   dur: 4.8, delay: 0.3 },
  { left: '88%', top: '71%', size: 1,   dur: 3.1, delay: 1.7 },
  { left: '5%',  top: '80%', size: 1.5, dur: 2.9, delay: 0.8 },
  { left: '62%', top: '85%', size: 1,   dur: 4.5, delay: 1.3 },
  { left: '19%', top: '92%', size: 2,   dur: 3.7, delay: 0.6 },
  { left: '48%', top: '95%', size: 1,   dur: 2.6, delay: 2.4 },
]

export default function FortuneChatPage() {
  const params = useParams()
  const router = useRouter()
  const rawId = Number(params.id)
  const oracleId = (rawId >= 1 && rawId <= 3 ? rawId : 1) as OracleId
  const oracle = oracles[oracleId]

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [inputVisible, setInputVisible] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(true)
  const [error, setError] = useState('')
  const [credits, setCredits] = useState(0)

  const startedRef = useRef(false)
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const typeText = useCallback((text: string, onDone?: () => void) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current)
    setDisplayText('')
    setIsTyping(true)
    setIsTalking(true)
    setInputVisible(false)
    let i = 0
    const chars = text.split('')
    const speed = oracleId === 3 ? 55 : 42
    typingTimerRef.current = setInterval(() => {
      if (i < chars.length) {
        setDisplayText((prev) => prev + chars[i])
        i++
      } else {
        clearInterval(typingTimerRef.current!)
        setIsTyping(false)
        setIsTalking(false)
        setTimeout(() => {
          setInputVisible(true)
          if (onDone) onDone()
        }, 300)
      }
    }, speed)
  }, [oracleId])

  useEffect(() => {
    return () => { if (typingTimerRef.current) clearInterval(typingTimerRef.current) }
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function init() {
      const meRes = await fetch('/api/user/me')
      if (!meRes.ok) {
        router.push(`/auth/login?redirect=/fortune/${oracleId}`)
        return
      }
      try {
        const startRes = await fetch('/api/fortune/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oracleSlug: oracle.slug }),
        })
        if (startRes.status === 402) {
          setError('เครดิตไม่เพียงพอ\nกรุณาเติมเครดิตเพิ่ม')
          setStarting(false)
          return
        }
        if (!startRes.ok) {
          setError('ไม่สามารถเริ่มการดูดวงได้\nกรุณาลองใหม่อีกครั้ง')
          setStarting(false)
          return
        }
        const data = await startRes.json()
        setSessionId(data.sessionId)
        setCredits(data.credits)
        setStarting(false)
        await sendMessage(data.sessionId, 'สวัสดี')
      } catch {
        setError('เกิดข้อผิดพลาด\nกรุณาลองใหม่อีกครั้ง')
        setStarting(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(sid: string, msg: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message: msg }),
      })
      if (res.ok) {
        const data = await res.json()
        typeText(data.reply)
      } else {
        typeText('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
      }
    } catch {
      typeText('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!userInput.trim() || !sessionId || loading || isTyping) return
    const msg = userInput.trim()
    setUserInput('')
    setInputVisible(false)
    await sendMessage(sessionId, msg)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend()
  }

  if (rawId < 1 || rawId > 3) {
    router.replace('/fortune')
    return null
  }

  const theme = ORACLE_THEME[oracleId]

  return (
    <div className="fortune-vn-bg" style={{ background: ORACLE_BG[oracleId] }}>
      {/* Stars */}
      <div className="fortune-vn-stars" aria-hidden="true">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="fortune-vn-star"
            style={{
              left: s.left, top: s.top,
              width: `${s.size}px`, height: `${s.size}px`,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main frame */}
      <div className={`fortune-vn-frame ${theme}`}>

        {/* STAGE — oracle portrait */}
        <div className="fortune-vn-stage">
          {/* Navigation */}
          <div className="fortune-vn-nav">
            <a href="/dashboard" className="fortune-vn-switch">⟵ Dashboard</a>
            <a href="/fortune" className="fortune-vn-switch">เปลี่ยนหมอดู</a>
          </div>

          {/* Animated rings */}
          <div className="fortune-vn-ring" />
          <div className="fortune-vn-ring" />
          <div className="fortune-vn-ring" />

          {/* Circular avatar — ใช้รูปเดียวกับหน้ารวม แต่ครอบในวงกลม */}
          <div className={`fortune-vn-avatar${isTalking ? ' talking' : ''}`}>
            <img
              src={TEMPLATE_AVATAR_BY_SLUG[oracle.slug] ?? `/avatars/${oracle.slug}.svg`}
              alt={oracle.name}
            />
          </div>

          {/* Speaking glows */}
          <div className={`fortune-vn-lip${isTalking ? ' on' : ''}`} />

          {/* Name tag */}
          <div className="fortune-vn-nametag">
            <div className="fortune-vn-name">{oracle.name}</div>
            <div className="fortune-vn-sub">{oracle.subtitle.toUpperCase()}</div>
          </div>

          {/* Thai decorative banner — Mae Mor only */}
          {oracleId === 1 && <div className="fortune-vn-thai-banner" />}
        </div>

        {/* DIALOG — chat area */}
        <div className="fortune-vn-dialog">

          {/* Starting state */}
          {starting && (
            <div className="fortune-vn-speech">
              <div className="fortune-vn-speech-text">
                <span className="fortune-vn-loading-spinner" />
                <span style={{ marginLeft: '12px' }}>เชื่อมต่อกับหมอดู...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {!starting && error && (
            <>
              <div className="fortune-vn-speech">
                <div className="fortune-vn-speech-text">{error}</div>
              </div>
              <div className="fortune-vn-input-zone show">
                {error.includes('เครดิต') ? (
                  <a href="/dashboard/credits" className="fortune-vn-buy-link">ซื้อเครดิตเพิ่ม ✦</a>
                ) : null}
                <a href="/fortune" className="fortune-vn-back-link">← เลือกหมอดูใหม่</a>
              </div>
            </>
          )}

          {/* Chat state */}
          {!starting && !error && (
            <>
              <div className="fortune-vn-speech">
                <div className="fortune-vn-speech-text">
                  {displayText}
                  {isTyping && <span className="fortune-vn-cursor" />}
                </div>
              </div>

              <div className={`fortune-vn-input-zone${inputVisible ? ' show' : ''}`}>
                <div className="fortune-vn-text-row">
                  <input
                    className="fortune-vn-text-input"
                    type="text"
                    placeholder="พิมพ์คำถามของคุณ..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading || isTyping}
                    autoComplete="off"
                  />
                  <button
                    className="fortune-vn-send-btn"
                    onClick={handleSend}
                    disabled={loading || isTyping || !userInput.trim()}
                    aria-label="ส่ง"
                  >
                    ▶
                  </button>
                </div>
                {credits > 0 && (
                  <div className="fortune-vn-credits">{credits} เครดิตคงเหลือ</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
