'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  isCancelledAtPeriodEnd?: boolean
}

export default function CancelSubscriptionButton({ userId, isCancelledAtPeriodEnd = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelled, setCancelled] = useState(isCancelledAtPeriodEnd)

  const handleCancel = async () => {
    if (!confirm('คุณจะหยุดการสมัครสมาชิกเมื่อสิ้นสุดรอบการเรียกเก็บเงิน\n\nยกเลิกสมาชิกใช่หรือไม่?')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Cancelling subscription for userId:', userId)

      const res = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      console.log('Cancel response status:', res.status)

      if (!res.ok) {
        const data = await res.json()
        console.error('Cancel error:', data)
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      const result = await res.json()
      console.log('Cancel success:', result)

      // Mark as cancelled and refresh
      setCancelled(true)
      setTimeout(() => {
        console.log('Refreshing page...')
        router.refresh()
      }, 1000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      console.error('Cancel error caught:', errorMsg)
      setError(errorMsg)
      setLoading(false)
    }
  }

  if (cancelled) {
    return (
      <div className="dash-payment-message">
        ✓ การยกเลิกสมาชิกทำเสร็จแล้ว จะหยุดการสมัครเมื่อสิ้นสุดรอบการเรียกเก็บเงิน
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="dash-payment-message error">
          ✕ {error}
        </div>
      )}
      <button
        className="dash-cancel-subscription-btn"
        onClick={handleCancel}
        disabled={loading}
        type="button"
      >
        {loading ? 'กำลังยกเลิก...' : 'ยกเลิกสมาชิก'}
      </button>
    </>
  )
}
