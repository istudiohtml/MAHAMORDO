import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/user-auth'

/**
 * PDPA "Right of Access" — return all personal data we hold for the
 * authenticated user as a JSON download. Excludes hashed passwords and
 * Stripe customer IDs (we keep the latter for billing reconciliation).
 */
export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req)
  if (!payload) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      birthTime: true,
      birthPlace: true,
      provider: true,
      image: true,
      role: true,
      credits: true,
      userPlan: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      consentVersion: true,
      consentAcceptedAt: true,
      marketingConsent: true,
      createdAt: true,
      updatedAt: true,
      sessions: {
        select: {
          id: true,
          oracleId: true,
          topic: true,
          status: true,
          createdAt: true,
          messages: {
            select: { role: true, content: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      creditLogs: {
        select: { amount: true, reason: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      payments: {
        select: {
          id: true,
          status: true,
          amount: true,
          credits: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      subscriptionLogs: {
        select: {
          event: true,
          planType: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  // Mark export request timestamp (audit trail).
  await prisma.user.update({
    where: { id: payload.userId },
    data: { dataExportRequestedAt: new Date() },
  })

  const payload_out = {
    exportedAt: new Date().toISOString(),
    notice:
      'ข้อมูลส่วนบุคคลของท่านตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
    user,
  }

  return new NextResponse(JSON.stringify(payload_out, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mahamordo-data-${user.id}.json"`,
    },
  })
}
