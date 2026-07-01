import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { todayBangkokDate } from "@/lib/format-date";
import {
  COIN_LABEL,
  generateCoinFlipReading,
  randomCoinOutcome,
  type CoinSide,
} from "@/lib/daily-coin-flip";
import { logger } from "@/lib/logger";

function isCoinSide(v: unknown): v is CoinSide {
  return v === "HEAD" || v === "TAIL";
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const today = todayBangkokDate();
    const flip = await prisma.dailyCoinFlip.findUnique({
      where: { userId_date: { userId: payload.userId, date: today } },
    });

    return NextResponse.json({ flip });
  } catch (error) {
    logger.error("Daily coin GET error", undefined, { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    userId = payload.userId;

    const body = await req.json().catch(() => ({}));
    const choice = body.choice;
    if (!isCoinSide(choice)) {
      return NextResponse.json(
        { error: "กรุณาเลือกหัวหรือก้อย" },
        { status: 400 }
      );
    }

    const today = todayBangkokDate();

    const existing = await prisma.dailyCoinFlip.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) {
      return NextResponse.json({ flip: existing, alreadyPlayed: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, name: true },
    });

    const outcome = randomCoinOutcome();
    const matched = choice === outcome;

    const reading = await generateCoinFlipReading({
      userChoice: choice,
      outcome,
      matched,
      userName: user?.firstName || user?.name,
    });

    const flip = await prisma.dailyCoinFlip.create({
      data: {
        userId,
        date: today,
        userChoice: choice,
        outcome,
        matched,
        headline: reading.headline,
        message: reading.message,
      },
    });

    logger.info("Daily coin flip", userId, {
      choice: COIN_LABEL[choice],
      outcome: COIN_LABEL[outcome],
      matched,
    });

    return NextResponse.json({ flip });
  } catch (error) {
    logger.error("Daily coin POST error", userId, { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
