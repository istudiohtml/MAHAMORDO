import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/cms-auth";

// GET /api/cms/users — list ทั้งหมด
export async function GET(req: NextRequest) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      credits: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}
