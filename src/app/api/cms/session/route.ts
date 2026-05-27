import { NextRequest, NextResponse } from "next/server";
import { resolveCmsAuth } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";

/** Current CMS user — accepts cms_token or app user_token (ADMIN) */
export async function GET(req: NextRequest) {
  const payload = await resolveCmsAuth(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
