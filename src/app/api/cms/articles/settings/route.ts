import { NextRequest, NextResponse } from "next/server";
import { requireRole, getCmsUser } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";
import { ensureArticleSettings } from "@/lib/ensure-article-settings";
import {
  ARTICLE_SETTING_DEFAULTS,
  ARTICLE_SETTING_KEYS,
} from "@/lib/article-setting-defaults";

export async function GET(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  await ensureArticleSettings();

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

  await ensureArticleSettings();

  for (const { key, value } of updates) {
    if (!ARTICLE_SETTING_KEYS.includes(key)) continue;
    const def = ARTICLE_SETTING_DEFAULTS[key];
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value), updatedBy: user?.userId },
      create: {
        key,
        value: String(value),
        label: def?.label ?? key,
        updatedBy: user?.userId,
      },
    });
  }

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ARTICLE_SETTING_KEYS } },
    orderBy: { key: "asc" },
  });
  return NextResponse.json(settings);
}
