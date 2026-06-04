import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ARTICLE_CATEGORIES } from "@/lib/article-content";
import { getArticleSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

const MAX_PAGE_SIZE = 24;

export async function GET(req: NextRequest) {
  const settings = await getArticleSettings();
  if (!settings.enabled) {
    return NextResponse.json({ articles: [], total: 0, categories: [] });
  }

  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const tag = url.searchParams.get("tag") ?? undefined;
  const pageRaw = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSizeRaw = Number.parseInt(
    url.searchParams.get("pageSize") ?? "12",
    10
  );
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 12
  );

  const where = {
    status: "PUBLISHED" as const,
    publishedAt: { lte: new Date() },
    ...(category ? { category } : {}),
    ...(tag ? { tags: { array_contains: tag } } : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        category: true,
        tags: true,
        publishedAt: true,
        readingMinutes: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    articles,
    total,
    page,
    pageSize,
    categories: ARTICLE_CATEGORIES,
  });
}
