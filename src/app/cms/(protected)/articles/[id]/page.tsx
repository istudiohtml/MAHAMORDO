"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { cmsFetch, useCms } from "@/components/cms/CmsProvider";

const CATEGORIES = [
  { id: "horoscope", label: "ดวงรายวัน" },
  { id: "tarot", label: "ทาโรต์" },
  { id: "feng_shui", label: "ฮวงจุ้ย" },
  { id: "lucky", label: "เสริมโชค" },
  { id: "general", label: "บทความทั่วไป" },
];

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  coverPrompt: string | null;
  category: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  source: string;
  readingMinutes: number | null;
  viewCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  author: { name: string | null; email: string } | null;
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CmsArticleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { user } = useCms();
  const isSuper = user?.role === "SUPERADMIN";

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // form state mirrors article
  const [form, setForm] = useState<Partial<Article>>({});

  useEffect(() => {
    cmsFetch(`/api/cms/articles/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setArticle(data);
          setForm({
            ...data,
            tags: Array.isArray(data.tags) ? data.tags : [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!article) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const res = await cmsFetch(`/api/cms/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          tags: form.tags,
          category: form.category,
          status: form.status,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          slug: form.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setArticle(data);
      setForm(data);
      setInfo("บันทึกแล้ว");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadCover(file: File) {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const fd = new FormData();
      fd.set("cover", file);
      const res = await cmsFetch(`/api/cms/articles/${id}`, {
        method: "PATCH",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setArticle(data);
      setForm(data);
      setInfo("อัปโหลดรูปปกแล้ว");
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSoftDelete() {
    if (!confirm("เก็บบทความนี้ (ARCHIVED)? — กลับมากู้ได้ภายหลัง")) return;
    setSaving(true);
    const res = await cmsFetch(`/api/cms/articles/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/cms/articles");
    setSaving(false);
  }

  async function handleHardDelete() {
    if (
      !confirm(
        "ลบบทความนี้ถาวร? ข้อมูลและรูปปกจะหายไปทันที — ไม่สามารถกู้คืนได้"
      )
    )
      return;
    setSaving(true);
    const res = await cmsFetch(`/api/cms/articles/${id}?hard=1`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/cms/articles");
    setSaving(false);
  }

  async function handleQuickStatus(status: Article["status"]) {
    if (!article) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const res = await cmsFetch(`/api/cms/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เปลี่ยนสถานะไม่สำเร็จ");
      setArticle(data);
      setForm((s) => ({ ...s, status: data.status }));
      setInfo(`เปลี่ยนสถานะเป็น ${data.status} แล้ว`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="cms-page">
        <p className="cms-loading-text">กำลังโหลด...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="cms-page">
        <p className="cms-posts-error">{error || "ไม่พบบทความ"}</p>
        <Link href="/cms/articles" className="cms-btn cms-btn-ghost">
          ← กลับ
        </Link>
      </div>
    );
  }

  return (
    <div className="cms-page cms-article-editor">
      <Link
        href="/cms/articles"
        className="text-sm text-slate-500 hover:text-slate-900 no-underline"
      >
        ← กลับรายการบทความ
      </Link>

      <header className="cms-page-header" style={{ marginTop: "0.75rem" }}>
        <div>
          <p className="cms-page-eyebrow">
            {article.source === "ai"
              ? "AI generated"
              : article.source === "cron"
                ? "Auto cron"
                : "Manual"}
            {" · "}
            {article.viewCount.toLocaleString("th-TH")} views
          </p>
          <h1 className="cms-page-title">แก้ไขบทความ</h1>
          <p className="cms-page-sub">
            slug: <code>{article.slug}</code> · สร้างเมื่อ {fmt(article.createdAt)}
          </p>
        </div>
        <div className="cms-posts-header-actions">
          <Link
            href={`/cms/articles/${id}/preview`}
            target="_blank"
            className="cms-btn cms-btn-ghost"
          >
            👁 ดูตัวอย่าง
          </Link>
          {article.status === "PUBLISHED" && (
            <Link
              href={`/articles/${encodeURIComponent(article.slug)}`}
              target="_blank"
              className="cms-btn cms-btn-ghost"
            >
              ↗ ดูในเว็บ
            </Link>
          )}
          {article.status !== "ARCHIVED" ? (
            <button
              type="button"
              className="cms-btn cms-btn-danger-ghost"
              onClick={handleSoftDelete}
              disabled={saving}
              title="เก็บไว้ (ARCHIVED) — กลับมากู้ได้"
            >
              เก็บ
            </button>
          ) : isSuper ? (
            <button
              type="button"
              className="cms-btn cms-btn-danger"
              onClick={handleHardDelete}
              disabled={saving}
              title="ลบถาวร — กู้ไม่ได้"
            >
              ✕ ลบถาวร
            </button>
          ) : null}
        </div>
      </header>

      <section className="cms-article-status-bar">
        <span className="cms-article-status-current">
          สถานะปัจจุบัน:{" "}
          <strong className={`cms-article-status-${article.status.toLowerCase()}`}>
            {article.status === "DRAFT"
              ? "ฉบับร่าง"
              : article.status === "PUBLISHED"
                ? "เผยแพร่"
                : "เก็บไว้ (ARCHIVED)"}
          </strong>
        </span>
        <div className="cms-article-status-pills">
          <button
            type="button"
            className={`cms-article-status-pill${article.status === "DRAFT" ? " active" : ""}`}
            disabled={saving || article.status === "DRAFT"}
            onClick={() => handleQuickStatus("DRAFT")}
          >
            ฉบับร่าง
          </button>
          <button
            type="button"
            className={`cms-article-status-pill${article.status === "PUBLISHED" ? " active" : ""}`}
            disabled={saving || article.status === "PUBLISHED"}
            onClick={() => handleQuickStatus("PUBLISHED")}
          >
            เผยแพร่
          </button>
          <button
            type="button"
            className={`cms-article-status-pill${article.status === "ARCHIVED" ? " active" : ""}`}
            disabled={saving || article.status === "ARCHIVED"}
            onClick={() => handleQuickStatus("ARCHIVED")}
          >
            เก็บไว้
          </button>
        </div>
      </section>

      <section className="cms-article-form-card">
        <div className="cms-article-cover">
          {article.coverImageUrl ? (
            <Image
              key={article.coverImageUrl}
              src={article.coverImageUrl}
              alt={article.title}
              width={1200}
              height={675}
              unoptimized
            />
          ) : (
            <div className="cms-article-cover-empty">ยังไม่มีรูปปก</div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUploadCover(f);
            }}
          />
          <button
            type="button"
            className="cms-btn cms-btn-ghost cms-article-cover-btn"
            onClick={() => fileRef.current?.click()}
            disabled={saving}
          >
            อัปโหลดรูปปก
          </button>
        </div>

        <div className="cms-article-form-row">
          <label className="cms-article-form-field">
            <span>หัวข้อ</span>
            <input
              className="cms-input"
              value={form.title ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, title: e.target.value }))
              }
              maxLength={200}
            />
          </label>
          <label className="cms-article-form-field">
            <span>Slug (URL)</span>
            <input
              className="cms-input"
              value={form.slug ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, slug: e.target.value }))
              }
            />
          </label>
        </div>

        <div className="cms-article-form-row">
          <label className="cms-article-form-field">
            <span>หมวด</span>
            <select
              className="cms-input"
              value={form.category ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, category: e.target.value }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="cms-article-form-field">
            <span>สถานะ</span>
            <select
              className="cms-input"
              value={form.status ?? "DRAFT"}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  status: e.target.value as Article["status"],
                }))
              }
            >
              <option value="DRAFT">ร่าง</option>
              <option value="PUBLISHED">เผยแพร่</option>
              <option value="ARCHIVED">เก็บไว้</option>
            </select>
          </label>
        </div>

        <label className="cms-article-form-field">
          <span>สรุปย่อ (excerpt)</span>
          <textarea
            className="cms-textarea"
            rows={2}
            value={form.excerpt ?? ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, excerpt: e.target.value }))
            }
            maxLength={220}
          />
        </label>

        <label className="cms-article-form-field">
          <span>เนื้อหา (Markdown)</span>
          <textarea
            className="cms-textarea cms-article-content-textarea"
            rows={20}
            value={form.content ?? ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, content: e.target.value }))
            }
          />
        </label>

        <label className="cms-article-form-field">
          <span>Tags (คั่นด้วยจุลภาค)</span>
          <input
            className="cms-input"
            value={(form.tags ?? []).join(", ")}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              }))
            }
          />
        </label>

        <div className="cms-article-form-row">
          <label className="cms-article-form-field">
            <span>SEO title</span>
            <input
              className="cms-input"
              value={form.seoTitle ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, seoTitle: e.target.value }))
              }
              maxLength={70}
            />
          </label>
          <label className="cms-article-form-field">
            <span>SEO description</span>
            <input
              className="cms-input"
              value={form.seoDescription ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, seoDescription: e.target.value }))
              }
              maxLength={180}
            />
          </label>
        </div>

        {info && <p className="cms-article-info">{info}</p>}
        {error && <p className="cms-article-error">{error}</p>}

        <div className="cms-article-actions">
          <Link href="/cms/articles" className="cms-btn cms-btn-ghost">
            ปิด
          </Link>
          <button
            type="button"
            className="cms-btn cms-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </section>
    </div>
  );
}
