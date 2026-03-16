import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

const SUBSCRIPTION_PLANS = {
  monthly: { priceThb: 129, interval: 'month' as const },
  yearly: { priceThb: 999, interval: 'year' as const },
}

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

    const { packageId } = await req.json()
    const plan = SUBSCRIPTION_PLANS[packageId as keyof typeof SUBSCRIPTION_PLANS]
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    let user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, stripeCustomerId: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })
      stripeCustomerId = customer.id

      // Save Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      })
    }

    // Create Stripe checkout session for recurring payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `MAHAMORDO ${packageId === 'monthly' ? 'Monthly' : 'Yearly'} Membership`,
              description: `Unlimited credits - ${packageId === 'monthly' ? 'renews every month' : 'renews every year'}`,
            },
            unit_amount: plan.priceThb * 100,
            recurring: {
              interval: plan.interval,
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/credits?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/credits?payment=cancelled`,
      customer: stripeCustomerId,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planType: packageId,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Stripe subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
