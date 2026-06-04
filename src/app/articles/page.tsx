import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  ARTICLE_CATEGORIES,
  getCategory,
} from "@/lib/article-content";
import { getArticleSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type SearchParams = {
  category?: string;
  page?: string;
  tag?: string;
};

function fmtDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlesIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const settings = await getArticleSettings();

  if (!settings.enabled) {
    return (
      <main className="articles-page">
        <section className="articles-empty">
          <h1>ยังไม่เปิดให้บริการบทความ</h1>
          <p>กลับไปที่หน้าแรกได้ที่ <Link href="/">มหาหมอดู</Link></p>
        </section>
      </main>
    );
  }

  const page = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1
  );
  const category = params.category;
  const tag = params.tag;

  const where = {
    status: "PUBLISHED" as const,
    publishedAt: { lte: new Date() },
    ...(category ? { category } : {}),
    ...(tag ? { tags: { array_contains: tag } } : {}),
  };

  const [articles, total, featured] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.article.count({ where }),
    page === 1 && !category && !tag
      ? prisma.article.findFirst({
          where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
          orderBy: { publishedAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rest = featured
    ? articles.filter((a) => a.id !== featured.id)
    : articles;

  return (
    <main className="articles-page">
      <header className="articles-hero">
        <div className="articles-hero-inner">
          <p className="articles-eyebrow thai-font">บทความ · มหาหมอดู</p>
          <h1 className="articles-hero-title thai-font">
            อ่านดวง วันใหม่ ทุกเช้า
          </h1>
          <p className="articles-hero-sub">
            บทความดูดวง ทาโรต์ ฮวงจุ้ย และเสริมโชค คัดสรรโดยทีมงานและ AI
            ของมหาหมอดู — อัปเดตใหม่ทุกวัน
          </p>

          <nav className="articles-cats" aria-label="หมวดบทความ">
            <Link
              href="/articles"
              className={`articles-cat${!category ? " active" : ""}`}
            >
              ทั้งหมด
            </Link>
            {ARTICLE_CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/articles?category=${c.id}`}
                className={`articles-cat${category === c.id ? " active" : ""}`}
              >
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="articles-content">
        {featured && (
          <Link
            href={`/articles/${encodeURIComponent(featured.slug)}`}
            className="articles-featured"
          >
            <div className="articles-featured-media">
              {featured.coverImageUrl ? (
                <Image
                  src={featured.coverImageUrl}
                  alt={featured.title}
                  width={1280}
                  height={720}
                  priority
                  unoptimized
                />
              ) : (
                <div className="articles-featured-media-empty" />
              )}
            </div>
            <div className="articles-featured-body">
              <p className="articles-featured-meta">
                <span className="articles-pill">
                  {getCategory(featured.category).label}
                </span>
                <span className="articles-dot">·</span>
                <span>{fmtDate(featured.publishedAt)}</span>
                {featured.readingMinutes ? (
                  <>
                    <span className="articles-dot">·</span>
                    <span>{featured.readingMinutes} นาที</span>
                  </>
                ) : null}
              </p>
              <h2 className="articles-featured-title thai-font">{featured.title}</h2>
              <p className="articles-featured-excerpt">{featured.excerpt}</p>
              <span className="articles-featured-cta">อ่านบทความ →</span>
            </div>
          </Link>
        )}

        {rest.length === 0 && !featured && (
          <div className="articles-empty">
            <h2 className="thai-font">ยังไม่มีบทความในหมวดนี้</h2>
            <p>ลองดูหมวดอื่น หรือกลับมาใหม่ในเช้าวันถัดไป</p>
            <Link href="/articles" className="articles-empty-cta">
              ดูบทความทั้งหมด
            </Link>
          </div>
        )}

        {rest.length > 0 && (
          <div className="articles-grid">
            {rest.map((a) => (
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
                  {a.readingMinutes ? (
                    <p className="articles-card-foot">
                      อ่าน ~{a.readingMinutes} นาที
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav className="articles-pagination" aria-label="หน้า">
            {Array.from({ length: pageCount }).map((_, i) => {
              const n = i + 1;
              const url = new URLSearchParams();
              if (category) url.set("category", category);
              if (tag) url.set("tag", tag);
              if (n > 1) url.set("page", String(n));
              const href = url.toString()
                ? `/articles?${url.toString()}`
                : "/articles";
              return (
                <Link
                  key={n}
                  href={href}
                  className={`articles-page-btn${n === page ? " active" : ""}`}
                >
                  {n}
                </Link>
              );
            })}
          </nav>
        )}

        <footer className="articles-footer">
          <Link href="/" className="articles-footer-link">
            ← กลับสู่มหาหมอดู
          </Link>
        </footer>
      </section>
    </main>
  );
}
