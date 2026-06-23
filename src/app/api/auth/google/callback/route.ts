import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccessToken, generateRefreshToken, refreshTokenExpiresAt } from '@/lib/jwt'
import { grantDailyLoginBonus } from '@/lib/daily-bonus'
import { grantSignupBonus } from '@/lib/signup-bonus'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = req.cookies.get('oauth_state')?.value

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_failed`)
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_failed`)
    }

    // Get user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json()

    if (!profile.email) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=no_email`)
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: profile.email } })
    let isNewUser = false

    if (!user) {
      isNewUser = true
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name ?? null,
          image: profile.picture ?? null,
          provider: 'google',
          credits: 0,
        },
      })
      await grantSignupBonus(user.id)
      user = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    } else {
      // Link existing email user to Google (update image if missing)
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          image: user.image ?? profile.picture ?? null,
          provider: user.provider === 'email' ? 'email' : user.provider,
        },
      })
    }

    // Issue JWT tokens
    const accessToken = await signAccessToken({ userId: user.id, role: user.role })
    const refreshToken = generateRefreshToken()
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: refreshTokenExpiresAt() },
    })

    // New users skip daily bonus on first login — signup bonus is separate.
    const bonus = isNewUser
      ? { granted: false, amount: 0 }
      : await grantDailyLoginBonus(user.id)

    const dashboardUrl = new URL('/dashboard', appUrl)
    if (bonus.granted) {
      dashboardUrl.searchParams.set('bonus', '1')
      dashboardUrl.searchParams.set('bonus_amount', String(bonus.amount))
    }

    const res = NextResponse.redirect(dashboardUrl)
    res.cookies.delete('oauth_state')
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
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_failed`)
  }
}
