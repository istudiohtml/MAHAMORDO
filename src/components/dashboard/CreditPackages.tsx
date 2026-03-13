'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const PACKAGES = [
  { id: 5, credits: 5, price: 49, label: 'Starter' },
  { id: 15, credits: 15, price: 129, label: 'Popular', highlight: true },
  { id: 30, credits: 30, price: 239, label: 'Value' },
]

export default function CreditPackages() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Show success/cancelled message from Stripe redirect
  const paymentStatus = searchParams.get('payment')

  const handlePurchase = useCallback(
    async (packageId: number) => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/payments/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create checkout')
        }

        const { url } = await res.json()
        if (url) {
          window.location.href = url
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setLoading(false)
      }
    },
    []
  )

  return (
    <>
      {/* Payment status message */}
      {paymentStatus === 'success' && (
        <div className="dash-payment-message success">
          ✓ ซื้อเครดิตสำเร็จ! เครดิตจะถูกเพิ่มเข้าบัญชีของคุณในไม่ช้า
        </div>
      )}
      {paymentStatus === 'cancelled' && (
        <div className="dash-payment-message cancelled">
          ✕ ยกเลิกการซื้อ
        </div>
      )}
      {error && (
        <div className="dash-payment-message error">
          ✕ {error}
        </div>
      )}

      <div className="dash-credit-packages">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`dash-credit-pkg${pkg.highlight ? ' highlight' : ''}`}
          >
            {pkg.highlight && (
              <span className="dash-credit-pkg-badge">แนะนำ</span>
            )}
            <p className="dash-credit-pkg-label">{pkg.label}</p>
            <p className="dash-credit-pkg-count">{pkg.credits}</p>
            <p className="dash-credit-pkg-unit">เครดิต</p>
            <p className="dash-credit-pkg-price">฿{pkg.price}</p>
            <button
              className="dash-credit-pkg-btn"
              onClick={() => handlePurchase(pkg.id)}
              disabled={loading}
              type="button"
            >
              {loading ? 'กำลังโหลด...' : 'ซื้อเลย'}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
