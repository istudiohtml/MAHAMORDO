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

    // ตรวจสอบ credits
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.credits < oracle.creditCost) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
    }

    // หัก credit ตาม oracle.creditCost + สร้าง session
    const [session] = await prisma.$transaction([
      prisma.fortuneSession.create({
        data: { userId, oracleId, topic, birthDate: birthDate ? new Date(birthDate) : null, birthTime },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: oracle.creditCost } },
      }),
      prisma.creditLog.create({
        data: { userId, amount: -oracle.creditCost, reason: "session_start" },
      }),
    ]);

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
