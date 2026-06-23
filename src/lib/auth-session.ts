import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";

/** Lightweight session check for public pages (landing, pricing, etc.). */
export async function getIsLoggedIn(): Promise<boolean> {
  const store = await cookies();
  const token = store.get("user_token")?.value;
  if (!token) return false;
  try {
    const payload = await verifyAccessToken(token);
    return Boolean(payload?.userId);
  } catch {
    return false;
  }
}
