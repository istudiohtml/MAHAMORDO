import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Public list of active oracle slugs (respects CMS isActive toggle). */
export async function GET() {
  const oracles = await prisma.oracle.findMany({
    where: { isActive: true },
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    { slugs: oracles.map((o) => o.slug) },
    { headers: { "Cache-Control": "public, max-age=30" } }
  );
}
