import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCategory } from "@/lib/article-content";
import { renderMarkdown } from "@/lib/markdown";
import { parseTags } from "@/lib/article-tags";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ฉบับร่าง",
  PUBLISHED: "เผยแพร่",
  ARCHIVED: "เก็บไว้",
};

export default async function CmsArticlePreviewPage({ params }: Params) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

  if (!article) notFound();

  const cat = getCategory(article.category);
  const html = renderMarkdown(article.content);

  return (
    <div className="articles-page article-detail-page">
      <div className="cms-preview-bar">
        <div className="cms-preview-bar-inner">
          <span className="cms-preview-bar-badge">PREVIEW</span>
          <span className="cms-preview-bar-text">
            กำลังดูตัวอย่างบทความ — สถานะ:{" "}
            <strong>{STATUS_LABEL[article.status] ?? article.status}</strong>
            {article.status !== "PUBLISHED" && " (ยังไม่ปรากฏบนเว็บสาธารณะ)"}
          </span>
          <div className="cms-preview-bar-actions">
            <Link
              href={`/cms/articles/${id}`}
              className="cms-btn cms-btn-sm cms-btn-ghost"
            >
              ← กลับไปแก้ไข
            </Link>
            {article.status === "PUBLISHED" && (
              <Link
                href={`/articles/${encodeURIComponent(article.slug)}`}
                target="_blank"
                className="cms-btn cms-btn-sm cms-btn-primary"
              >
                ↗ เปิดในเว็บจริง
              </Link>
            )}
          </div>
        </div>
      </div>

      <article className="article-detail">
        <header className="article-detail-head">
          <p className="article-detail-meta">
            <span className="articles-pill">{cat.label}</span>
            <span className="articles-dot">·</span>
            <span>{fmtDate(article.publishedAt ?? article.createdAt)}</span>
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
          className="article-detail-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {(() => {
          const tagList = parseTags(article.tags);
          return tagList.length > 0 ? (
            <ul className="article-detail-tags">
              {tagList.map((t) => (
                <li key={t}>
                  <span className="articles-pill articles-pill-sm">#{t}</span>
                </li>
              ))}
            </ul>
          ) : null;
        })()}
      </article>
    </div>
  );
}
