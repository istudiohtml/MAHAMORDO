import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = await verifyAccessToken(token)
    if (!payload?.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { userId } = await req.json()

    // Verify user owns this subscription
    if (userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.subscriptionPlan === 'NONE') {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      )
    }

    // Find Stripe subscription by searching for active subscriptions
    // Note: In production, you should store stripeCustomerId in User table for direct lookup
    try {
      const subscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
      })

      const userSubscription = subscriptions.data.find(
        (sub) => (sub.metadata?.userId === userId)
      )

      if (userSubscription) {
        // Cancel Stripe subscription at end of billing period
        await stripe.subscriptions.update(userSubscription.id, {
          cancel_at_period_end: true,
        })

        console.log(`Subscription scheduled to cancel at period end for user ${userId}: ${userSubscription.id}`)
      }
    } catch (stripeError) {
      console.warn('Could not find Stripe subscription:', stripeError)
      // Continue anyway - webhook or manual cancellation may have handled it
    }

    // Log subscription cancellation request
    await prisma.subscriptionLog.create({
      data: {
        userId,
        event: 'cancel_requested',
        planType: user.subscriptionPlan || undefined,
        expiresAt: user.subscriptionExpiresAt || undefined,
        reason: 'user_requested',
      },
    })

    // Also log to credit logs
    await prisma.creditLog.create({
      data: {
        userId,
        amount: 0,
        reason: 'subscription_cancelled_by_user',
      },
    })

    console.log(`User ${userId} requested subscription cancellation at period end`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
