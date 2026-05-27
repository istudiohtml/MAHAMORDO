import { prisma } from "@/lib/prisma";

const THAI_RANGE = /[\u0E00-\u0E7F]/;

/**
 * Build a URL-safe slug from a Thai or English title.
 * - English letters/digits → lowercase, dashes
 * - Thai chars → kept as-is (URL encoding handles them) but stripped of spaces/symbols
 * - Falls back to a short random id when the title is empty after sanitizing.
 */
export function slugifyTitle(title: string): string {
  const cleaned = title
    .normalize("NFC")
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/&/g, "-and-")
    .replace(/[^\p{L}\p{N}\u0E00-\u0E7F]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (cleaned) return cleaned;

  return `article-${Math.random().toString(36).slice(2, 8)}`;
}

/** Suffix with -2, -3, ... until unique in DB */
export async function uniqueArticleSlug(base: string): Promise<string> {
  const slug = slugifyTitle(base);
  let candidate = slug;
  let n = 2;
  while (await prisma.article.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${n++}`;
    if (n > 999) {
      candidate = `${slug}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}

/** True when slug contains Thai characters and should be URI-encoded in links */
export function slugNeedsEncoding(slug: string): boolean {
  return THAI_RANGE.test(slug);
}
