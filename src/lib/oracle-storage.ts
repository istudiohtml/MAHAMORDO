import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  getOraclesUploadDir,
  oraclePosterPublicPath,
  withUploadVersion,
} from "@/lib/upload-path";

export const MAX_ORACLE_POSTER_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_FORMATS = new Set(["png", "jpeg", "webp"]);

export class OraclePosterError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OraclePosterError";
    this.status = status;
  }
}

/** Validate upload and normalize to JPEG for storage */
export async function normalizeOraclePosterUpload(
  buffer: Buffer
): Promise<Buffer> {
  if (buffer.length > MAX_ORACLE_POSTER_BYTES) {
    throw new OraclePosterError("รูปภาพใหญ่เกิน 5 MB", 413);
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new OraclePosterError("ไฟล์รูปภาพไม่ถูกต้อง", 400);
  }

  if (!meta.format || !ALLOWED_IMAGE_FORMATS.has(meta.format)) {
    throw new OraclePosterError("รองรับเฉพาะ PNG, JPEG หรือ WebP", 400);
  }

  return sharp(buffer).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

export async function saveOraclePoster(
  slug: string,
  buffer: Buffer
): Promise<string> {
  const dir = getOraclesUploadDir();
  await fs.mkdir(dir, { recursive: true });

  const filename = `${slug}.jpg`;
  await fs.writeFile(path.join(dir, filename), buffer);

  return withUploadVersion(oraclePosterPublicPath(slug));
}

export async function readOraclePoster(
  filename: string
): Promise<Buffer | null> {
  if (!/^[a-z0-9-]+\.jpg$/i.test(filename)) {
    return null;
  }

  const filePath = path.join(getOraclesUploadDir(), filename);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}
