"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cmsFetch, useCms } from "@/components/cms/CmsProvider";
import CmsCopyPromptPanel from "@/components/cms/CmsCopyPromptPanel";
import CmsPostImage from "@/components/cms/CmsPostImage";
import {
  CHINESE_ZODIAC,
  FORTUNE_TRADITIONS,
  WESTERN_ZODIAC,
  TIME_PERIODS,
  FOCUS_AREAS,
  PLATFORMS,
  IMAGE_STYLES,
  IMAGE_SIZES,
  createModeLabel,
  isQuoteCardStyle,
  type ImageSizeKey,
  type TraditionId,
} from "@/data/post-composer";

interface PostDetail {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  oracleName: string;
  topic: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  imagePrompt: string | null;
  createdAt: string;
  zodiac: string | null;
  tradition: string | null;
  timePeriod: string | null;
  focus: string | null;
  platform: string | null;
  imageStyle: string | null;
  imageSize: string | null;
  createMode: string | null;
  quoteLine: string | null;
  user: { email: string; name: string | null };
  imageMeta?: {
    exists: boolean;
    isPlaceholder: boolean;
    byteLength: number;
  };
}

function metaLabel(
  list: readonly { id: string; label: string }[],
  id: string | null | undefined
) {
  if (!id) return "—";
  return list.find((x) => x.id === id)?.label ?? id;
}

function zodiacLabel(
  tradition: string | null | undefined,
  zodiacId: string | null | undefined
) {
  if (!zodiacId) return "—";
  const list = tradition === "chinese" ? CHINESE_ZODIAC : WESTERN_ZODIAC;
  return list.find((x) => x.id === zodiacId)?.label ?? zodiacId;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CmsPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCms();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [regeneratingQuote, setRegeneratingQuote] = useState(false);
  const [editQuoteLine, setEditQuoteLine] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    const res = await cmsFetch(`/api/cms/posts/${id}`);
    const data = await res.json();
    if (data.error) {
      setPost(null);
      return null;
    }
    setPost(data);
    setEditQuoteLine(data.quoteLine ?? "");
    setImageVersion((v) => v + 1);
    return data as PostDetail;
  }, [id]);

  useEffect(() => {
    loadPost().finally(() => setLoading(false));
  }, [loadPost]);

  async function updateVisibility(visibility: "PRIVATE" | "PUBLIC") {
    setSavingVisibility(true);
    const res = await cmsFetch(`/api/cms/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    if (res.ok) {
      const data = await res.json();
      setPost((p) => (p ? { ...p, visibility: data.visibility } : p));
    }
    setSavingVisibility(false);
  }

  async function saveEdits() {
    setEditError(null);
    setEditSuccess(null);
    setSavingEdit(true);

    const form = new FormData();
    const trimmedQuote = editQuoteLine.trim();
    const quoteChanged = trimmedQuote !== (post?.quoteLine ?? "").trim();

    if (quoteChanged) {
      form.append("quoteLine", trimmedQuote);
    }
    if (imageFile) {
      form.append("image", imageFile);
    }

    if (!quoteChanged && !imageFile) {
      setEditError("ไม่มีการเปลี่ยนแปลง");
      setSavingEdit(false);
      return;
    }

    const res = await cmsFetch(`/api/cms/posts/${id}`, {
      method: "PATCH",
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      setEditError(data.error ?? "บันทึกไม่สำเร็จ");
      setSavingEdit(false);
      return;
    }

    setPost(data);
    setEditQuoteLine(data.quoteLine ?? "");
    setImageFile(null);
    setImageVersion((v) => v + 1);
    setEditSuccess("บันทึกเรียบร้อยแล้ว");
    setSavingEdit(false);
  }

  async function regenerateQuoteImage() {
    setEditError(null);
    setEditSuccess(null);
    setRegeneratingQuote(true);

    const form = new FormData();
    form.append("regenerateQuoteOverlay", "true");
    form.append("quoteLine", editQuoteLine.trim());

    const res = await cmsFetch(`/api/cms/posts/${id}`, {
      method: "PATCH",
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      setEditError(data.error ?? "สร้างรูปใหม่ไม่สำเร็จ");
      setRegeneratingQuote(false);
      return;
    }

    setPost(data);
    setEditQuoteLine(data.quoteLine ?? "");
    setImageVersion((v) => v + 1);
    setEditSuccess("สร้างรูปใหม่จากคำคมเรียบร้อยแล้ว");
    setRegeneratingQuote(false);
  }

  if (loading) {
    return (
      <div className="cms-page cms-post-detail-page">
        <p className="cms-post-detail-loading">กำลังโหลด...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="cms-page cms-post-detail-page">
        <p className="cms-post-detail-error">ไม่พบโพสต์</p>
        <Link href="/cms/posts" className="cms-post-detail-back">
          ← กลับรายการโพสต์
        </Link>
      </div>
    );
  }

  const sizeMeta = post.imageSize
    ? IMAGE_SIZES[post.imageSize as ImageSizeKey]
    : null;
  const isPublic = post.visibility === "PUBLIC";
  const hasMeta = Boolean(post.zodiac || post.createMode);
  const isQuoteCard = isQuoteCardStyle(post.imageStyle ?? "");
  const quoteDirty =
    editQuoteLine.trim() !== (post.quoteLine ?? "").trim();
  const editBusy = savingEdit || regeneratingQuote;

  const promptSource = {
    title: post.title,
    caption: post.caption,
    imagePrompt: post.imagePrompt,
    quoteLine: post.quoteLine,
    zodiac: post.zodiac,
    tradition: post.tradition,
    timePeriod: post.timePeriod,
    timeLabel: metaLabel(TIME_PERIODS, post.timePeriod),
    isQuoteCard,
    platform: post.platform ?? undefined,
    zodiacLabel: zodiacLabel(
      post.tradition as TraditionId | null,
      post.zodiac
    ),
    traditionLabel: metaLabel(FORTUNE_TRADITIONS, post.tradition),
    focusLabel: metaLabel(FOCUS_AREAS, post.focus),
  };

  return (
    <div className="cms-page cms-post-detail-page">
      <Link href="/cms/posts" className="cms-post-detail-back">
        ← กลับรายการโพสต์
      </Link>

      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Fortune Posts</p>
          <h1 className="cms-page-title">{post.title}</h1>
          <p className="cms-page-sub">
            {post.oracleName}
            {post.topic ? ` · ${post.topic}` : ""}
          </p>
        </div>
        <div className="cms-post-detail-header-actions">
          <span
            className={`cms-post-badge cms-post-badge-${isPublic ? "public" : "private"}`}
          >
            {isPublic ? "สาธารณะ" : "ส่วนตัว"}
          </span>
          <button
            type="button"
            disabled={savingVisibility}
            onClick={() =>
              updateVisibility(isPublic ? "PRIVATE" : "PUBLIC")
            }
            className="cms-btn cms-btn-sm cms-btn-ghost"
          >
            {savingVisibility
              ? "กำลังบันทึก..."
              : isPublic
                ? "เปลี่ยนเป็นส่วนตัว"
                : "เผยแพร่สาธารณะ"}
          </button>
        </div>
      </header>

      <div className="cms-post-detail-layout">
        <article className="cms-post-detail-card">
          <div className="cms-post-detail-media">
            <CmsPostImage
              postId={post.id}
              imageUrl={post.imageUrl}
              alt={post.title}
              version={imageVersion}
              isPlaceholder={post.imageMeta?.isPlaceholder}
            />
            <div className="cms-post-card-badges">
              {post.createMode && (
                <span className="cms-post-badge cms-post-badge-mode">
                  {createModeLabel(post.createMode)}
                </span>
              )}
            </div>
          </div>

          <div className="cms-post-detail-body">
            <section className="cms-post-detail-edit">
              <h3 className="cms-post-detail-edit-title">แก้ไขโพสต์</h3>

              <label className="cms-composer-field">
                <span className="cms-composer-label">แก้คำคมบนรูป</span>
                <textarea
                  value={editQuoteLine}
                  onChange={(e) => setEditQuoteLine(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="คำคมที่จะแสดงบนรูป"
                  className="cms-post-detail-textarea"
                  disabled={editBusy}
                />
              </label>

              <label className="cms-composer-field">
                <span className="cms-composer-label">อัปโหลดรูปใหม่</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="cms-post-detail-file"
                  disabled={editBusy}
                  onChange={(e) => {
                    setImageFile(e.target.files?.[0] ?? null);
                    setEditError(null);
                    setEditSuccess(null);
                  }}
                />
                <p className="cms-post-detail-file-hint">
                  PNG, JPEG หรือ WebP — สูงสุด 5 MB
                  {imageFile ? ` · เลือก: ${imageFile.name}` : ""}
                </p>
              </label>

              <div className="cms-post-detail-edit-actions">
                <button
                  type="button"
                  className="cms-btn cms-btn-primary"
                  disabled={editBusy}
                  onClick={saveEdits}
                >
                  {savingEdit ? "กำลังบันทึก..." : "บันทึก"}
                </button>
                {isQuoteCard && (
                  <button
                    type="button"
                    className="cms-btn cms-btn-ghost"
                    disabled={editBusy || !editQuoteLine.trim() || !quoteDirty}
                    onClick={regenerateQuoteImage}
                    title="วางคำคมทับบนรูปปัจจุบัน (เหมาะกับรูปพื้นหลังที่ไม่มีข้อความ)"
                  >
                    {regeneratingQuote
                      ? "กำลังสร้างรูป..."
                      : "สร้างรูปใหม่จากคำคม"}
                  </button>
                )}
              </div>

              {editError && (
                <p className="cms-post-detail-edit-error">{editError}</p>
              )}
              {editSuccess && (
                <p className="cms-post-detail-edit-success">{editSuccess}</p>
              )}
            </section>

            <div>
              <p className="cms-post-detail-oracle">{post.oracleName}</p>
              <h2 className="cms-post-detail-title">{post.title}</h2>
              {post.topic && (
                <p className="cms-post-detail-topic">หัวข้อ: {post.topic}</p>
              )}
            </div>

            {post.quoteLine && (
              <blockquote className="cms-post-detail-quote">
                「{post.quoteLine}」
              </blockquote>
            )}

            <p className="cms-post-detail-caption">
              {post.caption.trim() || "—"}
            </p>

            {hasMeta && (
              <div className="cms-post-meta-grid cms-post-detail-meta">
                <span>
                  <strong>แนว:</strong>{" "}
                  {metaLabel(FORTUNE_TRADITIONS, post.tradition)}
                </span>
                <span>
                  <strong>ราศี:</strong>{" "}
                  {zodiacLabel(
                    post.tradition as TraditionId | null,
                    post.zodiac
                  )}
                </span>
                <span>
                  <strong>ช่วงเวลา:</strong>{" "}
                  {metaLabel(TIME_PERIODS, post.timePeriod)}
                </span>
                <span>
                  <strong>ด้าน:</strong> {metaLabel(FOCUS_AREAS, post.focus)}
                </span>
                <span>
                  <strong>แพลตฟอร์ม:</strong>{" "}
                  {metaLabel(PLATFORMS, post.platform)}
                </span>
                <span>
                  <strong>สไตล์:</strong>{" "}
                  {metaLabel(IMAGE_STYLES, post.imageStyle)}
                </span>
                <span>
                  <strong>ขนาด:</strong>{" "}
                  {sizeMeta
                    ? `${sizeMeta.label} (${sizeMeta.cost})`
                    : post.imageSize ?? "—"}
                </span>
                <span>
                  <strong>โหมด:</strong> {createModeLabel(post.createMode)}
                </span>
              </div>
            )}

            <footer className="cms-post-detail-footer">
              <p>สร้างโดย: {post.user.name ?? post.user.email}</p>
              <p>สร้างเมื่อ: {formatDate(post.createdAt)}</p>
              {user?.role === "SUPERADMIN" && post.imagePrompt && (
                <p className="cms-post-detail-prompt">
                  Prompt: {post.imagePrompt}
                </p>
              )}
            </footer>
          </div>
        </article>

        <CmsCopyPromptPanel source={promptSource} />
      </div>
    </div>
  );
}
