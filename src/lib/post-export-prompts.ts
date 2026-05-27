/** Build copy-paste prompts for external image/video/content tools */

import {
  buildContextualQuoteFallback,
  type TraditionId,
} from "@/data/post-composer";

export type PostPromptSource = {
  title: string;
  caption: string;
  imagePrompt?: string | null;
  quoteLine?: string | null;
  platform?: string | null;
  zodiac?: string | null;
  tradition?: string | null;
  timePeriod?: string | null;
  timeLabel?: string | null;
  zodiacLabel?: string;
  traditionLabel?: string;
  focusLabel?: string;
  isQuoteCard?: boolean;
};

export type QuoteResolveSource = "db" | "stored_prompt" | "fallback";

export type ResolvedExportQuote = {
  text: string;
  source: QuoteResolveSource | null;
};

const NO_TEXT_SUFFIX =
  "mystical illustration, ornate, cinematic lighting, absolutely no text, letters, numbers, or watermarks in image";

const OVERLAY_TEXT_STYLE =
  "Centered Thai typography, large and readable on mobile, white or gold with soft drop shadow, no other readable text or watermarks";

export const QUOTE_OVERLAY_MARKER = "--- Quote overlay ---";

function formatQuoteBlock(quote: string): string {
  return ["ข้อความบนรูป (ภาษาไทย):", `「${quote}」`].join("\n");
}

/** Strip overlay notes appended for prompt-only posts in DB */
export function extractBackgroundFromStoredPrompt(
  imagePrompt: string | null | undefined
): string {
  if (!imagePrompt?.trim()) return "";
  const idx = imagePrompt.indexOf(QUOTE_OVERLAY_MARKER);
  if (idx === -1) return imagePrompt.trim();
  return imagePrompt.slice(0, idx).trim();
}

/** Pull Thai quote from stored imagePrompt overlay section */
export function extractQuoteFromStoredPrompt(
  imagePrompt: string | null | undefined
): string | null {
  if (!imagePrompt?.trim()) return null;

  const patterns = [
    /Thai text on image:\s*「([^」]+)」/,
    /ข้อความบนรูป[^:\n]*:\s*「([^」]+)」/,
    /ข้อความที่วางบนรูป:\s*「([^」]+)」/,
  ];

  for (const pattern of patterns) {
    const match = imagePrompt.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }

  return null;
}

/** Resolve quote for export — DB, stored prompt, then zodiac/time fallback */
export function resolveExportQuoteLine(
  post: PostPromptSource
): ResolvedExportQuote {
  const fromDb = post.quoteLine?.trim();
  if (fromDb) return { text: fromDb, source: "db" };

  const fromPrompt = extractQuoteFromStoredPrompt(post.imagePrompt);
  if (fromPrompt) return { text: fromPrompt, source: "stored_prompt" };

  if (post.zodiac && post.tradition && post.timePeriod) {
    const fallback = buildContextualQuoteFallback(
      post.tradition as TraditionId,
      post.zodiac,
      post.timePeriod,
      post.zodiacLabel ?? post.zodiac,
      post.timeLabel ?? post.timePeriod
    );
    if (fallback.trim()) {
      return { text: fallback.trim(), source: "fallback" };
    }
  }

  return { text: "", source: null };
}

function resolvedQuoteText(post: PostPromptSource): string {
  return resolveExportQuoteLine(post).text;
}

function hasQuoteOverlay(post: PostPromptSource): boolean {
  return Boolean(resolvedQuoteText(post));
}

function resolveBackgroundPrompt(post: PostPromptSource): string {
  const stored = post.imagePrompt?.trim() ?? "";
  if (stored) {
    const extracted = extractBackgroundFromStoredPrompt(stored);
    if (extracted) return extracted;
    if (!stored.includes(QUOTE_OVERLAY_MARKER)) return stored;
  }
  return buildFallbackScene(post) || stored;
}

function buildFallbackScene(post: PostPromptSource): string {
  const focus =
    post.focusLabel && post.focusLabel !== "—" ? post.focusLabel : null;
  return [
    post.traditionLabel &&
      post.traditionLabel !== "—" &&
      `${post.traditionLabel} fortune aesthetic`,
    post.zodiacLabel &&
      post.zodiacLabel !== "—" &&
      `zodiac ${post.zodiacLabel}`,
    focus && `${focus} theme`,
    post.timeLabel &&
      post.timeLabel !== "—" &&
      `${post.timeLabel} horoscope mood`,
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeForCompare(text: string): string {
  return text.replace(/[「」""''\s#@]/g, "").toLowerCase();
}

/** Skip duplicate headline when title repeats the quote hook */
function isTitleRedundantWithQuote(title: string, quote: string): boolean {
  const t = normalizeForCompare(title);
  const q = normalizeForCompare(quote);
  if (!t || !q) return false;
  if (t === q) return true;
  if (t.length >= 6 && (q.includes(t) || t.includes(q))) return true;
  return false;
}

function buildContentHashtags(post: PostPromptSource): string {
  const tags = ["#ดูดวง"];
  const platform = post.platform?.trim().toLowerCase().replace(/\s+/g, "");
  if (platform && platform !== "—") tags.push(`#${platform}`);
  return tags.join(" ");
}

/** Background-only scene for DALL-E / Midjourney when text is added separately */
export function buildImageBackgroundPrompt(post: PostPromptSource): string {
  const base = extractBackgroundFromStoredPrompt(post.imagePrompt);
  const quote = resolvedQuoteText(post);

  if (quote) {
    const scene = base || buildFallbackScene(post);
    return [
      scene,
      NO_TEXT_SUFFIX,
      "background only — Thai quote text overlaid separately (see รูป + คำคม block)",
    ].join(", ");
  }

  if (base) return base;

  return [buildFallbackScene(post), NO_TEXT_SUFFIX].filter(Boolean).join(", ");
}

/** Full instructions: background + Thai quote overlay on image */
export function buildQuoteOverlayExportPrompt(post: PostPromptSource): string {
  const quote = resolvedQuoteText(post);
  if (!quote) return "";

  const background =
    resolveBackgroundPrompt(post) ||
    buildFallbackScene(post) ||
    "mystical fortune illustration, ornate frame, cinematic lighting";

  return [
    "สร้างภาพโพสต์พร้อมคำคมไทยบนรูป (Quote Overlay)",
    "",
    formatQuoteBlock(quote),
    "",
    "พื้นหลัง (Background scene):",
    background,
    "",
    "การวางข้อความบนรูป:",
    `- ${OVERLAY_TEXT_STYLE}`,
    "- วางคำคมกึ่งกลางภาพหรือกึ่งกลางด้านล่าง ให้อ่านง่ายบนมือถือ",
    "- ห้ามมีตัวอักษรอื่นที่อ่านได้ในภาพ",
    "",
    "สำหรับ Canva / Photoshop / CapCut (แยกเลเยอร์):",
    `• เลเยอร์พื้นหลัง: ${background}`,
    `• เลเยอร์ข้อความ: ${quote} (${OVERLAY_TEXT_STYLE})`,
    "",
    "สำหรับ Midjourney / DALL-E (รวมในคำสั่งเดียว):",
    `${background}, with large centered Thai text reading "${quote}", ${OVERLAY_TEXT_STYLE}`,
  ].join("\n");
}

/** Stored imagePrompt for prompt-only posts — includes overlay notes for CMS export */
export function buildStoredImagePromptWithOverlay(
  backgroundPrompt: string,
  quoteLine: string
): string {
  const bg = backgroundPrompt.trim();
  const quote = quoteLine.trim();
  return [
    bg,
    "",
    QUOTE_OVERLAY_MARKER,
    formatQuoteBlock(quote),
    OVERLAY_TEXT_STYLE,
  ].join("\n");
}

/** @deprecated use buildImageBackgroundPrompt — kept for imports */
export function buildImageExportPrompt(post: PostPromptSource): string {
  return buildImageBackgroundPrompt(post);
}

/** Alias for overlay export prompt */
export const buildImageOverlayExportPrompt = buildQuoteOverlayExportPrompt;

export function buildVideoExportPrompt(post: PostPromptSource): string {
  const quote = resolvedQuoteText(post);
  const scene = buildImageBackgroundPrompt(post);

  if (quote) {
    return [
      "Cinematic short clip, 5-8 seconds, smooth slow motion.",
      "Subtle mystical particles, gentle camera push-in or slow orbit.",
      "Loop-friendly, no watermark.",
      "",
      "ฉาก (Scene — no readable text in generated clip):",
      scene,
      "",
      "หลังตัดต่อ — วางคำคมไทยบนวิดีโอ:",
      formatQuoteBlock(quote),
      `- ${OVERLAY_TEXT_STYLE}`,
      "- คำคมค้างตลอดคลิปหรือ fade-in ช่วงต้น อ่านง่ายบนมือถือ",
    ].join("\n");
  }

  return [
    "Cinematic short clip, 5-8 seconds, smooth slow motion.",
    "Subtle mystical particles, gentle camera push-in or slow orbit.",
    "Loop-friendly, no on-screen text, no watermark.",
    scene,
  ].join(" ");
}

export function buildContentExportPrompt(post: PostPromptSource): string {
  const title = post.title.trim();
  const caption = post.caption.trim();
  const quote = resolvedQuoteText(post);
  const lines: string[] = [];

  // Social hook — quote on image, or title when no quote (prompt-only posts)
  if (quote) {
    lines.push(`「${quote}」`);
  } else if (title) {
    lines.push(title);
  }

  const body: string[] = [];
  if (caption) {
    body.push(caption);
  } else if (quote && title && !isTitleRedundantWithQuote(title, quote)) {
    body.push(title);
  }

  if (body.length) {
    if (lines.length) lines.push("");
    lines.push(...body);
  }

  const hashtags = buildContentHashtags(post);
  if (hashtags) {
    lines.push("");
    lines.push(hashtags);
  }

  return lines.join("\n").trim() || "—";
}

export function hasQuoteOverlayExport(post: PostPromptSource): boolean {
  if (hasQuoteOverlay(post)) return true;
  return Boolean(post.isQuoteCard);
}

/** Thai header prepended to combined “copy all” export */
export function buildCombinedExportPreamble(post: PostPromptSource): string {
  const { text } = resolveExportQuoteLine(post);
  if (!text) return "";
  return ["=== คำคมบนรูป (ภาษาไทย) ===", `「${text}」`, ""].join("\n");
}

export function quoteOverlayWarningThai(
  resolved: ResolvedExportQuote
): string | null {
  if (!resolved.text || resolved.source === "db") return null;
  if (resolved.source === "stored_prompt") {
    return "ไม่มีคำคมในฐานข้อมูล — ดึงจาก image prompt ที่บันทึกไว้";
  }
  return "ไม่มีคำคมในฐานข้อมูล — ใช้คำคมสำรองจากราศีและช่วงเวลา";
}
