import { prisma } from "@/lib/prisma";
import {
  buildConversationText,
  generatePostDraft,
} from "@/lib/fortune-post-content";
import { generateFortuneImage } from "@/lib/image-gen";
import { savePostImage } from "@/lib/post-storage";
import { getPostSettings } from "@/lib/system-settings";
import type { PostVisibility } from "@prisma/client";

type CreatePostInput = {
  sessionId: string;
  readingText?: string;
  visibility?: PostVisibility;
  /** Admin CMS — no credit charge, any session */
  adminCreate?: boolean;
};

export async function createFortunePost(input: CreatePostInput) {
  const postSettings = await getPostSettings();
  if (!postSettings.enabled && !input.adminCreate) {
    throw new PostError("ฟีเจอร์โพสต์ถูกปิดชั่วคราว", 503);
  }

  const session = await prisma.fortuneSession.findUnique({
    where: { id: input.sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      oracle: true,
      posts: { select: { id: true } },
    },
  });

  if (!session) {
    throw new PostError("Session not found", 404);
  }
  const existingPost = await prisma.fortunePost.findFirst({
    where: { sessionId: input.sessionId },
  });
  if (existingPost) {
    throw new PostError("โพสต์จาก session นี้ถูกสร้างแล้ว", 409);
  }

  const assistantMessages = session.messages.filter(
    (m) => m.role === "ASSISTANT"
  );
  const hasReading =
    assistantMessages.length > 0 || Boolean(input.readingText?.trim());
  if (!hasReading) {
    throw new PostError("ยังไม่มีผลดูดวงให้สร้างโพสต์", 400);
  }

  const conversation = buildConversationText(
    session.messages,
    session.oracle.name,
    session.topic,
    input.readingText
  );

  const draft = await generatePostDraft(conversation);
  const imagePrompt = postSettings.imageStyleSuffix
    ? `${draft.imagePrompt}. ${postSettings.imageStyleSuffix}`
    : draft.imagePrompt;

  const imageBuffer = await generateFortuneImage(imagePrompt);
  const postId = crypto.randomUUID();
  const imageUrl = await savePostImage(postId, imageBuffer);

  const visibility =
    input.visibility ??
    (postSettings.defaultVisibility as PostVisibility);

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.fortunePost.create({
      data: {
        id: postId,
        userId: session.userId,
        sessionId: input.sessionId,
        title: draft.title,
        caption: draft.caption,
        imageUrl,
        imagePrompt: draft.imagePrompt,
        topic: session.topic,
        oracleName: session.oracle.name,
        visibility,
      },
    });

    await tx.fortuneSession.update({
      where: { id: input.sessionId },
      data: { status: "COMPLETED" },
    });

    if (input.readingText?.trim()) {
      const lastAssistant = session.messages
        .filter((m) => m.role === "ASSISTANT")
        .pop();
      if (!lastAssistant || lastAssistant.content !== input.readingText.trim()) {
        await tx.message.create({
          data: {
            sessionId: input.sessionId,
            role: "ASSISTANT",
            content: input.readingText.trim(),
          },
        });
      }
    }

    return created;
  });

  return { post };
}

export class PostError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "PostError";
  }
}
