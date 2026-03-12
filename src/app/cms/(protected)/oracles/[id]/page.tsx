"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cmsFetch } from "@/components/cms/CmsProvider";

export default function EditOraclePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", title: "", description: "", speciality: "", systemPrompt: "", creditCost: 1, isActive: true, sortOrder: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    cmsFetch(`/api/cms/oracles/${id}`)
      .then((r) => r.json())
      .then((data) => { setForm(data); setLoading(false); });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    await cmsFetch(`/api/cms/oracles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="text-slate-400 text-sm animate-pulse">กำลังโหลด...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 transition-colors text-sm">← กลับ</button>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">แก้ไข — {form.name}</h2>
          <p className="text-slate-500 text-sm mt-0.5">อัปเดตข้อมูลและ system prompt</p>
        </div>
      </div>

      <div className="space-y-4">
        {[{ label: "ชื่อ", key: "name" }, { label: "Title", key: "title" }, { label: "Description", key: "description" }, { label: "Speciality", key: "speciality" }].map(({ label, key }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
            <input value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="mt-2 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
          </div>
        ))}

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">System Prompt</label>
          <textarea value={form.systemPrompt} onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
            rows={12} className="mt-2 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-mono resize-y" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Credit Cost</label>
            <input type="number" value={form.creditCost} onChange={(e) => setForm((f) => ({ ...f, creditCost: parseInt(e.target.value) }))}
              className="mt-2 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) }))}
              className="mt-2 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-all ${saved ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-700"}`}>
            {saved ? "✓ บันทึกแล้ว" : saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
