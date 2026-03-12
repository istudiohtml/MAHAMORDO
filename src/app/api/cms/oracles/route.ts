import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/cms-auth";

// GET /api/cms/oracles — list ทั้งหมด
export async function GET(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const oracles = await prisma.oracle.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(oracles);
}

// POST /api/cms/oracles — สร้างใหม่
export async function POST(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const body = await req.json();
  const { slug, name, title, description, avatarUrl, systemPrompt, speciality, creditCost, sortOrder } = body;

  if (!slug || !name || !systemPrompt) {
    return NextResponse.json({ error: "slug, name, systemPrompt are required" }, { status: 400 });
  }

  const oracle = await prisma.oracle.create({
    data: { slug, name, title, description, avatarUrl, systemPrompt, speciality, creditCost, sortOrder },
  });
  return NextResponse.json(oracle, { status: 201 });
}
