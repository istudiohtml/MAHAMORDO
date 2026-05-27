import { NextRequest, NextResponse } from "next/server";
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

/**
 * Marks every ACTIVE session whose expiresAt has already passed as EXPIRED.
 * Safe to run on any schedule (e.g. hourly via Vercel cron / system cron).
 *
 * GET  /api/cron/sessions/expire?secret=<CRON_SECRET>
 * POST /api/cron/sessions/expire  (Authorization: Bearer <CRON_SECRET>)
 */
async function runCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const result = await prisma.fortuneSession.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({
    success: true,
    expiredCount: result.count,
    ranAt: now.toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}
