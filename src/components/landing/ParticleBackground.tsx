'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  flickerSpeed: number
  flickerPhase: number
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    function createParticles() {
      if (!canvas) return
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 12000)
      const clamped = Math.min(Math.max(count, 20), 80)
      particlesRef.current = Array.from({ length: clamped }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.4 + 0.1,
        flickerSpeed: Math.random() * 0.02 + 0.005,
        flickerPhase: Math.random() * Math.PI * 2,
      }))
    }

    let time = 0

    function animate() {
      if (!canvas || !ctx) return
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.clearRect(0, 0, w, h)
      time += 1

      for (const p of particlesRef.current) {
        // Float upward
        p.y -= p.speed
        // Slight horizontal sway
        p.x += Math.sin(time * 0.01 + p.flickerPhase) * 0.15

        // Reset when off top
        if (p.y < -10) {
          p.y = h + 10
          p.x = Math.random() * w
        }
        // Wrap horizontal
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10

        // Flicker opacity
        const flicker = Math.sin(time * p.flickerSpeed + p.flickerPhase) * 0.5 + 0.5
        const alpha = p.opacity * (0.5 + flicker * 0.5)

        // Draw gold particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(184, 134, 11, ${alpha})`
        ctx.fill()

        // Add subtle glow for larger particles
        if (p.size > 1.2) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(184, 134, 11, ${alpha * 0.1})`
          ctx.fill()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    resize()
    createParticles()
    animate()

    window.addEventListener('resize', () => {
      resize()
      createParticles()
    })

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}
