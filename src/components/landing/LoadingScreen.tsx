'use client'

import { useEffect, useRef } from 'react'

import { ORACLE_PRELOAD_SVGS } from '@/lib/oracle-assets'

const RESOURCES = ORACLE_PRELOAD_SVGS

interface Props {
  onComplete: (isLoggedIn: boolean) => void
}

export default function LoadingScreen({ onComplete }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    // total tasks: 3 images + 1 auth check = 4
    const total = RESOURCES.length + 1
    let loaded = 0

    function setProgress(pct: number, label: string) {
      if (barRef.current) barRef.current.style.width = pct + '%'
      if (percentRef.current) percentRef.current.textContent = Math.floor(pct) + '%'
      if (statusRef.current) statusRef.current.textContent = label
    }

    function onItemDone(label: string) {
      loaded++
      const pct = Math.round((loaded / total) * 100)
      setProgress(pct, label)
      if (loaded >= total) finish()
    }

    function finish() {
      if (doneRef.current) return
      doneRef.current = true
      setProgress(100, 'Ready')
      setTimeout(() => {
        screenRef.current?.classList.add('hidden')
        setTimeout(() => onComplete(authResult), 600)
      }, 300)
    }

    let authResult = false

    // Preload each SVG image
    RESOURCES.forEach((src, i) => {
      const img = new window.Image()
      img.onload = () => onItemDone(i === 0 ? 'แม่หมอจันทร์' : i === 1 ? 'พ่อหมอซอน' : 'อาจารย์ราหู')
      img.onerror = () => onItemDone('...')
      img.src = src
    })

    // Auth check
    fetch('/api/user/me')
      .then(r => { authResult = r.ok })
      .catch(() => {})
      .finally(() => onItemDone('Authenticated'))

    // Safety timeout: if anything stalls > 8s, complete anyway
    const timeout = setTimeout(() => finish(), 8000)
    return () => clearTimeout(timeout)
  }, [onComplete])

  return (
    <div className="loading-screen" ref={screenRef}>
      <div className="loading-bar-wrap">
        <div className="loading-bar-fill" ref={barRef} style={{ width: '0%' }} />
      </div>
      <div className="loading-logo">
        <span className="loading-logo-symbol">M</span>
      </div>
      <span className="loading-status" ref={statusRef}>Loading</span>
      <span className="loading-percent" ref={percentRef}>0%</span>
    </div>
  )
}
