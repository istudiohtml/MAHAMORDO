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

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CmsUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<boolean> => {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) return false;
    const data = await res.json();
    setUser(data.user);
    return true;
  }, []);

  useEffect(() => {
    refresh().then((ok) => {
      if (!ok) router.replace("/cms/login");
      setLoading(false);
    });
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.replace("/cms/login");
  }, [router]);

  return (
    <CmsContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  return useContext(CmsContext);
}

// helper สำหรับ fetch ที่ต้องการ auto-refresh
export async function cmsFetch(url: string, options?: RequestInit): Promise<Response> {
  let res = await fetch(url, { ...options, credentials: "include" });

  if (res.status === 401) {
    // ลอง refresh แล้ว retry
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) {
      res = await fetch(url, { ...options, credentials: "include" });
    }
  }
  return res;
}
