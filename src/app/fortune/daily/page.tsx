'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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

// Starfield component
function Starfield() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = ref.current
    if (!container) return
    for (let i = 0; i < 130; i++) {
      const s = document.createElement('div')
      s.style.cssText = `
        position:absolute;
        width:${Math.random() < 0.2 ? '3px' : '2px'};
        height:${Math.random() < 0.2 ? '3px' : '2px'};
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        background:white;
        border-radius:50%;
        opacity:0;
        animation:df-twinkle ${2 + Math.random() * 4}s ease-in-out infinite ${-Math.random() * 6}s;
        --max-op:${0.25 + Math.random() * 0.6};
      `
      container.appendChild(s)
    }
  }, [])
  return <div ref={ref} className="df-stars" aria-hidden />
}

export default function DailyFortunePage() {
  const router = useRouter()
  const [fortune, setFortune] = useState<DailyFortune | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [animated, setAnimated] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // Animation refs
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
    fetch('/api/user/me').then((r) => {
      if (!r.ok) router.push('/auth/login?redirect=/fortune/daily')
    })

    fetch('/api/fortune/daily')
      .then((r) => r.json())
      .then((data) => {
        if (data.fortune) setFortune(data.fortune)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

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
      setFortune(data.fortune)
    } catch (e: any) {
      setError(e.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
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

    // Dynamic import so SSR doesn't break
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

    // Reset
    gsap.set(
      [els.header, els.date, els.intro, els.zoomContainer, els.body, els.lucky, els.closing],
      { opacity: 0, y: 10 }
    )
    gsap.set(els.divider, { width: 0, opacity: 0.6 })
    gsap.set(els.zoomWord, { scale: 1 })
    gsap.set(els.zoomGlow, { opacity: 0, scale: 0.5 })
    if (els.intro) els.intro.textContent = ''
    if (els.body) els.body.textContent = ''

    // 1. Header
    await gsap.to(els.header, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
    await gsap.to(els.date, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })

    // 2. Divider
    await gsap.to(els.divider, { width: '55%', duration: 0.9, ease: 'power2.inOut' })
    await new Promise((r) => setTimeout(r, 200))

    // 3. Intro line typewriter
    gsap.to(els.intro, { opacity: 1, y: 0, duration: 0.3 })
    if (els.intro) await typeText(els.intro, fortune.introLine, 40)
    await new Promise((r) => setTimeout(r, 300))

    // 4. Zoom word appear
    gsap.set(els.zoomContainer, { opacity: 1 })
    gsap.to(els.zoomGlow, { opacity: 1, scale: 1.2, duration: 0.4, ease: 'power2.out' })
    await gsap.to(els.zoomWord, { scale: 4.5, duration: 0.6, ease: 'power3.out' })

    // Spark burst
    burstSparks(els.zoomWord, gsap)

    await new Promise((r) => setTimeout(r, 750))

    // 5. Zoom out
    gsap.to(els.zoomGlow, { opacity: 0, scale: 0.5, duration: 0.5, ease: 'power2.in' })
    await gsap.to(els.zoomWord, { scale: 1, duration: 0.55, ease: 'back.out(1.4)' })
    await new Promise((r) => setTimeout(r, 300))

    // 6. Body text
    gsap.to(els.body, { opacity: 1, y: 0, duration: 0.3 })
    if (els.body) await typeText(els.body, fortune.bodyText, 35)
    await new Promise((r) => setTimeout(r, 300))

    // 7. Lucky info + closing
    await gsap.to(els.lucky, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    await gsap.to(els.closing, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
  }

  function burstSparks(el: HTMLElement | null, gsap: any) {
    if (!el) return
    const card = document.getElementById('df-card')
    if (!card) return
    const cardRect = card.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2 - cardRect.left
    const cy = rect.top + rect.height / 2 - cardRect.top

    for (let i = 0; i < 12; i++) {
      const spark = document.createElement('div')
      spark.style.cssText = `
        position:absolute;width:4px;height:4px;border-radius:50%;
        background:#fde68a;pointer-events:none;opacity:0;
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
    <>
      <style>{`
        @keyframes df-twinkle {
          0%, 100% { opacity: 0; }
          50% { opacity: var(--max-op, 0.5); }
        }
        .df-stars { position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0; }
        .df-page {
          min-height:100vh;background:linear-gradient(135deg,#0d0820 0%,#1a0d30 100%);
          display:flex;align-items:center;justify-content:center;
          font-family:'Sarabun',sans-serif;padding:1.5rem;position:relative;
        }
        .df-scene { position:relative;z-index:1;width:100%;max-width:700px; }
        .df-back {
          display:inline-flex;align-items:center;gap:0.5rem;
          color:rgba(240,192,96,0.55);font-size:0.8rem;letter-spacing:0.12em;
          text-decoration:none;margin-bottom:1.5rem;transition:color 0.2s;
        }
        .df-back:hover { color:rgba(240,192,96,0.9); }
        .df-card {
          background:linear-gradient(135deg,rgba(45,27,110,0.6),rgba(13,8,32,0.85));
          border:1px solid rgba(240,192,96,0.2);border-radius:24px;
          padding:3rem 2.5rem;backdrop-filter:blur(14px);text-align:center;
          box-shadow:0 0 80px rgba(113,63,200,0.2),0 0 24px rgba(240,192,96,0.07);
          position:relative;overflow:hidden;
        }
        .df-card::before,.df-card::after {
          content:'✦';position:absolute;font-size:1.1rem;color:#f0c060;opacity:0.35;
        }
        .df-card::before { top:1.1rem;left:1.4rem; }
        .df-card::after  { bottom:1.1rem;right:1.4rem; }
        .df-header {
          font-size:0.8rem;letter-spacing:0.32em;color:#f0c060;
          text-transform:uppercase;margin-bottom:0.5rem;
        }
        .df-date {
          font-size:0.75rem;color:rgba(240,192,96,0.5);
          letter-spacing:0.14em;margin-bottom:2rem;
        }
        .df-divider {
          height:1px;background:linear-gradient(90deg,transparent,#f0c060,transparent);
          margin:0 auto 2rem;opacity:0.6;
        }
        .df-intro {
          font-size:1.15rem;color:rgba(255,255,255,0.8);line-height:1.9;
          font-weight:300;margin-bottom:0.8rem;min-height:2.2rem;
        }
        .df-zoom-container { display:inline-block;position:relative;overflow:visible;margin:0.5rem 0 1rem; }
        .df-zoom-glow {
          position:absolute;inset:-40px;border-radius:50%;
          background:radial-gradient(ellipse,rgba(240,192,96,0.28) 0%,transparent 70%);
          pointer-events:none;
        }
        .df-zoom-word {
          display:inline-block;font-size:1.4rem;font-weight:800;color:#f0c060;
          text-shadow:0 0 30px rgba(240,192,96,0.8),0 0 60px rgba(240,192,96,0.4);
          transform-origin:center;will-change:transform;
        }
        .df-body {
          font-size:1.1rem;color:rgba(255,255,255,0.8);line-height:2;
          font-weight:300;min-height:3rem;
        }
        .df-lucky {
          margin-top:2rem;display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap;
        }
        .df-lucky-chip {
          border:1px solid rgba(240,192,96,0.3);border-radius:999px;
          padding:0.4rem 1.1rem;font-size:0.78rem;color:rgba(240,192,96,0.8);
          letter-spacing:0.1em;background:rgba(240,192,96,0.06);
        }
        .df-closing {
          margin-top:2rem;font-size:0.78rem;color:rgba(240,192,96,0.45);
          letter-spacing:0.2em;
        }
        .df-cta-zone { margin-top:2.5rem; }
        .df-generate-btn {
          display:inline-block;padding:0.8rem 2.4rem;
          background:linear-gradient(135deg,rgba(240,192,96,0.15),rgba(240,192,96,0.05));
          border:1px solid rgba(240,192,96,0.5);border-radius:999px;
          color:#f0c060;font-size:0.88rem;letter-spacing:0.18em;
          cursor:pointer;font-family:'Sarabun',sans-serif;
          transition:background 0.25s,border-color 0.25s;
        }
        .df-generate-btn:hover:not(:disabled) {
          background:rgba(240,192,96,0.18);border-color:rgba(240,192,96,0.8);
        }
        .df-generate-btn:disabled { opacity:0.5;cursor:wait; }
        .df-error {
          margin-top:1rem;font-size:0.8rem;color:rgba(255,120,120,0.8);
        }
        .df-loading-dots span {
          display:inline-block;animation:df-twinkle 1.2s ease-in-out infinite;
          --max-op:1;
        }
        .df-loading-dots span:nth-child(2) { animation-delay:0.2s; }
        .df-loading-dots span:nth-child(3) { animation-delay:0.4s; }
        @media(max-width:600px){
          .df-card { padding:2.2rem 1.5rem; }
          .df-zoom-word { font-size:1.2rem; }
          .df-intro,.df-body { font-size:1rem; }
        }
      `}</style>

      <div className="df-page">
        <Starfield />
        <div className="df-scene">
          <Link href="/dashboard" className="df-back">← กลับ Dashboard</Link>

          <div className="df-card" id="df-card">
            {loading ? (
              <div style={{ color: 'rgba(240,192,96,0.6)', letterSpacing: '0.2em', fontSize: '0.85rem' }}>
                <span className="df-loading-dots">
                  <span>●</span><span>●</span><span>●</span>
                </span>
              </div>
            ) : !fortune ? (
              /* No fortune yet — show CTA */
              <>
                <div ref={headerRef} className="df-header" style={{ opacity: 1 }}>✦ มาหาหมอดู ✦</div>
                <div ref={dateRef} className="df-date" style={{ opacity: 1 }}>ดวงประจำวัน</div>
                <div ref={dividerRef} className="df-divider" style={{ width: '55%' }} />
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.9, fontWeight: 300, marginBottom: '0.5rem' }}>
                  ยังไม่มีดวงวันนี้ของคุณ<br />กดปุ่มด้านล่างเพื่อดูดวงประจำวันนี้
                </div>
                <div className="df-cta-zone">
                  <button
                    className="df-generate-btn"
                    onClick={generate}
                    disabled={generating}
                  >
                    {generating ? '✦ กำลังดูดวง...' : '✦ ดึงดวงวันนี้'}
                  </button>
                  {error && <div className="df-error">{error}</div>}
                </div>
              </>
            ) : (
              /* Fortune revealed */
              <>
                <div ref={headerRef} className="df-header">✦ มาหาหมอดู ✦</div>
                <div ref={dateRef} className="df-date">{todayLabel}</div>
                <div ref={dividerRef} className="df-divider" />

                <div ref={introRef} className="df-intro" />

                <div ref={zoomContainerRef} className="df-zoom-container" style={{ opacity: 0 }}>
                  <div ref={zoomGlowRef} className="df-zoom-glow" />
                  <span ref={zoomWordRef} className="df-zoom-word">{fortune.zoomWord}</span>
                </div>

                <div ref={bodyRef} className="df-body" />

                <div ref={luckyRef} className="df-lucky" style={{ opacity: 0 }}>
                  <span className="df-lucky-chip">เลขมงคล: {fortune.luckyNumber}</span>
                  <span className="df-lucky-chip">สีมงคล: {fortune.luckyColor}</span>
                </div>

                <div ref={closingRef} className="df-closing" style={{ opacity: 0 }}>
                  ✦ ขอให้โชคดีในทุกวัน ✦
                </div>
                {animationDone && (
                  <button
                    type="button"
                    className="df-share-btn"
                    onClick={() => setShareOpen(true)}
                  >
                    ↗ แชร์ดวงวันนี้
                  </button>
                )}
              </>
            )}
          </div>
        </div>
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
    </>
  )
}
