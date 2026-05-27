"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cmsFetch } from "@/components/cms/CmsProvider";
import { oraclePosterSrc } from "@/lib/oracle-assets";

interface OracleForm {
  slug: string;
  name: string;
  title: string;
  description: string;
  speciality: string;
  systemPrompt: string;
  creditCost: number;
  isActive: boolean;
  sortOrder: number;
  posterUrl: string | null;
}

const SPECIALITIES = [
  "โหราศาสตร์ไทย",
  "ซาจูเกาหลี",
  "ไพ่ทาโรต์",
  "ศาสตร์มืด",
] as const;

export default function EditOraclePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<OracleForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterVersion, setPosterVersion] = useState(0);
  const [promptExpanded, setPromptExpanded] = useState(true);

  useEffect(() => {
    cmsFetch(`/api/cms/oracles/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setForm(data);
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!posterFile) {
      setPosterPreview(null);
      return;
    }
    const url = URL.createObjectURL(posterFile);
    setPosterPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [posterFile]);

  const posterSrc = useMemo(() => {
    if (posterPreview) return posterPreview;
    if (!form?.slug) return null;
    return oraclePosterSrc(form.slug, form.posterUrl, posterVersion);
  }, [form?.slug, form?.posterUrl, posterPreview, posterVersion]);

  const dirty = Boolean(posterFile);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      let res: Response;

      if (posterFile) {
        const body = new FormData();
        body.append("name", form.name);
        body.append("title", form.title);
        body.append("description", form.description);
        body.append("speciality", form.speciality);
        body.append("systemPrompt", form.systemPrompt);
        body.append("isActive", String(form.isActive));
        body.append("sortOrder", String(form.sortOrder));
        body.append("poster", posterFile);
        res = await cmsFetch(`/api/cms/oracles/${id}`, { method: "PUT", body });
      } else {
        res = await cmsFetch(`/api/cms/oracles/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            title: form.title,
            description: form.description,
            speciality: form.speciality,
            systemPrompt: form.systemPrompt,
            isActive: form.isActive,
            sortOrder: form.sortOrder,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        setSaving(false);
        return;
      }

      setForm(data);
      setPosterFile(null);
      setPosterVersion((v) => v + 1);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="cms-page cms-oracle-edit-page">
        <p className="cms-oracle-edit-loading">กำลังโหลด...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="cms-page cms-oracle-edit-page">
        <p className="cms-oracle-edit-error">{error || "ไม่พบหมอดู"}</p>
        <Link href="/cms/oracles" className="cms-oracle-edit-back">
          ← กลับรายการหมอดู
        </Link>
      </div>
    );
  }

  return (
    <div className="cms-page cms-oracle-edit-page">
      <Link href="/cms/oracles" className="cms-oracle-edit-back">
        ← กลับรายการหมอดู
      </Link>

      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Oracles</p>
          <h1 className="cms-page-title">{form.name}</h1>
          <p className="cms-page-sub">
            แก้ไขข้อมูล · <code className="cms-oracle-edit-slug">{form.slug}</code>
          </p>
        </div>
      </header>

      <div className="cms-oracle-edit-layout">
        <aside className="cms-oracle-edit-preview-col">
          <div className="cms-oracle-edit-poster-wrap">
            <div className={`fs-poster fs-theme-${form.slug === "mae-mor-jan" ? "moon" : form.slug === "por-mor-son" ? "saju" : "rahu"} cms-oracle-edit-poster`}>
              {posterSrc && (
                <>
                  <img
                    src={posterSrc}
                    alt={form.name}
                    className="fs-poster-img"
                  />
                  <div className="fs-poster-overlay" aria-hidden="true" />
                  <div className="fs-poster-bottom">
                    <h2 className="fs-poster-name">{form.name}</h2>
                    <p className="fs-poster-subtitle thai-font">{form.title}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="cms-oracle-edit-poster-upload">
            <p className="cms-oracle-edit-poster-label">รูปบนหน้าเลือกหมอดู</p>
            <label className="cms-oracle-edit-file-label">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="cms-oracle-edit-file-input"
                disabled={saving}
                onChange={(e) => {
                  setPosterFile(e.target.files?.[0] ?? null);
                  setError("");
                  setSaved(false);
                }}
              />
              <span className="cms-btn cms-btn-sm cms-btn-ghost">
                เลือกรูปใหม่
              </span>
            </label>
            <p className="cms-oracle-edit-file-hint">
              JPG, PNG หรือ WebP — สูงสุด 5 MB
              {posterFile ? ` · ${posterFile.name}` : ""}
            </p>
          </div>
        </aside>

        <div className="cms-oracle-edit-form-col">
          <section className="cms-oracle-edit-section">
            <h2 className="cms-oracle-edit-section-title">ข้อมูลพื้นฐาน</h2>
            <div className="cms-oracle-edit-fields">
              <label className="cms-composer-field">
                <span className="cms-composer-label">ชื่อหมอดู</span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, name: e.target.value })
                  }
                  className="cms-oracle-edit-input"
                />
              </label>

              <label className="cms-composer-field">
                <span className="cms-composer-label">คำบรรยาย (title)</span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, title: e.target.value })
                  }
                  className="cms-oracle-edit-input"
                />
              </label>

              <label className="cms-composer-field">
                <span className="cms-composer-label">คำอธิบายสั้น</span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, description: e.target.value })
                  }
                  rows={3}
                  className="cms-oracle-edit-textarea"
                />
              </label>

              <label className="cms-composer-field">
                <span className="cms-composer-label">สาย / ความเชี่ยวชาญ</span>
                <select
                  value={form.speciality}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, speciality: e.target.value })
                  }
                  className="cms-oracle-edit-input"
                >
                  {SPECIALITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {!SPECIALITIES.includes(
                    form.speciality as (typeof SPECIALITIES)[number]
                  ) && (
                    <option value={form.speciality}>{form.speciality}</option>
                  )}
                </select>
              </label>
            </div>
          </section>

          <section className="cms-oracle-edit-section cms-oracle-edit-section-prompt">
            <div className="cms-oracle-edit-section-head">
              <h2 className="cms-oracle-edit-section-title">System prompt</h2>
              <button
                type="button"
                className="cms-oracle-edit-toggle"
                onClick={() => setPromptExpanded((v) => !v)}
              >
                {promptExpanded ? "ย่อ" : "ขยาย"}
              </button>
            </div>
            {promptExpanded && (
              <textarea
                value={form.systemPrompt}
                onChange={(e) =>
                  setForm((f) => f && { ...f, systemPrompt: e.target.value })
                }
                className="cms-oracle-edit-prompt"
                spellCheck={false}
              />
            )}
          </section>

          <section className="cms-oracle-edit-section">
            <h2 className="cms-oracle-edit-section-title">ตั้งค่า</h2>
            <div className="cms-oracle-edit-settings-grid">
              <label className="cms-composer-field">
                <span className="cms-composer-label">ค่าเครดิต / session</span>
                <input
                  type="number"
                  min={0}
                  value={form.creditCost}
                  readOnly
                  className="cms-oracle-edit-input cms-oracle-edit-input-readonly"
                  title="แก้ไขค่าเครดิตผ่านฐานข้อมูลโดยตรง"
                />
              </label>

              <label className="cms-composer-field">
                <span className="cms-composer-label">ลำดับแสดงผล</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) =>
                      f
                        ? { ...f, sortOrder: parseInt(e.target.value, 10) || 0 }
                        : f
                    )
                  }
                  className="cms-oracle-edit-input"
                />
              </label>

              <label className="cms-oracle-edit-toggle-field">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, isActive: e.target.checked })
                  }
                />
                <span>เปิดใช้งานบนหน้าเว็บ</span>
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className="cms-oracle-edit-savebar">
        <div className="cms-oracle-edit-savebar-inner">
          {error && <p className="cms-oracle-edit-savebar-error">{error}</p>}
          {!error && saved && (
            <p className="cms-oracle-edit-savebar-success">บันทึกเรียบร้อยแล้ว</p>
          )}
          {!error && !saved && dirty && (
            <p className="cms-oracle-edit-savebar-hint">มีรูปใหม่รอบันทึก</p>
          )}
          <div className="cms-oracle-edit-savebar-actions">
            <button
              type="button"
              onClick={() => router.push("/cms/oracles")}
              className="cms-btn cms-btn-ghost"
              disabled={saving}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`cms-btn cms-btn-primary${saved ? " cms-btn-saved" : ""}`}
            >
              {saved ? "✓ บันทึกแล้ว" : saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
