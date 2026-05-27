"use client";

import { useEffect, useMemo, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

interface Setting {
  id: string;
  key: string;
  label: string;
  value: string;
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

  return (
    <div className="cms-page cms-settings-page">
      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">System Settings</p>
          <h1 className="cms-page-title">ตั้งค่าระบบ</h1>
          <p className="cms-page-sub">
            ราคา credit และค่าคงที่ของระบบ — SUPERADMIN เท่านั้น
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

      {loading && <p className="cms-loading-text">กำลังโหลด...</p>}

      {!loading && settings.length === 0 && (
        <div className="cms-empty">
          <span className="cms-empty-icon">◇</span>
          <h3>ยังไม่มีการตั้งค่า</h3>
          <p>เพิ่ม system settings เพื่อเริ่มใช้งาน</p>
        </div>
      )}

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
                <input
                  id={s.key}
                  value={edited[s.key] ?? ""}
                  onChange={(e) =>
                    setEdited((prev) => ({ ...prev, [s.key]: e.target.value }))
                  }
                  className="cms-settings-input"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
