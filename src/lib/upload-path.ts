import path from "path";

/**
 * Root directory for user-uploaded files (fortune post images).
 * On DigitalOcean/VPS: mount a persistent volume and set UPLOAD_DIR, e.g.
 *   UPLOAD_DIR=/var/lib/mahamordo/uploads
 */
export function getUploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "data", "uploads");
}

export function getPostsUploadDir(): string {
  return path.join(getUploadRoot(), "posts");
}

export function getOraclesUploadDir(): string {
  return path.join(getUploadRoot(), "oracles");
}

export function getArticlesUploadDir(): string {
  return path.join(getUploadRoot(), "articles");
}

/** Public URL path served by GET /api/uploads/posts/[filename] */
export function postImagePublicPath(postId: string): string {
  return `/api/uploads/posts/${postId}.png`;
}

/** Public URL path served by GET /api/uploads/oracles/[filename] */
export function oraclePosterPublicPath(slug: string): string {
  return `/api/uploads/oracles/${slug}.jpg`;
}

/** Public URL path served by GET /api/uploads/articles/[filename] */
export function articleCoverPublicPath(articleId: string): string {
  return `/api/uploads/articles/${articleId}.jpg`;
}
