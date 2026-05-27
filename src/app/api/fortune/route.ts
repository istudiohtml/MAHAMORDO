import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { anthropic, CLAUDE_FAST_MODEL, MAX_TOKENS } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) {
      logger.error("No auth token provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    payload = await verifyAccessToken(token);
    if (!payload?.userId) {
      logger.error("Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { sessionId, message, userName } = await req.json();
    logger.info("Fortune request", payload.userId, { sessionId, messageLength: message?.length });

    if (!sessionId || !message) {
      logger.warn("Missing required params", payload.userId, { sessionId, message });
      return NextResponse.json({ error: "sessionId and message required" }, { status: 400 });
    }

    // โหลด session + history + oracle
    const session = await prisma.fortuneSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        oracle: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify session ownership
    if (session.userId !== payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check session expiry
    const now = new Date();
    if (session.expiresAt && session.expiresAt < now) {
      // Mark session as expired
      await prisma.fortuneSession.update({
        where: { id: sessionId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Session expired" }, { status: 410 });
    }

    // Charge credit on the FIRST oracle reply (not on session open).
    // Subscription users have creditCharged=true set at session create time
    // so they skip this block entirely.
    if (!session.creditCharged) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { credits: true },
      });
      if (!user || user.credits < session.oracle.creditCost) {
        return NextResponse.json(
          { error: "Insufficient credits" },
          { status: 402 }
        );
      }
      try {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: payload.userId },
            data: { credits: { decrement: session.oracle.creditCost } },
          }),
          prisma.fortuneSession.update({
            where: { id: sessionId },
            data: { creditCharged: true },
          }),
          prisma.creditLog.create({
            data: {
              userId: payload.userId,
              amount: -session.oracle.creditCost,
              reason: `session_reply:${sessionId}`,
            },
          }),
        ]);
      } catch (chargeErr) {
        logger.error("Credit charge failed", payload?.userId, {
          sessionId,
          error: chargeErr instanceof Error ? chargeErr.message : String(chargeErr),
        });
        return NextResponse.json(
          { error: "Failed to charge credit" },
          { status: 500 }
        );
      }
    }

    // บันทึก user message
    await prisma.message.create({
      data: { sessionId, role: "USER", content: message },
    });

    // สร้าง history สำหรับ Claude
    const history = session.messages.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));
    history.push({ role: "user", content: message });

    // E2E: skip Claude when mock flag is set (Playwright / CI)
    if (process.env.E2E_MOCK_AI === "true") {
      const reply = "คำทำนายทดสอบ E2E — โชคดีในเรื่องที่ถาม";
      await prisma.message.create({
        data: { sessionId, role: "ASSISTANT", content: reply },
      });
      return NextResponse.json({ reply });
    }

    // เรียก Claude ด้วย systemPrompt จาก DB + ชื่อผู้ใช้
    const userNameContext = userName ? `\n\nหมายเหตุ: ชื่อลูกค้าของท่านคือ "${userName}" ใช้ชื่อนี้เวลาทักทายและสังสรรค์สนทนา` : '';
    const systemPrompt = session.oracle.systemPrompt + userNameContext;

    const response = await anthropic.messages.create({
      model: CLAUDE_FAST_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: history,
    });

    const firstContent = response.content?.[0];
    if (!firstContent || firstContent.type !== "text") {
      logger.error("Invalid Claude response format", payload?.userId, { contentType: firstContent?.type });
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
    }
    const reply = firstContent.text;
    logger.debug("Claude response received", payload?.userId, { replyLength: reply.length });

    // บันทึก assistant message
    await prisma.message.create({
      data: { sessionId, role: "ASSISTANT", content: reply },
    });

    // Return the latest credit balance so the UI can refresh.
    const after = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { credits: true },
    });

    logger.info("Message saved to DB", payload?.userId, { sessionId });
    return NextResponse.json({ reply, credits: after?.credits });
  } catch (error) {
    logger.error("Fortune API error", payload?.userId, {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
