'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_ORACLE_IDS, OracleId, oracles } from '@/data/oracles'
import { useActiveOracleIds } from '@/hooks/useActiveOracleIds'
import LoadingScreen from '@/components/landing/LoadingScreen'
import Nav, { NavMode } from '@/components/landing/Nav'
import HomeView from '@/components/landing/HomeView'
import DetailView from '@/components/landing/DetailView'
import ConfirmModal from '@/components/landing/ConfirmModal'

export default function HomeClient() {
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
  const { ids: activeIds, loaded: activeLoaded } = useActiveOracleIds()
  // Fall back to all oracles until the active list arrives, then track DB.
  const visibleIds = useMemo<OracleId[]>(
    () => (activeLoaded ? activeIds : ALL_ORACLE_IDS),
    [activeIds, activeLoaded]
  )

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
    if (visibleIds.length === 0) return
    const idx = visibleIds.indexOf(oracleId)
    // If the current oracle was just disabled, jump to the first available.
    const baseIdx = idx === -1 ? 0 : idx
    const next = visibleIds[(baseIdx + dir + visibleIds.length) % visibleIds.length]
    setDetailContentVisible(false)
    setTimeout(() => {
      setOracleId(next)
      setDetailContentVisible(true)
    }, 300)
  }, [oracleId, visibleIds])

  const scrollDetailTop = useCallback(() => {
    document.querySelector('.view-detail')?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleStartFortune = useCallback((id?: OracleId) => {
    // Block opening a session for an oracle that's been disabled in CMS.
    if (id && !visibleIds.includes(id)) return
    if (isLoggedIn) {
      setConfirmModal({ open: true, targetId: id ?? undefined })
    } else {
      const redirect = id ? `/fortune/${id}` : '/fortune'
      router.push(`/auth/login?redirect=${redirect}`)
    }
  }, [isLoggedIn, router, visibleIds])

  // Keep the detail view focused on a still-active oracle.
  useEffect(() => {
    if (!activeLoaded || visibleIds.length === 0) return
    if (!visibleIds.includes(oracleId)) {
      setOracleId(visibleIds[0])
    }
  }, [activeLoaded, visibleIds, oracleId])

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
        activeIds={visibleIds}
      />
      <DetailView
        slideIn={detailSlideIn}
        contentVisible={detailContentVisible}
        oracleId={oracleId}
        onNavigate={navigateOracle}
        onScrollTop={scrollDetailTop}
        onStartFortune={handleStartFortune}
        activeIds={visibleIds}
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
