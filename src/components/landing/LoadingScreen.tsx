'use client'

import { useEffect, useRef } from 'react'

interface Props {
  onComplete: () => void
}

export default function LoadingScreen({ onComplete }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let val = 0
    const interval = setInterval(() => {
      const step = val < 40 ? 3 : val < 75 ? 0.8 : val < 92 ? 0.4 : 2.5
      val = Math.min(100, val + step)
      if (barRef.current) barRef.current.style.width = val + '%'
      if (percentRef.current) percentRef.current.textContent = Math.floor(val) + '%'
      if (val >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          screenRef.current?.classList.add('hidden')
          setTimeout(onComplete, 600)
        }, 300)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="loading-screen" ref={screenRef}>
      <div className="loading-bar-wrap">
        <div className="loading-bar-fill" ref={barRef} />
      </div>
      <div className="loading-logo">
        <span className="loading-logo-symbol">M</span>
      </div>
      <span className="loading-status">Initializing</span>
      <span className="loading-percent" ref={percentRef}>0%</span>
    </div>
  )
}
