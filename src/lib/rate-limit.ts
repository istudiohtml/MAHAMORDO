import { NextRequest } from 'next/server'

// Simple in-memory rate limiter (use Redis in production)
const limits = new Map<string, { count: number; resetAt: number }>()

function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
  return ip
}

export function rateLimit(
  maxRequests: number,
  windowMs: number,
) {
  return (req: NextRequest): { limited: boolean; retryAfter?: number } => {
    const clientId = getClientId(req)
    const now = Date.now()
    const record = limits.get(clientId)

    if (!record) {
      limits.set(clientId, { count: 1, resetAt: now + windowMs })
      return { limited: false }
    }

    if (now > record.resetAt) {
      limits.set(clientId, { count: 1, resetAt: now + windowMs })
      return { limited: false }
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)
      return { limited: true, retryAfter }
    }

    record.count++
    return { limited: false }
  }
}
