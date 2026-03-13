import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import { signAccessToken, generateRefreshToken, refreshTokenExpiresAt } from '@/lib/jwt'

const registerLimiter = rateLimit(5, 60 * 60 * 1000) // 5 attempts per hour

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีอักษรใหญ่อย่างน้อย 1 ตัว' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีอักษรเล็กอย่างน้อย 1 ตัว' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' }
  }
  return { valid: true }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = registerLimiter(req)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: 'Too many registration attempts, please try again later' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name ?? null, role: 'USER', credits: 3 },
    })

    // credit log สำหรับ signup bonus
    await prisma.creditLog.create({
      data: { userId: user.id, amount: 3, reason: 'signup_bonus' },
    })

    const accessToken = await signAccessToken({ userId: user.id, role: user.role })
    const refreshToken = generateRefreshToken()
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: refreshTokenExpiresAt() },
    })

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits },
      accessToken,
    })

    res.cookies.set('user_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    res.cookies.set('user_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return res
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
