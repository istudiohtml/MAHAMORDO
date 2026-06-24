import { NextRequest, NextResponse } from "next/server";
import { requireRole, getCmsUser } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";
import { ArticleError, createArticle } from "@/lib/article";
import { getArticleSettings } from "@/lib/system-settings";
import {
  ARTICLE_CATEGORIES,
  estimateReadingMinutes,
} from "@/lib/article-content";
import { uniqueArticleSlug } from "@/lib/article-slug";
import { normalizeTags, serializeArticleTags } from "@/lib/article-tags";

export async function GET(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("q")?.trim();

  const articles = await prisma.article.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
      // MySQL `contains` is case-insensitive by default with utf8mb4_unicode_ci.
      // Prisma's `mode: "insensitive"` is Postgres-only.
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { excerpt: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      author: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({
    articles: articles.map(serializeArticleTags),
    categories: ARTICLE_CATEGORIES,
  });
}

export async function POST(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const cmsUser = await getCmsUser(req);
  if (!cmsUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getArticleSettings();
  if (!settings.enabled) {
    return NextResponse.json(
      { error: "ฟีเจอร์บทความถูกปิดในตั้งค่าระบบ" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const category = String(body.category ?? "general");

    // Manual mode: admin provided title/content directly
    if (body.mode === "manual" || body.title) {
      const title = String(body.title ?? "").trim();
      const content = String(body.content ?? "").trim();
      if (!title || !content) {
        return NextResponse.json(
          { error: "ต้องระบุ title และ content" },
          { status: 400 }
        );
      }

      const slug = await uniqueArticleSlug(title);
      const article = await prisma.article.create({
        data: {
          slug,
          title: title.slice(0, 200),
          excerpt: String(body.excerpt ?? "").slice(0, 220),
          content: content.slice(0, 12000),
          category,
          tags: normalizeTags(body.tags, { max: 10 }),
          status:
            body.status === "PUBLISHED" || body.status === "ARCHIVED"
              ? body.status
              : settings.defaultStatus,
          publishedAt: body.status === "PUBLISHED" ? new Date() : null,
          source: "manual",
          authorId: cmsUser.userId,
          readingMinutes: estimateReadingMinutes(content),
          seoTitle: String(body.seoTitle ?? title).slice(0, 70),
          seoDescription: String(body.seoDescription ?? body.excerpt ?? "").slice(
            0,
            180
          ),
        },
      });
      return NextResponse.json(article);
    }

    // AI mode: let server generate
    const { id } = await createArticle({
      category,
      authorId: cmsUser.userId,
      source: "ai",
      status: settings.defaultStatus,
      generateOptions: {
        category,
        topicHint: body.topicHint ?? undefined,
        styleSuffix: settings.imageStyleSuffix,
      },
    });
    const article = await prisma.article.findUnique({ where: { id } });
    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof ArticleError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("CMS create article error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
