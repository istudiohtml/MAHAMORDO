'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { oracles, OracleId } from '@/data/oracles'
import { getAllCards, TarotCard } from '@/data/tarot-cards'

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

function buildTarotReading(
  selectedCards: Array<{ position: 'past' | 'present' | 'future', card: TarotCard }>,
  birthData: any,
  userName: string
): string {
  const pastCard = selectedCards.find(sc => sc.position === 'past')?.card
  const presentCard = selectedCards.find(sc => sc.position === 'present')?.card
  const futureCard = selectedCards.find(sc => sc.position === 'future')?.card

  if (!pastCard || !presentCard || !futureCard) return 'เกิดข้อผิดพลาด'

  const name = birthData.fullName || userName || 'ท่าน'
  const lines = [
    `${name} คะ`,
    '',
    `ฉันได้อ่านไพ่ทาโร่สำหรับคุณแล้ว:`,
    '',
    `⏰ อดีต: ${pastCard.emoji} ${pastCard.nameThai}`,
    pastCard.past,
    '',
    `🌟 ปัจจุบัน: ${presentCard.emoji} ${presentCard.nameThai}`,
    presentCard.present,
    '',
    `🔮 อนาคต: ${futureCard.emoji} ${futureCard.nameThai}`,
    futureCard.future,
    '',
    `ไพ่ได้พูดว่า ชีวิตของท่านเป็นการเดินทางที่เต็มไปด้วยความหมาย และแต่ละขั้นตอนของมันล้วนมีจุดประสงค์ของตนเอง ฝึกฝนให้ตัวเองเข้าใจสัญญาณของชีวิต และให้ความไว้วางใจตัวเองในการเดินทางนี้ค่ะ`,
  ]
  return lines.join('\n')
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
  const [userName, setUserName] = useState('')

  // Subject selection (self or others)
  const [askingSubject, setAskingSubject] = useState(false)
  const [subjectChosen, setSubjectChosen] = useState<'self' | 'other' | null>(null)
  const [birthData, setBirthData] = useState<{
    fullName?: string
    birthDate?: string
    birthTime?: string
    birthPlace?: string
  }>({})
  const [showBirthForm, setShowBirthForm] = useState(false)

  // Topic selection
  const [askingTopic, setAskingTopic] = useState(false)
  const [topicChosen, setTopicChosen] = useState<string | null>(null)

  // Tarot card selection (for oracle 3 only)
  const [askingForCard, setAskingForCard] = useState(false)
  const [tarotCards, setTarotCards] = useState<TarotCard[]>([])
  const [selectedCards, setSelectedCards] = useState<Array<{ position: 'past' | 'present' | 'future', card: TarotCard }>>([])

  const TOPICS = [
    { id: 'love', emoji: '❤️', name: 'ความรัก', description: 'ความสัมพันธ์ การรักษา ความรักแท้' },
    { id: 'health', emoji: '💚', name: 'สุขภาพ', description: 'สุขภาพกาย จิตใจ การแคร์ตัวเอง' },
    { id: 'career', emoji: '💼', name: 'การงาน', description: 'อาชีพ พัฒนาตัวเอง ความสำเร็จ' },
    { id: 'finance', emoji: '💰', name: 'การเงิน', description: 'ลงทุน หารายได้ การออมเงิน' },
    { id: 'family', emoji: '👨‍👩‍👧‍👦', name: 'ครอบครัว', description: 'ความสัมพันธ์ครอบครัว บุคคลใกล้ชิด' },
    { id: 'custom', emoji: '✨', name: 'อื่นๆ', description: 'หัวข้ออื่นๆ ที่คุณสนใจ' },
  ]

  const startedRef = useRef(false)
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const typeText = useCallback((text: string, onDone?: () => void) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current)
    setDisplayText('')
    setIsTyping(true)
    setIsTalking(true)
    setInputVisible(false)

    const speed = oracleId === 3 ? 55 : 42
    let displayIndex = 0

    typingTimerRef.current = setInterval(() => {
      if (displayIndex < text.length) {
        displayIndex++
        setDisplayText(text.substring(0, displayIndex))
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
        setUserName(data.userName)
        // Load user data from profile
        const userRes = await fetch('/api/user/me')
        if (userRes.ok) {
          const { user: userData } = await userRes.json()
          const fullName = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || userData?.name || ''
          setBirthData({
            fullName,
            birthDate: userData?.birthDate ? new Date(userData.birthDate).toISOString().split('T')[0] : undefined,
            birthTime: userData?.birthTime,
            birthPlace: userData?.birthPlace,
          })
        }
        setStarting(false)
        // Display initial greeting from oracle and save to DB
        const greeting = data.initialGreeting || 'สวัสดีค่ะ'
        // Save greeting to database
        await fetch('/api/fortune/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            content: greeting,
            role: 'ASSISTANT',
          }),
        })
        typeText(greeting, () => {
          setAskingSubject(true)
        })
      } catch {
        setError('เกิดข้อผิดพลาด\nกรุณาลองใหม่อีกครั้ง')
        setStarting(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(sid: string, msg: string, uName?: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message: msg, userName: uName || userName }),
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

          {/* Subject selection state */}
          {!starting && !error && askingSubject && !subjectChosen && (
            <>
              <div className="fortune-vn-speech">
                <div className="fortune-vn-speech-text">
                  {displayText}
                  {isTyping && <span className="fortune-vn-cursor" />}
                </div>
              </div>

              <div className="fortune-vn-input-zone show">
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', padding: '0 24px' }}>
                  <button
                    onClick={async () => {
                      setSubjectChosen('self')
                      // Save choice to DB
                      if (sessionId) {
                        await fetch('/api/fortune/message', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId,
                            content: 'ตัวเอง',
                            role: 'USER',
                          }),
                        })
                      }
                      // Always show form for confirmation/editing
                      setShowBirthForm(true)
                    }}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #D4A853, #8B6914)',
                      border: 'none',
                      color: '#1A0800',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(212,168,83,0.4)',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,168,83,0.6)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 3px 12px rgba(212,168,83,0.4)'
                    }}
                  >
                    ตัวเอง
                  </button>
                  <button
                    onClick={async () => {
                      setSubjectChosen('other')
                      // Save choice to DB
                      if (sessionId) {
                        await fetch('/api/fortune/message', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId,
                            content: 'คนอื่น',
                            role: 'USER',
                          }),
                        })
                      }
                      setShowBirthForm(true)
                    }}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #D4A853, #8B6914)',
                      border: 'none',
                      color: '#1A0800',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(212,168,83,0.4)',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,168,83,0.6)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 3px 12px rgba(212,168,83,0.4)'
                    }}
                  >
                    คนอื่น
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Topic selection state */}
          {!starting && !error && askingTopic && !topicChosen && (
            <>
              <div className="fortune-vn-speech">
                <div className="fortune-vn-speech-text">
                  ท่านต้องการให้ดูดวงเกี่ยวกับเรื่องไหนคะ?
                </div>
              </div>
              <div className="fortune-vn-input-zone show" style={{ justifyContent: 'center', display: 'flex' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px',
                  padding: '0 16px',
                  maxWidth: '360px',
                }}>
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={async () => {
                        setTopicChosen(topic.id)
                        // Save topic to DB (message + session)
                        if (sessionId) {
                          await fetch('/api/fortune/message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sessionId,
                              content: `${topic.emoji} ${topic.name}`,
                              role: 'USER',
                              topic: topic.id,
                            }),
                          })
                        }
                        // For oracle 3 (tarot), show card selection
                        if (oracleId === 3) {
                          console.log('DEBUG: Oracle 3 detected, showing tarot modal')
                          const allCards = getAllCards()
                          console.log('DEBUG: Got', allCards.length, 'cards')
                          setTarotCards(allCards)
                          setSelectedCards([])
                          setAskingForCard(true)
                          console.log('DEBUG: askingForCard set to true')
                        }
                        setAskingTopic(false)
                      }}
                      style={{
                        padding: '20px 16px',
                        borderRadius: '12px',
                        background: 'rgba(26, 8, 0, 0.4)',
                        border: '1.5px solid rgba(212, 168, 83, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.35s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px',
                        position: 'relative',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212,168,83,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.6)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,168,83,0.15)'
                        e.currentTarget.style.transform = 'translateY(-4px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(26, 8, 0, 0.4)'
                        e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.3)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                      }}>
                        <span style={{ fontSize: '24px' }}>{topic.emoji}</span>
                        <span style={{
                          color: '#D4A853',
                          fontSize: '14px',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                        }}>
                          {topic.name}
                        </span>
                      </div>
                      <span style={{
                        color: 'rgba(212, 168, 83, 0.6)',
                        fontSize: '12px',
                        lineHeight: '1.4',
                        fontWeight: '400',
                      }}>
                        {topic.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tarot card selection - MODAL OVERLAY */}
          {askingForCard && oracleId === 3 && (() => {
            console.log('DEBUG: Rendering tarot modal. askingForCard:', askingForCard, 'oracleId:', oracleId, 'tarotCards.length:', tarotCards.length, 'selectedCards:', selectedCards.length)
            return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}>
              {/* Modal box */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(20,10,0,0.98), rgba(10,5,0,0.99))',
                border: '2px solid rgba(212,168,83,0.4)',
                borderRadius: '16px',
                padding: '28px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}>
                {/* TITLE */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    fontSize: '20px',
                    color: '#D4A853',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    marginBottom: '12px',
                  }}>
                    ◆ เลือกไพ่ ◆
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(212,168,83,0.75)',
                    marginBottom: '16px',
                  }}>
                    {selectedCards.length === 0 && 'เลือกไพ่ 3 ใบ'}
                    {selectedCards.length === 1 && 'เลือกอีก 2 ใบ'}
                    {selectedCards.length === 2 && 'เลือกอีก 1 ใบ'}
                    {selectedCards.length === 3 && '✨ ไพ่เปิดเผยแล้ว ✨'}
                  </div>
                  {/* DOT INDICATORS */}
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    {[0, 1, 2].map(idx => (
                      <div key={idx} style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: selectedCards.length > idx ? '#D4A853' : 'rgba(212,168,83,0.25)',
                        boxShadow: selectedCards.length > idx ? '0 0 12px #D4A853' : 'none',
                        transition: 'all 0.3s ease',
                      }} />
                    ))}
                  </div>
                </div>

                {/* CARD GRID */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '14px',
                }}>
                  {tarotCards.map(card => {
                    const isSelected = selectedCards.some(sc => sc.card.id === card.id)
                    return (
                      <button
                        key={card.id}
                        onClick={async () => {
                          if (selectedCards.length >= 3 || isSelected) return

                          const newSelected = [...selectedCards, {
                            position: selectedCards.length === 0 ? 'past' : selectedCards.length === 1 ? 'present' : 'future',
                            card,
                          }]
                          setSelectedCards(newSelected)

                          // Save message
                          if (sessionId) {
                            const posLabels = ['อดีต', 'ปัจจุบัน', 'อนาคต']
                            await fetch('/api/fortune/message', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                sessionId,
                                content: `🃏 [${posLabels[selectedCards.length]}] ${card.nameThai}`,
                                role: 'USER',
                              }),
                            })
                          }

                          // When 3 selected: close and show reading
                          if (newSelected.length === 3) {
                            setTimeout(() => {
                              setAskingForCard(false)
                              const reading = buildTarotReading(newSelected, birthData, userName)
                              typeText(reading)
                            }, 600)
                          }
                        }}
                        disabled={selectedCards.length >= 3 || isSelected}
                        style={{
                          padding: '14px 10px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(212,168,83,0.25)' : 'rgba(26,8,0,0.7)',
                          border: isSelected ? '2px solid #D4A853' : '1.5px solid rgba(212,168,83,0.3)',
                          color: '#D4A853',
                          cursor: isSelected || selectedCards.length >= 3 ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: isSelected || selectedCards.length >= 3 ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected && selectedCards.length < 3) {
                            e.currentTarget.style.background = 'rgba(212,168,83,0.15)'
                            e.currentTarget.style.borderColor = 'rgba(212,168,83,0.7)'
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(212,168,83,0.25)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected && selectedCards.length < 3) {
                            e.currentTarget.style.background = 'rgba(26,8,0,0.7)'
                            e.currentTarget.style.borderColor = 'rgba(212,168,83,0.3)'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{card.emoji}</span>
                        <span style={{ fontSize: '9px', lineHeight: '1.2', textAlign: 'center', fontWeight: 500 }}>
                          {card.nameThai.substring(0, 9)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            )
          })()}


          {/* Birth data form state */}
          {!starting && !error && showBirthForm && subjectChosen && (
            <>
              <div className="fortune-vn-speech">
                <div className="fortune-vn-speech-text">
                  {subjectChosen === 'self'
                    ? 'ดิฉันขอทราบชื่อและวันเกิดของท่าน (เวลาและสถานที่เกิดเป็นตัวเลือกค่ะ) เพื่อจะได้วิเคราะห์ดูดวงให้ถูกต้องยิ่งขึ้น'
                    : 'โปรดบอกดิฉันชื่อและวันเกิด (เวลาและสถานที่เกิดเป็นตัวเลือก) เพื่อดูดวงให้ผู้ที่ท่านต้องการทราบค่ะ'}
                </div>
              </div>
              <div className="fortune-vn-input-zone show">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 24px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(212,168,83,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ชื่อ นามสกุล
                  </div>
                  <input
                    type="text"
                    placeholder="กรอกชื่อ นามสกุล"
                    value={birthData.fullName || ''}
                    onChange={(e) => setBirthData({ ...birthData, fullName: e.target.value })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #8B6914',
                      background: 'rgba(212,168,83,0.08)',
                      color: '#D4A853',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#D4A853'
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(212,168,83,0.3)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#8B6914'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />

                  <div style={{ fontSize: '12px', color: 'rgba(212,168,83,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                    วันเกิด <span style={{ color: 'rgba(212,168,83,0.4)', fontSize: '10px' }}>*บังคับ</span>
                  </div>
                  <input
                    type="date"
                    placeholder="วันเกิด"
                    value={birthData.birthDate || ''}
                    onChange={(e) => setBirthData({ ...birthData, birthDate: e.target.value })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #8B6914',
                      background: 'rgba(212,168,83,0.08)',
                      color: '#D4A853',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#D4A853'
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(212,168,83,0.3)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#8B6914'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: 'rgba(212,168,83,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                    เวลาเกิด <span style={{ color: 'rgba(212,168,83,0.3)', fontSize: '10px' }}>(ตัวเลือก)</span>
                  </div>
                  <input
                    type="time"
                    placeholder="เวลาเกิด"
                    value={birthData.birthTime || ''}
                    onChange={(e) => setBirthData({ ...birthData, birthTime: e.target.value })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #8B6914',
                      background: 'rgba(212,168,83,0.08)',
                      color: '#D4A853',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#D4A853'
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(212,168,83,0.3)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#8B6914'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: 'rgba(212,168,83,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                    สถานที่เกิด <span style={{ color: 'rgba(212,168,83,0.3)', fontSize: '10px' }}>(ตัวเลือก)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="สถานที่เกิด"
                    value={birthData.birthPlace || ''}
                    onChange={(e) => setBirthData({ ...birthData, birthPlace: e.target.value })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #8B6914',
                      background: 'rgba(212,168,83,0.08)',
                      color: '#D4A853',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#D4A853'
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(212,168,83,0.3)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#8B6914'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!birthData.birthDate) {
                        alert('กรุณากรอกวันเกิด')
                        return
                      }

                      // Save birth data to message history
                      const parts = [`ชื่อ: ${birthData.fullName || '-'}`, `วันเกิด: ${birthData.birthDate}`]
                      if (birthData.birthTime) parts.push(`เวลาเกิด: ${birthData.birthTime}`)
                      if (birthData.birthPlace) parts.push(`สถานที่เกิด: ${birthData.birthPlace}`)
                      const birthDataMsg = parts.join(', ')

                      if (sessionId) {
                        await fetch('/api/fortune/message', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId,
                            content: birthDataMsg,
                            role: 'USER',
                          }),
                        })
                      }

                      if (subjectChosen === 'self') {
                        // Save to user profile (name + birth data)
                        const nameParts = (birthData.fullName || '').split(' ')
                        await fetch('/api/user/me', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            firstName: nameParts[0] || '',
                            lastName: nameParts.slice(1).join(' ') || '',
                            birthDate: birthData.birthDate,
                            birthTime: birthData.birthTime,
                            birthPlace: birthData.birthPlace,
                          }),
                        })
                      }
                      setShowBirthForm(false)
                      setAskingSubject(false)
                      setAskingTopic(true)
                    }}
                    style={{
                      padding: '12px 24px',
                      marginTop: '4px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #D4A853, #8B6914)',
                      border: 'none',
                      color: '#1A0800',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(212,168,83,0.4)',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,168,83,0.6)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 3px 12px rgba(212,168,83,0.4)'
                    }}
                  >
                    ยืนยัน
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Chat state */}
          {!starting && !error && !askingSubject && !showBirthForm && !askingTopic && !askingForCard && (
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

      {/* Tarot Modal - you add CSS to globals.css */}
      {askingForCard && oracleId === 3 && (
        <div className="tarot-overlay show" id="tarotOverlay">
          <div className="tarot-modal-box">
            <div className="tarot-header">
              <div className="tarot-title">◆ เลือกไพ่ ◆</div>
              <div className="tarot-subtitle" id="tarotSubtitle">
                {selectedCards.length === 0 && 'เลือกไพ่ 3 ใบ'}
                {selectedCards.length === 1 && 'เลือกอีก 2 ใบ'}
                {selectedCards.length === 2 && 'เลือกอีก 1 ใบ'}
                {selectedCards.length === 3 && '✨ ไพ่เปิดเผยแล้ว ✨'}
              </div>
              <div className="tarot-dots">
                {[0, 1, 2].map(idx => (
                  <span key={idx} className={`sel-dot ${selectedCards.length > idx ? 'filled' : ''}`} id={`sdot${idx}`} />
                ))}
              </div>
            </div>

            <div className="tarot-grid">
              {tarotCards.map(card => {
                const isSelected = selectedCards.some(sc => sc.card.id === card.id)
                return (
                  <button
                    key={card.id}
                    className={`tarot-slot ${isSelected ? 'selected' : 'selectable'}`}
                    onClick={async () => {
                      if (selectedCards.length >= 3 || isSelected) return
                      const newSelected = [...selectedCards, {
                        position: selectedCards.length === 0 ? 'past' : selectedCards.length === 1 ? 'present' : 'future',
                        card,
                      }]
                      setSelectedCards(newSelected)
                      if (sessionId) {
                        const posLabels = ['อดีต', 'ปัจจุบัน', 'อนาคต']
                        await fetch('/api/fortune/message', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId,
                            content: `🃏 [${posLabels[selectedCards.length]}] ${card.nameThai}`,
                            role: 'USER',
                          }),
                        })
                      }
                      if (newSelected.length === 3) {
                        setTimeout(() => {
                          setAskingForCard(false)
                          const reading = buildTarotReading(newSelected, birthData, userName)
                          typeText(reading)
                        }, 600)
                      }
                    }}
                    disabled={selectedCards.length >= 3 || isSelected}
                  >
                    <div className="slot-icon">{card.emoji}</div>
                    <div className="slot-name">{card.nameThai.substring(0, 9)}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
