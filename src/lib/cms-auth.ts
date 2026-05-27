import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/jwt";
import { UserRole } from "@prisma/client";

const CMS_FORBIDDEN_MESSAGE = "บัญชีนี้ไม่มีสิทธิ์เข้า CMS (ต้องเป็น ADMIN)";

export function isCmsAdminRole(role: string): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function cmsForbiddenResponse(): NextResponse {
  return NextResponse.json({ error: CMS_FORBIDDEN_MESSAGE }, { status: 403 });
}

export function clearCmsAuthCookies(res: NextResponse): void {
  res.cookies.delete("cms_token");
  res.cookies.delete("cms_refresh");
}

/** CMS cookie or app user_token when role is ADMIN/SUPERADMIN */
export async function resolveCmsAuth(
  req: NextRequest
): Promise<AccessTokenPayload | null> {
  const cmsToken = req.cookies.get("cms_token")?.value;
  if (cmsToken) {
    const payload = await verifyAccessToken(cmsToken);
    if (payload && isCmsAdminRole(payload.role)) return payload;
  }

  const userToken = req.cookies.get("user_token")?.value;
  if (userToken) {
    const payload = await verifyAccessToken(userToken);
    if (payload && isCmsAdminRole(payload.role)) return payload;
  }

  return null;
}

export async function getCmsUser(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (userId && role && isCmsAdminRole(role)) {
    return { userId, role };
  }

  const payload = await resolveCmsAuth(req);
  if (!payload) return null;
  return { userId: payload.userId, role: payload.role };
}

export function requireRole(...roles: UserRole[]) {
  return async (req: NextRequest) => {
    const user = await getCmsUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!roles.includes(user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null;
  };
}
