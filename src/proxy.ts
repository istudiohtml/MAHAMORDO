import { NextRequest, NextResponse } from "next/server";
import { isCmsAdminRole, resolveCmsAuth } from "@/lib/cms-auth";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const fullPath = pathname + (search || "");

  // For /dashboard/* we only need to expose the current pathname to the layout
  // so it can redirect back to the same page after re-login.
  if (pathname.startsWith("/dashboard")) {
    const res = NextResponse.next();
    res.headers.set("x-pathname", fullPath);
    return res;
  }

  if (!pathname.startsWith("/cms") || pathname === "/cms/login") {
    return NextResponse.next();
  }

  const payload = await resolveCmsAuth(req);

  if (!payload) {
    const loginUrl = new URL("/cms/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isCmsAdminRole(payload.role)) {
    const loginUrl = new URL("/cms/login", req.url);
    loginUrl.searchParams.set("error", "forbidden");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("cms_token");
    res.cookies.delete("cms_refresh");
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("x-user-id", payload.userId);
  res.headers.set("x-user-role", payload.role);
  res.headers.set("x-pathname", fullPath);
  return res;
}

export const config = {
  matcher: ["/cms/:path*", "/dashboard/:path*"],
};
