"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCms } from "./CmsProvider";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: string[];
  indent?: boolean;
  group?: string;
};

const nav: NavItem[] = [
  { href: "/cms", label: "Dashboard", icon: "⊞", roles: ["ADMIN", "SUPERADMIN"], group: "main" },
  { href: "/cms/oracles", label: "หมอดู", icon: "✦", roles: ["ADMIN", "SUPERADMIN"], group: "content" },
  { href: "/cms/posts", label: "โพสต์ดูดวง", icon: "✧", roles: ["ADMIN", "SUPERADMIN"], group: "content" },
  { href: "/cms/posts/new", label: "สร้างโพสต์", icon: "+", roles: ["ADMIN", "SUPERADMIN"], group: "content", indent: true },
  { href: "/cms/posts/settings", label: "ตั้งค่าโพสต์", icon: "⚙", roles: ["ADMIN", "SUPERADMIN"], group: "content", indent: true },
  { href: "/cms/articles", label: "บทความ", icon: "❑", roles: ["ADMIN", "SUPERADMIN"], group: "content" },
  { href: "/cms/articles/new", label: "เขียนบทความ", icon: "+", roles: ["ADMIN", "SUPERADMIN"], group: "content", indent: true },
  { href: "/cms/articles/settings", label: "ตั้งค่าบทความ", icon: "⚙", roles: ["ADMIN", "SUPERADMIN"], group: "content", indent: true },
  { href: "/cms/users", label: "ผู้ใช้", icon: "◎", roles: ["SUPERADMIN"], group: "system" },
  { href: "/cms/logs", label: "Logs", icon: "≡", roles: ["SUPERADMIN"], group: "system" },
  { href: "/cms/settings", label: "ตั้งค่าระบบ", icon: "◇", roles: ["SUPERADMIN"], group: "system" },
];

const groupLabels: Record<string, string> = {
  main: "",
  content: "เนื้อหา",
  system: "ระบบ",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, loading } = useCms();

  const visibleNav = nav.filter((item) =>
    item.roles.includes(user?.role ?? "")
  );

  const groups = ["main", "content", "system"] as const;

  function linkActive(item: NavItem) {
    if (item.href === "/cms/posts") {
      return (
        pathname === "/cms/posts" ||
        (pathname.startsWith("/cms/posts/") &&
          !pathname.includes("/new") &&
          !pathname.includes("/settings"))
      );
    }
    if (item.href === "/cms/articles") {
      return (
        pathname === "/cms/articles" ||
        (pathname.startsWith("/cms/articles/") &&
          !pathname.includes("/new") &&
          !pathname.includes("/settings"))
      );
    }
    return pathname === item.href;
  }

  return (
    <aside className="cms-sidebar">
      <div className="cms-sidebar-brand">
        <span className="cms-sidebar-brand-dot" />
        <div>
          <p className="cms-sidebar-brand-label">CMS Admin</p>
          <h1 className="cms-sidebar-brand-title">มาหาหมอดู</h1>
        </div>
      </div>

      <nav className="cms-sidebar-nav">
        {groups.map((group) => {
          const items = visibleNav.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="cms-sidebar-group">
              {groupLabels[group] ? (
                <p className="cms-sidebar-group-label">{groupLabels[group]}</p>
              ) : null}
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`cms-sidebar-link${item.indent ? " indent" : ""}${
                    linkActive(item) ? " active" : ""
                  }`}
                >
                  <span className="cms-sidebar-link-icon">{item.icon}</span>
                  <span className="cms-sidebar-link-text">{item.label}</span>
                  {item.roles.length === 1 && item.roles[0] === "SUPERADMIN" && (
                    <span className="cms-sidebar-badge">SA</span>
                  )}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="cms-sidebar-footer">
        {!loading && user ? (
          <div className="cms-sidebar-user">
            <div className="cms-sidebar-user-avatar">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </div>
            <div className="cms-sidebar-user-meta">
              <p className="cms-sidebar-user-name">{user.name ?? user.email}</p>
              <p className="cms-sidebar-user-role">{user.role}</p>
            </div>
          </div>
        ) : null}
        <button type="button" className="cms-sidebar-logout" onClick={logout}>
          ออกจากระบบ
        </button>
        <Link href="/dashboard" className="cms-sidebar-app-link">
          ← กลับแอปหลัก
        </Link>
      </div>
    </aside>
  );
}
