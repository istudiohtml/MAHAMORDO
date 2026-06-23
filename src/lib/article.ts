import { prisma } from "@/lib/prisma";
import type { ArticleStatus } from "@prisma/client";
import {
  estimateReadingMinutes,
  generateArticleDraft,
  getCategory,
  type ArticleCategoryId,
  type ArticleDraft,
  type GenerateArticleInput,
} from "@/lib/article-content";
import { generateFortuneImage } from "@/lib/image-gen";
import { saveArticleCover } from "@/lib/article-storage";
import { uniqueArticleSlug } from "@/lib/article-slug";

export class ArticleError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ArticleError";
    this.status = status;
  }
}

export type CreateArticleInput = {
  category: ArticleCategoryId | string;
  draft?: ArticleDraft; // pre-generated, otherwise we generate
  generateOptions?: GenerateArticleInput;
  authorId?: string;
  source?: "manual" | "ai" | "cron";
  status?: ArticleStatus; // overrides default
  publishedAt?: Date | null;
  withImage?: boolean; // when false (or no API key), skip DALL-E
};

export type CreateArticleResult = {
  article: Awaited<ReturnType<typeof prisma.article.findUnique>>;
};

/**
 * High-level helper used by CMS routes + cron.
 * Generates the draft (if needed), creates the row, then optionally renders the cover image.
 */
export async function createArticle(
  input: CreateArticleInput
): Promise<{ id: string }> {
  const draft =
    input.draft ??
    (await generateArticleDraft({
      category: input.category,
      ...input.generateOptions,
    }));

  if (!draft.title?.trim()) {
    throw new ArticleError("ไม่มี title ของบทความ", 400);
  }
  if (!draft.content?.trim()) {
    throw new ArticleError("ไม่มี content ของบทความ", 400);
  }

  const slug = await uniqueArticleSlug(draft.title);
  const readingMinutes = estimateReadingMinutes(draft.content);

  const status = input.status ?? "DRAFT";
  const publishedAt =
    input.publishedAt ?? (status === "PUBLISHED" ? new Date() : null);

  const article = await prisma.article.create({
    data: {
      slug,
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      coverPrompt: draft.imagePrompt,
      category: input.category,
      tags: draft.tags,
      status,
      publishedAt,
      source: input.source ?? "manual",
      ...(input.authorId
        ? { author: { connect: { id: input.authorId } } }
        : {}),
      readingMinutes,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
    },
  });

  if (input.withImage !== false) {
    try {
      const buffer = await generateFortuneImage(draft.imagePrompt, "1792x1024");
      const url = await saveArticleCover(article.id, buffer);
      await prisma.article.update({
        where: { id: article.id },
        data: { coverImageUrl: url },
      });
    } catch (err) {
      // image is best-effort — article still usable without cover
      console.error("[article] cover generation failed:", err);
    }
  }

  return { id: article.id };
}

export type CronGenerateResult = {
  id: string | null;
  category: string;
  skipped?: string;
};

/**
 * Pick the next category by rotating based on day-of-year, then create one article.
 * Returns null id if cron disabled or all errors handled gracefully.
 */
export async function runDailyArticleCron(opts: {
  categoriesCsv: string;
  autoPublish: boolean;
  withImage?: boolean;
  authorId?: string;
  styleSuffix?: string;
  now?: Date;
}): Promise<CronGenerateResult> {
  const cats = opts.categoriesCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (cats.length === 0) {
    return { id: null, category: "", skipped: "no categories configured" };
  }

  const now = opts.now ?? new Date();

  // Skip if any article already created by cron today (Bangkok)
  const bangkok = new Date(now.getTime() + 7 * 3600 * 1000);
  const start = new Date(
    Date.UTC(
      bangkok.getUTCFullYear(),
      bangkok.getUTCMonth(),
      bangkok.getUTCDate(),
      -7
    )
  );
  const end = new Date(start.getTime() + 24 * 3600 * 1000);

  const existing = await prisma.article.findFirst({
    where: { source: "cron", createdAt: { gte: start, lt: end } },
    select: { id: true, category: true },
  });
  if (existing) {
    return {
      id: existing.id,
      category: existing.category,
      skipped: "already created today",
    };
  }

  const dayOfYear = Math.floor(
    (Date.UTC(
      bangkok.getUTCFullYear(),
      bangkok.getUTCMonth(),
      bangkok.getUTCDate()
    ) -
      Date.UTC(bangkok.getUTCFullYear(), 0, 0)) /
      86400000
  );
  const category = cats[dayOfYear % cats.length];

  const dateLabel = bangkok.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const cat = getCategory(category);
  const { id } = await createArticle({
    category,
    source: "cron",
    authorId: opts.authorId,
    status: opts.autoPublish ? "PUBLISHED" : "DRAFT",
    withImage: opts.withImage !== false,
    generateOptions: {
      category,
      topicHint: `บทความ${cat.label}สำหรับ ${dateLabel}`,
      styleSuffix: opts.styleSuffix,
      date: bangkok,
    },
  });

  return { id, category };
}
