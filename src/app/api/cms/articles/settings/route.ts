import { NextRequest, NextResponse } from "next/server";
import { requireRole, getCmsUser } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";

const ARTICLE_SETTING_KEYS = [
  "articles_enabled",
  "articles_default_status",
  "articles_image_style_suffix",
  "articles_cron_enabled",
  "articles_cron_hour",
  "articles_cron_categories",
  "articles_cron_auto_publish",
];

export async function GET(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ARTICLE_SETTING_KEYS } },
    orderBy: { key: "asc" },
  });

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  const user = await getCmsUser(req);
  const updates: Array<{ key: string; value: string }> = await req.json();

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 });
  }

  for (const { key, value } of updates) {
    if (!ARTICLE_SETTING_KEYS.includes(key)) continue;
    await prisma.systemSetting.update({
      where: { key },
      data: { value: String(value), updatedBy: user?.userId },
    });
  }

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ARTICLE_SETTING_KEYS } },
  });
  return NextResponse.json(settings);
}
