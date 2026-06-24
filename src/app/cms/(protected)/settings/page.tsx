"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";
import CmsSettingToggle from "@/components/cms/CmsSettingToggle";
import { normalizeBoolSetting } from "@/lib/setting-bool";

interface Setting {
  id: string;
  key: string;
  label: string;
  value: string;
}

const BOOL_KEYS = new Set([
  "signup_bonus_enabled",
  "daily_login_bonus_enabled",
  "site_maintenance",
  "fortune_post_enabled",
  "articles_enabled",
  "articles_cron_enabled",
  "articles_cron_auto_publish",
  "articles_cron_with_image",
]);

const NUMBER_KEYS = new Set([
  "free_credits_on_signup",
  "daily_login_bonus_amount",
  "credit_price_thb",
  "max_messages_per_session",
  "articles_cron_hour",
]);

const CREDIT_SETTING_KEYS = new Set([
  "signup_bonus_enabled",
  "free_credits_on_signup",
  "daily_login_bonus_enabled",
  "daily_login_bonus_amount",
  "credit_price_thb",
]);

function sortSettings(a: Setting, b: Setting): number {
  const aCredit = CREDIT_SETTING_KEYS.has(a.key) ? 0 : 1;
  const bCredit = CREDIT_SETTING_KEYS.has(b.key) ? 0 : 1;
  if (aCredit !== bCredit) return aCredit - bCredit;
  return a.key.localeCompare(b.key);
}

function initEdited(settings: Setting[]): Record<string, string> {
  const init: Record<string, string> = {};
  settings.forEach((s) => {
    init[s.key] = BOOL_KEYS.has(s.key)
      ? normalizeBoolSetting(s.value)
      : s.value;
  });
  return init;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [boolSavingKey, setBoolSavingKey] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoadError("");
    const r = await cmsFetch("/api/cms/settings");
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
    const sorted = [...data].sort(sortSettings);
    setSettings(sorted);
    setEdited(initEdited(sorted));
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
      value: BOOL_KEYS.has(key) ? normalizeBoolSetting(value) : value,
    }));
    const res = await cmsFetch("/api/cms/settings", {
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
      const sorted = [...data].sort(sortSettings);
      setSettings(sorted);
      setEdited(initEdited(sorted));
    }
    return true;
  }

  async function handleBoolToggle(key: string, next: boolean) {
    if (boolSavingKey) return;
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
    setSaving(true);
    const ok = await persistSettings(edited);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function renderInput(s: Setting) {
    if (BOOL_KEYS.has(s.key)) {
      const on = normalizeBoolSetting(edited[s.key]) === "true";
      return (
        <CmsSettingToggle
          id={s.key}
          checked={on}
          disabled={boolSavingKey === s.key}
          onChange={(next) => handleBoolToggle(s.key, next)}
        />
      );
    }

    return (
      <input
        id={s.key}
        type={NUMBER_KEYS.has(s.key) ? "number" : "text"}
        min={NUMBER_KEYS.has(s.key) ? 0 : undefined}
        value={edited[s.key] ?? ""}
        onChange={(e) =>
          setEdited((prev) => ({ ...prev, [s.key]: e.target.value }))
        }
        className="cms-settings-input"
      />
    );
  }

  const creditSettings = settings.filter((s) => CREDIT_SETTING_KEYS.has(s.key));
  const otherSettings = settings.filter((s) => !CREDIT_SETTING_KEYS.has(s.key));

  function renderSection(title: string, hint: string, items: Setting[]) {
    if (items.length === 0) return null;
    return (
      <section className="cms-settings-group">
        <header className="cms-settings-group-head">
          <h2 className="cms-settings-group-title">{title}</h2>
          <p className="cms-settings-group-hint">{hint}</p>
        </header>
        <div className="cms-settings-list">
          {items.map((s) => {
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
      </section>
    );
  }

  return (
    <div className="cms-page cms-settings-page">
      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">System Settings</p>
          <h1 className="cms-page-title">ตั้งค่าระบบ</h1>
          <p className="cms-page-sub">
            เครดิตฟรีและค่าคงที่ของระบบ — SUPERADMIN เท่านั้น · toggle
            บันทึกทันที
          </p>
        </div>
        {hasChanges && (
          <div className="cms-settings-header-actions">
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
          </div>
        )}
      </header>

      <p className="cms-settings-policy-note thai-font">
        สมาชิกที่ไม่ได้สมัครแพ็กเกจใช้ <strong>ดูดวงวันนี้ฟรี</strong>{" "}
        ได้วันละ 1 ครั้ง — การสนทนากับหมอดูแต่ละสำนักต้องใช้เครดิต
        (หรือแพ็กเกจไม่จำกัด)
      </p>

      {loading && <p className="cms-loading-text">กำลังโหลด...</p>}

      {!loading && loadError && (
        <div className="cms-empty">
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
        <div className="cms-empty">
          <span className="cms-empty-icon">◇</span>
          <h3>ยังไม่มีการตั้งค่า</h3>
          <p>รัน seed หรือเพิ่ม system settings เพื่อเริ่มใช้งาน</p>
        </div>
      )}

      {!loading && !loadError && settings.length > 0 && (
        <>
          {renderSection(
            "เครดิตฟรี",
            "เปิด/ปิดและกำหนดจำนวนเครดิตที่แจกให้สมาชิกฟรี",
            creditSettings
          )}
          {renderSection("อื่น ๆ", "การตั้งค่าระบบทั่วไป", otherSettings)}
        </>
      )}
    </div>
  );
}
