"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildCombinedExportPreamble,
  buildContentExportPrompt,
  buildImageBackgroundPrompt,
  buildQuoteOverlayExportPrompt,
  buildVideoExportPrompt,
  hasQuoteOverlayExport,
  quoteOverlayWarningThai,
  resolveExportQuoteLine,
  type PostPromptSource,
} from "@/lib/post-export-prompts";

type PromptKind = "image" | "overlay" | "video" | "content" | "all";

type PromptBlock = {
  id: PromptKind;
  label: string;
  hint: string;
  build: (post: PostPromptSource) => string;
};

const BASE_BLOCKS: PromptBlock[] = [
  {
    id: "image",
    label: "รูปภาพ (พื้นหลัง)",
    hint: "พื้นหลังเท่านั้น ไม่มีตัวอักษร — DALL-E, Midjourney, Flux",
    build: buildImageBackgroundPrompt,
  },
  {
    id: "video",
    label: "วิดีโอ",
    hint: "Runway, Pika, Kling, Sora ฯลฯ",
    build: buildVideoExportPrompt,
  },
  {
    id: "content",
    label: "เนื้อหาโพสต์",
    hint: "คำคม (hook) + แคปชัน + แฮชแท็ก — Facebook, IG, TikTok, LINE",
    build: buildContentExportPrompt,
  },
];

const OVERLAY_BLOCK: PromptBlock = {
  id: "overlay",
  label: "รูป + คำคม (Overlay)",
  hint: "ภาพพร้อมข้อความไทยบนรูป — Canva, Photoshop, Midjourney+ข้อความ",
  build: buildQuoteOverlayExportPrompt,
};

type Props = {
  source: PostPromptSource;
};

export default function CmsCopyPromptPanel({ source }: Props) {
  const [copied, setCopied] = useState<PromptKind | null>(null);

  const resolvedQuote = useMemo(
    () => resolveExportQuoteLine(source),
    [source]
  );
  const quoteWarning = useMemo(
    () => quoteOverlayWarningThai(resolvedQuote),
    [resolvedQuote]
  );

  const blocks = useMemo(() => {
    if (!hasQuoteOverlayExport(source)) return BASE_BLOCKS;
    const overlayText = buildQuoteOverlayExportPrompt(source);
    if (!overlayText.trim()) return BASE_BLOCKS;
    return [BASE_BLOCKS[0], OVERLAY_BLOCK, ...BASE_BLOCKS.slice(1)];
  }, [source]);

  const copy = useCallback(async (kind: PromptKind, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const buildAllText = useCallback(() => {
    const preamble = buildCombinedExportPreamble(source);
    const body = blocks
      .map((b) => {
        const text = b.build(source);
        return `=== ${b.label} ===\n${text}`;
      })
      .join("\n\n");
    return preamble ? preamble + body : body;
  }, [blocks, source]);

  const showQuoteCardMissing =
    Boolean(source.isQuoteCard) &&
    !resolvedQuote.text &&
    !source.quoteLine?.trim();

  return (
    <section className="cms-copy-prompts" aria-label="คัดลอก prompt">
      <header className="cms-copy-prompts-header">
        <div>
          <h2 className="cms-copy-prompts-title">คัดลอก Prompt</h2>
          <p className="cms-copy-prompts-sub">
            นำไปวางในเครื่องมือสร้างรูป วิดีโอ หรือโพสต์โซเชียล
            {hasQuoteOverlayExport(source)
              ? " — มีคำคมบนรูป ใช้บล็อก «รูป + คำคม (Overlay)»"
              : ""}
          </p>
        </div>
        <button
          type="button"
          className="cms-btn cms-btn-ghost cms-btn-sm"
          onClick={() => copy("all", buildAllText())}
        >
          {copied === "all" ? "คัดลอกทั้งหมดแล้ว" : "คัดลอกทั้งหมด"}
        </button>
      </header>

      {(quoteWarning || showQuoteCardMissing) && (
        <p className="cms-copy-prompt-warning" role="status">
          {showQuoteCardMissing
            ? "โพสต์การ์ดคำคมแต่ไม่มีข้อความไทย — กรุณาเลือกราศีและช่วงเวลาในข้อมูลโพสต์"
            : quoteWarning}
        </p>
      )}

      {resolvedQuote.text && !source.quoteLine?.trim() && (
        <p className="cms-copy-prompt-resolved-quote">
          คำคมที่ใช้ในบล็อก Overlay: 「{resolvedQuote.text}」
        </p>
      )}

      <div className="cms-copy-prompts-grid">
        {blocks.map((block) => {
          const text = block.build(source);
          const isCopied = copied === block.id;
          const isOverlay = block.id === "overlay";

          return (
            <div
              key={block.id}
              className={`cms-copy-prompt-block${isOverlay ? " cms-copy-prompt-block-overlay" : ""}`}
            >
              <div className="cms-copy-prompt-block-head">
                <div>
                  <h3 className="cms-copy-prompt-block-label">{block.label}</h3>
                  <p className="cms-copy-prompt-block-hint">{block.hint}</p>
                </div>
                <button
                  type="button"
                  className={`cms-btn cms-btn-sm ${isCopied ? "cms-btn-copied" : "cms-btn-primary"}`}
                  onClick={() => copy(block.id, text)}
                  disabled={isOverlay && !text.trim()}
                >
                  {isCopied ? "คัดลอกแล้ว ✓" : "คัดลอก"}
                </button>
              </div>
              <pre className="cms-copy-prompt-text">
                {text.trim() || (isOverlay ? "— ไม่มีคำคม —" : text)}
              </pre>
            </div>
          );
        })}
      </div>
    </section>
  );
}
