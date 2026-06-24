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
  /** Categories with the fewest articles that were eligible for random pick */
  categoryPool?: string[];
};

/** Pick randomly from up to 3 configured categories with the lowest article counts. */
async function pickCronCategory(categories: string[]): Promise<{
  category: string;
  pool: string[];
}> {
  const rows = await prisma.article.groupBy({
    by: ["category"],
    where: { category: { in: categories } },
    _count: { id: true },
  });
  const countByCategory = new Map(
    rows.map((row) => [row.category, row._count.id])
  );

  const ranked = categories
    .map((cat) => ({ cat, count: countByCategory.get(cat) ?? 0 }))
    .sort((a, b) => a.count - b.count || a.cat.localeCompare(b.cat));

  const pool = ranked.slice(0, Math.min(3, ranked.length)).map((r) => r.cat);
  const category = pool[Math.floor(Math.random() * pool.length)];

  return { category, pool };
}

/**
 * Create one cron article — category is random among the 3 least-used configured categories.
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
  const bangkok = new Date(now.getTime() + 7 * 3600 * 1000);

  const { category, pool } = await pickCronCategory(cats);

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
    withImage: opts.withImage === true,
    generateOptions: {
      category,
      topicHint: `บทความ${cat.label}สำหรับ ${dateLabel}`,
      styleSuffix: opts.styleSuffix,
      date: bangkok,
    },
  });

  return { id, category, categoryPool: pool };
}
