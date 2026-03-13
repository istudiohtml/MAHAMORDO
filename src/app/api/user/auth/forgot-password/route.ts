import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success — don't reveal whether email exists
    if (!user || user.provider !== 'email' || !user.password) {
      return NextResponse.json({ ok: true })
    }

    // Delete old unused tokens
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id, usedAt: null },
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    })

    // Send reset email
    const emailResult = await sendPasswordResetEmail(email, token)

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      // Still return success to not reveal whether email service works
    }

    // Dev logging
    if (process.env.NODE_ENV !== 'production') {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${token}`
      console.log(`[DEV] Password reset link for ${email}:\n${resetUrl}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
