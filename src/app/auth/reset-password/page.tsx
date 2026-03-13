'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">ลิงก์ไม่ถูกต้อง</h2>
          <p className="auth-card-sub">ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว</p>
        </div>
        <Link href="/auth/forgot-password" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          ขอลิงก์ใหม่ ✦
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    setLoading(true)
    const res = await fetch('/api/user/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'เกิดข้อผิดพลาด'); return }
    router.replace('/dashboard')
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-card-title">รีเซ็ตรหัสผ่าน</h2>
        <p className="auth-card-sub">กำหนดรหัสผ่านใหม่ของคุณ</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-label">รหัสผ่านใหม่</label>
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
        <div className="auth-field">
          <label className="auth-label">ยืนยันรหัสผ่าน</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className="auth-input"
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่ ✦'}
        </button>
      </form>

      <div className="auth-back">
        <Link href="/auth/login" className="auth-back-link">← กลับหน้าเข้าสู่ระบบ</Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
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
          <p className="auth-subtitle">กำหนดรหัสผ่านใหม่</p>
        </div>
        <div className="auth-oracles-hint">
          <span>☽ &nbsp; แม่หมอจันทร์</span>
          <span>☯ &nbsp; พ่อหมอซอน</span>
          <span>✦ &nbsp; อาจารย์ราหู</span>
        </div>
      </div>

      <div className="auth-right">
        <Suspense fallback={<div className="auth-card"><p className="auth-card-sub">กำลังโหลด...</p></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
