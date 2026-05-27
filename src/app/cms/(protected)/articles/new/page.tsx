"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cmsFetch } from "@/components/cms/CmsProvider";

const CATEGORIES = [
  { id: "horoscope", label: "ดวงรายวัน" },
  { id: "tarot", label: "ทาโรต์" },
  { id: "feng_shui", label: "ฮวงจุ้ย" },
  { id: "lucky", label: "เสริมโชค" },
  { id: "general", label: "บทความทั่วไป" },
];

type Draft = {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  imagePrompt: string;
  seoTitle: string;
  seoDescription: string;
};

export default function CmsArticleNewPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [category, setCategory] = useState("horoscope");
  const [topicHint, setTopicHint] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");

  const [draft, setDraft] = useState<Draft>({
    title: "",
    excerpt: "",
    content: "",
    tags: [],
    imagePrompt: "",
    seoTitle: "",
    seoDescription: "",
  });

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setInfo("");
    try {
      const res = await cmsFetch("/api/cms/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, topicHint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI ไม่ตอบสนอง");
      setDraft({
        title: data.title ?? "",
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        tags: data.tags ?? [],
        imagePrompt: data.imagePrompt ?? "",
        seoTitle: data.seoTitle ?? "",
        seoDescription: data.seoDescription ?? "",
      });
      setMode("manual");
      setInfo("AI ร่างบทความเรียบร้อย — ตรวจทานก่อนบันทึกได้");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (mode === "ai") {
      setSaving(true);
      setError("");
      try {
        const res = await cmsFetch("/api/cms/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "ai",
            category,
            topicHint,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
        router.push(`/cms/articles/${data.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!draft.title.trim() || !draft.content.trim()) {
      setError("ต้องระบุ title และเนื้อหา");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await cmsFetch("/api/cms/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          category,
          status,
          title: draft.title,
          excerpt: draft.excerpt,
          content: draft.content,
          tags: draft.tags,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      router.push(`/cms/articles/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
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
          <p className="cms-page-eyebrow">เขียนบทความใหม่</p>
          <h1 className="cms-page-title">บทความหน้าเว็บ</h1>
          <p className="cms-page-sub">
            เลือกโหมด AI ให้ช่วยร่าง หรือเขียนเองทั้งหมด
          </p>
        </div>
      </header>

      <div className="cms-article-mode">
        <button
          type="button"
          className={`cms-article-mode-btn${mode === "ai" ? " active" : ""}`}
          onClick={() => setMode("ai")}
        >
          ✨ AI ช่วยร่าง
        </button>
        <button
          type="button"
          className={`cms-article-mode-btn${mode === "manual" ? " active" : ""}`}
          onClick={() => setMode("manual")}
        >
          ✎ เขียนเอง
        </button>
      </div>

      <section className="cms-article-form-card">
        <div className="cms-article-form-row">
          <label className="cms-article-form-field">
            <span>หมวด</span>
            <select
              className="cms-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          {mode === "manual" && (
            <label className="cms-article-form-field">
              <span>สถานะตอนบันทึก</span>
              <select
                className="cms-input"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "DRAFT" | "PUBLISHED")
                }
              >
                <option value="DRAFT">ร่าง</option>
                <option value="PUBLISHED">เผยแพร่ทันที</option>
              </select>
            </label>
          )}
        </div>

        {mode === "ai" && (
          <label className="cms-article-form-field">
            <span>
              หัวข้อ/มุมมองที่อยากให้ AI เขียน (ไม่บังคับ — เว้นว่างจะสุ่มอัตโนมัติ)
            </span>
            <div className="cms-article-topic-row">
              <input
                className="cms-input"
                placeholder="เช่น ดวงราศีกรกฎสัปดาห์นี้ เรื่องการงาน"
                value={topicHint}
                onChange={(e) => setTopicHint(e.target.value)}
              />
              <button
                type="button"
                className="cms-btn cms-btn-ghost"
                onClick={async () => {
                  const res = await cmsFetch(
                    `/api/cms/articles/topics?category=${encodeURIComponent(category)}`
                  );
                  const data = await res.json();
                  if (data.topic) setTopicHint(data.topic);
                }}
                title="สุ่มหัวข้อจากคลัง"
              >
                🎲 สุ่มหัวข้อ
              </button>
            </div>
            <p className="cms-article-topic-hint">
              เว้นว่างไว้ระบบจะสุ่มหัวข้อตามหมวดให้อัตโนมัติ
            </p>
            <button
              type="button"
              className="cms-btn cms-btn-primary cms-article-generate-btn"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "กำลังเขียน..." : "✨ ให้ AI ร่างให้"}
            </button>
          </label>
        )}

        {mode === "manual" && (
          <>
            <label className="cms-article-form-field">
              <span>หัวข้อ</span>
              <input
                className="cms-input"
                value={draft.title}
                onChange={(e) =>
                  setDraft((s) => ({ ...s, title: e.target.value }))
                }
                placeholder="ใส่หัวข้อบทความ"
                maxLength={200}
              />
            </label>
            <label className="cms-article-form-field">
              <span>สรุปย่อ (excerpt)</span>
              <textarea
                className="cms-textarea"
                rows={2}
                value={draft.excerpt}
                onChange={(e) =>
                  setDraft((s) => ({ ...s, excerpt: e.target.value }))
                }
                placeholder="1-2 ประโยคสำหรับ preview"
                maxLength={220}
              />
            </label>
            <label className="cms-article-form-field">
              <span>เนื้อหา (Markdown)</span>
              <textarea
                className="cms-textarea"
                rows={14}
                value={draft.content}
                onChange={(e) =>
                  setDraft((s) => ({ ...s, content: e.target.value }))
                }
                placeholder={`# หัวข้อหลัก\n\nย่อหน้าแรก...\n\n## หัวข้อย่อย\n- รายการ`}
              />
            </label>
            <label className="cms-article-form-field">
              <span>Tags (คั่นด้วยจุลภาค)</span>
              <input
                className="cms-input"
                value={draft.tags.join(", ")}
                onChange={(e) =>
                  setDraft((s) => ({
                    ...s,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="ดวง, ทาโรต์, ราศีกรกฎ"
              />
            </label>
            <div className="cms-article-form-row">
              <label className="cms-article-form-field">
                <span>SEO title</span>
                <input
                  className="cms-input"
                  value={draft.seoTitle}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, seoTitle: e.target.value }))
                  }
                  maxLength={70}
                />
              </label>
              <label className="cms-article-form-field">
                <span>SEO description</span>
                <input
                  className="cms-input"
                  value={draft.seoDescription}
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      seoDescription: e.target.value,
                    }))
                  }
                  maxLength={180}
                />
              </label>
            </div>
          </>
        )}

        {info && <p className="cms-article-info">{info}</p>}
        {error && <p className="cms-article-error">{error}</p>}

        <div className="cms-article-actions">
          <Link href="/cms/articles" className="cms-btn cms-btn-ghost">
            ยกเลิก
          </Link>
          <button
            type="button"
            className="cms-btn cms-btn-primary"
            onClick={handleSave}
            disabled={saving || generating}
          >
            {saving
              ? "กำลังบันทึก..."
              : mode === "ai"
                ? "✨ ให้ AI สร้าง + บันทึก"
                : "บันทึกบทความ"}
          </button>
        </div>
      </section>
    </div>
  );
}
