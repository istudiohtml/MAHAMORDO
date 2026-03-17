import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    payload = await verifyAccessToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { sessionId, content, role, topic } = await req.json();
    if (!sessionId || !content || !role) {
      return NextResponse.json(
        { error: "sessionId, content, and role required" },
        { status: 400 }
      );
    }

    // Verify session ownership
    const session = await prisma.fortuneSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session || session.userId !== payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Save message
    const message = await prisma.message.create({
      data: { sessionId, role, content },
    });

    // Update session topic if provided
    if (topic) {
      await prisma.fortuneSession.update({
        where: { id: sessionId },
        data: { topic },
      });
    }

    logger.info("Message saved", payload.userId, { sessionId, contentLength: content.length, topic });
    return NextResponse.json({ message });
  } catch (error) {
    logger.error("Message save error", payload?.userId, {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
