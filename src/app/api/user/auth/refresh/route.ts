import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccessToken, generateRefreshToken, refreshTokenExpiresAt } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    const oldRefresh = req.cookies.get('user_refresh')?.value
    if (!oldRefresh) return NextResponse.json({ error: 'no refresh token' }, { status: 401 })

    const stored = await prisma.refreshToken.findUnique({
      where: { token: oldRefresh },
      include: { user: true },
    })
    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json({ error: 'refresh token expired' }, { status: 401 })
    }

    // rotate tokens
    await prisma.refreshToken.delete({ where: { id: stored.id } })
    const newAccess = await signAccessToken({ userId: stored.user.id, role: stored.user.role })
    const newRefresh = generateRefreshToken()
    await prisma.refreshToken.create({
      data: { token: newRefresh, userId: stored.user.id, expiresAt: refreshTokenExpiresAt() },
    })

    const res = NextResponse.json({
      user: { id: stored.user.id, email: stored.user.email, name: stored.user.name, credits: stored.user.credits },
    })
    res.cookies.set('user_token', newAccess, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    })
    res.cookies.set('user_refresh', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch (error) {
    console.error('User refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
