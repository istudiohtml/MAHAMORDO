import { NextRequest, NextResponse } from "next/server";
import { runDailyArticleCron } from "@/lib/article";
import { getArticleSettings } from "@/lib/system-settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header =
    req.headers.get("authorization") ?? req.headers.get("x-cron-secret") ?? "";
  const bearer = header.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : header;

  if (bearer && bearer === secret) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

async function runCron(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 503 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getArticleSettings();
  if (!settings.enabled) {
    return NextResponse.json({ skipped: "articles feature disabled" });
  }
  if (!settings.cronEnabled) {
    return NextResponse.json({ skipped: "cron disabled in settings" });
  }

  // optional: only run when current Bangkok hour matches configured hour ±0
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  if (!force) {
    const now = new Date();
    const bangkokHour = (now.getUTCHours() + 7) % 24;
    if (bangkokHour !== settings.cronHour) {
      return NextResponse.json({
        skipped: `not the scheduled hour (current Bangkok hour ${bangkokHour}, expected ${settings.cronHour})`,
      });
    }
  }

  // try to find a default author for cron-generated articles
  const author = await prisma.user.findFirst({
    where: { role: { in: ["SUPERADMIN", "ADMIN"] } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  try {
    const result = await runDailyArticleCron({
      categoriesCsv: settings.cronCategoriesCsv,
      autoPublish: settings.cronAutoPublish,
      withImage: settings.cronWithImage,
      authorId: author?.id,
      styleSuffix: settings.imageStyleSuffix,
    });
    return NextResponse.json({
      ok: true,
      cronEnabled: settings.cronEnabled,
      cronWithImage: settings.cronWithImage,
      ...result,
    });
  } catch (error) {
    console.error("[cron/articles/daily] failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "cron failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}
