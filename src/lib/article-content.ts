import { anthropic, CLAUDE_FAST_MODEL } from "@/lib/anthropic";
import { pickRandomTopic } from "@/data/article-topics";

export type ArticleCategoryId =
  | "horoscope"
  | "tarot"
  | "feng_shui"
  | "lucky"
  | "general";

export const ARTICLE_CATEGORIES: Array<{
  id: ArticleCategoryId;
  label: string;
  hint: string;
  imageHint: string;
}> = [
  {
    id: "horoscope",
    label: "ดวงรายวัน",
    hint: "horoscope prediction by zodiac, daily fortune insight",
    imageHint:
      "celestial zodiac wheel, soft golden cosmic glow, mystical Thai aesthetic",
  },
  {
    id: "tarot",
    label: "ทาโรต์",
    hint: "tarot card meaning, spread interpretation, Major Arcana lore",
    imageHint:
      "ornate tarot cards on velvet, candlelight, deep violet and gold tones",
  },
  {
    id: "feng_shui",
    label: "ฮวงจุ้ย",
    hint: "feng shui at home, lucky direction, cleansing energy",
    imageHint:
      "serene Chinese-Thai interior, jade and gold accents, bamboo, soft sunlight",
  },
  {
    id: "lucky",
    label: "เสริมโชค",
    hint: "lucky color, lucky number, prosperity ritual",
    imageHint:
      "shimmering coins, lotus flower, red and gold prosperity motifs",
  },
  {
    id: "general",
    label: "บทความทั่วไป",
    hint: "general mystical wisdom, Thai spiritual culture, soft insight",
    imageHint:
      "ornate mystical Thai art, soft pastel sunrise, ethereal atmosphere",
  },
];

export function getCategory(id: string) {
  return (
    ARTICLE_CATEGORIES.find((c) => c.id === id) ??
    ARTICLE_CATEGORIES[ARTICLE_CATEGORIES.length - 1]
  );
}

export type ArticleDraft = {
  title: string;
  excerpt: string;
  content: string; // markdown
  tags: string[];
  imagePrompt: string;
  seoTitle: string;
  seoDescription: string;
};

const SYSTEM_PROMPT = `You are a Thai mystic columnist for "มาหาหมอดู" (Mahamordo), a Thai fortune-telling app.
Write warm, modern Thai blog articles about astrology, tarot, feng shui, and mysticism.

Return ONLY valid JSON (no markdown fences) with EXACTLY these keys:
{
  "title": string,             // catchy Thai title, max 70 chars, no emoji
  "excerpt": string,           // 1-2 Thai sentences summary, max 180 chars
  "content": string,           // full Thai article in MARKDOWN, 350-650 words
  "tags": string[],            // 3-6 Thai tags, lowercase, no #
  "imagePrompt": string,       // English DALL-E prompt for editorial cover (no text in image)
  "seoTitle": string,          // SEO title, max 60 chars Thai
  "seoDescription": string     // SEO meta desc, max 155 chars Thai
}

Markdown rules for "content":
- Start with a short paragraph (no heading on first line)
- Use 2-4 ## subheadings to organize
- Use bullet lists (-) and bold (**) sparingly to highlight key ideas
- Tone: friendly, modern, respectful — speak to the reader as "คุณ"
- No hashtags inside content, no emoji, no links, no images
- No medical/financial/legal absolute claims — frame as guidance`;

export type GenerateArticleInput = {
  category: ArticleCategoryId | string;
  topicHint?: string; // optional admin-provided seed (e.g. "ดวงราศีกรกฎสัปดาห์นี้")
  styleSuffix?: string; // appended to imagePrompt
  date?: Date; // used for time-bound topics
};

export async function generateArticleDraft(
  input: GenerateArticleInput
): Promise<ArticleDraft> {
  const cat = getCategory(input.category);
  const today = input.date ?? new Date();
  const dateLabel = today.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (process.env.E2E_MOCK_AI === "true") {
    return {
      title: `${cat.label} ประจำ ${dateLabel}`,
      excerpt: `บทความ${cat.label}สำหรับวันนี้ มาฟังคำแนะนำดีๆ จากมาหาหมอดูกัน`,
      content: [
        `วันนี้พลังจักรวาลเอื้อให้คุณกล้าตัดสินใจในเรื่องที่ค้างคา หัวข้อ${cat.label}ของวันนี้พร้อมแล้วเจ้าค่ะ`,
        "",
        "## พลังประจำวัน",
        "- ดูแลใจให้สงบก่อนเริ่มงาน",
        "- จดสิ่งที่อยากได้และอ่านทบทวน",
        "",
        "## คำแนะนำ",
        "ลองให้เวลาตัวเองหายใจช้าๆ แล้วเริ่มจากสิ่งเล็กที่ทำได้ก่อน",
      ].join("\n"),
      tags: [cat.label, "ดูดวง", "มาหาหมอดู"],
      imagePrompt: `${cat.imageHint}, mystical Thai editorial cover, no text`,
      seoTitle: `${cat.label} ${dateLabel} | มาหาหมอดู`,
      seoDescription: `อ่านบทความ${cat.label}ประจำวัน${dateLabel} จากมาหาหมอดู ครบทุกคำแนะนำจากหมอดูดิจิทัล`,
    };
  }

  const resolvedHint =
    input.topicHint?.trim() || pickRandomTopic(cat.id);

  const userPrompt = [
    `วันที่: ${dateLabel}`,
    `หมวด: ${cat.label} (${cat.id})`,
    `แนวเนื้อหา: ${cat.hint}`,
    `แนวภาพปก: ${cat.imageHint}`,
    `หัวข้อ: ${resolvedHint}`,
    "",
    "กรุณาเขียนบทความใหม่ ห้ามคัดลอกจากที่อื่น เน้นเป็นเอกลักษณ์ของมาหาหมอดู",
  ].join("\n");

  const response = await anthropic.messages.create({
    model: CLAUDE_FAST_MODEL,
    max_tokens: 2200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content?.[0];
  if (!block || block.type !== "text") {
    throw new Error("Invalid Claude response for article draft");
  }

  const jsonMatch = block.text.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse article draft JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ArticleDraft>;
  if (
    !parsed.title ||
    !parsed.excerpt ||
    !parsed.content ||
    !parsed.imagePrompt
  ) {
    throw new Error("Incomplete article draft from Claude");
  }

  const styleSuffix = input.styleSuffix?.trim();
  const imagePrompt = styleSuffix
    ? `${parsed.imagePrompt.trim()}. ${styleSuffix}`
    : parsed.imagePrompt.trim();

  return {
    title: parsed.title.slice(0, 100),
    excerpt: parsed.excerpt.slice(0, 220),
    content: parsed.content.slice(0, 8000),
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.filter((t): t is string => typeof t === "string").slice(0, 8)
      : [],
    imagePrompt: imagePrompt.slice(0, 1000),
    seoTitle: (parsed.seoTitle ?? parsed.title).slice(0, 70),
    seoDescription: (parsed.seoDescription ?? parsed.excerpt).slice(0, 180),
  };
}

/** Approx Thai reading speed ~ 220 chars/min; min 1 minute */
export function estimateReadingMinutes(markdown: string): number {
  const chars = markdown.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 220));
}
