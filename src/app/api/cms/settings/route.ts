import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getCmsUser } from "@/lib/cms-auth";

// GET /api/cms/settings — ดู config ทั้งหมด
export async function GET(req: NextRequest) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json(settings);
}

// PUT /api/cms/settings — แก้ไข config (ส่ง array of { key, value })
export async function PUT(req: NextRequest) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  const caller = await getCmsUser(req);
  const body: { key: string; value: string }[] = await req.json();

  const updated = await Promise.all(
    body.map(({ key, value }) =>
      prisma.systemSetting.update({
        where: { key },
        data: { value, updatedBy: caller?.userId },
      })
    )
  );
  return NextResponse.json(updated);
}
