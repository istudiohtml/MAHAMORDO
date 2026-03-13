'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { oracles, OracleId } from '@/data/oracles'

type MessageRole = 'USER' | 'ASSISTANT'

interface ChatMessage {
  role: MessageRole
  content: string
}

export default function FortuneChatPage() {
  const params = useParams()
  const router = useRouter()
  const rawId = Number(params.id)
  const oracleId = (rawId >= 1 && rawId <= 3 ? rawId : 1) as OracleId
  const oracle = oracles[oracleId]

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(true)
  const [credits, setCredits] = useState(0)
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auth check + session start
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function init() {
      // 1. Check auth
      const meRes = await fetch('/api/user/me')
      if (!meRes.ok) {
        router.push(`/auth/login?redirect=/fortune/${oracleId}`)
        return
      }

      // 2. Start fortune session
      try {
        const startRes = await fetch('/api/fortune/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oracleSlug: oracle.slug }),
        })

        if (startRes.status === 402) {
          setError('เครดิตไม่เพียงพอ กรุณาเติมเครดิต')
          setStarting(false)
          return
        }

        if (!startRes.ok) {
          setError('ไม่สามารถเริ่มการดูดวงได้ กรุณาลองใหม่')
          setStarting(false)
          return
        }

        const data = await startRes.json()
        setSessionId(data.sessionId)
        setCredits(data.credits)
        setStarting(false)

        // 3. Auto-send greeting to get initial oracle message
        await sendGreeting(data.sessionId)
      } catch {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
        setStarting(false)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendGreeting(sid: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message: 'สวัสดี' }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages([{ role: 'ASSISTANT', content: data.reply }])
      }
    } catch {
      // Greeting failed silently — user can still type
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || !sessionId || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'USER', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: 'ASSISTANT', content: data.reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'ASSISTANT', content: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ASSISTANT', content: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Invalid oracle id
  if (rawId < 1 || rawId > 3) {
    return (
      <div className="fortune-chat-layout">
        <div className="fortune-chat-right">
          <div className="fortune-chat-error">
            <p className="fortune-chat-error-title">ไม่พบหมอดู</p>
            <p className="fortune-chat-error-text">หมอดูที่คุณเลือกไม่มีอยู่ในระบบ</p>
            <Link href="/fortune" className="fortune-chat-error-btn">เลือกหมอดูใหม่</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fortune-chat-layout">
      {/* LEFT: Oracle info */}
      <div className="fortune-chat-left">
        <Link href="/fortune" className="fortune-chat-back">← เลือกหมอดู</Link>
        <div className="fortune-chat-oracle-avatar">{oracle.avatar}</div>
        <p className="fortune-chat-oracle-num">Oracle {oracle.number}</p>
        <p className="fortune-chat-oracle-name">{oracle.name}</p>
        <p className="fortune-chat-oracle-sub">{oracle.subtitle}</p>
        <p className="fortune-chat-oracle-desc">{oracle.desc.replace(/\n/g, ' ')}</p>
        {sessionId && (
          <div className="fortune-chat-credits">
            {credits} เครดิตคงเหลือ
          </div>
        )}
      </div>

      {/* RIGHT: Chat area */}
      <div className="fortune-chat-right">
        {/* Starting state */}
        {starting && (
          <div className="fortune-chat-starting">
            <div className="fortune-chat-starting-symbol">{oracle.avatar}</div>
            <p className="fortune-chat-starting-text">กำลังเตรียมการดูดวง...</p>
          </div>
        )}

        {/* Error state */}
        {!starting && error && (
          <div className="fortune-chat-error">
            <p className="fortune-chat-error-title">เกิดข้อผิดพลาด</p>
            <p className="fortune-chat-error-text">{error}</p>
            <Link href="/fortune" className="fortune-chat-error-btn">กลับเลือกหมอดู</Link>
          </div>
        )}

        {/* Chat state */}
        {!starting && !error && (
          <>
            <div className="fortune-chat-messages">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`fortune-chat-message ${msg.role === 'USER' ? 'user' : 'oracle'}`}
                >
                  <p className="fortune-chat-message-label">
                    {msg.role === 'USER' ? 'คุณ' : oracle.name}
                  </p>
                  <div className="fortune-chat-message-bubble">{msg.content}</div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="fortune-chat-message oracle">
                  <p className="fortune-chat-message-label">{oracle.name}</p>
                  <div className="fortune-chat-typing">
                    <div className="fortune-chat-typing-dot" />
                    <div className="fortune-chat-typing-dot" />
                    <div className="fortune-chat-typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="fortune-chat-input-area">
              <textarea
                className="fortune-chat-textarea"
                placeholder="พิมพ์คำถามของคุณ..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button
                className="fortune-chat-send"
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                ส่ง
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
