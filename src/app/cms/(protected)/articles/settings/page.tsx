"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cmsFetch, useCms } from "@/components/cms/CmsProvider";

interface Setting {
  id: string;
  key: string;
  label: string;
  value: string;
}

const BOOL_KEYS = new Set([
  "articles_enabled",
  "articles_cron_enabled",
  "articles_cron_auto_publish",
  "articles_cron_with_image",
]);

export default function CmsArticlesSettingsPage() {
  const { user } = useCms();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const canEdit = user?.role === "SUPERADMIN";

  useEffect(() => {
    cmsFetch("/api/cms/articles/settings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSettings(data);
          const init: Record<string, string> = {};
          data.forEach((s: Setting) => {
            init[s.key] = s.value;
          });
          setEdited(init);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const hasChanges = useMemo(
    () => settings.some((s) => edited[s.key] !== s.value),
    [settings, edited]
  );

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    const payload = Object.entries(edited).map(([key, value]) => ({
      key,
      value,
    }));
    const res = await cmsFetch("/api/cms/articles/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSettings((prev) =>
        prev.map((s) => ({ ...s, value: edited[s.key] ?? s.value }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleCronTest() {
    const secret = prompt("ใส่ CRON_SECRET เพื่อรัน cron ทันที (force=1)");
    if (!secret) return;
    const res = await fetch(
      `/api/cron/articles/daily?force=1&secret=${encodeURIComponent(secret)}`
    );
    const data = await res.json();
    alert(JSON.stringify(data, null, 2));
  }

  return (
    <div className="cms-page cms-settings-page">
      <Link href="/cms/articles" className="cms-post-detail-back">
        ← บทความ
      </Link>

      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Article Settings</p>
          <h1 className="cms-page-title">ตั้งค่าบทความ</h1>
          <p className="cms-page-sub">
            {canEdit
              ? "SUPERADMIN แก้ไขได้ · เปิด/ปิด AI cron รายวันที่นี่"
              : "ADMIN ดูการตั้งค่าได้อย่างเดียว"}
          </p>
        </div>
        <div className="cms-settings-header-actions">
          {canEdit && (
            <button
              type="button"
              className="cms-btn cms-btn-ghost"
              onClick={handleCronTest}
            >
              รัน cron ตอนนี้
            </button>
          )}
          {canEdit && hasChanges && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`cms-btn cms-btn-primary${saved ? " cms-btn-saved" : ""}`}
            >
              {saved
                ? "✓ บันทึกแล้ว"
                : saving
                  ? "กำลังบันทึก..."
                  : "บันทึกทั้งหมด"}
            </button>
          )}
        </div>
      </header>

      <p className="cms-articles-cron-hint">
        cron รันที่ URL <code>/api/cron/articles/daily</code> ต้องส่ง
        <code>Authorization: Bearer $CRON_SECRET</code> หรือ
        <code>?secret=…</code> — ตั้ง <code>CRON_SECRET</code> ใน env แล้วเรียก
        ผ่าน system cron หรือบริการ external เช่น cron-job.org
      </p>

      {loading && <p className="cms-loading-text">กำลังโหลด...</p>}

      {!loading && settings.length > 0 && (
        <div className="cms-settings-list">
          {settings.map((s) => {
            const changed = edited[s.key] !== s.value;
            return (
              <div
                key={s.key}
                className={`cms-settings-card${changed ? " is-dirty" : ""}`}
              >
                <div className="cms-settings-card-head">
                  <label className="cms-settings-card-label" htmlFor={s.key}>
                    {s.label}
                  </label>
                  {changed && (
                    <span className="cms-settings-card-dirty-flag">
                      มีการแก้ไข
                    </span>
                  )}
                </div>
                <p className="cms-settings-card-key">{s.key}</p>

                {BOOL_KEYS.has(s.key) ? (
                  <select
                    id={s.key}
                    value={edited[s.key] ?? "true"}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setEdited((prev) => ({
                        ...prev,
                        [s.key]: e.target.value,
                      }))
                    }
                    className="cms-settings-select"
                  >
                    <option value="true">เปิด</option>
                    <option value="false">ปิด</option>
                  </select>
                ) : s.key === "articles_default_status" ? (
                  <select
                    id={s.key}
                    value={edited[s.key] ?? "DRAFT"}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setEdited((prev) => ({
                        ...prev,
                        [s.key]: e.target.value,
                      }))
                    }
                    className="cms-settings-select"
                  >
                    <option value="DRAFT">DRAFT (ร่าง)</option>
                    <option value="PUBLISHED">PUBLISHED (เผยแพร่ทันที)</option>
                  </select>
                ) : s.key === "articles_cron_hour" ? (
                  <input
                    id={s.key}
                    type="number"
                    min={0}
                    max={23}
                    value={edited[s.key] ?? "7"}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setEdited((prev) => ({
                        ...prev,
                        [s.key]: e.target.value,
                      }))
                    }
                    className="cms-settings-input"
                  />
                ) : (
                  <input
                    id={s.key}
                    value={edited[s.key] ?? ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setEdited((prev) => ({
                        ...prev,
                        [s.key]: e.target.value,
                      }))
                    }
                    className="cms-settings-input"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
