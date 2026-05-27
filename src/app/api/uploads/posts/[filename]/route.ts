import { NextRequest, NextResponse } from "next/server";
import { getCmsUser } from "@/lib/cms-auth";
import { readPostImage } from "@/lib/post-storage";

type Params = { params: Promise<{ filename: string }> };

/** Serve post images — ADMIN / SUPERADMIN only */
export async function GET(req: NextRequest, { params }: Params) {
  const cmsUser = await getCmsUser(req);
  if (
    !cmsUser ||
    (cmsUser.role !== "ADMIN" && cmsUser.role !== "SUPERADMIN")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { filename } = await params;
  const buffer = await readPostImage(filename);

  if (!buffer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
