import { NextRequest, NextResponse } from "next/server";
import { readArticleCover } from "@/lib/article-storage";

type Params = { params: Promise<{ filename: string }> };

/** Serve article cover images — public (used on public blog pages) */
export async function GET(_req: NextRequest, { params }: Params) {
  const { filename } = await params;
  const buffer = await readArticleCover(filename);

  if (!buffer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
