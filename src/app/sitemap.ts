import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://mahamordo.com'

// Static, public-facing routes worth indexing. Auth/CMS/dashboard pages are
// excluded — robots.ts disallows them as well.
const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/thai-astrology', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/saju', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/tarot', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/articles', changeFrequency: 'daily', priority: 0.9 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/pdpa', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
]

// Cache sitemap for crawlers; static routes always included even if DB is slow.
export const revalidate = 3600

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('sitemap db timeout')), ms)
    }),
  ])
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Pull published articles — sitemap is regenerated per request, so DB
  // failures should never break crawling. Fall back to just the static set.
  let articleEntries: MetadataRoute.Sitemap = []
  try {
    const articles = await withTimeout(
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
        },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 1000,
      }),
      3000
    )
    articleEntries = articles.map((a) => ({
      url: `${SITE_URL}/articles/${encodeURIComponent(a.slug)}`,
      lastModified: a.updatedAt ?? a.publishedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch {
    articleEntries = []
  }

  return [...staticEntries, ...articleEntries]
}
