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

export default function CmsPostSettingsPage() {
  const { user } = useCms();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const canEdit = user?.role === "SUPERADMIN";

  useEffect(() => {
    cmsFetch("/api/cms/posts/settings")
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
    const res = await cmsFetch("/api/cms/posts/settings", {
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
      <Link href="/cms/posts" className="cms-post-detail-back">
        ← โพสต์ดูดวง
      </Link>

      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Post Settings</p>
          <h1 className="cms-page-title">ตั้งค่าโพสต์</h1>
          <p className="cms-page-sub">
            {canEdit
              ? "SUPERADMIN แก้ไขได้ · ADMIN ดูอย่างเดียว"
              : "ADMIN ดูการตั้งค่าได้อย่างเดียว"}
          </p>
        </div>
        {canEdit && hasChanges && (
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
          <span className="cms-empty-icon cms-empty-icon-violet">⚙</span>
          <h3>ยังไม่มีการตั้งค่า</h3>
          <p>เพิ่ม post settings เพื่อเริ่มใช้งาน</p>
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
                {s.key === "fortune_post_default_visibility" ? (
                  <select
                    id={s.key}
                    value={edited[s.key] ?? "PRIVATE"}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setEdited((prev) => ({
                        ...prev,
                        [s.key]: e.target.value,
                      }))
                    }
                    className="cms-settings-select"
                  >
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="PUBLIC">PUBLIC</option>
                  </select>
                ) : s.key === "fortune_post_enabled" ? (
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
