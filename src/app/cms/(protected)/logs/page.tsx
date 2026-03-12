"use client";

import { useEffect, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

export default function LogsPage() {
  const [type, setType] = useState<"credit" | "session">("credit");
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    cmsFetch(`/api/cms/logs?type=${type}`)
      .then((r) => r.json())
      .then((res) => { setData(res.data ?? []); setTotal(res.total ?? 0); })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Logs</h2>
          <p className="text-slate-500 text-sm mt-1">รวม {total} รายการ</p>
        </div>
        <div className="flex bg-white border border-slate-100 rounded-lg p-1 shadow-sm">
          {(["credit", "session"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`text-sm px-4 py-1.5 rounded-md font-medium transition-all ${type === t ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "credit" ? "Credit Logs" : "Sessions"}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="animate-pulse text-slate-400 text-sm">กำลังโหลด...</div>}
      {!loading && data.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
      )}

      {!loading && data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {(type === "credit"
                  ? ["ผู้ใช้", "Amount", "เหตุผล", "วันที่"]
                  : ["ผู้ใช้", "หมอดู", "ข้อความ", "Status", "วันที่"]
                ).map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-slate-900">{item.user?.name || "—"}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.user?.email}</p>
                  </td>
                  {type === "credit" ? (
                    <>
                      <td className="px-5 py-3"><span className={`font-mono font-medium ${item.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>{item.amount > 0 ? `+${item.amount}` : item.amount}</span></td>
                      <td className="px-5 py-3 text-xs text-slate-500 font-mono">{item.reason}</td>
                      <td className="px-5 py-3 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("th-TH")}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-slate-700">{item.oracle?.name}</td>
                      <td className="px-5 py-3 text-slate-500">{item._count?.messages} ข้อความ</td>
                      <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${item.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : item.status === "COMPLETED" ? "bg-slate-100 text-slate-500" : "bg-red-50 text-red-500"}`}>{item.status}</span></td>
                      <td className="px-5 py-3 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("th-TH")}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
