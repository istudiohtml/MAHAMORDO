import { beforeEach, describe, expect, it } from "vitest";
import {
  ARTICLE_CATEGORIES,
  estimateReadingMinutes,
  generateArticleDraft,
  getCategory,
} from "./article-content";

describe("article-content categories", () => {
  it("exposes 5 canonical categories", () => {
    expect(ARTICLE_CATEGORIES).toHaveLength(5);
    expect(ARTICLE_CATEGORIES.map((c) => c.id)).toEqual([
      "horoscope",
      "tarot",
      "feng_shui",
      "lucky",
      "general",
    ]);
  });

  it("falls back to general for unknown ids", () => {
    expect(getCategory("unknown")).toEqual(getCategory("general"));
  });
});

describe("estimateReadingMinutes", () => {
  it("returns at least 1 minute for any non-empty body", () => {
    expect(estimateReadingMinutes("สวัสดี")).toBe(1);
  });

  it("scales with content length", () => {
    const long = "ทดสอบ".repeat(500); // ~2500 chars
    expect(estimateReadingMinutes(long)).toBeGreaterThanOrEqual(10);
  });
});

describe("generateArticleDraft (E2E_MOCK_AI)", () => {
  beforeEach(() => {
    process.env.E2E_MOCK_AI = "true";
  });

  it("returns a deterministic mock draft when AI mock flag is set", async () => {
    const draft = await generateArticleDraft({
      category: "horoscope",
      date: new Date("2026-05-22T00:00:00Z"),
    });
    expect(draft.title).toContain("ดวงรายวัน");
    expect(draft.content).toContain("##");
    expect(draft.tags.length).toBeGreaterThan(0);
    expect(draft.imagePrompt).toMatch(/no text/i);
    expect(draft.seoDescription.length).toBeLessThanOrEqual(180);
  });
});
