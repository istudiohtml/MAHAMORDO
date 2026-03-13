'use client'

import { useState, useEffect } from 'react'

interface ProfileData {
  firstName: string
  lastName: string
  birthDate: string
  birthTime: string
  birthPlace: string
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return
        setForm({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
          birthTime: user.birthTime ?? '',
          birthPlace: user.birthPlace ?? '',
        })
      })
  }, [])

  function set(field: keyof ProfileData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (!res.ok) { setError('บันทึกไม่สำเร็จ กรุณาลองใหม่'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">Profile</p>
        <h1 className="dash-page-title">ข้อมูลส่วนตัว</h1>
        <p className="dash-page-sub">ข้อมูลเหล่านี้ช่วยให้หมอดูวิเคราะห์ดวงชะตาได้แม่นยำขึ้น</p>
      </div>

      <form onSubmit={handleSave}>

        {/* ── ข้อมูลพื้นฐาน ── */}
        <div className="profile-section">
          <div className="profile-section-title">ข้อมูลพื้นฐาน</div>
          <div className="profile-grid">
            <div className="profile-field">
              <label className="profile-label">ชื่อ</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="ชื่อจริง"
                className="profile-input"
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">นามสกุล</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="นามสกุล"
                className="profile-input"
              />
            </div>
          </div>
        </div>

        {/* ── ข้อมูลการเกิด ── */}
        <div className="profile-section">
          <div className="profile-section-title">ข้อมูลการเกิด</div>
          <p className="profile-section-sub">ใช้สำหรับคำนวณดวงชะตา — ยิ่งครบถ้วนยิ่งแม่น</p>

          <div className="profile-grid">
            <div className="profile-field">
              <label className="profile-label">วันเกิด</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => set('birthDate', e.target.value)}
                className="profile-input"
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">เวลาที่เกิด</label>
              <input
                type="time"
                value={form.birthTime}
                onChange={(e) => set('birthTime', e.target.value)}
                placeholder="00:00"
                className="profile-input"
              />
              <p className="profile-field-hint">ถ้าไม่ทราบเวลาเกิดสามารถเว้นว่างไว้ได้</p>
            </div>
          </div>

          <div className="profile-field" style={{ marginTop: 16 }}>
            <label className="profile-label">สถานที่เกิด</label>
            <input
              type="text"
              value={form.birthPlace}
              onChange={(e) => set('birthPlace', e.target.value)}
              placeholder="เช่น กรุงเทพมหานคร, เชียงใหม่"
              className="profile-input"
            />
            <p className="profile-field-hint">จังหวัด หรือเมืองที่เกิด ใช้สำหรับคำนวณดาวตาม timezone</p>
          </div>
        </div>

        {/* ── Fortune context preview ── */}
        {(form.firstName || form.birthDate) && (
          <div className="profile-preview">
            <p className="profile-preview-label">ตัวอย่างข้อมูลที่หมอดูจะได้รับ</p>
            <p className="profile-preview-text">
              {form.firstName && `ชื่อ: ${form.firstName}${form.lastName ? ' ' + form.lastName : ''}`}
              {form.birthDate && ` · เกิด: ${new Date(form.birthDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              {form.birthTime && ` เวลา ${form.birthTime} น.`}
              {form.birthPlace && ` · ${form.birthPlace}`}
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        {error && <div className="profile-error">{error}</div>}

        <div className="profile-actions">
          <button type="submit" disabled={loading} className="profile-save-btn">
            {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล ✦'}
          </button>
          {saved && <span className="profile-saved-msg">✓ บันทึกแล้ว</span>}
        </div>

      </form>
    </div>
  )
}
