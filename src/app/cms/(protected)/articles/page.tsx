"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cmsFetch, useCms } from "@/components/cms/CmsProvider";

type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt: string | null;
  source: string;
  readingMinutes: number | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: { name: string | null; email: string } | null;
};

type Category = { id: string; label: string };

const STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: "ฉบับร่าง",
  PUBLISHED: "เผยแพร่",
  ARCHIVED: "เก็บไว้",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CmsArticlesPage() {
  const { user } = useCms();
  const isSuper = user?.role === "SUPERADMIN";

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filter, setFilter] = useState<{ category: string; status: string }>({
    category: "",
    status: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filter.category) params.set("category", filter.category);
    if (filter.status) params.set("status", filter.status);
    return params.toString();
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    cmsFetch(`/api/cms/articles${queryString ? `?${queryString}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setArticles(data.articles ?? []);
          setCategories(data.categories ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [queryString]);

  const visibleArticles = useMemo(
    () =>
      showArchived
        ? articles
        : articles.filter((a) => a.status !== "ARCHIVED"),
    [articles, showArchived]
  );

  const stats = useMemo(() => {
    return {
      total: articles.length,
      published: articles.filter((a) => a.status === "PUBLISHED").length,
      draft: articles.filter((a) => a.status === "DRAFT").length,
      archived: articles.filter((a) => a.status === "ARCHIVED").length,
    };
  }, [articles]);

  async function handleSoftDelete(id: string) {
    if (!confirm("เก็บบทความนี้ (ARCHIVED)? — กลับมากู้ได้ภายหลัง")) return;
    setBusyId(id);
    const res = await cmsFetch(`/api/cms/articles/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok && data.article) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "ARCHIVED" as ArticleStatus } : a
        )
      );
    }
    setBusyId(null);
  }

  async function handleHardDelete(id: string) {
    if (!confirm("ลบบทความนี้ถาวร? — ไม่สามารถกู้คืนได้")) return;
    setBusyId(id);
    const res = await cmsFetch(`/api/cms/articles/${id}?hard=1`, {
      method: "DELETE",
    });
    if (res.ok) setArticles((prev) => prev.filter((a) => a.id !== id));
    setBusyId(null);
  }

  async function handleSetStatus(id: string, status: ArticleStatus) {
    setBusyId(id);
    const res = await cmsFetch(`/api/cms/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
      );
    }
    setBusyId(null);
  }

  function categoryLabel(id: string) {
    return categories.find((c) => c.id === id)?.label ?? id;
  }

  return (
    <div className="cms-page cms-articles-page">
      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Articles</p>
          <h1 className="cms-page-title">บทความหน้าเว็บ</h1>
          <p className="cms-page-sub">
            จัดการบทความสาธารณะ — สร้างด้วยตัวเอง, AI ช่วยเขียน, หรือเปิด cron รายวัน
          </p>
        </div>
        <div className="cms-posts-header-actions">
          <Link href="/cms/articles/settings" className="cms-btn cms-btn-ghost">
            ตั้งค่า
          </Link>
          <Link href="/cms/articles/new" className="cms-page-cta">
            + เขียนบทความ
          </Link>
        </div>
      </header>

      <div className="cms-articles-stats">
        <div className="cms-posts-stat">
          <span className="cms-posts-stat-value">{stats.total}</span>
          <span className="cms-posts-stat-label">ทั้งหมด</span>
        </div>
        <div className="cms-posts-stat">
          <span className="cms-posts-stat-value">{stats.published}</span>
          <span className="cms-posts-stat-label">เผยแพร่</span>
        </div>
        <div className="cms-posts-stat">
          <span className="cms-posts-stat-value">{stats.draft}</span>
          <span className="cms-posts-stat-label">ร่าง</span>
        </div>
        <div className="cms-posts-stat">
          <span className="cms-posts-stat-value">{stats.archived}</span>
          <span className="cms-posts-stat-label">เก็บไว้ (ARCHIVED)</span>
        </div>
      </div>

      <div className="cms-articles-filters">
        <label className="cms-articles-filter">
          <span>หมวด</span>
          <select
            className="cms-input"
            value={filter.category}
            onChange={(e) =>
              setFilter((s) => ({ ...s, category: e.target.value }))
            }
          >
            <option value="">ทั้งหมด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="cms-articles-filter">
          <span>สถานะ</span>
          <select
            className="cms-input"
            value={filter.status}
            onChange={(e) => setFilter((s) => ({ ...s, status: e.target.value }))}
          >
            <option value="">ทั้งหมด</option>
            <option value="PUBLISHED">เผยแพร่</option>
            <option value="DRAFT">ร่าง</option>
            <option value="ARCHIVED">เก็บไว้</option>
          </select>
        </label>

        <label className="cms-articles-filter-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <span>แสดงบทความที่เก็บไว้ (ARCHIVED) ด้วย</span>
        </label>
      </div>

      {error && <p className="cms-posts-error">{error}</p>}

      {loading && (
        <div className="cms-articles-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cms-article-card cms-post-card-skeleton">
              <div className="cms-article-card-media skeleton" />
              <div className="cms-article-card-body">
                <div className="skeleton cms-post-skel-line" />
                <div className="skeleton cms-post-skel-line short" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && visibleArticles.length === 0 && !error && (
        <div className="cms-posts-empty">
          <span className="cms-posts-empty-icon">❑</span>
          <h3>ยังไม่มีบทความ</h3>
          <p>เริ่มเขียนบทความแรก หรือเปิด AI ให้ช่วยร่างได้เลย</p>
          <Link href="/cms/articles/new" className="cms-page-cta">
            เขียนบทความแรก
          </Link>
        </div>
      )}

      {!loading && visibleArticles.length > 0 && (
        <div className="cms-articles-grid">
          {visibleArticles.map((a) => {
            const isArchived = a.status === "ARCHIVED";
            return (
              <article
                key={a.id}
                className={`cms-article-card${isArchived ? " is-archived" : ""}`}
              >
                <Link
                  href={`/cms/articles/${a.id}`}
                  className="cms-article-card-link"
                >
                  <div className="cms-article-card-media">
                    {a.coverImageUrl ? (
                      <Image
                        src={a.coverImageUrl}
                        alt={a.title}
                        width={640}
                        height={360}
                        unoptimized
                      />
                    ) : (
                      <div className="cms-article-card-media-empty">
                        ไม่มีรูปปก
                      </div>
                    )}
                    <div className="cms-article-card-badges">
                      <span
                        className={`cms-article-badge cms-article-badge-${a.status.toLowerCase()}`}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                      <span className="cms-article-badge cms-article-badge-cat">
                        {categoryLabel(a.category)}
                      </span>
                      {a.source !== "manual" && (
                        <span className="cms-article-badge cms-article-badge-source">
                          {a.source === "cron" ? "auto" : "AI"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="cms-article-card-body">
                    <h3 className="cms-article-card-title">{a.title}</h3>
                    <p className="cms-article-card-excerpt">{a.excerpt}</p>

                    <footer className="cms-article-card-footer">
                      <span>{fmt(a.publishedAt ?? a.createdAt)}</span>
                      <span>{a.readingMinutes ?? 1} นาที</span>
                      <span>
                        {a.viewCount.toLocaleString("th-TH")} ครั้ง
                      </span>
                    </footer>
                  </div>
                </Link>

                <div className="cms-article-card-actions">
                  <Link
                    href={`/cms/articles/${a.id}`}
                    className="cms-btn cms-btn-sm cms-btn-primary"
                  >
                    เปิด
                  </Link>

                  {/* Quick status change */}
                  {a.status === "DRAFT" && (
                    <button
                      type="button"
                      className="cms-btn cms-btn-sm cms-article-quick-publish"
                      disabled={busyId === a.id}
                      onClick={() => handleSetStatus(a.id, "PUBLISHED")}
                      title="เผยแพร่ทันที"
                    >
                      ↑ เผยแพร่
                    </button>
                  )}
                  {a.status === "PUBLISHED" && (
                    <button
                      type="button"
                      className="cms-btn cms-btn-sm cms-btn-ghost"
                      disabled={busyId === a.id}
                      onClick={() => handleSetStatus(a.id, "DRAFT")}
                      title="ดึงกลับเป็นร่าง"
                    >
                      ↓ ร่าง
                    </button>
                  )}
                  {isArchived ? (
                    <button
                      type="button"
                      className="cms-btn cms-btn-sm cms-btn-ghost"
                      disabled={busyId === a.id}
                      onClick={() => handleSetStatus(a.id, "DRAFT")}
                      title="กู้คืนเป็นร่าง"
                    >
                      ↺ กู้คืน
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="cms-btn cms-btn-sm cms-btn-danger-ghost"
                      disabled={busyId === a.id}
                      onClick={() => handleSoftDelete(a.id)}
                      title="เก็บไว้ (ARCHIVED) — กู้คืนได้"
                    >
                      {busyId === a.id ? "..." : "เก็บ"}
                    </button>
                  )}
                  {isArchived && isSuper && (
                    <button
                      type="button"
                      className="cms-btn cms-btn-sm cms-btn-danger"
                      disabled={busyId === a.id}
                      onClick={() => handleHardDelete(a.id)}
                      title="ลบถาวร (ไม่กู้คืน)"
                    >
                      ✕ ลบถาวร
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
