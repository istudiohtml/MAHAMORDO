"use client";

import Link from "next/link";
import { useCms } from "@/components/cms/CmsProvider";

type DashCard = {
  href: string;
  label: string;
  desc: string;
  icon: string;
  accent: "gold" | "violet" | "emerald" | "slate";
  sa?: boolean;
};

const cards: DashCard[] = [
  {
    href: "/cms/oracles",
    label: "จัดการหมอดู",
    desc: "แก้ไข prompt และตัวละคร",
    icon: "✦",
    accent: "gold",
  },
  {
    href: "/cms/posts",
    label: "โพสต์ดูดวง",
    desc: "รายการโพสต์ + ภาพ AI",
    icon: "✧",
    accent: "violet",
  },
  {
    href: "/cms/posts/new",
    label: "สร้างโพสต์",
    desc: "สร้างจากราศี / แพลตฟอร์ม",
    icon: "+",
    accent: "violet",
  },
  {
    href: "/cms/posts/settings",
    label: "ตั้งค่าโพสต์",
    desc: "เปิด/ปิด การมองเห็น",
    icon: "⚙",
    accent: "slate",
  },
  {
    href: "/cms/users",
    label: "จัดการผู้ใช้",
    desc: "role และ credits",
    icon: "◎",
    accent: "emerald",
    sa: true,
  },
  {
    href: "/cms/logs",
    label: "ดู Logs",
    desc: "credit logs & sessions",
    icon: "≡",
    accent: "slate",
    sa: true,
  },
  {
    href: "/cms/settings",
    label: "ตั้งค่าระบบ",
    desc: "ราคา credit และอื่นๆ",
    icon: "◇",
    accent: "slate",
    sa: true,
  },
];

export default function CmsDashboard() {
  const { user, loading } = useCms();

  const visible = cards.filter((c) => !c.sa || user?.role === "SUPERADMIN");

  return (
    <div className="cms-page">
      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">CMS Dashboard</p>
          <h1 className="cms-page-title">ยินดีต้อนรับ</h1>
          {!loading && user && (
            <p className="cms-page-sub">
              {user.name ?? user.email}
              <span className="cms-page-role">{user.role}</span>
            </p>
          )}
        </div>
        <Link href="/cms/posts/new" className="cms-page-cta">
          + สร้างโพสต์ใหม่
        </Link>
      </header>

      <div className="cms-card-grid">
        {visible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`cms-dash-card accent-${item.accent}`}
          >
            <span className="cms-dash-card-icon">{item.icon}</span>
            <div className="cms-dash-card-body">
              <p className="cms-dash-card-title">{item.label}</p>
              <p className="cms-dash-card-desc">{item.desc}</p>
            </div>
            <span className="cms-dash-card-arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
