import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, generateRefreshToken, refreshTokenExpiresAt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("cms_refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // ตรวจ refresh token ใน DB
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // ลบถ้าหมดอายุ
      if (stored) await prisma.refreshToken.deleteMany({ where: { id: stored.id } });
      return NextResponse.json({ error: "Refresh token expired" }, { status: 401 });
    }

    // Rotate refresh token (ออก token ใหม่ + ลบอันเก่า)
    const newAccessToken = await signAccessToken({ userId: stored.user.id, role: stored.user.role });
    const newRefreshToken = generateRefreshToken();
    const expiresAt = refreshTokenExpiresAt();

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { id: stored.id } }),
      prisma.refreshToken.create({
        data: { token: newRefreshToken, userId: stored.user.id, expiresAt },
      }),
    ]);

    const res = NextResponse.json({
      user: { id: stored.user.id, email: stored.user.email, name: stored.user.name, role: stored.user.role },
      accessToken: newAccessToken,
    });

    res.cookies.set("cms_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });

    res.cookies.set("cms_refresh", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
