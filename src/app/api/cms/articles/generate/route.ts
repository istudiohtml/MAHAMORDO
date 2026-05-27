import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/cms-auth";
import { generateArticleDraft } from "@/lib/article-content";
import { getArticleSettings } from "@/lib/system-settings";

export async function POST(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  try {
    const body = await req.json().catch(() => ({}));
    const settings = await getArticleSettings();

    const draft = await generateArticleDraft({
      category: String(body.category ?? "general"),
      topicHint: body.topicHint ? String(body.topicHint) : undefined,
      styleSuffix: settings.imageStyleSuffix,
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error("CMS generate article draft error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "เขียนบทความด้วย AI ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}
