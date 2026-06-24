import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  PLACEHOLDER_IMAGE_MAX_BYTES,
  placeholderImageBuffer,
  type DallESize,
} from "@/lib/image-gen";
import {
  getPostsUploadDir,
  postImagePublicPath,
  withUploadVersion,
} from "@/lib/upload-path";

const PENDING_SIZE_PX: Record<DallESize, { width: number; height: number }> = {
  "1024x1024": { width: 1024, height: 1024 },
  "1792x1024": { width: 1792, height: 1024 },
  "1024x1792": { width: 1024, height: 1792 },
};

export type PostImageMeta = {
  exists: boolean;
  /** Awaiting upload or legacy 1×1 stub — not a user-provided image */
  isPlaceholder: boolean;
  byteLength: number;
};

function pendingMarkerPath(postId: string): string {
  return path.join(getPostsUploadDir(), `${postId}.pending`);
}

export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_FORMATS = new Set(["png", "jpeg", "webp"]);

export class PostImageError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PostImageError";
    this.status = status;
  }
}

/** Validate upload and normalize to PNG for storage */
export async function normalizePostImageUpload(buffer: Buffer): Promise<Buffer> {
  if (buffer.length > MAX_POST_IMAGE_BYTES) {
    throw new PostImageError("รูปภาพใหญ่เกิน 5 MB", 413);
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new PostImageError("ไฟล์รูปภาพไม่ถูกต้อง", 400);
  }

  if (!meta.format || !ALLOWED_IMAGE_FORMATS.has(meta.format)) {
    throw new PostImageError("รองรับเฉพาะ PNG, JPEG หรือ WebP", 400);
  }

  return sharp(buffer).png().toBuffer();
}

/** Save post image on the app server; returns URL path for DB */
export async function savePostImage(
  postId: string,
  buffer: Buffer
): Promise<string> {
  const dir = getPostsUploadDir();
  await fs.mkdir(dir, { recursive: true });

  const filename = `${postId}.png`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  await clearPostImagePending(postId);

  return withUploadVersion(postImagePublicPath(postId));
}

/** Mark post image as awaiting a real upload (prompt/post modes) */
export async function markPostImagePending(postId: string): Promise<void> {
  const dir = getPostsUploadDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(pendingMarkerPath(postId), "1", "utf8");
}

export async function clearPostImagePending(postId: string): Promise<void> {
  try {
    await fs.unlink(pendingMarkerPath(postId));
  } catch {
    // marker may not exist
  }
}

async function isPostImagePending(postId: string): Promise<boolean> {
  try {
    await fs.access(pendingMarkerPath(postId));
    return true;
  } catch {
    return false;
  }
}

/** Read saved post image bytes (for API route) */
export async function readPostImage(
  filename: string
): Promise<Buffer | null> {
  if (!/^[\w-]+\.png$/i.test(filename)) {
    return null;
  }

  const filePath = path.join(getPostsUploadDir(), filename);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

/** Detect legacy 1×1 red marker or other tiny stub images */
export async function isPlaceholderImageBuffer(
  buffer: Buffer
): Promise<boolean> {
  if (buffer.length <= PLACEHOLDER_IMAGE_MAX_BYTES) {
    return true;
  }
  if (buffer.equals(placeholderImageBuffer())) {
    return true;
  }
  try {
    const meta = await sharp(buffer).metadata();
    if (meta.width === 1 && meta.height === 1) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

export async function getPostImageMeta(postId: string): Promise<PostImageMeta> {
  const pending = await isPostImagePending(postId);
  const buffer = await readPostImage(`${postId}.png`);
  if (!buffer) {
    return { exists: false, isPlaceholder: true, byteLength: 0 };
  }
  const legacyStub = await isPlaceholderImageBuffer(buffer);
  return {
    exists: true,
    isPlaceholder: pending || legacyStub,
    byteLength: buffer.length,
  };
}

/** Full-size neutral canvas for prompt/post modes before a real image is uploaded */
export async function createPendingPostImageBuffer(
  size: DallESize = "1024x1024"
): Promise<Buffer> {
  const { width, height } = PENDING_SIZE_PX[size];
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 226, g: 232, b: 240 },
    },
  })
    .png()
    .toBuffer();
}
