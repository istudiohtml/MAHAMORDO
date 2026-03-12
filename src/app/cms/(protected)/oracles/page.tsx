"use client";

import { useEffect, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

interface Oracle {
  id: string; slug: string; name: string; title: string;
  speciality: string; creditCost: number; isActive: boolean; sortOrder: number;
}

export default function OraclesPage() {
  const [oracles, setOracles] = useState<Oracle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cmsFetch("/api/cms/oracles")
      .then((r) => r.json())
      .then((data) => { if (data.error) setError(data.error); else setOracles(data); })
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await cmsFetch(`/api/cms/oracles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setOracles((prev) => prev.map((o) => (o.id === id ? { ...o, isActive: !current } : o)));
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900">หมอดู</h2>
        <p className="text-slate-500 text-sm mt-1">จัดการตัวละครและ system prompt</p>
      </div>

      {error && <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 mb-4">{error}</div>}
      {loading && <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse h-20"/>)}</div>}

      {!loading && oracles.length > 0 && (
        <div className="space-y-3">
          {oracles.map((oracle) => (
            <div key={oracle.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${oracle.isActive ? "bg-slate-900" : "bg-slate-100"}`}>
                  <span className={oracle.isActive ? "text-white" : "text-slate-400"}>✦</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{oracle.name}</p>
                    <span className="text-xs text-slate-400 font-mono">{oracle.slug}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{oracle.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">{oracle.speciality}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{oracle.creditCost} credit/session</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleActive(oracle.id, oracle.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${oracle.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>
                  {oracle.isActive ? "Active" : "Inactive"}
                </button>
                <a href={`/cms/oracles/${oracle.id}`} className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-900 text-white hover:bg-slate-700 transition-colors">
                  แก้ไข
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
