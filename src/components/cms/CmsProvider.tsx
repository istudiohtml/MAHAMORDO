"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface CmsUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface CmsContextType {
  user: CmsUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const CmsContext = createContext<CmsContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refresh: async () => false,
});

function isCmsAdminRole(role: string | undefined): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CmsUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<boolean> => {
    const sessionRes = await fetch("/api/cms/session", { credentials: "include" });
    if (sessionRes.ok) {
      const data = await sessionRes.json();
      if (isCmsAdminRole(data.user?.role)) {
        setUser(data.user);
        return true;
      }
    }

    const cmsRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (cmsRes.ok) {
      const data = await cmsRes.json();
      if (isCmsAdminRole(data.user?.role)) {
        setUser(data.user);
        return true;
      }
      await fetch("/api/auth/logout", { method: "POST" });
    }

    return false;
  }, []);

  useEffect(() => {
    refresh().then((ok) => {
      if (!ok) router.replace("/cms/login");
      setLoading(false);
    });
  }, [refresh, router]);

  const logout = useCallback(async () => {
    await Promise.all([
      fetch("/api/auth/logout", { method: "POST" }),
      fetch("/api/user/auth/logout", { method: "POST" }),
    ]);
    setUser(null);
    router.replace("/cms/login");
  }, [router]);

  if (loading) {
    return (
      <div className="cms-shell">
        <div
          className="cms-main"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <p className="cms-loading-text">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <CmsContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  return useContext(CmsContext);
}

export async function cmsFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  let res = await fetch(url, { ...options, credentials: "include" });

  if (res.status === 401) {
    const refreshed =
      (await fetch("/api/auth/refresh", { method: "POST" })).ok ||
      (await fetch("/api/user/auth/refresh", { method: "POST" })).ok;
    if (refreshed) {
      res = await fetch(url, { ...options, credentials: "include" });
    }
  }
  return res;
}
