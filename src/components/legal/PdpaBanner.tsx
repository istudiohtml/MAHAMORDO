'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CURRENT_POLICY_VERSION,
  PDPA_STORAGE_KEY,
  type PdpaPreferences,
} from '@/lib/pdpa'

type Mode = 'compact' | 'manage'

/**
 * Cookie / PDPA consent banner pinned to the bottom of every page until
 * the visitor makes a choice. Choice is stored in localStorage; logged-in
 * users also POST to /api/user/privacy/consent so it's stored in DB.
 */
export default function PdpaBanner() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<Mode>('compact')
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PDPA_STORAGE_KEY)
      if (!raw) {
        setVisible(true)
        return
      }
      const saved: PdpaPreferences = JSON.parse(raw)
      if (saved.version !== CURRENT_POLICY_VERSION) {
        setVisible(true)
        return
      }
      setAnalytics(saved.analytics)
      setMarketing(saved.marketing)
    } catch {
      setVisible(true)
    }
  }, [])

  async function persist(prefs: PdpaPreferences) {
    localStorage.setItem(PDPA_STORAGE_KEY, JSON.stringify(prefs))
    // Best-effort sync to DB for logged-in users. Ignore failures (guest user).
    try {
      await fetch('/api/user/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: prefs.version,
          marketing: prefs.marketing,
        }),
      })
    } catch {
      // ignore network errors / not logged in
    }
  }

  async function acceptAll() {
    const prefs: PdpaPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      acceptedAt: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    }
    await persist(prefs)
    setVisible(false)
  }

  async function acceptNecessary() {
    const prefs: PdpaPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      acceptedAt: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    }
    await persist(prefs)
    setVisible(false)
  }

  async function saveChoices() {
    const prefs: PdpaPreferences = {
      necessary: true,
      analytics,
      marketing,
      acceptedAt: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    }
    await persist(prefs)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="pdpa-banner" role="dialog" aria-live="polite" aria-label="ความเป็นส่วนตัว">
      <div className="pdpa-banner-inner">
        {mode === 'compact' ? (
          <>
            <div className="pdpa-banner-text">
              <p className="pdpa-banner-title">
                เว็บนี้ใช้คุกกี้เพื่อให้บริการคุณ
              </p>
              <p className="pdpa-banner-sub">
                คุกกี้ <strong>ที่จำเป็น</strong> (สำหรับล็อกอิน, ดูดวง,
                ชำระเงิน) เปิดไว้เสมอเพื่อให้เว็บทำงานได้ ส่วน
                <strong> Analytics</strong> และ <strong>Marketing</strong>{' '}
                คุณเลือกได้ —{' '}
                <Link href="/pdpa" className="pdpa-banner-link">
                  อ่านนโยบายเต็ม
                </Link>
              </p>
            </div>
            <div className="pdpa-banner-actions">
              <button
                type="button"
                className="pdpa-banner-btn pdpa-banner-btn-ghost"
                onClick={() => setMode('manage')}
              >
                ตั้งค่าเอง
              </button>
              <button
                type="button"
                className="pdpa-banner-btn pdpa-banner-btn-outline"
                onClick={acceptNecessary}
                title="ใช้แค่คุกกี้ที่จำเป็นต่อการใช้งาน (ล็อกอิน, ชำระเงิน)"
              >
                ใช้แค่ที่จำเป็น
              </button>
              <button
                type="button"
                className="pdpa-banner-btn pdpa-banner-btn-primary"
                onClick={acceptAll}
              >
                ยอมรับทั้งหมด
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="pdpa-banner-text">
              <p className="pdpa-banner-title">ตั้งค่าความเป็นส่วนตัว</p>
              <p className="pdpa-banner-sub">
                เลือกประเภทคุกกี้ที่คุณยินยอมให้เราใช้
              </p>

              <label className="pdpa-banner-row">
                <input type="checkbox" checked disabled readOnly />
                <span>
                  <strong>จำเป็น (ปิดไม่ได้)</strong>
                  <br />
                  ใช้สำหรับล็อกอิน, จดจำเซสชัน, การชำระเงิน — ไม่มีคุกกี้นี้
                  เว็บใช้งานไม่ได้
                </span>
              </label>

              <label className="pdpa-banner-row">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <span>
                  <strong>Analytics</strong>
                  <br />
                  ช่วยเราเข้าใจว่ามีคนใช้งานแบบไหน เพื่อปรับปรุงเว็บให้ดีขึ้น
                </span>
              </label>

              <label className="pdpa-banner-row">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
                <span>
                  <strong>Marketing</strong>
                  <br />
                  รับอีเมลข่าวสาร โปรโมชั่น และคำทำนายพิเศษ (ยกเลิกได้ตลอด)
                </span>
              </label>
            </div>
            <div className="pdpa-banner-actions">
              <button
                type="button"
                className="pdpa-banner-btn pdpa-banner-btn-ghost"
                onClick={() => setMode('compact')}
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                className="pdpa-banner-btn pdpa-banner-btn-primary"
                onClick={saveChoices}
              >
                บันทึกการเลือก
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
