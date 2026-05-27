import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

/**
 * Load an existing FortuneSession for the authenticated user so the chat page
 * can resume the conversation instead of starting a new one.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await verifyAccessToken(token);
  if (!payload?.userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { id } = await params;

  const session = await prisma.fortuneSession.findUnique({
    where: { id },
    include: {
      oracle: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session || session.userId !== payload.userId) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Check expiry (24h auto-expire) so the client can decide to start fresh.
  const now = new Date();
  const isExpired = session.expiresAt && session.expiresAt < now;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { firstName: true, name: true, credits: true },
  });
  const userName = user?.firstName || user?.name || "ผู้ถาม";

  return NextResponse.json({
    sessionId: session.id,
    oracleSlug: session.oracle.slug,
    oracleName: session.oracle.name,
    isExpired,
    status: session.status,
    creditCharged: session.creditCharged,
    creditCost: session.oracle.creditCost,
    userName,
    credits: user?.credits ?? 0,
    topic: session.topic,
    messages: session.messages,
  });
}
