export type CreateMode = "both" | "post" | "image" | "prompt";

export const CREATE_MODE_LABELS: Record<CreateMode, string> = {
  both: "Post+รูป",
  post: "Post",
  image: "รูป",
  prompt: "Prompt",
};

export function createModeLabel(mode: string | null | undefined): string {
  if (!mode) return "—";
  return CREATE_MODE_LABELS[mode as CreateMode] ?? mode;
}

export type ImageSizeKey = "square" | "wide" | "story";

export type TraditionId = "chinese" | "western" | "korean";

export type ZodiacOption = { id: string; label: string };

export const FORTUNE_TRADITIONS = [
  {
    id: "chinese" as const,
    label: "โหราศาสตร์จีน",
    promptHint:
      "Chinese astrology aesthetic, red and gold, lanterns, yin yang, oriental clouds",
  },
  {
    id: "western" as const,
    label: "โหราศาสตร์ตะวันตก",
    promptHint:
      "Western zodiac constellations, celestial chart, art deco stars, navy and gold",
  },
  {
    id: "korean" as const,
    label: "ซาจูเกาหลี",
    promptHint:
      "Korean Saju fortune aesthetic, hanbok motifs, ink wash, subtle hanja energy",
  },
] as const;

export const WESTERN_ZODIAC = [
  { id: "aries", label: "♈ เมษ" },
  { id: "taurus", label: "♉ พฤษภ" },
  { id: "gemini", label: "♊ เมถุน" },
  { id: "cancer", label: "♋ กรกฎ" },
  { id: "leo", label: "♌ สิงห์" },
  { id: "virgo", label: "♍ กันย์" },
  { id: "libra", label: "♎ ตุลย์" },
  { id: "scorpio", label: "♏ พิจิก" },
  { id: "sagittarius", label: "♐ ธนู" },
  { id: "capricorn", label: "♑ มังกร" },
  { id: "aquarius", label: "♒ กุมภ์" },
  { id: "pisces", label: "♓ มีน" },
] as const;

export const CHINESE_ZODIAC = [
  { id: "rat", label: "ชวด (หนู)" },
  { id: "ox", label: "ฉลู (วัว)" },
  { id: "tiger", label: "ขาล (เสือ)" },
  { id: "rabbit", label: "เถาะ (กระต่าย)" },
  { id: "dragon", label: "มะโรง (มังกร)" },
  { id: "snake", label: "มะเส็ง (งู)" },
  { id: "horse", label: "มะเมีย (ม้า)" },
  { id: "goat", label: "มะแม (แพะ)" },
  { id: "monkey", label: "วอก (ลิง)" },
  { id: "rooster", label: "ระกา (ไก่)" },
  { id: "dog", label: "จอ (สุนัข)" },
  { id: "pig", label: "กุน (หมู)" },
] as const;

/** @deprecated use WESTERN_ZODIAC — kept for imports */
export const ZODIAC_SIGNS = WESTERN_ZODIAC;

export function zodiacOptionsForTradition(
  tradition: TraditionId
): readonly ZodiacOption[] {
  return tradition === "chinese" ? CHINESE_ZODIAC : WESTERN_ZODIAC;
}

export const TIME_PERIODS = [
  { id: "today", label: "วันนี้" },
  { id: "week", label: "สัปดาห์นี้" },
  { id: "month", label: "เดือนนี้" },
  { id: "year", label: "ปีนี้" },
] as const;

export const FOCUS_AREAS = [
  { id: "general", label: "ภาพรวมทั่วไป" },
  { id: "love", label: "ความรัก" },
  { id: "career", label: "การงาน" },
  { id: "finance", label: "การเงิน" },
  { id: "health", label: "สุขภาพ" },
] as const;

export const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "line", label: "LINE" },
] as const;

export const IMAGE_STYLES = [
  {
    id: "cosmic",
    label: "Cosmic Mystic",
    prompt: "cosmic mystic fortune art, nebula, stars, deep purple and gold",
  },
  {
    id: "watercolor",
    label: "Watercolor",
    prompt: "soft watercolor mystical illustration, flowing pigments",
  },
  {
    id: "artnouveau",
    label: "Art Nouveau",
    prompt: "art nouveau ornate frame, elegant curves, gold leaf",
  },
  {
    id: "minimal",
    label: "Minimal Geo",
    prompt: "minimal geometric sacred symbols, clean lines, light background",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    prompt: "cinematic dramatic lighting, mystical atmosphere, film still",
  },
  {
    id: "anime",
    label: "Anime Style",
    prompt: "anime style mystical fortune scene, vibrant, detailed",
  },
  {
    id: "quote_card",
    label: "การ์ดคำคม",
    prompt:
      "mystical fortune social card background, ornate golden frame edges, deep purple and gold aura, cinematic bokeh, empty center for text overlay",
  },
] as const;

export function isQuoteCardStyle(styleId: string): boolean {
  return styleId === "quote_card";
}

/** Colloquial Thai animal names for punchy quote lines (ชาว___) */
const CHINESE_ZODIAC_QUOTE_NAMES: Record<string, string> = {
  rat: "ชวด",
  ox: "วัว",
  tiger: "เสือ",
  rabbit: "กระต่าย",
  dragon: "มังกร",
  snake: "งู",
  horse: "ม้า",
  goat: "แพะ",
  monkey: "ลิง",
  rooster: "ไก่",
  dog: "สุนัข",
  pig: "หมู",
};

/** Contextual fallback when AI quote is missing (image overlay must always have text) */
export function buildContextualQuoteFallback(
  tradition: TraditionId,
  zodiacId: string,
  timePeriod: string,
  zodiacLabel: string,
  timeLabel: string
): string {
  if (tradition === "chinese") {
    const animal = CHINESE_ZODIAC_QUOTE_NAMES[zodiacId];
    if (animal) {
      switch (timePeriod) {
        case "today":
          return `วันนี้ชาว${animal}มีลาภ รับโชค`;
        case "week":
          return `สัปดาห์นี้ชาว${animal}ดวงปัง`;
        case "month":
          return `เดือนชาว${animal}มีโชคดี ปังปรุเย่`;
        case "year":
          return `ปีนี้ชาว${animal}รุ่งโรจน์`;
        default:
          break;
      }
    }
  }
  return `ดวง${timeLabel} ราศี${zodiacLabel} เปิดทางใหม่`;
}

export const IMAGE_SIZES: Record<
  ImageSizeKey,
  {
    label: string;
    ratio: string;
    dallE: "1024x1024" | "1792x1024" | "1024x1792";
    cost: string;
  }
> = {
  square: { label: "1:1 Square", ratio: "1:1", dallE: "1024x1024", cost: "$0.04" },
  wide: { label: "16:9 Wide", ratio: "16:9", dallE: "1792x1024", cost: "$0.08" },
  story: { label: "9:16 Story", ratio: "9:16", dallE: "1024x1792", cost: "$0.08" },
};

export type ComposerPayload = {
  mode: CreateMode;
  zodiac: string;
  tradition: TraditionId;
  timePeriod: string;
  focus: string;
  platform: string;
  imageStyle: string;
  imageSize: ImageSizeKey;
  visibility?: "PRIVATE" | "PUBLIC";
  sessionId?: string;
};

export type ComposerDefaults = {
  zodiac: string;
  tradition: TraditionId;
  timePeriod: string;
  focus: string;
  platform: string;
  imageStyle: string;
  imageSize: ImageSizeKey;
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random image style (optionally different from current). */
export function pickRandomImageStyle(excludeId?: string): string {
  const pool =
    excludeId && IMAGE_STYLES.length > 1
      ? IMAGE_STYLES.filter((s) => s.id !== excludeId)
      : IMAGE_STYLES;
  return pick(pool.length > 0 ? pool : IMAGE_STYLES).id;
}

/** Random form values on each visit to /cms/posts/new */
export function pickRandomComposerDefaults(): ComposerDefaults {
  const tradition = pick(FORTUNE_TRADITIONS).id;
  const zodiacList = zodiacOptionsForTradition(tradition);
  const sizeKeys = Object.keys(IMAGE_SIZES) as ImageSizeKey[];

  const zodiacPick = pick([...zodiacList]);

  return {
    tradition,
    zodiac: zodiacPick.id,
    timePeriod: pick(TIME_PERIODS).id,
    focus: pick(FOCUS_AREAS).id,
    platform: pick(PLATFORMS).id,
    imageStyle: pick(IMAGE_STYLES).id,
    imageSize: pick(sizeKeys),
  };
}
