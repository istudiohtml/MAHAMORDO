import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/session — สร้าง session ใหม่
export async function POST(req: NextRequest) {
  try {
    const { userId, oracleId, topic, birthDate, birthTime } = await req.json();

    if (!userId || !oracleId) {
      return NextResponse.json({ error: "userId and oracleId required" }, { status: 400 });
    }

    // ตรวจสอบ oracle มีอยู่และ active
    const oracle = await prisma.oracle.findUnique({ where: { id: oracleId } });
    if (!oracle || !oracle.isActive) {
      return NextResponse.json({ error: "Oracle not found or inactive" }, { status: 404 });
    }

    // ตรวจสอบ credits + subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, subscriptionPlan: true, subscriptionExpiresAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const hasActiveSubscription =
      user.subscriptionPlan !== "NONE" &&
      user.subscriptionExpiresAt !== null &&
      user.subscriptionExpiresAt > now;

    if (!hasActiveSubscription && user.credits < oracle.creditCost) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
    }

    // หัก credit ตาม oracle.creditCost + สร้าง session (ถ้ามี subscription จะไม่หักเครดิต)
    const [session] = await prisma.$transaction([
      prisma.fortuneSession.create({
        data: { userId, oracleId, topic, birthDate: birthDate ? new Date(birthDate) : null, birthTime },
      }),
      hasActiveSubscription
        ? prisma.user.update({
            where: { id: userId },
            data: {},
          })
        : prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: oracle.creditCost } },
          }),
      hasActiveSubscription
        ? prisma.creditLog.create({
            data: { userId, amount: 0, reason: "session_start:subscription" },
          })
        : prisma.creditLog.create({
            data: { userId, amount: -oracle.creditCost, reason: "session_start" },
          }),
    ]);

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
