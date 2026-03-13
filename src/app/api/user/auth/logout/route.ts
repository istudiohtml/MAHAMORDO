import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('user_refresh')?.value
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('user_token')
  res.cookies.delete('user_refresh')
  return res
}
