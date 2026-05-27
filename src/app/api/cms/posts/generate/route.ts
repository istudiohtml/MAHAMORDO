import { NextRequest, NextResponse } from "next/server";
import { requireRole, getCmsUser } from "@/lib/cms-auth";
import { createPostFromComposer } from "@/lib/fortune-post-composer";
import { createFortunePost, PostError } from "@/lib/fortune-post";
import type { ComposerPayload } from "@/data/post-composer";

export async function POST(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const cmsUser = await getCmsUser(req);
  if (!cmsUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Legacy: from fortune session
    if (body.sessionId && !body.zodiac) {
      const { post } = await createFortunePost({
        sessionId: body.sessionId,
        readingText: body.readingText,
        visibility: body.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
        adminCreate: true,
      });
      return NextResponse.json(post);
    }

    const payload = body as ComposerPayload;
    const { post } = await createPostFromComposer(cmsUser.userId, payload);
    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof PostError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("CMS generate post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
