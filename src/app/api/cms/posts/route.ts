import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";
import { createFortunePost, PostError } from "@/lib/fortune-post";
import { getPostImageMeta } from "@/lib/post-storage";

export async function GET(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const posts = await prisma.fortunePost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const withMeta = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      imageMeta: await getPostImageMeta(post.id),
    }))
  );

  return NextResponse.json(withMeta);
}

export async function POST(req: NextRequest) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  try {
    const { sessionId, readingText, visibility } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const { post } = await createFortunePost({
      sessionId,
      readingText,
      visibility: visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
      adminCreate: true,
    });

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof PostError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("CMS create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
