import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";

/** Sessions ที่ยังไม่มีโพสต์ — สำหรับหน้าสร้างโพสต์ใน CMS */
export async function GET(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const sessions = await prisma.fortuneSession.findMany({
    where: {
      posts: { none: {} },
      messages: { some: { role: "ASSISTANT" } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      oracle: { select: { name: true } },
      user: { select: { email: true, name: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(sessions);
}
