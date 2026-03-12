import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { UserRole } from "@prisma/client";

export async function getCmsUser(req: NextRequest) {
  // อ่านจาก header ที่ middleware แนบไว้
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (userId && role) return { userId, role };

  // fallback: อ่านจาก cookie โดยตรง (กรณีเรียก API โดยตรง)
  const token = req.cookies.get("cms_token")?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
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
