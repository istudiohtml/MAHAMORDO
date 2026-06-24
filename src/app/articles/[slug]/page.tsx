import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCategory } from "@/lib/article-content";
import { getArticleSettings } from "@/lib/system-settings";
import { renderMarkdown } from "@/lib/markdown";
import { parseTags } from "@/lib/article-tags";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function findPublishedArticle(slug: string) {
  return prisma.article.findFirst({
    where: {
      slug: decodeURIComponent(slug),
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
    },
    include: { author: { select: { name: true } } },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await findPublishedArticle(slug);
  if (!article) return { title: "ไม่พบบทความ — มาหาหมอดู" };

  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.excerpt;
  const image = article.coverImageUrl ?? undefined;

  return {
    title: `${title} — มาหาหมอดู`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

function fmtDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticleDetailPage({ params }: Params) {
  const { slug } = await params;
  const settings = await getArticleSettings();
  if (!settings.enabled) notFound();

  const article = await findPublishedArticle(slug);
  if (!article) notFound();

  // best-effort view bump
  prisma.article
    .update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  const related = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      category: article.category,
      id: { not: article.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const cat = getCategory(article.category);
  const html = renderMarkdown(article.content);

  return (
    <main className="articles-page article-detail-page">
      <article className="article-detail">
        <Link href="/articles" className="article-detail-back">
          ← บทความทั้งหมด
        </Link>

        <header className="article-detail-head">
          <p className="article-detail-meta">
            <Link
              href={`/articles?category=${cat.id}`}
              className="articles-pill"
            >
              {cat.label}
            </Link>
            <span className="articles-dot">·</span>
            <span>{fmtDate(article.publishedAt)}</span>
            {article.readingMinutes ? (
              <>
                <span className="articles-dot">·</span>
                <span>อ่าน ~{article.readingMinutes} นาที</span>
              </>
            ) : null}
          </p>
          <h1 className="article-detail-title thai-font">{article.title}</h1>
          {article.excerpt && (
            <p className="article-detail-excerpt">{article.excerpt}</p>
          )}
          {article.author?.name && (
            <p className="article-detail-author">โดย {article.author.name}</p>
          )}
        </header>

        {article.coverImageUrl && (
          <div className="article-detail-cover">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              width={1600}
              height={900}
              priority
              unoptimized
            />
          </div>
        )}

        <div
          className="article-detail-body prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {(() => {
          const tagList = parseTags(article.tags);
          return tagList.length > 0 ? (
            <ul className="article-detail-tags">
              {tagList.map((t) => (
                <li key={t}>
                  <Link
                    href={`/articles?tag=${encodeURIComponent(t)}`}
                    className="articles-pill articles-pill-sm"
                  >
                    #{t}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null;
        })()}
      </article>

      {related.length > 0 && (
        <section className="article-related">
          <h2 className="article-related-title thai-font">บทความใกล้เคียง</h2>
          <div className="articles-grid">
            {related.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${encodeURIComponent(a.slug)}`}
                className="articles-card"
              >
                <div className="articles-card-media">
                  {a.coverImageUrl ? (
                    <Image
                      src={a.coverImageUrl}
                      alt={a.title}
                      width={640}
                      height={360}
                      unoptimized
                    />
                  ) : (
                    <div className="articles-card-media-empty" />
                  )}
                </div>
                <div className="articles-card-body">
                  <p className="articles-card-meta">
                    <span className="articles-pill articles-pill-sm">
                      {getCategory(a.category).label}
                    </span>
                    <span>{fmtDate(a.publishedAt)}</span>
                  </p>
                  <h3 className="articles-card-title thai-font">{a.title}</h3>
                  <p className="articles-card-excerpt">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="articles-footer">
        <Link href="/" className="articles-footer-link">
          ← กลับสู่มาหาหมอดู
        </Link>
      </footer>
    </main>
  );
}
