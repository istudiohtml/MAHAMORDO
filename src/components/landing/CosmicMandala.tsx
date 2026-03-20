'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Atmospheric Renaissance Hero — Shopify Editions-inspired
 * Deep cinematic feel: floating dust in light, volumetric rays,
 * bokeh orbs, multi-depth parallax. Warm gold on dark atmosphere.
 */
export default function CosmicMandala() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // === SCENE ===
    const scene = new THREE.Scene()
    // Add subtle fog for depth
    scene.fog = new THREE.FogExp2(0x0a0806, 0.06)

    const w = container.offsetWidth
    const h = container.offsetHeight
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // === COLORS ===
    const warmGold = new THREE.Color(0xD4A017)
    const paleGold = new THREE.Color(0xF5DEB3)
    const deepAmber = new THREE.Color(0xB8860B)
    const softWhite = new THREE.Color(0xFFF8E7)

    // ═══════════════════════════════════════════════
    // 1. DUST PARTICLES — Like dust floating in light
    // ═══════════════════════════════════════════════
    // Three layers at different depths for parallax feel
    function createDustLayer(
      count: number,
      spread: { x: number; y: number; z: number },
      baseSize: number,
      opacity: number,
      color: THREE.Color,
      zOffset: number,
    ) {
      const geom = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      const alphas = new Float32Array(count)
      const driftSpeeds = new Float32Array(count)
      const driftPhases = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread.x
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z + zOffset
        alphas[i] = 0.3 + Math.random() * 0.7
        driftSpeeds[i] = 0.1 + Math.random() * 0.4
        driftPhases[i] = Math.random() * Math.PI * 2
      }

      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3))

      const mat = new THREE.PointsMaterial({
        color,
        size: baseSize,
        transparent: true,
        opacity,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const points = new THREE.Points(geom, mat)
      scene.add(points)

      return { points, geom, mat, pos, alphas, driftSpeeds, driftPhases, count }
    }

    // Far background dust — tiny, many, slow
    const farDust = createDustLayer(
      600, { x: 30, y: 20, z: 15 }, 0.04, 0.25, paleGold, -8
    )

    // Mid dust — medium, moderate
    const midDust = createDustLayer(
      300, { x: 20, y: 15, z: 8 }, 0.06, 0.35, warmGold, -2
    )

    // Near dust — larger, fewer, brighter (foreground bokeh feel)
    const nearDust = createDustLayer(
      80, { x: 15, y: 12, z: 5 }, 0.12, 0.4, softWhite, 3
    )

    const dustLayers = [farDust, midDust, nearDust]

    // ═══════════════════════════════════════════════
    // 2. BOKEH ORBS — Soft glowing spheres at depth
    // ═══════════════════════════════════════════════
    const bokehGroup = new THREE.Group()
    const bokehData: { mesh: THREE.Mesh; x: number; y: number; z: number; phase: number; speed: number }[] = []
    const bokehCount = 15

    for (let i = 0; i < bokehCount; i++) {
      const radius = 0.08 + Math.random() * 0.25
      const geom = new THREE.SphereGeometry(radius, 16, 16)
      const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? paleGold : warmGold,
        transparent: true,
        opacity: 0.03 + Math.random() * 0.05,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geom, mat)
      const x = (Math.random() - 0.5) * 18
      const y = (Math.random() - 0.5) * 14
      const z = (Math.random() - 0.5) * 10 - 2
      mesh.position.set(x, y, z)
      bokehGroup.add(mesh)
      bokehData.push({
        mesh, x, y, z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.3,
      })
    }
    scene.add(bokehGroup)

    // ═══════════════════════════════════════════════
    // 3. VOLUMETRIC LIGHT RAYS — Sweeping beams
    // ═══════════════════════════════════════════════
    const rayGroup = new THREE.Group()
    const rayData: { mesh: THREE.Mesh; baseOpacity: number; phase: number }[] = []

    // Main diagonal rays
    for (let i = 0; i < 5; i++) {
      const width = 0.3 + Math.random() * 0.8
      const height = 25
      const geom = new THREE.PlaneGeometry(width, height)
      const mat = new THREE.MeshBasicMaterial({
        color: paleGold,
        transparent: true,
        opacity: 0.012 + Math.random() * 0.008,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geom, mat)

      // Position rays coming from upper-right, sweeping across
      mesh.position.set(
        (i - 2) * 3 + (Math.random() - 0.5) * 2,
        2,
        -5 + Math.random() * 3
      )
      // Diagonal angle — like light through a cathedral window
      mesh.rotation.z = -0.4 + Math.random() * 0.15

      rayGroup.add(mesh)
      rayData.push({
        mesh,
        baseOpacity: mat.opacity,
        phase: Math.random() * Math.PI * 2,
      })
    }

    // Wider, softer background beams
    for (let i = 0; i < 3; i++) {
      const geom = new THREE.PlaneGeometry(2 + Math.random() * 2, 30)
      const mat = new THREE.MeshBasicMaterial({
        color: deepAmber,
        transparent: true,
        opacity: 0.006,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geom, mat)
      mesh.position.set((i - 1) * 5, 0, -8)
      mesh.rotation.z = -0.3 + i * 0.15
      rayGroup.add(mesh)
      rayData.push({
        mesh,
        baseOpacity: 0.006,
        phase: Math.random() * Math.PI * 2,
      })
    }
    scene.add(rayGroup)

    // ═══════════════════════════════════════════════
    // 4. ATMOSPHERIC GRADIENT ORB — Warm center glow
    // ═══════════════════════════════════════════════
    // Creates a warm atmospheric presence in the center
    const atmosGeom = new THREE.SphereGeometry(3, 32, 32)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: deepAmber,
      transparent: true,
      opacity: 0.025,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const atmos = new THREE.Mesh(atmosGeom, atmosMat)
    atmos.position.set(0, -0.5, -3)
    scene.add(atmos)

    // Larger, dimmer atmosphere
    const atmosOuter = new THREE.Mesh(
      new THREE.SphereGeometry(6, 32, 32),
      new THREE.MeshBasicMaterial({
        color: warmGold,
        transparent: true,
        opacity: 0.008,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    atmosOuter.position.set(1, 0, -6)
    scene.add(atmosOuter)

    // ═══════════════════════════════════════════════
    // 5. FLOATING EMBERS — Slow rising sparks
    // ═══════════════════════════════════════════════
    const emberCount = 40
    const emberGeom = new THREE.BufferGeometry()
    const ePos = new Float32Array(emberCount * 3)
    const eVel = new Float32Array(emberCount) // upward speed
    const ePhase = new Float32Array(emberCount)
    const eLife = new Float32Array(emberCount) // 0-1 lifecycle

    for (let i = 0; i < emberCount; i++) {
      ePos[i * 3] = (Math.random() - 0.5) * 14
      ePos[i * 3 + 1] = (Math.random() - 0.5) * 14
      ePos[i * 3 + 2] = (Math.random() - 0.5) * 6
      eVel[i] = 0.005 + Math.random() * 0.015
      ePhase[i] = Math.random() * Math.PI * 2
      eLife[i] = Math.random()
    }
    emberGeom.setAttribute('position', new THREE.BufferAttribute(ePos, 3))

    const emberMat = new THREE.PointsMaterial({
      color: 0xFFD700,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const embers = new THREE.Points(emberGeom, emberMat)
    scene.add(embers)

    // ═══════════════════════════════════════════════
    // 6. SUBTLE RING — Single elegant golden ring
    // ═══════════════════════════════════════════════
    const ringGeom = new THREE.TorusGeometry(4.5, 0.005, 8, 200)
    const ringMat = new THREE.MeshBasicMaterial({
      color: warmGold,
      transparent: true,
      opacity: 0.06,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.rotation.x = Math.PI * 0.55
    ring.position.z = -2
    scene.add(ring)

    // Second ring — offset
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(5.5, 0.003, 8, 200),
      new THREE.MeshBasicMaterial({
        color: deepAmber,
        transparent: true,
        opacity: 0.03,
      })
    )
    ring2.rotation.x = Math.PI * 0.48
    ring2.rotation.y = 0.2
    ring2.position.z = -4
    scene.add(ring2)

    // ═══════════════════════════════════════════════
    // MOUSE PARALLAX
    // ═══════════════════════════════════════════════
    let mx = 0, my = 0, tmx = 0, tmy = 0

    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect()
      tmx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      tmy = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    container.addEventListener('mousemove', onMouseMove)

    // ═══════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════
    let animId = 0
    const clock = new THREE.Clock()

    function animate() {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      const dt = clock.getDelta()

      // Smooth mouse
      mx += (tmx - mx) * 0.02
      my += (tmy - my) * 0.02

      // --- Dust layers drift ---
      dustLayers.forEach((layer, li) => {
        const arr = layer.geom.attributes.position.array as Float32Array
        const parallaxStrength = [0.03, 0.08, 0.15][li]

        for (let i = 0; i < layer.count; i++) {
          // Slow upward drift
          arr[i * 3 + 1] += layer.driftSpeeds[i] * 0.003
          // Gentle sway
          arr[i * 3] += Math.sin(t * 0.2 + layer.driftPhases[i]) * 0.001

          // Reset if drifted too far up
          const spread = [20, 15, 12][li]
          if (arr[i * 3 + 1] > spread / 2) {
            arr[i * 3 + 1] = -spread / 2
            arr[i * 3] = (Math.random() - 0.5) * [30, 20, 15][li]
          }
        }
        layer.geom.attributes.position.needsUpdate = true

        // Parallax per layer
        layer.points.position.x = mx * parallaxStrength * 2
        layer.points.position.y = -my * parallaxStrength * 1.5

        // Subtle opacity pulsing
        const pulse = Math.sin(t * (0.3 + li * 0.1)) * 0.1
        layer.mat.opacity = [0.25, 0.35, 0.4][li] * (1 + pulse)
      })

      // --- Bokeh orbs float ---
      bokehData.forEach((b) => {
        b.mesh.position.x = b.x + Math.sin(t * b.speed + b.phase) * 0.5
        b.mesh.position.y = b.y + Math.cos(t * b.speed * 0.7 + b.phase) * 0.4
        // Breathing scale
        const breathe = Math.sin(t * 0.4 + b.phase) * 0.15
        b.mesh.scale.setScalar(1 + breathe)
        // Fade in/out slowly
        const mat = b.mesh.material as THREE.MeshBasicMaterial
        mat.opacity = (0.03 + Math.sin(t * 0.2 + b.phase) * 0.02) * 1.2
      })

      // --- Light rays sweep ---
      rayData.forEach((r, i) => {
        // Very slow lateral drift
        r.mesh.position.x += Math.sin(t * 0.05 + r.phase) * 0.002
        // Opacity breathing
        const breath = Math.sin(t * 0.3 + r.phase) * 0.4 + 0.6
        const mat = r.mesh.material as THREE.MeshBasicMaterial
        mat.opacity = r.baseOpacity * breath
      })

      // --- Atmosphere pulse ---
      const atmosPulse = Math.sin(t * 0.2) * 0.5 + 0.5
      atmosMat.opacity = 0.02 + atmosPulse * 0.015
      atmos.scale.setScalar(1 + atmosPulse * 0.1)

      // --- Embers rise ---
      const eArr = emberGeom.attributes.position.array as Float32Array
      for (let i = 0; i < emberCount; i++) {
        eArr[i * 3 + 1] += eVel[i]
        eArr[i * 3] += Math.sin(t + ePhase[i]) * 0.003
        eLife[i] += 0.001

        // Reset when too high
        if (eArr[i * 3 + 1] > 8) {
          eArr[i * 3] = (Math.random() - 0.5) * 14
          eArr[i * 3 + 1] = -7
          eArr[i * 3 + 2] = (Math.random() - 0.5) * 6
          eLife[i] = 0
        }
      }
      emberGeom.attributes.position.needsUpdate = true

      // --- Ring slow rotation ---
      ring.rotation.z = t * 0.008
      ring2.rotation.z = -t * 0.005

      // --- Camera parallax (subtle, cinematic) ---
      camera.position.x = mx * 0.5
      camera.position.y = -my * 0.35
      camera.lookAt(0, 0, -2)

      renderer.render(scene, camera)
    }

    animate()

    // === RESIZE ===
    function onResize() {
      if (!container) return
      const w = container.offsetWidth
      const h = container.offsetHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // === CLEANUP ===
    cleanupRef.current = () => {
      cancelAnimationFrame(animId)
      container.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
      scene.clear()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }

    return () => { cleanupRef.current?.() }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    />
  )
}
