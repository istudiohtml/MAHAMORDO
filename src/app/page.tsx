'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OracleId } from '@/data/oracles'
import LoadingScreen from '@/components/landing/LoadingScreen'
import Nav, { NavMode } from '@/components/landing/Nav'
import HomeView from '@/components/landing/HomeView'
import DetailView from '@/components/landing/DetailView'

export default function Home() {
  const router = useRouter()
  const [navReady, setNavReady] = useState(false)
  const [homeAnimated, setHomeAnimated] = useState(false)
  const [homeSlideUp, setHomeSlideUp] = useState(false)
  const [detailSlideIn, setDetailSlideIn] = useState(false)
  const [detailContentVisible, setDetailContentVisible] = useState(false)
  const [navMode, setNavMode] = useState<NavMode>('home')
  const [oracleId, setOracleId] = useState<OracleId>(1)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const detailViewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/user/me').then(r => setIsLoggedIn(r.ok)).catch(() => {})
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setNavReady(true)
    setTimeout(() => setHomeAnimated(true), 400)
  }, [])

  const openOracle = useCallback((id: OracleId) => {
    setOracleId(id)
    setDetailContentVisible(false)
    setHomeSlideUp(true)
    setDetailSlideIn(true)
    setNavMode('detail')
    setTimeout(() => setDetailContentVisible(true), 500)
  }, [])

  const goHome = useCallback(() => {
    setHomeSlideUp(false)
    setDetailSlideIn(false)
    setNavMode('home')
    setTimeout(() => setDetailContentVisible(false), 750)
  }, [])

  const navigateOracle = useCallback((dir: -1 | 1) => {
    const ids: OracleId[] = [1, 2, 3]
    const idx = ids.indexOf(oracleId)
    const next = ids[(idx + dir + 3) % 3]
    setDetailContentVisible(false)
    setTimeout(() => {
      setOracleId(next)
      setDetailContentVisible(true)
    }, 300)
  }, [oracleId])

  const scrollDetailTop = useCallback(() => {
    document.querySelector('.view-detail')?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleStartFortune = useCallback((id?: OracleId) => {
    if (isLoggedIn) {
      router.push(id ? `/fortune/${id}` : '/fortune')
    } else {
      const redirect = id ? `/fortune/${id}` : '/fortune'
      router.push(`/auth/login?redirect=${redirect}`)
    }
  }, [isLoggedIn, router])

  return (
    <>
      <LoadingScreen onComplete={handleLoadingComplete} />
      <Nav mode={navMode} ready={navReady} onHome={goHome} />
      <HomeView
        slideUp={homeSlideUp}
        animated={homeAnimated}
        onOpenOracle={openOracle}
        onStartFortune={handleStartFortune}
      />
      <DetailView
        slideIn={detailSlideIn}
        contentVisible={detailContentVisible}
        oracleId={oracleId}
        onNavigate={navigateOracle}
        onScrollTop={scrollDetailTop}
        onStartFortune={handleStartFortune}
      />
    </>
  )
}
