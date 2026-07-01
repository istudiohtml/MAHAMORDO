import { anthropic, CLAUDE_FAST_MODEL } from "@/lib/anthropic";
import { COIN_LABEL, type CoinSide } from "@/lib/daily-coin-flip-shared";

export type { CoinSide } from "@/lib/daily-coin-flip-shared";
export { COIN_LABEL } from "@/lib/daily-coin-flip-shared";

export type CoinFlipReading = {
  headline: string;
  message: string;
};

const COIN_SYSTEM = `You interpret a Thai fortune coin flip (หัว/ก้อย).
Return ONLY valid JSON: {"headline":"...","message":"..."}
- If matched (user choice = coin outcome): headline affirms intuition; message MUST convey that what they are thinking about will come true — e.g. "สิ่งที่คุณกำลังคิดอยู่จะเป็นจริง" (vary wording naturally, stay warm and mystical)
- If not matched: gentle message that timing may not be right yet, or they should reconsider — do NOT say their thought will come true
- 2-3 Thai sentences max in message. No emoji, no hashtags.
- Speak as mystical advisor of มาหาหมอดู`;

export function randomCoinOutcome(): CoinSide {
  return Math.random() < 0.5 ? "HEAD" : "TAIL";
}

function fallbackReading(matched: boolean, choice: CoinSide): CoinFlipReading {
  if (matched) {
    return {
      headline: "เหรียญยืนยันแล้ว",
      message: `คุณเลือก${COIN_LABEL[choice]}และเหรียญตอบ${COIN_LABEL[choice]} — สิ่งที่คุณกำลังคิดอยู่จะเป็นจริง จงเชื่อมั่นในสัญชาตญาณของคุณและก้าวไปข้างหน้าอย่างมั่นใจ`,
    };
  }
  return {
    headline: "เหรียญบอกให้รอจังหวะ",
    message: `วันนี้คุณเลือก${COIN_LABEL[choice]}แต่เหรียญออกอีกด้าน — สิ่งที่คุณคิดอยู่อาจยังไม่ถึงเวลา ลองเปิดใจ รอจังหวะที่เหมาะสม แล้วค่อยตัดสินใจอีกครั้ง`,
  };
}

export async function generateCoinFlipReading(input: {
  userChoice: CoinSide;
  outcome: CoinSide;
  matched: boolean;
  userName?: string | null;
}): Promise<CoinFlipReading> {
  if (process.env.E2E_MOCK_AI === "true") {
    return fallbackReading(input.matched, input.userChoice);
  }

  const userPrompt = [
    input.userName ? `ชื่อ: ${input.userName}` : "",
    `ผู้ใช้เลือก: ${COIN_LABEL[input.userChoice]} (${input.userChoice})`,
    `ผลเหรียญ: ${COIN_LABEL[input.outcome]} (${input.outcome})`,
    input.matched ? "ผล: ตรงกับที่เลือก (matched)" : "ผล: ไม่ตรงกับที่เลือก",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_FAST_MODEL,
      max_tokens: 300,
      system: COIN_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content?.[0];
    if (!block || block.type !== "text") {
      return fallbackReading(input.matched, input.userChoice);
    }

    const jsonMatch = block.text.trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackReading(input.matched, input.userChoice);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<CoinFlipReading>;
    if (!parsed.headline?.trim() || !parsed.message?.trim()) {
      return fallbackReading(input.matched, input.userChoice);
    }

    return {
      headline: parsed.headline.trim().slice(0, 200),
      message: parsed.message.trim().slice(0, 800),
    };
  } catch {
    return fallbackReading(input.matched, input.userChoice);
  }
}
