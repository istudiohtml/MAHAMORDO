import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";
import { buildConversationText } from "@/lib/fortune-post-content";
import {
  fallbackShareSummary,
  generateShareSummary,
  TOPIC_LABELS,
} from "@/lib/fortune-share-summary";

type Body = {
  sessionId?: string;
  readingText?: string;
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await verifyAccessToken(token);
  if (!payload?.userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const session = await prisma.fortuneSession.findUnique({
    where: { id: sessionId },
    include: {
      oracle: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session || session.userId !== payload.userId) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const assistantMessages = session.messages.filter((m) => m.role === "ASSISTANT");
  const readingText = body.readingText?.trim();
  const hasReading =
    assistantMessages.length > 0 || Boolean(readingText);

  if (!hasReading) {
    return NextResponse.json(
      { error: "ยังไม่มีผลดูดวงให้แชร์" },
      { status: 400 }
    );
  }

  const conversation = buildConversationText(
    session.messages,
    session.oracle.name,
    session.topic,
    readingText
  );

  let summary;
  try {
    summary = await generateShareSummary(conversation);
  } catch (err) {
    console.error("[fortune/share] AI summary failed:", err);
    const source =
      readingText ||
      assistantMessages[assistantMessages.length - 1]?.content ||
      "";
    summary = fallbackShareSummary(source, session.oracle.name);
  }

  const topicLabel = session.topic
    ? TOPIC_LABELS[session.topic] ?? session.topic
    : null;

  return NextResponse.json({
    quoteLine: summary.quoteLine,
    summary: summary.summary,
    oracleName: session.oracle.name,
    oracleSlug: session.oracle.slug,
    topic: session.topic,
    topicLabel,
    shareText: buildShareText(
      summary.quoteLine,
      summary.summary,
      session.oracle.name
    ),
  });
}

function buildShareText(
  quoteLine: string,
  summary: string,
  oracleName: string
): string {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://mahamordo.com";
  return [
    `✦ ${quoteLine}`,
    "",
    summary,
    "",
    `— ${oracleName} · มาหาหมอดู`,
    site,
  ].join("\n");
}
