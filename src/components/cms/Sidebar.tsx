"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCms } from "./CmsProvider";

const nav = [
  { href: "/cms", label: "Dashboard", icon: "⊞" },
  { href: "/cms/oracles", label: "หมอดู", icon: "✦" },
  { href: "/cms/users", label: "ผู้ใช้", icon: "◎", roles: ["SUPERADMIN"] },
  { href: "/cms/logs", label: "Logs", icon: "≡", roles: ["SUPERADMIN"] },
  { href: "/cms/settings", label: "ตั้งค่า", icon: "⚙", roles: ["SUPERADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useCms();

  const visibleNav = nav.filter((item) => !item.roles || item.roles.includes(user?.role ?? ""));

  return (
    <aside className="w-56 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-10">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">CMS</p>
        <h1 className="text-slate-900 font-semibold text-sm mt-0.5">มหาหมอดู</h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {item.roles && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
                  SA
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-slate-100">
        {user && (
          <>
            <p className="text-xs font-medium text-slate-700 truncate">{user.name ?? user.email}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{user.role}</p>
          </>
        )}
        <button
          onClick={logout}
          className="mt-3 w-full text-xs text-slate-400 hover:text-red-500 transition-colors text-left"
        >
          ออกจากระบบ →
        </button>
      </div>
    </aside>
  );
}
