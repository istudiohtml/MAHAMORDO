import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia',
})

const CREDIT_PACKAGES = {
  5: { credits: 5, priceThb: 49 },
  15: { credits: 15, priceThb: 129 },
  30: { credits: 30, priceThb: 239 },
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
    const pkg = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]
    if (!pkg) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create payment record with PENDING status
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        stripeSessionId: 'temp', // will update after session creation
        status: 'PENDING',
        amount: pkg.priceThb * 100, // convert baht to satang
        credits: pkg.credits,
      },
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `${pkg.credits} Credits`,
              description: `Purchase ${pkg.credits} credits for MAHAMORDO Fortune Telling`,
            },
            unit_amount: pkg.priceThb * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/credits?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/credits?payment=cancelled`,
      customer_email: user.email || undefined,
      metadata: {
        paymentId: payment.id,
        userId: user.id,
        credits: pkg.credits.toString(),
      },
    })

    // Update payment record with real Stripe session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
