'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Props = {
  initialCredits?: number
}

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

export default function CreditPackages({ initialCredits }: Props = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'one-time' | 'subscription'>('subscription')
  const [pollingCredits, setPollingCredits] = useState(false)
  const startCreditsRef = useRef<number | undefined>(initialCredits)

  // Show success/cancelled message from Stripe redirect
  const paymentStatus = searchParams.get('payment')

  // Poll /api/user/me after a successful payment until credits actually
  // increase (webhook can take a few seconds, especially with PromptPay).
  // Falls back to a single refresh after 30s if polling never sees a change.
  useEffect(() => {
    if (paymentStatus !== 'success') return

    setPollingCredits(true)
    let cancelled = false
    let attempts = 0
    const maxAttempts = 20 // ~30s @ 1.5s interval

    async function poll() {
      while (!cancelled && attempts < maxAttempts) {
        attempts++
        try {
          const res = await fetch('/api/user/me', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const latest = data?.user?.credits
            const started = startCreditsRef.current
            // Either credits increased (one-time top-up) or subscription kicked in
            // (subscriptionPlan set). Either way: refresh and stop polling.
            if (
              typeof latest === 'number' &&
              typeof started === 'number' &&
              latest > started
            ) {
              if (!cancelled) {
                setPollingCredits(false)
                router.refresh()
              }
              return
            }
          }
        } catch {
          // ignore transient errors and keep polling
        }
        await new Promise((r) => setTimeout(r, 1500))
      }
      if (!cancelled) {
        setPollingCredits(false)
        router.refresh()
      }
    }

    poll()
    return () => {
      cancelled = true
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
          {pollingCredits
            ? '⏳ กำลังตรวจสอบการชำระเงิน... (อาจใช้เวลาสักครู่)'
            : '✓ สำเร็จ! เครดิตถูกเพิ่มเข้าบัญชีของคุณแล้ว'}
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

      {/* Payment method hint */}
      <div className="dash-payment-hint">
        {tab === 'one-time' ? (
          <>
            <span className="dash-payment-hint-icon" aria-hidden>💳</span>
            <span>
              ชำระด้วย <strong>บัตรเครดิต/เดบิต</strong> หรือ{' '}
              <strong>PromptPay (สแกน QR)</strong>
            </span>
          </>
        ) : (
          <>
            <span className="dash-payment-hint-icon" aria-hidden>💳</span>
            <span>
              สมาชิกแบบต่ออายุอัตโนมัติรองรับเฉพาะ <strong>บัตรเครดิต/เดบิต</strong>{' '}
              เท่านั้น (PromptPay ใช้ได้กับการซื้อครั้งเดียว)
            </span>
          </>
        )}
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
                <span className="dash-credit-pkg-badge thai-font">แนะนำ</span>
              )}
              <p className="dash-credit-pkg-label thai-font">{pkg.label}</p>
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
