'use client'

import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { oracles, OracleId } from '@/data/oracles'
import { getAllCards, TarotCard } from '@/data/tarot-cards'
import ParticleBackground from '@/components/landing/ParticleBackground'
import TarotPickArea, { SelectedTarotCard } from '@/components/fortune/TarotPickArea'
import { getOracleTemplateAvatar } from '@/lib/oracle-assets'
import { useOraclePosters } from '@/hooks/useOraclePosters'
import { useActiveOracleIds } from '@/hooks/useActiveOracleIds'
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


type HistoryMessage = {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

function FortuneChatPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeSessionId = searchParams.get('session')
  const rawId = Number(params.id)
  const oracleId = (rawId >= 1 && rawId <= 3 ? rawId : 1) as OracleId
  const oracle = oracles[oracleId]
  const { posters } = useOraclePosters()
  const { ids: activeIds, loaded: activeIdsLoaded } = useActiveOracleIds()

  // Redirect away when this oracle is disabled in CMS.
  useEffect(() => {
    if (!activeIdsLoaded) return
    if (!activeIds.includes(oracleId)) {
      router.replace('/fortune')
    }
  }, [activeIds, activeIdsLoaded, oracleId, router])

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

  // Resume mode — populated when ?session=xxx is provided in the URL.
  const [resumed, setResumed] = useState(false)
  const [history, setHistory] = useState<HistoryMessage[]>([])
  const [showHistory, setShowHistory] = useState(false)

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
  const [selectedCards, setSelectedCards] = useState<SelectedTarotCard[]>([])
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

    if (process.env.NEXT_PUBLIC_E2E_FAST_TYPING === 'true') {
      setDisplayText(text)
      setIsTyping(false)
      setIsTalking(false)
      setInputVisible(true)
      onDone?.()
      return
    }

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
        router.push(`/auth/login?redirect=/fortune/${oracleId}${resumeSessionId ? `?session=${resumeSessionId}` : ''}`)
        return
      }

      // Resume mode — load an existing session instead of creating a new one.
      if (resumeSessionId) {
        try {
          const res = await fetch(`/api/fortune/session/${resumeSessionId}`)
          if (!res.ok) {
            setError('ไม่พบเซสชันนี้\nหรืออาจหมดอายุแล้ว')
            setStarting(false)
            return
          }
          const data = await res.json()
          if (data.isExpired || data.status === 'EXPIRED') {
            setError('เซสชันนี้หมดอายุแล้ว\nเริ่มดูดวงรอบใหม่ได้ที่หน้าแรก')
            setStarting(false)
            return
          }
          setSessionId(data.sessionId)
          setCredits(data.credits)
          setUserName(data.userName)
          setHistory(data.messages || [])
          setShowHistory(true)
          setResumed(true)
          setStarting(false)
          // Skip onboarding (subject/topic) — go straight to chat.
          const lastAssistant = (data.messages || []).filter(
            (m: HistoryMessage) => m.role === 'ASSISTANT'
          ).pop()
          // Show the last assistant message in the speech bubble (no typing
          // animation — just snap it in so the user can keep chatting).
          if (lastAssistant) {
            setDisplayText(lastAssistant.content)
            setInputVisible(true)
          } else {
            setInputVisible(true)
          }
          return
        } catch {
          setError('เกิดข้อผิดพลาดในการโหลดเซสชัน')
          setStarting(false)
          return
        }
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
    // In resume mode, append the user's message to the thread immediately.
    if (resumed) {
      setHistory((prev) => [
        ...prev,
        {
          id: `local-user-${Date.now()}`,
          role: 'USER',
          content: msg,
          createdAt: new Date().toISOString(),
        },
      ])
    }
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message: msg, userName: uName || userName }),
      })
      if (res.ok) {
        const data = await res.json()
        if (typeof data.credits === 'number') setCredits(data.credits)
        setLoading(false)
        if (resumed) {
          setHistory((prev) => [
            ...prev,
            {
              id: `local-assistant-${Date.now()}`,
              role: 'ASSISTANT',
              content: data.reply,
              createdAt: new Date().toISOString(),
            },
          ])
        }
        typeText(data.reply)
        return
      }
      if (res.status === 402) {
        setLoading(false)
        setError('เครดิตไม่เพียงพอ\nกรุณาเติมเครดิตเพิ่ม')
        return
      }
      setLoading(false)
      typeText('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } catch {
      setLoading(false)
      typeText('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    }
  }

  async function handleSend() {
    if (!userInput.trim() || !sessionId || loading || isTyping) return
    const msg = userInput.trim()
    setUserInput('')
    setInputVisible(false)
    // Echo the user's question into the speech area immediately so they know
    // the system received it while Claude is still thinking.
    setDisplayText(`คุณ: ${msg}`)
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
      {/* Particle background — same as other pages */}
      <ParticleBackground />

      {/* Main frame */}
      <div className={`fortune-vn-frame ${theme}`}>

        {/* STAGE — oracle portrait */}
        <div className="fortune-vn-stage">
          {/* Navigation */}
          <div className="fortune-vn-nav">
            <a href="/dashboard" className="fortune-vn-switch">⟵ Dashboard</a>
            <a href="/fortune" className="fortune-vn-switch thai-font">เปลี่ยนหมอดู</a>
          </div>

          {/* Animated rings */}
          <div className="fortune-vn-ring" />
          <div className="fortune-vn-ring" />
          <div className="fortune-vn-ring" />

          {/* Circular avatar — ใช้รูปเดียวกับหน้ารวม แต่ครอบในวงกลม */}
          <div className={`fortune-vn-avatar${isTalking ? ' talking' : ''}`}>
            <img
              src={getOracleTemplateAvatar(oracle.slug, posters[oracle.slug])}
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
                <a href="/fortune" className="fortune-vn-back-link thai-font">← เลือกหมอดูใหม่</a>
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
                <div className="vn-subject-row">
                  <button
                    className="vn-gold-btn"
                    onClick={async () => {
                      setSubjectChosen('self')
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
                      setShowBirthForm(true)
                    }}
                  >
                    ตัวเอง
                  </button>
                  <button
                    className="vn-gold-btn"
                    onClick={async () => {
                      setSubjectChosen('other')
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
                <div className="vn-topic-grid">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      className="vn-topic-btn"
                      onClick={async () => {
                        setTopicChosen(topic.id)
                        const isCustom = topic.id === 'custom'
                        // Build a starter message — for fixed topics we phrase it
                        // as a real question so the AI immediately gives a reading.
                        const starterMessage = isCustom
                          ? `${topic.emoji} ${topic.name}`
                          : `ฉันอยากให้ดูดวงเรื่อง${topic.name}ค่ะ ช่วยทำนายให้หน่อยได้ไหม`

                        if (sessionId) {
                          await fetch('/api/fortune/message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sessionId,
                              content: starterMessage,
                              role: 'USER',
                              topic: topic.id,
                            }),
                          })
                        }
                        if (oracleId === 3) {
                          // Tarot oracle: skip auto-send; user picks cards first.
                          const allCards = getAllCards()
                          setTarotCards(allCards)
                          setSelectedCards([])
                          setAskingForCard(true)
                          setAskingTopic(false)
                          return
                        }
                        setAskingTopic(false)
                        if (!isCustom && sessionId) {
                          // Auto-trigger the first reading for fixed topics.
                          setDisplayText(`คุณ: เลือกดูดวงเรื่อง${topic.name}`)
                          await sendMessage(sessionId, starterMessage)
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                        <span className="vn-topic-emoji">{topic.emoji}</span>
                        <span className="vn-topic-name">{topic.name}</span>
                      </div>
                      <span className="vn-topic-desc">{topic.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

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
                <div className="vn-form">
                  <div className="vn-form-label">ชื่อ นามสกุล</div>
                  <input
                    type="text"
                    className="vn-form-input"
                    placeholder="กรอกชื่อ นามสกุล"
                    value={birthData.fullName || ''}
                    onChange={(e) => setBirthData({ ...birthData, fullName: e.target.value })}
                  />

                  <div className="vn-form-label">
                    วันเกิด <span className="vn-form-label-required">*บังคับ</span>
                  </div>
                  <input
                    type="date"
                    className="vn-form-input"
                    placeholder="วันเกิด"
                    value={birthData.birthDate || ''}
                    onChange={(e) => setBirthData({ ...birthData, birthDate: e.target.value })}
                  />
                  <div className="vn-form-label">
                    เวลาเกิด <span className="vn-form-label-optional">(ตัวเลือก)</span>
                  </div>
                  <input
                    type="time"
                    className="vn-form-input"
                    placeholder="เวลาเกิด"
                    value={birthData.birthTime || ''}
                    onChange={(e) => setBirthData({ ...birthData, birthTime: e.target.value })}
                  />
                  <div className="vn-form-label">
                    สถานที่เกิด <span className="vn-form-label-optional">(ตัวเลือก)</span>
                  </div>
                  <input
                    type="text"
                    className="vn-form-input"
                    placeholder="สถานที่เกิด"
                    value={birthData.birthPlace || ''}
                    onChange={(e) => setBirthData({ ...birthData, birthPlace: e.target.value })}
                  />
                  <button
                    className="vn-gold-btn"
                    onClick={async () => {
                      if (!birthData.birthDate) {
                        alert('กรุณากรอกวันเกิด')
                        return
                      }

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
              {/* Resume mode — show full conversation history above the active bubble.
                  The last assistant message is hidden because it's already
                  rendered (with typing animation) in the speech bubble below. */}
              {resumed && showHistory && history.length > 0 && (
                <div className="fortune-vn-history">
                  <div className="fortune-vn-history-header">
                    <span>บทสนทนาก่อนหน้า</span>
                    <button
                      type="button"
                      className="fortune-vn-history-toggle"
                      onClick={() => setShowHistory(false)}
                    >
                      ซ่อน
                    </button>
                  </div>
                  <div className="fortune-vn-history-scroll">
                    {history.slice(0, -1).map((m) => (
                      <div
                        key={m.id}
                        className={`fortune-vn-history-msg ${
                          m.role === 'USER'
                            ? 'is-user'
                            : 'is-oracle'
                        }`}
                      >
                        <span className="fortune-vn-history-author">
                          {m.role === 'USER' ? 'คุณ' : oracle.name}
                        </span>
                        <span className="fortune-vn-history-text">
                          {m.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resumed && !showHistory && history.length > 0 && (
                <button
                  type="button"
                  className="fortune-vn-history-show"
                  onClick={() => setShowHistory(true)}
                >
                  ▾ ดูบทสนทนาก่อนหน้า ({history.length - 1})
                </button>
              )}

              <div className="fortune-vn-speech">
                <div className="fortune-vn-speech-text">
                  {displayText}
                  {isTyping && <span className="fortune-vn-cursor" />}
                </div>
                {loading && !isTyping && (
                  <div className="fortune-vn-thinking" aria-live="polite">
                    <span className="fortune-vn-thinking-label">
                      {oracle.name}กำลังคิด
                    </span>
                    <span className="fortune-vn-thinking-dots" aria-hidden>
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                )}
              </div>

              <div className={`fortune-vn-input-zone${inputVisible && !loading ? ' show' : ''}`}>
                <div className="fortune-vn-text-row">
                  <input
                    className="fortune-vn-text-input"
                    type="text"
                    placeholder={loading ? 'กำลังรอคำตอบ...' : 'พิมพ์คำถามของคุณ...'}
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
                  <div className="fortune-vn-credits thai-font">{credits} เครดิตคงเหลือ</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tarot card selection — fancy modal (outside frame container) */}
      {askingForCard && oracleId === 3 && (
        <div className="vn-tarot-overlay" role="dialog" aria-modal="true" aria-label="เลือกไพ่ทาโรต์">
          <div className="vn-tarot-box">
            <div className="vn-tarot-header">
              <div className="vn-tarot-eyebrow">Tarot Reading</div>
              <div className="vn-tarot-title">◆ เลือกไพ่ทาโรต์ ◆</div>
              <div className="vn-tarot-subtitle">
                {selectedCards.length === 0 && 'จดจ่อกับคำถามของคุณ แล้วเลือก 3 ใบ'}
                {selectedCards.length === 1 && 'ดี… เลือกอีก 2 ใบเพื่อปัจจุบัน และอนาคต'}
                {selectedCards.length === 2 && 'อีก 1 ใบสุดท้าย เพื่อเปิดเผยอนาคต'}
                {selectedCards.length === 3 && '✨ ไพ่ทั้งสามใบเผยตัวแล้ว ✨'}
              </div>
            </div>

            <TarotPickArea
              cards={tarotCards}
              selected={selectedCards}
              onSelect={async (card, position) => {
                const newSelected: SelectedTarotCard[] = [
                  ...selectedCards,
                  { position, card },
                ]
                setSelectedCards(newSelected)

                if (sessionId) {
                  const posLabels: Record<typeof position, string> = {
                    past: 'อดีต',
                    present: 'ปัจจุบัน',
                    future: 'อนาคต',
                  }
                  await fetch('/api/fortune/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sessionId,
                      content: `🃏 [${posLabels[position]}] ${card.nameThai}`,
                      role: 'USER',
                    }),
                  })
                }

                if (newSelected.length === 3) {
                  // Hold a beat so the user can savour the third reveal.
                  setTimeout(() => {
                    setAskingForCard(false)
                    const reading = buildTarotReading(newSelected, birthData, userName)
                    typeText(reading)
                  }, 1400)
                }
              }}
            />

            <div className={`vn-tarot-footer${selectedCards.length === 3 ? ' is-done' : ''}`}>
              {selectedCards.length === 3
                ? '✦ กำลังเชื่อมโยงพลังของไพ่ ✦'
                : `เลือกแล้ว ${selectedCards.length} / 3 ใบ`}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FortuneChatPage() {
  return (
    <Suspense fallback={null}>
      <FortuneChatPageInner />
    </Suspense>
  )
}
