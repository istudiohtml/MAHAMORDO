'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OracleId, oracles } from '@/data/oracles'
import LoadingScreen from '@/components/landing/LoadingScreen'
import Nav, { NavMode } from '@/components/landing/Nav'
import HomeView from '@/components/landing/HomeView'
import DetailView from '@/components/landing/DetailView'
import ConfirmModal from '@/components/landing/ConfirmModal'

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
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; targetId?: OracleId }>({ open: false })

  const handleLoadingComplete = useCallback((loggedIn: boolean) => {
    setIsLoggedIn(loggedIn)
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
      setConfirmModal({ open: true, targetId: id ?? undefined })
    } else {
      const redirect = id ? `/fortune/${id}` : '/fortune'
      router.push(`/auth/login?redirect=${redirect}`)
    }
  }, [isLoggedIn, router])

  const handleConfirm = useCallback(() => {
    const id = confirmModal.targetId
    setConfirmModal({ open: false })
    router.push(id ? `/fortune/${id}` : '/fortune')
  }, [confirmModal.targetId, router])

  const handleCancel = useCallback(() => {
    setConfirmModal({ open: false })
  }, [])

  return (
    <>
      <LoadingScreen onComplete={handleLoadingComplete} />
      <Nav mode={navMode} ready={navReady} onHome={goHome} isLoggedIn={isLoggedIn} />
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
      <ConfirmModal
        open={confirmModal.open}
        oracleName={confirmModal.targetId ? oracles[confirmModal.targetId].name : undefined}
        creditCost={confirmModal.targetId ? oracles[confirmModal.targetId].creditCost : 1}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
