import { anthropic, CLAUDE_FAST_MODEL } from "@/lib/anthropic";
import {
  buildContextualQuoteFallback,
  isQuoteCardStyle,
  type ComposerPayload,
} from "@/data/post-composer";

export type PostDraft = {
  title: string;
  caption: string;
  imagePrompt: string;
  quoteLine?: string;
};

export type ComposerContext = {
  zodiacLabel: string;
  traditionLabel: string;
  traditionHint: string;
  timeLabel: string;
  focusLabel: string;
  platformLabel: string;
  stylePrompt: string;
  styleLabel: string;
  isQuoteCard: boolean;
};

const SUMMARY_SYSTEM = `You create shareable fortune-reading posts for a Thai mystic app.
Return ONLY valid JSON (no markdown) with keys:
- title: short catchy Thai title (max 40 chars)
- caption: Thai post body summarizing the reading (2-4 sentences, warm tone, no PII like full birth dates or exact addresses)
- imagePrompt: English DALL-E prompt for a mystical fortune card illustration matching the reading mood (ornate, cinematic, no text/letters/watermarks in image)`;

const FOCUS_CONTENT_HINTS: Record<string, string> = {
  general: "ภาพรวมดวงชะตา โอกาสใหม่ จังหวะชีวิต",
  love: "ความรัก ความสัมพันธ์ หัวใจ คู่ครอง",
  career: "การงาน อาชีพ ความก้าวหน้า โอกาสในที่ทำงาน",
  finance: "การเงิน โชคลาภ รายได้ ความมั่งคั่ง",
  health: "สุขภาพ ดูแลร่างกาย สุขภาพแข็งแรง ระวังสุขภาพ — ห้ามพูดเรื่องเงินทอง/โชคลาภ",
};

const FOCUS_IMAGE_HINTS: Record<string, string> = {
  general: "cosmic balance, mystical harmony, zodiac symbols",
  love: "romantic roses, heart motifs, soft pink and gold aura",
  career: "mountain peak, compass, rising sun, path to success",
  finance: "golden prosperity, coins, abundance symbols",
  health:
    "wellness, healing light, serene nature, herbal symbols, soft green and gold — NO coins or money motifs",
};

const THAI_STYLE_RULES = `- Use natural spoken Thai; avoid awkward compounds (e.g. NOT "วิบากดี" — use "สุขภาพแข็งแรง", "ระวังสุขภาพ", "ดูแลตัวให้ดี")
- title, caption, and quoteLine MUST match the given focus area — do NOT mention money/luck/prosperity when focus is health, love, career, etc. unless that IS the focus
- imagePrompt MUST visually match focus + tradition + zodiac (see focus image hint in user message)`;

const COMPOSER_SYSTEM = `You write Thai horoscope social media posts for Mahamordo.
Return ONLY valid JSON: {"title":"...","caption":"...","imagePrompt":"..."}
- title: catchy Thai, max 40 chars, reflect focus area and zodiac (NOT generic luck if focus is health)
- caption: 2-3 warm Thai sentences for social caption, match focus area, no hashtags (added separately)
- imagePrompt: English DALL-E background prompt, no text in image, match focus + tradition + zodiac mood
${THAI_STYLE_RULES}`;

const QUOTE_CARD_COMPOSER_SYSTEM = `You write Thai horoscope QUOTE CARD posts for Mahamordo social marketing.
Return ONLY valid JSON: {"title":"...","caption":"...","imagePrompt":"...","quoteLine":"..."}
- quoteLine: ONE punchy Thai fortune quote ON the image (max 40 chars, scroll-stopping, no emoji, no hashtags)
  MUST weave in the given time period (วันนี้ / สัปดาห์นี้ / เดือนนี้ / ปีนี้), zodiac, AND focus area.
  For Chinese tradition use Thai animal names: ชวด ฉลู ขาล เถาะ มะโรง มะเส็ง มะเมีย มะแม วอก ระกา จอ กุน (often as ชาว___ e.g. ชาวไก่ for ระกา).
  Examples by focus:
  • finance + เดือนนี้ + ระกา: "เดือนชาวไก่มีโชคดี ปังปรุเย่"
  • health + ปีนี้ + กรกฎ: "ปีนี้กรกฎดูแลตัวดีจะสุข"
  • career + สัปดาห์นี้ + มะโรง: "สัปดาห์นี้มังกรฟาดฟ้า งานพุ่ง"
- title: catchy Thai, max 40 chars, echoes focus (not a verbatim copy of quoteLine)
- caption: 2-3 sentences Thai BELOW the image — expands quote with focus context, no hashtags
- imagePrompt: English DALL-E BACKGROUND ONLY — match focus visually, ornate frame edges, cinematic lighting, absolutely NO text/letters/numbers/watermarks (text added separately)
${THAI_STYLE_RULES}`;

export function buildConversationText(
  messages: Array<{ role: string; content: string }>,
  oracleName: string,
  topic: string | null,
  extraReading?: string
): string {
  const lines = [`Oracle: ${oracleName}`];
  if (topic) lines.push(`Topic: ${topic}`);
  lines.push("---");
  for (const m of messages) {
    if (m.role === "ASSISTANT" || m.role === "USER") {
      lines.push(`${m.role}: ${m.content}`);
    }
  }
  if (extraReading?.trim()) {
    lines.push("---");
    lines.push(`ASSISTANT (final reading): ${extraReading.trim()}`);
  }
  return lines.join("\n");
}

export async function generatePostDraft(
  conversation: string
): Promise<PostDraft> {
  if (process.env.E2E_MOCK_AI === "true") {
    return {
      title: "คำทำนายของคุณ",
      caption:
        "ดวงชะตาเปิดทางให้ความหวังใหม่ จงมั่นใจในตัวเองและก้าวไปข้างหน้าอย่างมั่นคง",
      imagePrompt:
        "mystical Thai fortune card art, golden oracle aura, tarot symbols, cinematic lighting, ornate frame, no text",
    };
  }

  const response = await anthropic.messages.create({
    model: CLAUDE_FAST_MODEL,
    max_tokens: 600,
    system: SUMMARY_SYSTEM,
    messages: [{ role: "user", content: conversation }],
  });

  const block = response.content?.[0];
  if (!block || block.type !== "text") {
    throw new Error("Invalid Claude response for post draft");
  }

  const raw = block.text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse post draft JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<PostDraft>;
  if (!parsed.title || !parsed.caption || !parsed.imagePrompt) {
    throw new Error("Incomplete post draft from Claude");
  }

  return {
    title: parsed.title.slice(0, 80),
    caption: parsed.caption.slice(0, 2000),
    imagePrompt: parsed.imagePrompt.slice(0, 1000),
    quoteLine: parsed.quoteLine?.slice(0, 45),
  };
}

export async function generatePostDraftFromComposer(
  ctx: ComposerContext,
  payload: ComposerPayload
): Promise<PostDraft> {
  const focusContentHint =
    FOCUS_CONTENT_HINTS[payload.focus] ?? FOCUS_CONTENT_HINTS.general;
  const focusImageHint =
    FOCUS_IMAGE_HINTS[payload.focus] ?? FOCUS_IMAGE_HINTS.general;

  const userPrompt = [
    `แนวโหราศาสตร์: ${ctx.traditionLabel}`,
    `ราศี: ${ctx.zodiacLabel} (id: ${payload.zodiac})`,
    `ช่วงเวลา: ${ctx.timeLabel} (id: ${payload.timePeriod})`,
    `ด้าน (focus): ${ctx.focusLabel} — เนื้อหา คำคม และภาพต้องสอดคล้องด้านนี้เท่านั้น`,
    `แนวเนื้อหา: ${focusContentHint}`,
    `แนวภาพพื้นหลัง: ${focusImageHint}`,
    `แพลตฟอร์ม: ${ctx.platformLabel}`,
    `สไตล์ภาพ: ${ctx.styleLabel}`,
    ctx.isQuoteCard
      ? [
          "รูปแบบ: การ์ดคำคม (ข้อความบนรูป + แคปชันด้านล่าง)",
          `quoteLine ต้องอ้าง "${ctx.timeLabel}", ราศี/นักษัตร "${ctx.zodiacLabel}", และด้าน "${ctx.focusLabel}" ให้ตรงบริบท`,
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (process.env.E2E_MOCK_AI === "true") {
    if (ctx.isQuoteCard) {
      const quoteLine = buildContextualQuoteFallback(
        payload.tradition,
        payload.zodiac,
        payload.timePeriod,
        ctx.zodiacLabel,
        ctx.timeLabel
      );
      return {
        title: `ดวง${ctx.timeLabel} ราศี${ctx.zodiacLabel}`,
        quoteLine,
        caption: `พลังจักรวาลส่งสัญญาณดีในด้าน${ctx.focusLabel} จงเปิดใจรับโอกาสใหม่`,
        imagePrompt: `${ctx.stylePrompt}, ${ctx.traditionHint}, zodiac ${ctx.zodiacLabel}, ${FOCUS_IMAGE_HINTS[payload.focus] ?? FOCUS_IMAGE_HINTS.general}, ornate mystical background, no text`,
      };
    }
    return {
      title: `ดวง${ctx.timeLabel} ราศี${ctx.zodiacLabel}`,
      caption: `พลังจักรวาลส่งสัญญาณดีในด้าน${ctx.focusLabel} จงเปิดใจรับโอกาสใหม่`,
      imagePrompt: `${ctx.stylePrompt}, ${ctx.traditionHint}, zodiac ${ctx.zodiacLabel}, ${FOCUS_IMAGE_HINTS[payload.focus] ?? FOCUS_IMAGE_HINTS.general}, no text`,
    };
  }

  const system = ctx.isQuoteCard ? QUOTE_CARD_COMPOSER_SYSTEM : COMPOSER_SYSTEM;

  const response = await anthropic.messages.create({
    model: CLAUDE_FAST_MODEL,
    max_tokens: ctx.isQuoteCard ? 800 : 700,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content?.[0];
  if (!block || block.type !== "text") {
    throw new Error("Invalid Claude response");
  }

  const jsonMatch = block.text.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse composer draft");

  const parsed = JSON.parse(jsonMatch[0]) as Partial<PostDraft>;
  if (!parsed.title || !parsed.caption || !parsed.imagePrompt) {
    throw new Error("Incomplete composer draft");
  }

  if (ctx.isQuoteCard && !parsed.quoteLine?.trim()) {
    throw new Error("Incomplete quote card draft (missing quoteLine)");
  }

  return {
    title: parsed.title.slice(0, 80),
    caption: parsed.caption.slice(0, 2000),
    imagePrompt: parsed.imagePrompt.slice(0, 1000),
    quoteLine: parsed.quoteLine?.trim().slice(0, 45),
  };
}

export function composerUsesQuoteCard(payload: ComposerPayload): boolean {
  return isQuoteCardStyle(payload.imageStyle);
}
