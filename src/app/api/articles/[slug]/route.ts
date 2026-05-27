import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getArticleSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const settings = await getArticleSettings();
  if (!settings.enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);

  const article = await prisma.article.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
    },
    include: {
      author: { select: { name: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // best-effort view count bump; don't block on errors
  prisma.article
    .update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const related = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      category: article.category,
      id: { not: article.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      category: true,
      publishedAt: true,
      readingMinutes: true,
    },
  });

  return NextResponse.json({ article, related });
}
