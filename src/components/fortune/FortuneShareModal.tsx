"use client";

import { useCallback, useEffect, useState } from "react";
import type { OracleId } from "@/data/oracles";
import {
  copyShareText,
  DAILY_SHARE_THEME,
  downloadShareBlob,
  nativeShare,
  renderShareCardToBlob,
  SHARE_CARD_THEME,
  type ShareCardInput,
} from "@/lib/fortune-share-card";

export type SharePayload = {
  quoteLine: string;
  summary: string;
  shareText: string;
  oracleName: string;
  topicLabel?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  oracleId: OracleId;
  oracleName: string;
  oracleSubtitle?: string;
  posterUrl?: string | null;
  sessionId?: string;
  readingText?: string;
  /** Pre-filled payload — skips API (e.g. daily fortune) */
  preset?: SharePayload | null;
  dailyMode?: boolean;
};

export default function FortuneShareModal({
  open,
  onClose,
  oracleId,
  oracleName,
  oracleSubtitle,
  posterUrl,
  sessionId,
  readingText,
  preset,
  dailyMode = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<SharePayload | null>(preset ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState("");

  const buildCardInput = useCallback(
    (data: SharePayload): ShareCardInput => ({
      oracleId,
      oracleName: data.oracleName || oracleName,
      oracleSubtitle,
      quoteLine: data.quoteLine,
      summary: data.summary,
      topicLabel: data.topicLabel,
      posterUrl,
    }),
    [oracleId, oracleName, oracleSubtitle, posterUrl]
  );

  const generatePreview = useCallback(
    async (data: SharePayload) => {
      const theme = dailyMode ? DAILY_SHARE_THEME : SHARE_CARD_THEME[oracleId];
      const blob = await renderShareCardToBlob(buildCardInput(data), theme);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      return blob;
    },
    [buildCardInput, dailyMode, oracleId]
  );

  useEffect(() => {
    if (!open) return;

    if (preset) {
      setPayload(preset);
      setError("");
      setLoading(true);
      generatePreview(preset)
        .catch(() => setError("สร้างรูปแชร์ไม่สำเร็จ"))
        .finally(() => setLoading(false));
      return;
    }

    if (!sessionId) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setInfo("");
    setPayload(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    fetch("/api/fortune/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, readingText }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "สร้างสรุปไม่สำเร็จ");
        if (cancelled) return;
        const sharePayload: SharePayload = {
          quoteLine: data.quoteLine,
          summary: data.summary,
          shareText: data.shareText,
          oracleName: data.oracleName,
          topicLabel: data.topicLabel,
        };
        setPayload(sharePayload);
        await generatePreview(sharePayload);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when modal opens
  }, [open, sessionId, readingText]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  async function withBlob(
    action: (blob: Blob, data: SharePayload) => Promise<void>
  ) {
    if (!payload) return;
    setBusy("…");
    setInfo("");
    try {
      const theme = dailyMode ? DAILY_SHARE_THEME : SHARE_CARD_THEME[oracleId];
      const blob = await renderShareCardToBlob(buildCardInput(payload), theme);
      await action(blob, payload);
    } catch {
      setError("ดำเนินการไม่สำเร็จ");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fortune-share-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="แชร์คำทำนาย"
      onClick={onClose}
    >
      <div
        className="fortune-share-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="fortune-share-head">
          <h2 className="fortune-share-title thai-font">แชร์คำทำนาย</h2>
          <button
            type="button"
            className="fortune-share-close"
            onClick={onClose}
            aria-label="ปิด"
          >
            ✕
          </button>
        </header>

        {loading && (
          <div className="fortune-share-loading">
            <span className="fortune-vn-loading-spinner" />
            <span>กำลังสรุปคำทำนาย...</span>
          </div>
        )}

        {error && !loading && (
          <p className="fortune-share-error">{error}</p>
        )}

        {!loading && payload && (
          <>
            <div className="fortune-share-preview">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="ตัวอย่างการ์ดแชร์" />
              ) : null}
            </div>

            <blockquote className="fortune-share-quote thai-font">
              &ldquo;{payload.quoteLine}&rdquo;
            </blockquote>
            <p className="fortune-share-summary">{payload.summary}</p>

            <div className="fortune-share-actions">
              <button
                type="button"
                className="fortune-share-btn fortune-share-btn-primary"
                disabled={!!busy}
                onClick={() =>
                  withBlob(async (blob) => downloadShareBlob(blob))
                }
              >
                บันทึกรูป
              </button>
              <button
                type="button"
                className="fortune-share-btn"
                disabled={!!busy}
                onClick={async () => {
                  if (!payload) return;
                  setBusy("copy");
                  const ok = await copyShareText(payload.shareText);
                  setInfo(ok ? "คัดลอกข้อความแล้ว" : "คัดลอกไม่สำเร็จ");
                  setBusy(null);
                }}
              >
                คัดลอกข้อความ
              </button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  type="button"
                  className="fortune-share-btn"
                  disabled={!!busy}
                  onClick={() =>
                    withBlob(async (blob, data) => {
                      const ok = await nativeShare(
                        blob,
                        data.shareText,
                        `คำทำนายจาก ${data.oracleName}`
                      );
                      if (ok) setInfo("แชร์แล้ว");
                      else setError("แชร์ไม่สำเร็จ — ลองบันทึกรูปแทน");
                    })
                  }
                >
                  แชร์...
                </button>
              )}
            </div>
            {info && <p className="fortune-share-info">{info}</p>}
          </>
        )}
      </div>
    </div>
  );
}
