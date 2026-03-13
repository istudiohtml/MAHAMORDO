'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/user/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'เกิดข้อผิดพลาด'); return }
    router.replace('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-dot" />
          Mahamordo
        </Link>
        <div className="auth-hero-text">
          <p className="auth-tagline">✦ &nbsp; The Grand Oracle &nbsp; ✦</p>
          <h1 className="auth-title">MAHA<br />MORDO</h1>
          <p className="auth-subtitle">เริ่มต้นเส้นทางโชคชะตาของคุณ</p>
        </div>
        <div className="auth-bonus-hint">
          <span className="auth-bonus-icon">✦</span>
          <div>
            <p className="auth-bonus-title">รับ 3 เครดิตฟรีทันที</p>
            <p className="auth-bonus-sub">สำหรับสมาชิกใหม่ทุกคน</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">สมัครสมาชิก</h2>
            <p className="auth-card-sub">มีบัญชีแล้ว? <Link href="/auth/login" className="auth-link">เข้าสู่ระบบ</Link></p>
          </div>

          {/* OAuth Buttons */}
          <div className="auth-oauth-buttons">
            <a href="/api/auth/google" className="auth-oauth-btn auth-oauth-btn--google">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.6 6.9 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" fill="#FFC107"/>
                <path d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.6 6.9 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" fill="#FF3D00"/>
                <path d="M24 44c5.4 0 10.3-2 14-5.3l-6.5-5.5C29.6 35 27 36 24 36c-5.3 0-9.8-3.4-11.4-8l-6.6 5.1C9.5 39.5 16.3 44 24 44z" fill="#4CAF50"/>
                <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l.1-.1 6.5 5.5C37.5 39.3 44 34 44 24c0-1.2-.1-2.4-.4-3.5z" fill="#1976D2"/>
              </svg>
              สมัครด้วย Google
            </a>
          </div>

          <div className="auth-divider">
            <span>หรือสมัครด้วยอีเมล</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">ชื่อ (ไม่บังคับ)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อของคุณ"
                className="auth-input"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="auth-input"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
                minLength={6}
                className="auth-input"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก ✦'}
            </button>
          </form>

          <div className="auth-back">
            <Link href="/" className="auth-back-link">← กลับหน้าหลัก</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
