import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getCmsUser } from "@/lib/cms-auth";
import { UserRole } from "@prisma/client";

// PUT /api/cms/users/[id] — เปลี่ยน role หรือ credits
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json();
  const { role, credits } = body;

  // ป้องกัน superadmin แก้ตัวเอง
  const caller = await getCmsUser(req);
  if (caller?.userId === id && role && role !== caller.role) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const data: { role?: UserRole; credits?: number } = {};
  if (role) data.role = role;
  if (credits !== undefined) data.credits = credits;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, credits: true },
  });
  return NextResponse.json(user);
}

// DELETE /api/cms/users/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;

  // ป้องกัน superadmin ลบตัวเอง
  const caller = await getCmsUser(req);
  if (caller?.userId === id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
