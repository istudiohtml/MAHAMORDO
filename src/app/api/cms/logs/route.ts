import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/cms-auth";

// GET /api/cms/logs?type=credit|session&page=1&limit=50
export async function GET(req: NextRequest) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "credit";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  if (type === "session") {
    const [data, total] = await Promise.all([
      prisma.fortuneSession.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true, name: true } },
          oracle: { select: { name: true, slug: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.fortuneSession.count(),
    ]);
    return NextResponse.json({ data, total, page, limit });
  }

  // default: credit logs
  const [data, total] = await Promise.all([
    prisma.creditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.creditLog.count(),
  ]);
  return NextResponse.json({ data, total, page, limit });
}
