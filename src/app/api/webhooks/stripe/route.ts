import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia',
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

      const paymentId = session.metadata?.paymentId
      const userId = session.metadata?.userId
      const creditsStr = session.metadata?.credits
      const credits = creditsStr ? parseInt(creditsStr, 10) : 0

      if (!paymentId || !userId || !credits) {
        console.error('Missing metadata in Stripe session:', session.metadata)
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

    // Handle payment_intent.payment_failed event
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

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
