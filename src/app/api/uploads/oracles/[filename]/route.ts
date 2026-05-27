import { NextRequest, NextResponse } from "next/server";
import { readOraclePoster } from "@/lib/oracle-storage";

type Params = { params: Promise<{ filename: string }> };

/** Serve oracle poster images — public (used on fortune UI) */
export async function GET(_req: NextRequest, { params }: Params) {
  const { filename } = await params;
  const buffer = await readOraclePoster(filename);

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
