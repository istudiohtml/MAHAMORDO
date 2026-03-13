import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signAccessToken, generateRefreshToken, refreshTokenExpiresAt } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'token and password required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    }

    const reset = await prisma.passwordReset.findUnique({ where: { token } })

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: 'ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุแล้ว' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      prisma.refreshToken.deleteMany({ where: { userId: reset.userId } }),
    ])

    // Auto-login after reset
    const user = await prisma.user.findUnique({ where: { id: reset.userId } })
    const accessToken = await signAccessToken({ userId: user!.id, role: user!.role })
    const refreshToken = generateRefreshToken()
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user!.id, expiresAt: refreshTokenExpiresAt() },
    })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('user_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
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
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
