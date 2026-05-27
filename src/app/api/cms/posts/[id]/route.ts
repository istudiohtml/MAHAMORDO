import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";
import {
  IMAGE_SIZES,
  isQuoteCardStyle,
  type ImageSizeKey,
} from "@/data/post-composer";
import type { DallESize } from "@/lib/image-gen";
import {
  buildStoredImagePromptWithOverlay,
  extractBackgroundFromStoredPrompt,
  QUOTE_OVERLAY_MARKER,
} from "@/lib/post-export-prompts";
import {
  getPostImageMeta,
  normalizePostImageUpload,
  PostImageError,
  readPostImage,
  savePostImage,
} from "@/lib/post-storage";
import { composeQuoteCardImage } from "@/lib/quote-card-image";

type Params = { params: Promise<{ id: string }> };

type PatchFields = {
  visibility?: "PUBLIC" | "PRIVATE";
  title?: string;
  caption?: string;
  quoteLine?: string | null;
  imageBuffer?: Buffer;
  regenerateQuoteOverlay?: boolean;
};

function dallESizeForPost(imageSize: string | null | undefined): DallESize {
  const key = (imageSize ?? "square") as ImageSizeKey;
  return IMAGE_SIZES[key]?.dallE ?? IMAGE_SIZES.square.dallE;
}

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

    const visibility = form.get("visibility");
    if (visibility === "PUBLIC" || visibility === "PRIVATE") {
      fields.visibility = visibility;
    }

    const title = form.get("title");
    if (typeof title === "string") fields.title = title;

    const caption = form.get("caption");
    if (typeof caption === "string") fields.caption = caption;

    if (form.has("quoteLine")) {
      const quoteLine = form.get("quoteLine");
      fields.quoteLine =
        typeof quoteLine === "string" ? quoteLine.trim().slice(0, 500) : null;
    }

    fields.regenerateQuoteOverlay =
      form.get("regenerateQuoteOverlay") === "true";

    const image = form.get("image");
    if (image instanceof File && image.size > 0) {
      fields.imageBuffer = Buffer.from(await image.arrayBuffer());
    }

    return fields;
  }

  const body = await req.json();
  const fields: PatchFields = {};

  if (body.visibility === "PUBLIC" || body.visibility === "PRIVATE") {
    fields.visibility = body.visibility;
  }
  if (typeof body.title === "string") fields.title = body.title;
  if (typeof body.caption === "string") fields.caption = body.caption;
  if (body.quoteLine !== undefined) {
    fields.quoteLine =
      typeof body.quoteLine === "string"
        ? body.quoteLine.trim().slice(0, 500)
        : null;
  }
  if (body.regenerateQuoteOverlay === true) {
    fields.regenerateQuoteOverlay = true;
  }

  if (typeof body.imageBase64 === "string") {
    const buffer = parseBase64Image(body.imageBase64);
    if (buffer) fields.imageBuffer = buffer;
  }

  return fields;
}

function updateStoredPromptQuote(
  imagePrompt: string | null | undefined,
  quoteLine: string
): string | undefined {
  if (!imagePrompt?.includes(QUOTE_OVERLAY_MARKER)) return undefined;
  const background = extractBackgroundFromStoredPrompt(imagePrompt);
  if (!background) return undefined;
  return buildStoredImagePromptWithOverlay(background, quoteLine);
}

export async function GET(req: NextRequest, { params }: Params) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const post = await prisma.fortunePost.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      session: { select: { id: true, topic: true, createdAt: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const imageMeta = await getPostImageMeta(id);
  return NextResponse.json({ ...post, imageMeta });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;

  const existing = await prisma.fortunePost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let patch: PatchFields;
  try {
    patch = await parsePatchRequest(req);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data: {
    visibility?: "PUBLIC" | "PRIVATE";
    title?: string;
    caption?: string;
    quoteLine?: string | null;
    imageUrl?: string;
    imagePrompt?: string;
  } = {};

  if (patch.visibility === "PUBLIC" || patch.visibility === "PRIVATE") {
    data.visibility = patch.visibility;
  }
  if (typeof patch.title === "string") {
    data.title = patch.title.slice(0, 80);
  }
  if (typeof patch.caption === "string") {
    data.caption = patch.caption.slice(0, 2000);
  }
  if (patch.quoteLine !== undefined) {
    data.quoteLine = patch.quoteLine || null;
    const nextQuote = patch.quoteLine?.trim();
    if (nextQuote) {
      const updatedPrompt = updateStoredPromptQuote(
        existing.imagePrompt,
        nextQuote
      );
      if (updatedPrompt) data.imagePrompt = updatedPrompt;
    }
  }

  try {
    if (patch.imageBuffer) {
      const normalized = await normalizePostImageUpload(patch.imageBuffer);
      data.imageUrl = await savePostImage(id, normalized);
    } else if (patch.regenerateQuoteOverlay) {
      if (!isQuoteCardStyle(existing.imageStyle ?? "")) {
        return NextResponse.json(
          { error: "โพสต์นี้ไม่ใช่สไตล์การ์ดคำคม" },
          { status: 400 }
        );
      }

      const quoteLine =
        (patch.quoteLine !== undefined ? patch.quoteLine : existing.quoteLine)?.trim() ??
        "";
      if (!quoteLine) {
        return NextResponse.json(
          { error: "กรุณาระบุคำคมก่อนสร้างรูปใหม่" },
          { status: 400 }
        );
      }

      const background = await readPostImage(`${id}.png`);
      if (!background) {
        return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 404 });
      }

      const composed = await composeQuoteCardImage(
        background,
        quoteLine,
        dallESizeForPost(existing.imageSize)
      );
      data.imageUrl = await savePostImage(id, composed);
      if (patch.quoteLine === undefined) {
        data.quoteLine = quoteLine;
      }
    }
  } catch (error) {
    if (error instanceof PostImageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[cms/posts PATCH] image update failed:", error);
    const message =
      error instanceof Error ? error.message : "อัปเดตรูปภาพไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
  }

  const post = await prisma.fortunePost.update({
    where: { id },
    data,
    include: {
      user: { select: { email: true, name: true } },
      session: { select: { id: true, topic: true, createdAt: true } },
    },
  });

  const imageMeta = await getPostImageMeta(id);
  return NextResponse.json({ ...post, imageMeta });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  await prisma.fortunePost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
