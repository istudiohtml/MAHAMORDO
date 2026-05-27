import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/user-auth'
import { CURRENT_POLICY_VERSION } from '@/lib/pdpa'

/**
 * Record the visitor's PDPA consent. Anonymous visitors are accepted
 * silently (the banner stores everything in localStorage already);
 * logged-in users get their preferences persisted to the User row so
 * we have a tamper-evident record per PDPA accountability principle.
 */
export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req)
  if (!payload) {
    // Guest user — we still return ok so the banner can dismiss itself.
    return NextResponse.json({ ok: true, persisted: false })
  }

  let body: { version?: string; marketing?: boolean } = {}
  try {
    body = await req.json()
  } catch {
    // empty body is fine — we use defaults
  }

  const version = body.version || CURRENT_POLICY_VERSION
  const marketing = Boolean(body.marketing)

  await prisma.user.update({
    where: { id: payload.userId },
    data: {
      consentVersion: version,
      consentAcceptedAt: new Date(),
      marketingConsent: marketing,
    },
  })

  return NextResponse.json({ ok: true, persisted: true, version })
}

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req)
  if (!payload) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      consentVersion: true,
      consentAcceptedAt: true,
      marketingConsent: true,
    },
  })
  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }
  return NextResponse.json({
    consentVersion: user.consentVersion,
    consentAcceptedAt: user.consentAcceptedAt,
    marketingConsent: user.marketingConsent,
    currentVersion: CURRENT_POLICY_VERSION,
    needsRefresh:
      !user.consentVersion || user.consentVersion !== CURRENT_POLICY_VERSION,
  })
}
