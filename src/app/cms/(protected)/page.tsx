"use client";

import { useCms } from "@/components/cms/CmsProvider";

export default function CmsDashboard() {
  const { user } = useCms();

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
      <p className="text-slate-500 text-sm mt-1">
        ยินดีต้อนรับ, <span className="text-slate-700 font-medium">{user?.name ?? user?.email}</span>
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {[
          { href: "/cms/oracles", label: "จัดการหมอดู", desc: "แก้ไข prompt และตัวละคร", icon: "✦" },
          { href: "/cms/users", label: "จัดการผู้ใช้", desc: "role และ credits", icon: "◎", sa: true },
          { href: "/cms/logs", label: "ดู Logs", desc: "credit logs & sessions", icon: "≡", sa: true },
          { href: "/cms/settings", label: "ตั้งค่าระบบ", desc: "ราคา credit และอื่นๆ", icon: "⚙", sa: true },
        ]
          .filter((item) => !item.sa || user?.role === "SUPERADMIN")
          .map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all duration-200 group"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="text-sm font-semibold text-slate-900 mt-3 group-hover:text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </a>
          ))}
      </div>
    </div>
  );
}
