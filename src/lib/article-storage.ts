import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  articleCoverPublicPath,
  getArticlesUploadDir,
} from "@/lib/upload-path";

export const MAX_ARTICLE_COVER_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_FORMATS = new Set(["png", "jpeg", "webp"]);

export class ArticleImageError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ArticleImageError";
    this.status = status;
  }
}

/** Validate upload and normalize to JPEG for storage (smaller than PNG for blog covers) */
export async function normalizeArticleCoverUpload(
  buffer: Buffer
): Promise<Buffer> {
  if (buffer.length > MAX_ARTICLE_COVER_BYTES) {
    throw new ArticleImageError("รูปปกใหญ่เกิน 5 MB", 413);
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new ArticleImageError("ไฟล์รูปภาพไม่ถูกต้อง", 400);
  }

  if (!meta.format || !ALLOWED_IMAGE_FORMATS.has(meta.format)) {
    throw new ArticleImageError("รองรับเฉพาะ PNG, JPEG หรือ WebP", 400);
  }

  return sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

/** Save article cover image; returns public URL path for DB */
export async function saveArticleCover(
  articleId: string,
  buffer: Buffer
): Promise<string> {
  const dir = getArticlesUploadDir();
  await fs.mkdir(dir, { recursive: true });

  const filename = `${articleId}.jpg`;
  await fs.writeFile(path.join(dir, filename), buffer);

  return articleCoverPublicPath(articleId);
}

/** Read saved article cover bytes (for public uploads route) */
export async function readArticleCover(
  filename: string
): Promise<Buffer | null> {
  if (!/^[\w-]+\.jpg$/i.test(filename)) {
    return null;
  }

  const filePath = path.join(getArticlesUploadDir(), filename);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

/** Delete a saved cover (ignore if missing) */
export async function deleteArticleCover(articleId: string): Promise<void> {
  const filePath = path.join(getArticlesUploadDir(), `${articleId}.jpg`);
  try {
    await fs.unlink(filePath);
  } catch {
    // not present
  }
}
