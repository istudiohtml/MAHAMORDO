import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getCmsUser } from "@/lib/cms-auth";
import { ensureArticleSettings } from "@/lib/ensure-article-settings";
import { ARTICLE_SETTING_DEFAULTS } from "@/lib/article-setting-defaults";

// GET /api/cms/settings — ดู config ทั้งหมด
export async function GET(req: NextRequest) {
  const deny = await requireRole("SUPERADMIN")(req);
  if (deny) return deny;

  await ensureArticleSettings();

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

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 });
  }

  await ensureArticleSettings();

  try {
    await Promise.all(
      body.map(({ key, value }) => {
        const articleDef = ARTICLE_SETTING_DEFAULTS[key];
        if (articleDef) {
          return prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value), updatedBy: caller?.userId },
            create: {
              key,
              value: String(value),
              label: articleDef.label,
              updatedBy: caller?.userId,
            },
          });
        }
        return prisma.systemSetting.update({
          where: { key },
          data: { value: String(value), updatedBy: caller?.userId },
        });
      })
    );
  } catch (error) {
    console.error("[cms/settings PUT] failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "บันทึกการตั้งค่าไม่สำเร็จ",
      },
      { status: 500 }
    );
  }

  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json(settings);
}
