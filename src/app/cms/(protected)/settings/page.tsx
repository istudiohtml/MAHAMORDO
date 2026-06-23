"use client";

import { useEffect, useMemo, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    cmsFetch("/api/cms/settings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort(sortSettings);
          setSettings(sorted);
          const init: Record<string, string> = {};
          sorted.forEach((s: Setting) => {
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
    setSaving(true);
    const payload = Object.entries(edited).map(([key, value]) => ({
      key,
      value,
    }));
    const res = await cmsFetch("/api/cms/settings", {
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

  function renderInput(s: Setting) {
    if (BOOL_KEYS.has(s.key)) {
      const on = edited[s.key] === "true";
      return (
        <label className="cms-settings-switch">
          <input
            type="checkbox"
            className="cms-settings-switch-input"
            checked={on}
            onChange={(e) =>
              setEdited((prev) => ({
                ...prev,
                [s.key]: e.target.checked ? "true" : "false",
              }))
            }
          />
          <span className="cms-settings-switch-track" aria-hidden="true">
            <span className="cms-settings-switch-thumb" />
          </span>
          <span
            className={`cms-settings-switch-status${on ? " is-on" : " is-off"}`}
          >
            {on ? "เปิดใช้งาน" : "ปิดอยู่"}
          </span>
        </label>
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
            เครดิตฟรีและค่าคงที่ของระบบ — SUPERADMIN เท่านั้น
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

      {!loading && settings.length === 0 && (
        <div className="cms-empty">
          <span className="cms-empty-icon">◇</span>
          <h3>ยังไม่มีการตั้งค่า</h3>
          <p>รัน seed หรือเพิ่ม system settings เพื่อเริ่มใช้งาน</p>
        </div>
      )}

      {!loading && settings.length > 0 && (
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
