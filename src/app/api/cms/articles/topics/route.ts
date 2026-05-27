import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/cms-auth";
import {
  ARTICLE_TOPIC_POOL,
  pickRandomTopic,
} from "@/data/article-topics";

export async function GET(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "general";
  const topic = pickRandomTopic(category);
  const pool = ARTICLE_TOPIC_POOL[category] ?? ARTICLE_TOPIC_POOL.general;

  return NextResponse.json({ topic, poolSize: pool.length });
}
