import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getCmsUser } from "@/lib/cms-auth";
import { UserRole } from "@prisma/client";
import { anonymiseUser, hardDeleteUser } from "@/lib/user-deletion";

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
//
// Default behaviour:  PDPA-compliant anonymise (recommended for user requests).
// ?hard=1            : true hard delete — only works if no payment records;
//                      falls back to anonymise automatically when payments exist.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const url = new URL(req.url);
  const wantHard = url.searchParams.get("hard") === "1";

  // ป้องกัน superadmin ลบตัวเอง
  const caller = await getCmsUser(req);
  if (caller?.userId === id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  if (wantHard) {
    const ok = await hardDeleteUser(id);
    if (ok) return NextResponse.json({ success: true, mode: "hard" });
    // Has payments — fall back to anonymise to stay compliant with Thai tax law.
    await anonymiseUser(id);
    return NextResponse.json({
      success: true,
      mode: "anonymised",
      note: "User has payment records; anonymised instead of hard-deleted (5y tax retention).",
    });
  }

  await anonymiseUser(id);
  return NextResponse.json({ success: true, mode: "anonymised" });
}
