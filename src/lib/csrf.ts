import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates CSRF for state-changing requests
 * Checks that request origin matches the server host
 */
export function validateCSRF(req: NextRequest): { valid: boolean; error?: string } {
  const method = req.method.toUpperCase()

  // Only validate for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { valid: true }
  }

  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')

  // Strict origin check
  if (origin) {
    try {
      const originUrl = new URL(origin)
      if (originUrl.host !== host) {
        return { valid: false, error: 'Invalid origin' }
      }
    } catch {
      return { valid: false, error: 'Invalid origin header' }
    }
  }

  // Referer check (fallback for older browsers)
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer)
      if (refererUrl.host !== host) {
        return { valid: false, error: 'Invalid referer' }
      }
    } catch {
      return { valid: false, error: 'Invalid referer header' }
    }
  }

  // At least one must be present for state-changing requests
  if (!origin && !referer) {
    return { valid: false, error: 'Missing origin/referer' }
  }

  return { valid: true }
}
