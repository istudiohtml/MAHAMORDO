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
        <div className="auth-brand">
          <span className="auth-brand-dot" />
          Mahamordo
        </div>
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
