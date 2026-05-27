"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CMS_FORBIDDEN_MESSAGE = "บัญชีนี้ไม่มีสิทธิ์เข้า CMS (ต้องเป็น ADMIN)";

function isCmsAdminRole(role: string | undefined): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/cms";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const forbidden = searchParams.get("error") === "forbidden";
    if (forbidden) {
      setError(CMS_FORBIDDEN_MESSAGE);
      void fetch("/api/auth/logout", { method: "POST" });
      return;
    }

    async function tryExistingSession() {
      const cmsRes = await fetch("/api/auth/refresh", { method: "POST" });
      if (cmsRes.ok) {
        const data = await cmsRes.json();
        if (isCmsAdminRole(data.user?.role)) {
          router.replace(redirect);
          return;
        }
        await fetch("/api/auth/logout", { method: "POST" });
      }

      const sessionRes = await fetch("/api/cms/session");
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        if (isCmsAdminRole(data.user?.role)) {
          router.replace(redirect);
          return;
        }
      }
    }

    void tryExistingSession();
  }, [redirect, router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "เกิดข้อผิดพลาด");
      return;
    }

    if (!isCmsAdminRole(data.user?.role)) {
      await fetch("/api/auth/logout", { method: "POST" });
      setError(CMS_FORBIDDEN_MESSAGE);
      return;
    }

    router.replace(redirect);
  }

  return (
    <div className="cms-login-shell">
      <div className="cms-login-stack">
        <div className="cms-login-brand">
          <p className="cms-login-brand-eyebrow">CMS Admin</p>
          <h1 className="cms-login-brand-title">มหาหมอดู</h1>
          <p className="cms-login-brand-sub">เข้าสู่ระบบจัดการ</p>
        </div>

        <div className="cms-login-card">
          <form onSubmit={handleSubmit} className="cms-login-form">
            <div className="cms-login-field">
              <label htmlFor="cms-login-email" className="cms-login-label">
                อีเมล
              </label>
              <input
                id="cms-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@mahamordo.com"
                required
                autoComplete="email"
                className="cms-login-input"
              />
            </div>

            <div className="cms-login-field">
              <label htmlFor="cms-login-password" className="cms-login-label">
                รหัสผ่าน
              </label>
              <input
                id="cms-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="cms-login-input"
              />
            </div>

            {error && <p className="cms-login-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="cms-login-submit"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        <p className="cms-login-footer">เฉพาะผู้ดูแลระบบเท่านั้น</p>
      </div>
    </div>
  );
}

export default function CmsLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
