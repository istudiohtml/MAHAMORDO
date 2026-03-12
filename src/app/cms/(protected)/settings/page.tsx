"use client";

import { useEffect, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

interface Setting { id: string; key: string; label: string; value: string; }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    cmsFetch("/api/cms/settings").then((r) => r.json()).then((data) => {
      setSettings(data);
      const init: Record<string, string> = {};
      data.forEach((s: Setting) => { init[s.key] = s.value; });
      setEdited(init);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    const payload = Object.entries(edited).map(([key, value]) => ({ key, value }));
    await cmsFetch("/api/cms/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const hasChanges = settings.some((s) => edited[s.key] !== s.value);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">ตั้งค่าระบบ</h2>
          <p className="text-slate-500 text-sm mt-1">SUPERADMIN เท่านั้น</p>
        </div>
        {hasChanges && (
          <button onClick={handleSave} disabled={saving}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-all ${saved ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-700"}`}>
            {saved ? "✓ บันทึกแล้ว" : saving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
          </button>
        )}
      </div>

      {loading && <div className="animate-pulse text-slate-400 text-sm">กำลังโหลด...</div>}

      {!loading && settings.length > 0 && (
        <div className="space-y-3">
          {settings.map((s) => {
            const changed = edited[s.key] !== s.value;
            return (
              <div key={s.key} className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${changed ? "border-slate-900/20" : "border-slate-100"}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-900">{s.label}</label>
                  {changed && <span className="text-xs text-amber-500 font-medium">มีการแก้ไข</span>}
                </div>
                <p className="text-xs text-slate-400 font-mono mb-3">{s.key}</p>
                <input value={edited[s.key] ?? ""} onChange={(e) => setEdited((prev) => ({ ...prev, [s.key]: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
