'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CURRENT_POLICY_VERSION, PDPA_STORAGE_KEY } from '@/lib/pdpa'

type Props = {
  initialMarketing: boolean
  hasDeletionRequest: boolean
}

type Stage = 'idle' | 'confirm' | 'deleting'

export default function PrivacyControls({
  initialMarketing,
  hasDeletionRequest,
}: Props) {
  const router = useRouter()
  const [marketing, setMarketing] = useState(initialMarketing)
  const [savingMarketing, setSavingMarketing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteStage, setDeleteStage] = useState<Stage>('idle')
  const [confirmText, setConfirmText] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function saveMarketing(next: boolean) {
    setSavingMarketing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: CURRENT_POLICY_VERSION,
          marketing: next,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setMarketing(next)
      // Keep localStorage in sync with the latest choice.
      try {
        const raw = localStorage.getItem(PDPA_STORAGE_KEY)
        const prev = raw ? JSON.parse(raw) : {}
        localStorage.setItem(
          PDPA_STORAGE_KEY,
          JSON.stringify({
            ...prev,
            necessary: true,
            marketing: next,
            version: CURRENT_POLICY_VERSION,
            acceptedAt: new Date().toISOString(),
          })
        )
      } catch {
        // ignore
      }
      setMessage({ kind: 'ok', text: 'บันทึกการยินยอมเรียบร้อย' })
    } catch {
      setMessage({ kind: 'err', text: 'บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง' })
    } finally {
      setSavingMarketing(false)
    }
  }

  async function exportData() {
    setExporting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/privacy/export')
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mahamordo-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMessage({ kind: 'ok', text: 'ดาวน์โหลดข้อมูลเรียบร้อย' })
    } catch {
      setMessage({ kind: 'err', text: 'ดาวน์โหลดไม่สำเร็จ' })
    } finally {
      setExporting(false)
    }
  }

  async function confirmDelete() {
    if (confirmText !== 'ลบบัญชี') {
      setMessage({ kind: 'err', text: 'พิมพ์ "ลบบัญชี" เพื่อยืนยัน' })
      return
    }
    setDeleteStage('deleting')
    try {
      const res = await fetch('/api/user/privacy/delete-account?confirm=1', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('delete failed')
      try {
        localStorage.removeItem(PDPA_STORAGE_KEY)
      } catch {
        // ignore
      }
      router.replace('/?deleted=1')
    } catch {
      setDeleteStage('confirm')
      setMessage({ kind: 'err', text: 'ลบไม่สำเร็จ — กรุณาลองใหม่' })
    }
  }

  async function cancelDeletion() {
    setMessage(null)
    try {
      await fetch('/api/user/privacy/delete-account', { method: 'DELETE' })
      router.refresh()
    } catch {
      setMessage({ kind: 'err', text: 'ยกเลิกคำขอไม่สำเร็จ' })
    }
  }

  return (
    <>
      {message && (
        <div
          className={`dash-payment-message ${
            message.kind === 'ok' ? 'success' : 'error'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Marketing consent */}
      <section className="dash-section">
        <h2 className="dash-section-title thai-font">การยินยอมที่เปลี่ยนได้</h2>
        <div className="dash-toggle-row">
          <div>
            <p className="dash-toggle-title">รับอีเมลข่าวสาร / โปรโมชั่น</p>
            <p className="dash-toggle-sub">
              เราจะส่งโปรโมชั่นและข่าวสารใหม่ทางอีเมล ยกเลิกได้ทุกเมื่อ
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={marketing}
            disabled={savingMarketing}
            onClick={() => saveMarketing(!marketing)}
            className={`dash-toggle${marketing ? ' is-on' : ''}`}
          >
            <span className="dash-toggle-knob" />
          </button>
        </div>
      </section>

      {/* Data export */}
      <section className="dash-section">
        <h2 className="dash-section-title thai-font">ขอสำเนาข้อมูล (Right of Access)</h2>
        <p className="dash-section-text">
          ดาวน์โหลดข้อมูลทั้งหมดที่เรามีเกี่ยวกับคุณ ในรูปแบบ JSON
          รวมประวัติดูดวง, การชำระเงิน, การยินยอม
        </p>
        <button
          type="button"
          className="dash-btn dash-btn-outline"
          onClick={exportData}
          disabled={exporting}
        >
          {exporting ? 'กำลังเตรียมไฟล์...' : '⬇ ดาวน์โหลดข้อมูล (.json)'}
        </button>
      </section>

      {/* Account deletion */}
      <section className="dash-section dash-section-danger">
        <h2 className="dash-section-title thai-font">ลบบัญชี (Right to Erasure)</h2>
        <p className="dash-section-text">
          การลบบัญชีจะลบข้อมูลส่วนบุคคลทั้งหมด (อีเมล, ชื่อ, วันเกิด, ประวัติดูดวง)
          ภายใน 30 วัน
          <br />
          <strong>ข้อยกเว้น:</strong> บันทึกการชำระเงินจะเก็บไว้ 5 ปี
          เพื่อปฏิบัติตามกฎหมายภาษีและการบัญชี
        </p>

        {hasDeletionRequest ? (
          <div className="dash-danger-confirm">
            <p>
              <strong>มีคำขอลบบัญชีค้างอยู่</strong> —
              คุณสามารถยืนยันการลบทันที หรือยกเลิกคำขอได้
            </p>
            <div className="dash-danger-actions">
              <button
                type="button"
                className="dash-btn dash-btn-outline"
                onClick={cancelDeletion}
              >
                ยกเลิกคำขอ
              </button>
              <button
                type="button"
                className="dash-btn dash-btn-danger"
                onClick={() => setDeleteStage('confirm')}
              >
                ดำเนินการลบทันที
              </button>
            </div>
          </div>
        ) : deleteStage === 'idle' ? (
          <button
            type="button"
            className="dash-btn dash-btn-danger"
            onClick={() => setDeleteStage('confirm')}
          >
            ลบบัญชีของฉัน
          </button>
        ) : null}

        {deleteStage === 'confirm' && (
          <div className="dash-danger-confirm">
            <p>
              <strong>กรุณาพิมพ์คำว่า "ลบบัญชี" เพื่อยืนยัน</strong>
            </p>
            <input
              type="text"
              className="auth-input"
              placeholder="ลบบัญชี"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
            />
            <div className="dash-danger-actions">
              <button
                type="button"
                className="dash-btn dash-btn-outline"
                onClick={() => {
                  setDeleteStage('idle')
                  setConfirmText('')
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="dash-btn dash-btn-danger"
                onClick={confirmDelete}
                disabled={confirmText !== 'ลบบัญชี'}
              >
                ยืนยันลบบัญชี
              </button>
            </div>
          </div>
        )}

        {deleteStage === 'deleting' && (
          <p className="dash-section-text">กำลังลบบัญชี...</p>
        )}
      </section>
    </>
  )
}
