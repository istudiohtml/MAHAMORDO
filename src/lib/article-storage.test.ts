import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";

let tmpRoot = "";

beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mahamordo-articles-"));
  process.env.UPLOAD_DIR = tmpRoot;
});

afterAll(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function makePng(size = 600): Promise<Buffer> {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 200, g: 150, b: 80 },
    },
  })
    .png()
    .toBuffer();
}

describe("article-storage", () => {
  it("normalizes uploads to JPEG within size cap", async () => {
    const { normalizeArticleCoverUpload, ArticleImageError } = await import(
      "./article-storage"
    );

    const png = await makePng(800);
    const jpeg = await normalizeArticleCoverUpload(png);
    const meta = await sharp(jpeg).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBeLessThanOrEqual(1600);

    await expect(
      normalizeArticleCoverUpload(Buffer.alloc(10))
    ).rejects.toBeInstanceOf(ArticleImageError);
  });

  it("saves to UPLOAD_DIR/articles/<id>.jpg and reads it back", async () => {
    const { saveArticleCover, readArticleCover, deleteArticleCover } =
      await import("./article-storage");
    const id = "abc123";
    const png = await makePng(400);

    const url = await saveArticleCover(id, png);
    expect(url).toBe(`/api/uploads/articles/${id}.jpg`);

    const written = await readArticleCover(`${id}.jpg`);
    expect(written?.length).toBeGreaterThan(0);

    expect(await readArticleCover("../etc/passwd.jpg")).toBeNull();

    await deleteArticleCover(id);
    expect(await readArticleCover(`${id}.jpg`)).toBeNull();
  });
});
