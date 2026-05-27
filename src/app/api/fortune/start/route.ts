import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    // Auth
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const userId = payload.userId

    // Body
    const { oracleSlug } = await req.json()
    if (!oracleSlug) {
      return NextResponse.json({ error: 'oracleSlug required' }, { status: 400 })
    }

    // Find oracle in DB by slug
    const oracle = await prisma.oracle.findUnique({
      where: { slug: oracleSlug },
    })
    if (!oracle || !oracle.isActive) {
      return NextResponse.json({ error: 'Oracle not found' }, { status: 404 })
    }

    // Get user credits + subscription + name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const hasActiveSubscription =
      user.subscriptionPlan !== 'NONE' &&
      user.subscriptionExpiresAt !== null &&
      user.subscriptionExpiresAt > now

    // Reject up front if user clearly can't afford a reading — but DO NOT
    // deduct here. Charging happens in /api/fortune on the first oracle reply.
    if (!hasActiveSubscription && user.credits < oracle.creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    const sessionExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

    const session = await prisma.fortuneSession.create({
      data: {
        userId,
        oracleId: oracle.id,
        status: 'ACTIVE',
        expiresAt: sessionExpiresAt,
        // Subscription users get this set immediately so /api/fortune skips
        // the charge step. Pay-as-you-go users get charged on first reply.
        creditCharged: hasActiveSubscription,
      },
    })

    // Get user's name for greeting
    const userName = user.firstName || user.name || 'ผู้ถาม'

    return NextResponse.json({
      sessionId: session.id,
      oracleDbId: oracle.id,
      credits: user.credits, // unchanged — we didn't deduct
      userName,
      initialGreeting: oracle.initialGreeting,
      creditCost: oracle.creditCost,
      hasActiveSubscription,
    })
  } catch (error) {
    console.error('Fortune start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
