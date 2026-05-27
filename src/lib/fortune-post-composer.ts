import { prisma } from "@/lib/prisma";
import {
  composerUsesQuoteCard,
  generatePostDraftFromComposer,
  type ComposerContext,
} from "@/lib/fortune-post-content";
import { generateFortuneImage, type DallESize } from "@/lib/image-gen";
import { generateQuoteCardImage, composeQuoteCardImage } from "@/lib/quote-card-image";
import {
  createPendingPostImageBuffer,
  markPostImagePending,
  savePostImage,
} from "@/lib/post-storage";
import { getPostSettings } from "@/lib/system-settings";
import {
  buildContextualQuoteFallback,
  FOCUS_AREAS,
  FORTUNE_TRADITIONS,
  IMAGE_STYLES,
  IMAGE_SIZES,
  PLATFORMS,
  TIME_PERIODS,
  zodiacOptionsForTradition,
  type ComposerPayload,
  type ImageSizeKey,
} from "@/data/post-composer";
import { PostError } from "@/lib/fortune-post";
import { buildStoredImagePromptWithOverlay } from "@/lib/post-export-prompts";
import type { PostVisibility } from "@prisma/client";

function labelOf(
  list: readonly { id: string; label: string }[],
  id: string
) {
  return list.find((x) => x.id === id)?.label ?? id;
}

export function buildComposerContext(payload: ComposerPayload): ComposerContext {
  const zodiacList = zodiacOptionsForTradition(payload.tradition);
  const tradition = FORTUNE_TRADITIONS.find((t) => t.id === payload.tradition);
  const isQuoteCard = composerUsesQuoteCard(payload);

  return {
    zodiacLabel: labelOf(zodiacList, payload.zodiac),
    traditionLabel: tradition?.label ?? payload.tradition,
    traditionHint: tradition?.promptHint ?? "",
    timeLabel: labelOf(TIME_PERIODS, payload.timePeriod),
    focusLabel: labelOf(FOCUS_AREAS, payload.focus),
    platformLabel: labelOf(PLATFORMS, payload.platform),
    stylePrompt:
      IMAGE_STYLES.find((s) => s.id === payload.imageStyle)?.prompt ??
      IMAGE_STYLES[0].prompt,
    styleLabel:
      IMAGE_STYLES.find((s) => s.id === payload.imageStyle)?.label ??
      "Cosmic Mystic",
    isQuoteCard,
  };
}

export async function createPostFromComposer(
  adminUserId: string,
  payload: ComposerPayload
) {
  if (!payload.zodiac) {
    throw new PostError("กรุณาเลือกราศี", 400);
  }
  if (!payload.tradition) {
    throw new PostError("กรุณาเลือกแนวโหราศาสตร์", 400);
  }

  const postSettings = await getPostSettings();
  if (!postSettings.enabled) {
    throw new PostError("ฟีเจอร์โพสต์ถูกปิดชั่วคราว", 503);
  }

  const ctx = buildComposerContext(payload);
  const sizeKey: ImageSizeKey = payload.imageSize ?? "square";
  const dallESize: DallESize = IMAGE_SIZES[sizeKey].dallE;
  const visibility: PostVisibility =
    payload.visibility === "PUBLIC"
      ? "PUBLIC"
      : (postSettings.defaultVisibility as PostVisibility);

  let title = `${ctx.zodiacLabel} · ${ctx.focusLabel}`;
  let caption = "";
  let imagePrompt = `${ctx.stylePrompt}, ${ctx.traditionHint}, ${ctx.zodiacLabel}, ${ctx.focusLabel}`;
  let quoteLine: string | null = null;

  if (
    payload.mode === "both" ||
    payload.mode === "post" ||
    payload.mode === "prompt"
  ) {
    const draft = await generatePostDraftFromComposer(ctx, payload);
    title = draft.title;
    caption = draft.caption;
    imagePrompt = draft.imagePrompt;
    if (ctx.isQuoteCard) {
      quoteLine =
        draft.quoteLine?.trim() ||
        buildContextualQuoteFallback(
          payload.tradition,
          payload.zodiac,
          payload.timePeriod,
          ctx.zodiacLabel,
          ctx.timeLabel
        );
    }
  } else if (payload.mode === "image") {
    title = `${ctx.zodiacLabel} · ${ctx.styleLabel}`;
    caption = ctx.isQuoteCard
      ? `การ์ดคำคมดวง${ctx.timeLabel} — ${ctx.focusLabel}`
      : `ภาพดวง${ctx.timeLabel} — ${ctx.focusLabel}`;
    imagePrompt = `${ctx.stylePrompt}, ${ctx.traditionHint}, ${ctx.zodiacLabel} zodiac, ${ctx.focusLabel} theme, ${ctx.timeLabel}`;
    if (ctx.isQuoteCard) {
      quoteLine = buildContextualQuoteFallback(
        payload.tradition,
        payload.zodiac,
        payload.timePeriod,
        ctx.zodiacLabel,
        ctx.timeLabel
      );
    }
  }

  const postId = crypto.randomUUID();
  let imageBuffer: Buffer;
  let storedImagePrompt = imagePrompt;

  if (payload.mode === "post" || payload.mode === "prompt") {
    const pendingBg = await createPendingPostImageBuffer(dallESize);
    const line = quoteLine?.trim();
    if (ctx.isQuoteCard && line) {
      imageBuffer = await composeQuoteCardImage(pendingBg, line, dallESize);
    } else {
      imageBuffer = pendingBg;
    }
  } else if (ctx.isQuoteCard) {
    const line =
      quoteLine?.trim() ||
      buildContextualQuoteFallback(
        payload.tradition,
        payload.zodiac,
        payload.timePeriod,
        ctx.zodiacLabel,
        ctx.timeLabel
      );
    if (!line) {
      throw new PostError("ไม่สามารถสร้างคำคมบนรูปได้ กรุณาลองใหม่", 500);
    }
    quoteLine = line;
    const bgPrompt = postSettings.imageStyleSuffix
      ? `${imagePrompt}. ${ctx.stylePrompt}. ${postSettings.imageStyleSuffix}`
      : `${imagePrompt}. ${ctx.stylePrompt}`;
    try {
      const result = await generateQuoteCardImage(bgPrompt, line, dallESize);
      imageBuffer = result.buffer;
      storedImagePrompt = result.fullBackgroundPrompt;
    } catch (err) {
      console.error("[quote-card] image compose failed:", err);
      const detail = err instanceof Error ? err.message : String(err);
      throw new PostError(
        `วางข้อความบนรูปไม่สำเร็จ: ${detail}`,
        500
      );
    }
  } else {
    const fullPrompt = postSettings.imageStyleSuffix
      ? `${imagePrompt}. ${ctx.stylePrompt}. ${postSettings.imageStyleSuffix}`
      : `${imagePrompt}. ${ctx.stylePrompt}`;
    imageBuffer = await generateFortuneImage(fullPrompt, dallESize);
    storedImagePrompt = fullPrompt;
  }

  const imageUrl = await savePostImage(postId, imageBuffer);
  if (payload.mode === "post" || payload.mode === "prompt") {
    const hasQuotePreview = ctx.isQuoteCard && Boolean(quoteLine?.trim());
    if (!hasQuotePreview) {
      await markPostImagePending(postId);
    }
  }

  if (payload.mode === "prompt" && quoteLine?.trim()) {
    storedImagePrompt = buildStoredImagePromptWithOverlay(
      imagePrompt,
      quoteLine
    );
  }

  const post = await prisma.fortunePost.create({
    data: {
      id: postId,
      userId: adminUserId,
      sessionId: payload.sessionId || null,
      title,
      caption: caption || " ",
      imageUrl,
      imagePrompt: storedImagePrompt,
      quoteLine,
      topic: payload.focus,
      oracleName: "มหาหมอดู CMS",
      visibility,
      zodiac: payload.zodiac,
      tradition: payload.tradition,
      timePeriod: payload.timePeriod,
      focus: payload.focus,
      platform: payload.platform,
      imageStyle: payload.imageStyle,
      imageSize: sizeKey,
      createMode: payload.mode,
    },
  });

  return { post };
}
