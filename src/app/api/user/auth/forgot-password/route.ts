import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${token}`

    // TODO: Send email with resetUrl using your email service (Resend, Nodemailer, etc.)
    // Example: await resend.emails.send({ to: email, subject: 'รีเซ็ตรหัสผ่าน', html: `...` })

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Password reset link for ${email}:\n${resetUrl}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
