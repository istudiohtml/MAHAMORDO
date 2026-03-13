import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/cms-auth";

// GET /api/cms/oracles/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const oracle = await prisma.oracle.findUnique({ where: { id } });
  if (!oracle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(oracle);
}

// PUT /api/cms/oracles/[id] — แก้ไข
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json();

  // Whitelist allowed fields
  const allowedFields = ['name', 'title', 'description', 'avatarUrl', 'systemPrompt', 'speciality', 'isActive', 'sortOrder'];
  const updateData: any = {};

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const oracle = await prisma.oracle.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(oracle);
}

// DELETE /api/cms/oracles/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  await prisma.oracle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
