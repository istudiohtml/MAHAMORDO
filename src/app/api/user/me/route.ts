import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/user-auth'

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, firstName: true, lastName: true, birthDate: true, birthTime: true, birthPlace: true, credits: true, createdAt: true },
  })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  return NextResponse.json({ user })
}
