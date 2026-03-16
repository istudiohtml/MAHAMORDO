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

    // Get user credits + subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, subscriptionPlan: true, subscriptionExpiresAt: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const hasActiveSubscription =
      user.subscriptionPlan !== 'NONE' &&
      user.subscriptionExpiresAt !== null &&
      user.subscriptionExpiresAt > now

    // ถ้าไม่มี subscription ที่ยัง active → ใช้เครดิตตามเดิม
    if (!hasActiveSubscription && user.credits < oracle.creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // Create session + deduct credits in a transaction
    const sessionExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now

    const [session, updatedUser] = await prisma.$transaction([
      prisma.fortuneSession.create({
        data: {
          userId,
          oracleId: oracle.id,
          status: 'ACTIVE',
          expiresAt: sessionExpiresAt,
        },
      }),
      // ถ้ามี subscription ไม่ต้องหักเครดิต
      hasActiveSubscription
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true },
          })
        : prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: oracle.creditCost } },
            select: { credits: true },
          }),
    ])

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Log credit usage (เฉพาะกรณีใช้เครดิตจริง ๆ)
    if (!hasActiveSubscription) {
      await prisma.creditLog.create({
        data: {
          userId,
          amount: -oracle.creditCost,
          reason: `session_start:${session.id}`,
        },
      })
    }

    return NextResponse.json({
      sessionId: session.id,
      oracleDbId: oracle.id,
      credits: updatedUser.credits,
    })
  } catch (error) {
    console.error('Fortune start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
