'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/user/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'เกิดข้อผิดพลาด'); return }
    router.replace(redirect)
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
          <p className="auth-subtitle">มหาหมอดู — เข้าสู่โลกแห่งโชคชะตา</p>
        </div>
        <div className="auth-oracles-hint">
          <span>☽ &nbsp; แม่หมอจันทร์</span>
          <span>☯ &nbsp; พ่อหมอซอน</span>
          <span>✦ &nbsp; อาจารย์ราหู</span>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">เข้าสู่ระบบ</h2>
            <p className="auth-card-sub">ยังไม่มีบัญชี? <Link href="/auth/register" className="auth-link">สมัครสมาชิก</Link></p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="••••••••"
                required
                className="auth-input"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ ✦'}
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

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
