import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("cms_refresh")?.value;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("cms_token");
  res.cookies.delete("cms_refresh");
  return res;
}
