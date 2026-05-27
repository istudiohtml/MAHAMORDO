import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/user-auth'
import { anonymiseUser } from '@/lib/user-deletion'

/**
 * PDPA "Right to Erasure".
 *
 * Two-step deletion to balance user safety with regulatory needs:
 *  1. POST  → mark `deletionRequestedAt` (soft request, recoverable)
 *  2. POST ?confirm=1 with body { password? } → anonymise data immediately
 *
 * We anonymise rather than hard delete so payment records remain auditable
 * for the 5-year statutory retention period (Thai accounting law).
 * Personal identifiers (email, name, birth data, OAuth ids) are wiped;
 * the row stays as a tombstone.
 */
export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req)
  if (!payload) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const confirm = url.searchParams.get('confirm') === '1'

  if (!confirm) {
    // Step 1 — mark request only.
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { deletionRequestedAt: new Date() },
      select: { deletionRequestedAt: true },
    })
    return NextResponse.json({
      ok: true,
      deletionRequestedAt: user.deletionRequestedAt,
      message:
        'บันทึกคำขอลบบัญชีแล้ว — กดยืนยันอีกครั้งเพื่อลบทันที หรือยกเลิกได้ใน 7 วัน',
    })
  }

  // Step 2 — anonymise the account using the shared helper.
  await anonymiseUser(payload.userId)

  // Best-effort: clear auth cookies so the client logs out.
  const res = NextResponse.json({ ok: true, deleted: true })
  res.cookies.delete('user_token')
  res.cookies.delete('user_refresh')
  return res
}

/**
 * Cancel a pending deletion request (only while it's still pending).
 */
export async function DELETE(req: NextRequest) {
  const payload = await getUserFromRequest(req)
  if (!payload) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  await prisma.user.update({
    where: { id: payload.userId },
    data: { deletionRequestedAt: null },
  })
  return NextResponse.json({ ok: true, cancelled: true })
}
