import { describe, expect, it } from "vitest";
import {
  buildCombinedExportPreamble,
  buildContentExportPrompt,
  buildQuoteOverlayExportPrompt,
  buildStoredImagePromptWithOverlay,
  extractQuoteFromStoredPrompt,
  resolveExportQuoteLine,
} from "@/lib/post-export-prompts";

const basePost = {
  title: "ทดสอบ",
  caption: "แคปชัน",
  imagePrompt: "mystical purple background",
  platform: "facebook",
  zodiacLabel: "ระกา (ไก่)",
  traditionLabel: "โหราศาสตร์จีน",
  focusLabel: "การเงิน",
  isQuoteCard: true,
};

describe("resolveExportQuoteLine", () => {
  it("prefers DB quoteLine", () => {
    const r = resolveExportQuoteLine({
      ...basePost,
      quoteLine: "จาก DB",
      zodiac: "rooster",
      tradition: "chinese",
      timePeriod: "month",
    });
    expect(r).toEqual({ text: "จาก DB", source: "db" });
  });

  it("extracts quote from stored imagePrompt overlay", () => {
    const stored = buildStoredImagePromptWithOverlay(
      "bg scene",
      "เดือนชาวไก่มีโชคดี ปังปรุเย่"
    );
    const r = resolveExportQuoteLine({
      ...basePost,
      quoteLine: null,
      imagePrompt: stored,
    });
    expect(r.text).toBe("เดือนชาวไก่มีโชคดี ปังปรุเย่");
    expect(r.source).toBe("stored_prompt");
  });

  it("falls back to zodiac + timePeriod when quote missing", () => {
    const r = resolveExportQuoteLine({
      ...basePost,
      quoteLine: null,
      zodiac: "rooster",
      tradition: "chinese",
      timePeriod: "month",
      timeLabel: "เดือนนี้",
    });
    expect(r.text).toBe("เดือนชาวไก่มีโชคดี ปังปรุเย่");
    expect(r.source).toBe("fallback");
  });
});

describe("buildQuoteOverlayExportPrompt", () => {
  it("includes prominent Thai quote block", () => {
    const text = buildQuoteOverlayExportPrompt({
      ...basePost,
      quoteLine: "เดือนชาวไก่มีโชคดี ปังปรุเย่",
    });
    expect(text).toContain("ข้อความบนรูป (ภาษาไทย):");
    expect(text).toContain("「เดือนชาวไก่มีโชคดี ปังปรุเย่」");
    expect(text).not.toContain("see overlay block");
  });

  it("includes background scene from imagePrompt", () => {
    const text = buildQuoteOverlayExportPrompt({
      ...basePost,
      quoteLine: "เดือนชาวไก่มีโชคดี ปังปรุเย่",
      imagePrompt: "serene wellness garden, soft green light, Cancer zodiac",
    });
    expect(text).toContain("พื้นหลัง (Background scene):");
    expect(text).toContain("serene wellness garden");
  });

  it("uses fallback scene when imagePrompt missing", () => {
    const text = buildQuoteOverlayExportPrompt({
      ...basePost,
      quoteLine: "เดือนชาวไก่มีโชคดี ปังปรุเย่",
      imagePrompt: null,
      zodiacLabel: "ระกา (ไก่)",
      traditionLabel: "โหราศาสตร์จีน",
      focusLabel: "สุขภาพ",
    });
    expect(text).toContain("พื้นหลัง (Background scene):");
    expect(text).toMatch(/สุขภาพ theme/);
  });

  it("uses fallback quote when DB field empty", () => {
    const text = buildQuoteOverlayExportPrompt({
      ...basePost,
      quoteLine: null,
      zodiac: "rooster",
      tradition: "chinese",
      timePeriod: "month",
      timeLabel: "เดือนนี้",
    });
    expect(text).toContain("「เดือนชาวไก่มีโชคดี ปังปรุเย่」");
  });
});

describe("extractQuoteFromStoredPrompt", () => {
  it("reads quote from overlay section", () => {
    const prompt = buildStoredImagePromptWithOverlay("x", "ดวงเปิดทาง");
    expect(extractQuoteFromStoredPrompt(prompt)).toBe("ดวงเปิดทาง");
  });
});

describe("buildCombinedExportPreamble", () => {
  it("prepends Thai quote for copy-all", () => {
    const preamble = buildCombinedExportPreamble({
      ...basePost,
      quoteLine: "คำคมทดสอบ",
    });
    expect(preamble).toContain("「คำคมทดสอบ」");
  });
});

describe("buildContentExportPrompt", () => {
  it("formats as social post with quote hook and caption", () => {
    const text = buildContentExportPrompt({
      ...basePost,
      quoteLine: "ปีนี้กรกฎดูแลตัวดีจะสุข",
      title: "ปีนี้กรกฎมีสุขภาพวิบากดี",
      caption: "ช่วงนี้กรกฎควรพักผ่อนและดูแลร่างกาย จังหวะดีสำหรับเริ่มนิสัยสุขภาพใหม่",
      platform: "facebook",
    });
    expect(text).toContain("「ปีนี้กรกฎดูแลตัวดีจะสุข」");
    expect(text).toContain("ช่วงนี้กรกฎควรพักผ่อน");
    expect(text).toContain("#ดูดวง #facebook");
    expect(text).not.toContain("ข้อความบนรูป");
    expect(text).not.toContain("ปีนี้กรกฎมีสุขภาพวิบากดี");
  });

  it("uses title as hook for prompt-only posts without quote", () => {
    const text = buildContentExportPrompt({
      ...basePost,
      quoteLine: null,
      isQuoteCard: false,
      title: "ดวงเดือนนี้ ราศีกรกฎ",
      caption: "พลังจักรวาลส่งสัญญาณดีในด้านสุขภาพ",
      platform: "instagram",
    });
    expect(text.startsWith("ดวงเดือนนี้ ราศีกรกฎ")).toBe(true);
    expect(text).toContain("พลังจักรวาล");
    expect(text).toContain("#instagram");
  });

  it("uses resolved quote in content block", () => {
    const text = buildContentExportPrompt({
      ...basePost,
      quoteLine: null,
      zodiac: "rooster",
      tradition: "chinese",
      timePeriod: "month",
      timeLabel: "เดือนนี้",
      caption: "แคปชันทดสอบ",
    });
    expect(text).toContain("「เดือนชาวไก่มีโชคดี ปังปรุเย่」");
    expect(text).toContain("แคปชันทดสอบ");
  });
});
