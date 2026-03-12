"use client";

import { useEffect, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

interface User { id: string; email: string; name: string | null; role: "USER" | "ADMIN" | "SUPERADMIN"; credits: number; createdAt: string; }

const roleBadge: Record<string, string> = {
  USER: "bg-slate-100 text-slate-500",
  ADMIN: "bg-blue-50 text-blue-600",
  SUPERADMIN: "bg-violet-50 text-violet-600",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cmsFetch("/api/cms/users").then((r) => r.json()).then((data) => {
      if (data.error) setError(data.error); else setUsers(data);
    }).finally(() => setLoading(false));
  }, []);

  async function changeRole(id: string, role: string) {
    const res = await cmsFetch(`/api/cms/users/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!data.error) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: data.role } : u)));
  }

  async function deleteUser(id: string) {
    if (!confirm("ลบ user นี้?")) return;
    const res = await cmsFetch(`/api/cms/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900">ผู้ใช้</h2>
        <p className="text-slate-500 text-sm mt-1">จัดการ role และ credits — SUPERADMIN เท่านั้น</p>
      </div>

      {error && <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 mb-4">{error}</div>}
      {loading && <div className="animate-pulse text-slate-400 text-sm">กำลังโหลด...</div>}

      {!loading && users.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["ผู้ใช้", "Role", "Credits", "สมัครเมื่อ", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{user.name || "—"}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border-0 cursor-pointer ${roleBadge[user.role]}`}>
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-700">{user.credits}</td>
                  <td className="px-5 py-4 text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString("th-TH")}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => deleteUser(user.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
