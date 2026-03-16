import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature || !webhookSecret) {
      console.warn('Missing Stripe signature or webhook secret')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // For one-time purchases (mode: payment)
      if (session.mode === 'payment') {
        const paymentId = session.metadata?.paymentId
        const userId = session.metadata?.userId
        const creditsStr = session.metadata?.credits
        const credits = creditsStr ? parseInt(creditsStr, 10) : 0

        console.log('checkout.session.completed (one-time):', {
          paymentId,
          userId,
          creditsStr,
          credits,
        })

        if (!paymentId || !userId || !credits) {
          console.error('Missing metadata in one-time session:', session.metadata)
          return NextResponse.json(
            { error: 'Missing metadata' },
            { status: 400 }
          )
        }

        // Update payment record
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'SUCCEEDED',
            stripePaymentId: session.payment_intent as string,
            completedAt: new Date(),
          },
        })

        // Add credits to user
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: credits } },
        })

        // Log the credit transaction
        await prisma.creditLog.create({
          data: {
            userId,
            amount: credits,
            reason: `purchase_stripe_${paymentId}`,
          },
        })

        console.log(
          `Payment ${paymentId} succeeded. Added ${credits} credits to user ${userId}`
        )
      }
      // For subscriptions (mode: subscription), subscription webhook will handle it
      else if (session.mode === 'subscription') {
        console.log('checkout.session.completed (subscription) - handled by subscription webhook')
      }
    }

    // Handle charge.failed event
    if (event.type === 'charge.failed') {
      const charge = event.data.object as Stripe.Charge
      const sessionId = charge.payment_intent as string

      // Find payment by stripePaymentId
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: sessionId },
      })

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        })
        console.log(`Payment ${payment.id} failed`)
      }
    }

    // Handle customer.subscription.created
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any
      const stripeCustomerId = subscription.customer

      console.log('customer.subscription.created:', {
        id: subscription.id,
        customer: stripeCustomerId,
        client_reference_id: subscription.client_reference_id,
        metadata: subscription.metadata,
        current_period_end: subscription.current_period_end,
        status: subscription.status,
      })

      // Lookup userId by Stripe customer ID
      let userId: string | undefined
      if (stripeCustomerId) {
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId },
          select: { id: true },
        })
        userId = user?.id
      }

      if (!userId) {
        console.warn('Could not find userId for subscription:', {
          stripeCustomerId,
          id: subscription.id,
        })
        return NextResponse.json({ error: 'User not found' }, { status: 400 })
      }

      // Determine plan type from items.data[0].plan.interval
      const interval = subscription.items?.data?.[0]?.plan?.interval
      const planType = interval === 'year' ? 'yearly' : 'monthly'

      if (!['monthly', 'yearly'].includes(planType)) {
        console.warn('Invalid planType from subscription:', planType)
        return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
      }

      // Calculate expiration date from billing cycle
      let expiresAt: Date
      if (subscription.current_period_end) {
        // Use current_period_end if available
        expiresAt = new Date(subscription.current_period_end * 1000)
      } else if (subscription.billing_cycle_anchor) {
        // Calculate from billing cycle anchor
        expiresAt = new Date(subscription.billing_cycle_anchor * 1000)
        // Add 1 month or 1 year
        if (planType === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1)
        }
      } else {
        // Fallback: use current date + 1 month/year
        expiresAt = new Date()
        if (planType === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1)
        }
      }

      const subscriptionPlan = planType === 'yearly' ? 'YEARLY' : 'MONTHLY'

      console.log('Updating subscription for user:', {
        userId,
        planType,
        expiresAt: expiresAt.toISOString(),
      })

      // Update user subscription (don't set credits, UI checks subscriptionPlan)
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan,
          subscriptionExpiresAt: expiresAt,
        },
      })

      // Log subscription event
      await prisma.subscriptionLog.create({
        data: {
          userId,
          event: 'created',
          planType,
          expiresAt,
        },
      })

      // Also log to credit logs for compatibility
      await prisma.creditLog.create({
        data: {
          userId,
          amount: 0,
          reason: `subscription_${planType}_created`,
        },
      })

      console.log(`Subscription created for user ${userId}: ${planType}`)
    }

    // Handle customer.subscription.updated
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any

      // Try to get userId from customer ID
      let userId: string | undefined
      const stripeCustomerId = subscription.customer
      if (stripeCustomerId) {
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId },
          select: { id: true },
        })
        userId = user?.id
      }

      if (!userId) {
        console.warn('Could not find userId for subscription update:', stripeCustomerId)
        return NextResponse.json({ error: 'User not found' }, { status: 400 })
      }

      // If cancel_at_period_end is set, keep subscription active until period end
      // Only update the expiration date, don't change subscriptionPlan
      if (subscription.current_period_end) {
        const expiresAt = new Date(subscription.current_period_end * 1000)
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionExpiresAt: expiresAt },
        })

        if (subscription.cancel_at_period_end) {
          console.log(`Subscription scheduled for cancellation at period end for user ${userId}: expires ${expiresAt}`)
        } else {
          console.log(`Subscription updated for user ${userId}: expires ${expiresAt}`)
        }
      }
    }

    // Handle customer.subscription.deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      const userId = subscription.metadata?.userId

      if (!userId) {
        console.warn('Missing userId in subscription metadata:', subscription.metadata)
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      // Cancel subscription (don't reset credits, user keeps what they have)
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: 'NONE',
          subscriptionExpiresAt: null,
        },
      })

      // Log cancellation
      await prisma.creditLog.create({
        data: {
          userId,
          amount: 0,
          reason: 'subscription_cancelled',
        },
      })

      console.log(`Subscription cancelled for user ${userId}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
