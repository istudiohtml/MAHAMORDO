import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Public map of slug → custom poster URL for active oracles */
export async function GET() {
  const oracles = await prisma.oracle.findMany({
    where: { isActive: true },
    select: { slug: true, posterUrl: true },
  });

  const posters: Record<string, string> = {};
  for (const oracle of oracles) {
    if (oracle.posterUrl) {
      posters[oracle.slug] = oracle.posterUrl;
    }
  }

  return NextResponse.json(posters, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
