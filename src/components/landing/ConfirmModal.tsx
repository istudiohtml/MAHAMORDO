'use client'

import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  oracleName?: string
  creditCost: number
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, oracleName, creditCost, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    const dialog = dialogRef.current
    if (!dialog) return
    const rect = dialog.getBoundingClientRect()
    if (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    ) {
      onCancel()
    }
  }

  // Close on Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-modal"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="confirm-modal-inner">
        <div className="confirm-modal-icon">✦</div>
        <h3 className="confirm-modal-title">เริ่มดูดวง</h3>
        {oracleName && (
          <p className="confirm-modal-oracle">{oracleName}</p>
        )}
        <p className="confirm-modal-desc">
          การดูดวงครั้งนี้จะใช้ <strong>{creditCost} เครดิต</strong>
        </p>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-btn confirm-modal-btn-primary" onClick={onConfirm}>
            เริ่มเลย &nbsp;✦
          </button>
          <button className="confirm-modal-btn confirm-modal-btn-cancel" onClick={onCancel}>
            ยกเลิก
          </button>
        </div>
      </div>
    </dialog>
  )
}
