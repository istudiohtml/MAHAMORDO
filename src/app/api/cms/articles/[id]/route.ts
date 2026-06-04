import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";
import {
  ArticleImageError,
  deleteArticleCover,
  normalizeArticleCoverUpload,
  saveArticleCover,
} from "@/lib/article-storage";
import { estimateReadingMinutes } from "@/lib/article-content";
import { uniqueArticleSlug, slugifyTitle } from "@/lib/article-slug";
import { normalizeTags } from "@/lib/article-tags";

type Params = { params: Promise<{ id: string }> };

type PatchFields = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  seoTitle?: string;
  seoDescription?: string;
  coverPrompt?: string;
  coverImageBuffer?: Buffer;
};

function parseBase64Image(value: string): Buffer | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dataUrl = trimmed.match(
    /^data:image\/(?:png|jpeg|webp);base64,(.+)$/i
  );
  const raw = dataUrl ? dataUrl[1] : trimmed;
  try {
    return Buffer.from(raw, "base64");
  } catch {
    return null;
  }
}

async function parsePatchRequest(req: NextRequest): Promise<PatchFields> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const fields: PatchFields = {};

    const stringFields: (keyof PatchFields)[] = [
      "title",
      "slug",
      "excerpt",
      "content",
      "category",
      "seoTitle",
      "seoDescription",
      "coverPrompt",
    ];
    for (const key of stringFields) {
      const v = form.get(key);
      if (typeof v === "string") {
        (fields as Record<string, unknown>)[key] = v;
      }
    }

    const tags = form.get("tags");
    if (typeof tags === "string") {
      fields.tags = normalizeTags(tags, { max: 10 });
    }

    const status = form.get("status");
    if (status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED") {
      fields.status = status;
    }

    const cover = form.get("cover");
    if (cover instanceof File && cover.size > 0) {
      fields.coverImageBuffer = Buffer.from(await cover.arrayBuffer());
    }

    return fields;
  }

  const body = await req.json();
  const fields: PatchFields = {};
  for (const key of [
    "title",
    "slug",
    "excerpt",
    "content",
    "category",
    "seoTitle",
    "seoDescription",
    "coverPrompt",
  ] as const) {
    if (typeof body[key] === "string") {
      (fields as Record<string, unknown>)[key] = body[key];
    }
  }
  if (Array.isArray(body.tags)) {
    fields.tags = normalizeTags(body.tags, { max: 10 });
  }
  if (
    body.status === "DRAFT" ||
    body.status === "PUBLISHED" ||
    body.status === "ARCHIVED"
  ) {
    fields.status = body.status;
  }
  if (typeof body.coverBase64 === "string") {
    const buf = parseBase64Image(body.coverBase64);
    if (buf) fields.coverImageBuffer = buf;
  }
  return fields;
}

export async function GET(req: NextRequest, { params }: Params) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { email: true, name: true } },
    },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let patch: PatchFields;
  try {
    patch = await parsePatchRequest(req);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof patch.title === "string") {
    data.title = patch.title.slice(0, 200).trim();
  }
  if (typeof patch.excerpt === "string") {
    data.excerpt = patch.excerpt.slice(0, 220);
  }
  if (typeof patch.content === "string") {
    data.content = patch.content.slice(0, 12000);
    data.readingMinutes = estimateReadingMinutes(patch.content);
  }
  if (typeof patch.category === "string") data.category = patch.category;
  if (Array.isArray(patch.tags)) data.tags = patch.tags;
  if (typeof patch.seoTitle === "string") {
    data.seoTitle = patch.seoTitle.slice(0, 70);
  }
  if (typeof patch.seoDescription === "string") {
    data.seoDescription = patch.seoDescription.slice(0, 180);
  }
  if (typeof patch.coverPrompt === "string") {
    data.coverPrompt = patch.coverPrompt.slice(0, 1000);
  }

  if (typeof patch.slug === "string" && patch.slug.trim()) {
    const desired = slugifyTitle(patch.slug);
    if (desired !== existing.slug) {
      const conflict = await prisma.article.findUnique({
        where: { slug: desired },
      });
      data.slug = conflict ? await uniqueArticleSlug(desired) : desired;
    }
  } else if (typeof patch.title === "string") {
    // auto re-slug on title change when slug field omitted? keep stable, don't auto re-slug
  }

  if (patch.status) {
    data.status = patch.status;
    if (patch.status === "PUBLISHED" && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
    if (patch.status === "DRAFT") {
      // keep publishedAt history; don't null it out
    }
  }

  try {
    if (patch.coverImageBuffer) {
      const normalized = await normalizeArticleCoverUpload(
        patch.coverImageBuffer
      );
      data.coverImageUrl = await saveArticleCover(id, normalized);
    }
  } catch (error) {
    if (error instanceof ArticleImageError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[cms/articles PATCH] cover update failed:", error);
    return NextResponse.json(
      { error: "อัปเดตรูปปกไม่สำเร็จ" },
      { status: 500 }
    );
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "ไม่มีข้อมูลที่จะอัปเดต" },
      { status: 400 }
    );
  }

  const article = await prisma.article.update({
    where: { id },
    data,
    include: { author: { select: { email: true, name: true } } },
  });
  return NextResponse.json(article);
}

/**
 * Default behavior: SOFT DELETE — mark as ARCHIVED (admin can still see/restore).
 * With ?hard=1 query: permanently delete row + cover file (SUPERADMIN only).
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const url = new URL(req.url);
  const hard = url.searchParams.get("hard") === "1";

  const deny = hard
    ? await requireRole("SUPERADMIN")(req)
    : await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;

  if (hard) {
    await prisma.article.delete({ where: { id } });
    await deleteArticleCover(id);
    return NextResponse.json({ ok: true, hard: true });
  }

  const article = await prisma.article.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  return NextResponse.json({ ok: true, hard: false, article });
}
