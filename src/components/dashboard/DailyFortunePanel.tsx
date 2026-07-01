'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import FortuneShareModal, { type SharePayload } from '@/components/fortune/FortuneShareModal'

type DailyFortune = {
  id: string
  introLine: string
  zoomWord: string
  bodyText: string
  luckyNumber: string
  luckyColor: string
  date: string
  createdAt: string
}

export default function DailyFortunePanel() {
  const [fortune, setFortune] = useState<DailyFortune | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [animated, setAnimated] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const headerRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const zoomContainerRef = useRef<HTMLDivElement>(null)
  const zoomWordRef = useRef<HTMLSpanElement>(null)
  const zoomGlowRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const luckyRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/fortune/daily')
      .then((r) => r.json())
      .then((data) => {
        if (data.fortune) setFortune(data.fortune)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (fortune && !animated) {
      setAnimated(true)
      setAnimationDone(false)
      runAnimation().then(() => setAnimationDone(true))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fortune])

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/fortune/daily', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
      setAnimated(false)
      setFortune(data.fortune)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setGenerating(false)
    }
  }

  function typeText(el: HTMLElement, text: string, speed = 42): Promise<void> {
    return new Promise((resolve) => {
      let i = 0
      const interval = setInterval(() => {
        i++
        el.textContent = text.substring(0, i)
        if (i >= text.length) {
          clearInterval(interval)
          resolve()
        }
      }, speed)
    })
  }

  async function runAnimation() {
    if (!fortune) return

    const { gsap } = await import('gsap')

    const els = {
      header: headerRef.current,
      date: dateRef.current,
      divider: dividerRef.current,
      intro: introRef.current,
      zoomContainer: zoomContainerRef.current,
      zoomWord: zoomWordRef.current,
      zoomGlow: zoomGlowRef.current,
      body: bodyRef.current,
      lucky: luckyRef.current,
      closing: closingRef.current,
    }

    gsap.set(
      [els.header, els.date, els.intro, els.zoomContainer, els.body, els.lucky, els.closing],
      { opacity: 0, y: 10 }
    )
    gsap.set(els.divider, { width: 0, opacity: 0.6 })
    gsap.set(els.zoomWord, { scale: 1 })
    gsap.set(els.zoomGlow, { opacity: 0, scale: 0.5 })
    if (els.intro) els.intro.textContent = ''
    if (els.body) els.body.textContent = ''

    await gsap.to(els.header, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
    await gsap.to(els.date, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
    await gsap.to(els.divider, { width: '55%', duration: 0.9, ease: 'power2.inOut' })
    await new Promise((r) => setTimeout(r, 200))

    gsap.to(els.intro, { opacity: 1, y: 0, duration: 0.3 })
    if (els.intro) await typeText(els.intro, fortune.introLine, 40)
    await new Promise((r) => setTimeout(r, 300))

    gsap.set(els.zoomContainer, { opacity: 1 })
    gsap.to(els.zoomGlow, { opacity: 1, scale: 1.2, duration: 0.4, ease: 'power2.out' })
    await gsap.to(els.zoomWord, { scale: 4.5, duration: 0.6, ease: 'power3.out' })

    burstSparks(els.zoomWord, gsap)

    await new Promise((r) => setTimeout(r, 750))

    gsap.to(els.zoomGlow, { opacity: 0, scale: 0.5, duration: 0.5, ease: 'power2.in' })
    await gsap.to(els.zoomWord, { scale: 1, duration: 0.55, ease: 'back.out(1.4)' })
    await new Promise((r) => setTimeout(r, 300))

    gsap.to(els.body, { opacity: 1, y: 0, duration: 0.3 })
    if (els.body) await typeText(els.body, fortune.bodyText, 35)
    await new Promise((r) => setTimeout(r, 300))

    await gsap.to(els.lucky, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    await gsap.to(els.closing, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
  }

  function burstSparks(el: HTMLElement | null, gsap: typeof import('gsap').gsap) {
    if (!el) return
    const card = document.getElementById('dash-df-card')
    if (!card) return
    const cardRect = card.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2 - cardRect.left
    const cy = rect.top + rect.height / 2 - cardRect.top

    for (let i = 0; i < 12; i++) {
      const spark = document.createElement('div')
      spark.style.cssText = `
        position:absolute;width:4px;height:4px;border-radius:50%;
        background:#D4A017;pointer-events:none;opacity:0;
        left:${cx}px;top:${cy}px;
      `
      card.appendChild(spark)
      const angle = (i / 12) * Math.PI * 2
      const dist = 40 + Math.random() * 50
      gsap.to(spark, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        opacity: 0,
        duration: 0.8 + Math.random() * 0.4,
        ease: 'power2.out',
        onComplete: () => spark.remove(),
      })
    }
  }

  const todayLabel = new Date().toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  function buildDailySharePreset(f: DailyFortune): SharePayload {
    const site =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://mahamordo.com'
    const shareText = [
      `✦ ${f.zoomWord}`,
      '',
      f.bodyText,
      '',
      `เลขมงคล: ${f.luckyNumber} · สีมงคล: ${f.luckyColor}`,
      '',
      '— มาหาหมอดู · ดวงประจำวัน',
      site,
    ].join('\n')
    return {
      quoteLine: f.zoomWord,
      summary: f.bodyText.slice(0, 220),
      shareText,
      oracleName: 'มาหาหมอดู',
      topicLabel: 'ดวงประจำวัน',
    }
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">Daily Fortune</p>
        <h1 className="dash-page-title thai-font">ดวงประจำวัน</h1>
        <p className="dash-page-sub thai-font">
          ดูดวงรายวันฟรี · รีเซตทุกเที่ยงคืน
        </p>
      </div>

      <div className="dash-daily-body">
        <div className="dash-df-card" id="dash-df-card">
          {loading ? (
            <div className="dash-df-loading">
              <span className="dash-df-loading-dots">
                <span>●</span><span>●</span><span>●</span>
              </span>
            </div>
          ) : !fortune ? (
            <>
              <div ref={headerRef} className="dash-df-header" style={{ opacity: 1 }}>✦ มาหาหมอดู ✦</div>
              <div ref={dateRef} className="dash-df-date" style={{ opacity: 1 }}>ดวงประจำวัน</div>
              <div ref={dividerRef} className="dash-df-divider" style={{ width: '55%' }} />
              <p className="dash-df-empty thai-font">
                ยังไม่มีดวงวันนี้ของคุณ<br />กดปุ่มด้านล่างเพื่อดูดวงประจำวันนี้
              </p>
              <div className="dash-df-cta">
                <button
                  type="button"
                  className="dash-df-generate-btn thai-font"
                  onClick={generate}
                  disabled={generating}
                >
                  {generating ? '✦ กำลังดูดวง...' : '✦ ดึงดวงวันนี้'}
                </button>
                {error && <p className="dash-df-error thai-font">{error}</p>}
              </div>
            </>
          ) : (
            <>
              <div ref={headerRef} className="dash-df-header">✦ มาหาหมอดู ✦</div>
              <div ref={dateRef} className="dash-df-date">{todayLabel}</div>
              <div ref={dividerRef} className="dash-df-divider" />

              <div ref={introRef} className="dash-df-intro thai-font" />

              <div ref={zoomContainerRef} className="dash-df-zoom-container" style={{ opacity: 0 }}>
                <div ref={zoomGlowRef} className="dash-df-zoom-glow" />
                <span ref={zoomWordRef} className="dash-df-zoom-word thai-font">{fortune.zoomWord}</span>
              </div>

              <div ref={bodyRef} className="dash-df-body thai-font" />

              <div ref={luckyRef} className="dash-df-lucky" style={{ opacity: 0 }}>
                <span className="dash-df-lucky-chip thai-font">เลขมงคล: {fortune.luckyNumber}</span>
                <span className="dash-df-lucky-chip thai-font">สีมงคล: {fortune.luckyColor}</span>
              </div>

              <div ref={closingRef} className="dash-df-closing" style={{ opacity: 0 }}>
                ✦ ขอให้โชคดีในทุกวัน ✦
              </div>

              {animationDone && (
                <button
                  type="button"
                  className="df-share-btn thai-font"
                  onClick={() => setShareOpen(true)}
                >
                  ↗ แชร์ดวงวันนี้
                </button>
              )}
            </>
          )}
        </div>

        {fortune && (
          <Link href="/dashboard/coin" className="dash-section-link thai-font" style={{ display: 'inline-block', marginTop: 20 }}>
            ทอยเหรียญหัว–ก้อย →
          </Link>
        )}
      </div>

      {fortune && (
        <FortuneShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          oracleId={1}
          oracleName="มาหาหมอดู"
          oracleSubtitle="ดวงประจำวัน"
          preset={buildDailySharePreset(fortune)}
          dailyMode
        />
      )}
    </div>
  )
}
