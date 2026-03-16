'use client'

import { useCallback, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const ONE_TIME_PACKAGES = [
  { id: 5, credits: 5, price: 39, label: 'ทดลองใช้', highlight: true },
]

const SUBSCRIPTIONS = [
  {
    id: 'monthly',
    name: 'รายเดือน',
    price: 129,
    credits: 'ไม่จำกัด',
    period: '/เดือน',
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'รายปี',
    price: 999,
    credits: 'ไม่จำกัด',
    period: '/ปี',
    highlight: true,
    save: 'ประหยัด 36%',
  },
]

export default function CreditPackages() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'one-time' | 'subscription'>('one-time')

  // Show success/cancelled message from Stripe redirect
  const paymentStatus = searchParams.get('payment')

  // Refresh page data when payment succeeds
  useEffect(() => {
    if (paymentStatus === 'success') {
      console.log('Payment success detected, refreshing in 3 seconds...')
      // Wait for webhook to process, then refresh
      const timer = setTimeout(() => {
        console.log('Refreshing page data...')
        router.refresh()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [paymentStatus, router])

  const handlePurchase = useCallback(
    async (packageId: string | number, type: 'one-time' | 'subscription' = 'one-time') => {
      setLoading(`${type}-${packageId}`)
      setError('')
      try {
        const endpoint = type === 'subscription'
          ? '/api/payments/create-subscription'
          : '/api/payments/create-checkout'

        const res = await fetch(endpoint, {
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
        setLoading(null)
      }
    },
    []
  )

  return (
    <>
      {/* Payment status message */}
      {paymentStatus === 'success' && (
        <div className="dash-payment-message success">
          ✓ สำเร็จ! เครดิตจะถูกเพิ่มเข้าบัญชีของคุณในไม่ช้า
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

      {/* Tabs */}
      <div className="dash-package-tabs">
        <button
          className={`dash-package-tab${tab === 'one-time' ? ' active' : ''}`}
          onClick={() => setTab('one-time')}
          type="button"
        >
          ซื้อครั้งเดียว
        </button>
        <button
          className={`dash-package-tab${tab === 'subscription' ? ' active' : ''}`}
          onClick={() => setTab('subscription')}
          type="button"
        >
          สมาชิก
        </button>
      </div>

      {/* One-time packages */}
      {tab === 'one-time' && (
        <div className="dash-credit-packages">
          {ONE_TIME_PACKAGES.map((pkg) => (
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
                onClick={() => handlePurchase(pkg.id, 'one-time')}
                disabled={loading !== null}
                type="button"
              >
                {loading === `one-time-${pkg.id}` ? 'กำลังโหลด...' : 'ซื้อเลย'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Subscription packages */}
      {tab === 'subscription' && (
        <div className="dash-subscription-packages">
          {SUBSCRIPTIONS.map((sub) => (
            <div
              key={sub.id}
              className={`dash-subscription-pkg${sub.highlight ? ' highlight' : ''}`}
            >
              {sub.highlight && sub.save && (
                <span className="dash-subscription-badge">{sub.save}</span>
              )}
              <p className="dash-subscription-name">{sub.name}</p>
              <p className="dash-subscription-credits">{sub.credits}</p>
              <p className="dash-subscription-unit">เครดิต</p>
              <p className="dash-subscription-price">
                ฿{sub.price}<span className="dash-subscription-period">{sub.period}</span>
              </p>
              <button
                className="dash-subscription-btn"
                onClick={() => handlePurchase(sub.id, 'subscription')}
                disabled={loading !== null}
                type="button"
              >
                {loading === `subscription-${sub.id}` ? 'กำลังโหลด...' : 'สมัครเลย'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
