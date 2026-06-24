import { anthropic, CLAUDE_FAST_MODEL } from "@/lib/anthropic";

export type ShareSummary = {
  quoteLine: string;
  summary: string;
};

const SHARE_SYSTEM = `You summarize a Thai fortune-telling chat for social sharing.
Return ONLY valid JSON (no markdown): {"quoteLine":"...","summary":"..."}
- quoteLine: ONE punchy Thai line as if the oracle is speaking directly (max 50 chars, no emoji, no hashtags)
- summary: 2-3 short Thai sentences summarizing the reading in a warm oracle voice; keep it shareable and uplifting
- No PII (full names, exact birth dates, addresses)
- Match the reading topic and tone; do not invent facts not in the conversation`;

export async function generateShareSummary(
  conversation: string
): Promise<ShareSummary> {
  if (process.env.E2E_MOCK_AI === "true") {
    return {
      quoteLine: "ดวงเปิดทางให้ความหวังใหม่",
      summary:
        "พลังจักรวาลส่งสัญญาณดีมาให้คุณ จงมั่นใจในตัวเองและก้าวไปข้างหน้าอย่างมั่นคง โอกาสดีกำลังมาเยือน",
    };
  }

  const response = await anthropic.messages.create({
    model: CLAUDE_FAST_MODEL,
    max_tokens: 400,
    system: SHARE_SYSTEM,
    messages: [{ role: "user", content: conversation }],
  });

  const block = response.content?.[0];
  if (!block || block.type !== "text") {
    throw new Error("Invalid Claude response for share summary");
  }

  const jsonMatch = block.text.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse share summary JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ShareSummary>;
  if (!parsed.quoteLine?.trim() || !parsed.summary?.trim()) {
    throw new Error("Incomplete share summary from Claude");
  }

  return {
    quoteLine: parsed.quoteLine.trim().slice(0, 50),
    summary: parsed.summary.trim().slice(0, 400),
  };
}

/** Rule-based fallback when AI is unavailable */
export function fallbackShareSummary(
  assistantText: string,
  oracleName: string
): ShareSummary {
  const cleaned = assistantText
    .replace(/^คุณ:\s*/m, "")
    .replace(/\n+/g, " ")
    .trim();
  const snippet = cleaned.slice(0, 220);
  const quoteSource = cleaned.split(/[。.!?]\s*/)[0] || cleaned;
  const quoteLine =
    quoteSource.slice(0, 50).trim() +
    (quoteSource.length > 50 ? "…" : "");

  return {
    quoteLine: quoteLine || `${oracleName} ส่งคำทำนายถึงคุณ`,
    summary: snippet || "คำทำนายจากหมอดู — เปิดใจรับพลังจักรวาล",
  };
}

export const TOPIC_LABELS: Record<string, string> = {
  love: "ความรัก",
  health: "สุขภาพ",
  career: "การงาน",
  finance: "การเงิน",
  family: "ครอบครัว",
  custom: "คำถามพิเศษ",
};
