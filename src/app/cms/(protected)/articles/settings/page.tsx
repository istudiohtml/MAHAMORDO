"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cmsFetch, useCms } from "@/components/cms/CmsProvider";
import CmsSettingToggle from "@/components/cms/CmsSettingToggle";
import { normalizeBoolSetting } from "@/lib/setting-bool";

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

function normalizeEditedValue(key: string, value: string): string {
  if (BOOL_KEYS.has(key)) return normalizeBoolSetting(value);
  if (key === "articles_default_status") {
    return value === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  }
  return value;
}

function initEdited(settings: Setting[]): Record<string, string> {
  const init: Record<string, string> = {};
  settings.forEach((s) => {
    init[s.key] = normalizeEditedValue(s.key, s.value);
  });
  return init;
}

export default function CmsArticlesSettingsPage() {
  const { user } = useCms();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [boolSavingKey, setBoolSavingKey] = useState<string | null>(null);
  const canEdit = user?.role === "SUPERADMIN";

  const loadSettings = useCallback(async () => {
    setLoadError("");
    const r = await cmsFetch("/api/cms/articles/settings");
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      throw new Error(
        typeof data?.error === "string"
          ? data.error
          : `โหลดไม่สำเร็จ (${r.status})`
      );
    }
    if (!Array.isArray(data)) {
      throw new Error("รูปแบบข้อมูลการตั้งค่าไม่ถูกต้อง");
    }
    setSettings(data);
    setEdited(initEdited(data));
  }, []);

  useEffect(() => {
    loadSettings()
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "โหลดการตั้งค่าไม่สำเร็จ"
        );
      })
      .finally(() => setLoading(false));
  }, [loadSettings]);

  const hasChanges = useMemo(
    () => settings.some((s) => edited[s.key] !== s.value),
    [settings, edited]
  );

  async function persistSettings(
    nextEdited: Record<string, string>
  ): Promise<boolean> {
    const payload = Object.entries(nextEdited).map(([key, value]) => ({
      key,
      value: normalizeEditedValue(key, value),
    }));
    const res = await cmsFetch("/api/cms/articles/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(
        `บันทึกไม่สำเร็จ (${res.status})\n${
          typeof data?.error === "string" ? data.error : "ลองใหม่อีกครั้ง"
        }`
      );
      return false;
    }
    if (Array.isArray(data)) {
      setSettings(data);
      setEdited(initEdited(data));
    }
    return true;
  }

  async function handleBoolToggle(key: string, next: boolean) {
    if (!canEdit || boolSavingKey) return;
    const nextValue = next ? "true" : "false";
    const prevEdited = edited;
    const nextEdited = { ...edited, [key]: nextValue };
    setEdited(nextEdited);
    setBoolSavingKey(key);
    const ok = await persistSettings(nextEdited);
    if (!ok) setEdited(prevEdited);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
    setBoolSavingKey(null);
  }

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    const ok = await persistSettings(edited);
    if (ok) {
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
    if (!res.ok) {
      alert(`Cron ล้มเหลว (${res.status})\n${JSON.stringify(data, null, 2)}`);
      return;
    }
    if (data.skipped) {
      alert(`Cron ข้าม: ${data.skipped}\n${JSON.stringify(data, null, 2)}`);
      return;
    }
    alert(`Cron สำเร็จ\n${JSON.stringify(data, null, 2)}`);
  }

  function renderInput(s: Setting) {
    const value = edited[s.key] ?? s.value;

    if (BOOL_KEYS.has(s.key)) {
      const on = normalizeBoolSetting(value) === "true";
      return (
        <CmsSettingToggle
          id={s.key}
          checked={on}
          disabled={!canEdit || boolSavingKey === s.key}
          onChange={(next) => handleBoolToggle(s.key, next)}
        />
      );
    }

    if (s.key === "articles_default_status") {
      const status = value === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
      return (
        <select
          id={s.key}
          value={status}
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
      );
    }

    if (s.key === "articles_cron_hour") {
      return (
        <input
          id={s.key}
          type="number"
          min={0}
          max={23}
          value={value || "7"}
          disabled={!canEdit}
          onChange={(e) =>
            setEdited((prev) => ({
              ...prev,
              [s.key]: e.target.value,
            }))
          }
          className="cms-settings-input"
        />
      );
    }

    return (
      <input
        id={s.key}
        value={value ?? ""}
        disabled={!canEdit}
        onChange={(e) =>
          setEdited((prev) => ({
            ...prev,
            [s.key]: e.target.value,
          }))
        }
        className="cms-settings-input"
      />
    );
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
              ? "SUPERADMIN แก้ไขได้ · เปิด/ปิดจะบันทึกทันที"
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

      {!loading && loadError && (
        <div className="cms-settings-empty">
          <p className="cms-posts-error">{loadError}</p>
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            onClick={() => window.location.reload()}
          >
            ลองใหม่
          </button>
        </div>
      )}

      {!loading && !loadError && settings.length === 0 && (
        <div className="cms-settings-empty">
          <h3>ยังไม่มีการตั้งค่า</h3>
          <p>รีเฟรชหน้านี้เพื่อสร้างค่าเริ่มต้นอัตโนมัติ</p>
        </div>
      )}

      {!loading && !loadError && settings.length > 0 && (
        <div className="cms-settings-list">
          {settings.map((s) => {
            const changed = edited[s.key] !== s.value;
            return (
              <div
                key={s.key}
                className={`cms-settings-card${changed ? " is-dirty" : ""}`}
              >
                <div className="cms-settings-card-head">
                  <p className="cms-settings-card-label">{s.label}</p>
                  {changed && (
                    <span className="cms-settings-card-dirty-flag">
                      มีการแก้ไข
                    </span>
                  )}
                </div>
                <p className="cms-settings-card-key">{s.key}</p>
                {renderInput(s)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
