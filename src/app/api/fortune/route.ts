import { NextRequest, NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL, MAX_TOKENS } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json();

    if (!sessionId || !message) {
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

    // เรียก Claude ด้วย systemPrompt จาก DB
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: session.oracle.systemPrompt,
      messages: history,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";

    // บันทึก assistant message
    await prisma.message.create({
      data: { sessionId, role: "ASSISTANT", content: reply },
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Fortune API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
