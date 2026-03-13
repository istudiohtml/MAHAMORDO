'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/user/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (!res.ok) { setError('เกิดข้อผิดพลาด กรุณาลองใหม่'); return }
    setSent(true)
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
          <p className="auth-subtitle">ลืมรหัสผ่าน? ไม่ต้องกังวล</p>
        </div>
        <div className="auth-oracles-hint">
          <span>☽ &nbsp; แม่หมอจันทร์</span>
          <span>☯ &nbsp; พ่อหมอซอน</span>
          <span>✦ &nbsp; อาจารย์ราหู</span>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {sent ? (
            <div className="auth-success-box">
              <div className="auth-success-icon">✦</div>
              <h2 className="auth-card-title">ตรวจสอบอีเมล</h2>
              <p className="auth-success-text">
                หากอีเมล <strong>{email}</strong> มีในระบบ<br />
                เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ<br />
                กรุณาตรวจสอบกล่องจดหมาย (รวมถึง Spam)
              </p>
              <Link href="/auth/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '24px' }}>
                กลับหน้าเข้าสู่ระบบ
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-card-header">
                <h2 className="auth-card-title">ลืมรหัสผ่าน</h2>
                <p className="auth-card-sub">กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
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

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" disabled={loading} className="auth-submit">
                  {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต ✦'}
                </button>
              </form>
            </>
          )}

          <div className="auth-back">
            <Link href="/auth/login" className="auth-back-link">← กลับหน้าเข้าสู่ระบบ</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
