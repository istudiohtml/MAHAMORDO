import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ตรวจเฉพาะ /cms/* ยกเว้น /cms/login
  if (!pathname.startsWith("/cms") || pathname === "/cms/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get("cms_token")?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/cms/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // แนบ userId และ role ใน header ให้ API อ่านได้
  const res = NextResponse.next();
  res.headers.set("x-user-id", payload.userId);
  res.headers.set("x-user-role", payload.role);
  return res;
}

export const config = {
  matcher: ["/cms/:path*"],
};
