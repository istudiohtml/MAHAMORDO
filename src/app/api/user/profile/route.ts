import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/user-auth'

export async function PATCH(req: NextRequest) {
  const payload = await getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { firstName, lastName, birthDate, birthTime, birthPlace } = await req.json()

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      name: [firstName, lastName].filter(Boolean).join(' ') || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      birthTime: birthTime ?? null,
      birthPlace: birthPlace ?? null,
    },
    select: { id: true, email: true, name: true, firstName: true, lastName: true, birthDate: true, birthTime: true, birthPlace: true, credits: true },
  })

  return NextResponse.json({ user })
}
