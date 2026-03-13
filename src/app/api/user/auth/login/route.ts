import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { validateCSRF } from '@/lib/csrf'
import bcrypt from 'bcryptjs'
import { signAccessToken, generateRefreshToken, refreshTokenExpiresAt } from '@/lib/jwt'

const loginLimiter = rateLimit(10, 15 * 60 * 1000) // 10 attempts per 15 minutes

export async function POST(req: NextRequest) {
  try {
    // CSRF validation
    const csrfCheck = validateCSRF(req)
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error || 'Invalid request' }, { status: 403 })
    }

    // Rate limiting
    const rateLimitResult = loginLimiter(req)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: 'Too many login attempts, please try again later' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }
    if (!user.password) {
      return NextResponse.json({ error: 'บัญชีนี้ไม่สามารถเข้าสู่ระบบด้วยรหัสผ่านได้ กรุณาลองวิธีเข้าสู่ระบบอื่น' }, { status: 401 })
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
