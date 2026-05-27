"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cmsFetch } from "@/components/cms/CmsProvider";
import {
  FORTUNE_TRADITIONS,
  FOCUS_AREAS,
  IMAGE_STYLES,
  IMAGE_SIZES,
  PLATFORMS,
  TIME_PERIODS,
  isQuoteCardStyle,
  pickRandomComposerDefaults,
  pickRandomImageStyle,
  zodiacOptionsForTradition,
  type CreateMode,
  type ImageSizeKey,
  type TraditionId,
} from "@/data/post-composer";

const MODES: { id: CreateMode; label: string; icon: string }[] = [
  { id: "both", label: "สร้างพร้อมกัน", icon: "✨" },
  { id: "post", label: "Post เท่านั้น", icon: "📝" },
  { id: "image", label: "รูปเท่านั้น", icon: "🎨" },
  { id: "prompt", label: "Prompt เท่านั้น", icon: "📋" },
];

export default function PostComposerForm() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<CreateMode>("both");
  const [tradition, setTradition] = useState<TraditionId | "">("");
  const [zodiac, setZodiac] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [focus, setFocus] = useState("");
  const [platform, setPlatform] = useState("");
  const [imageStyle, setImageStyle] = useState("");
  const [imageSize, setImageSize] = useState<ImageSizeKey | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const zodiacOptions = useMemo(() => {
    if (!tradition) return [];
    return zodiacOptionsForTradition(tradition);
  }, [tradition]);

  const applyRandomDefaults = useCallback(() => {
    const d = pickRandomComposerDefaults();
    setTradition(d.tradition);
    setZodiac(d.zodiac);
    setTimePeriod(d.timePeriod);
    setFocus(d.focus);
    setPlatform(d.platform);
    setImageStyle(d.imageStyle);
    setImageSize(d.imageSize);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!pathname?.endsWith("/posts/new")) return;
    applyRandomDefaults();
  }, [pathname, applyRandomDefaults]);

  function rerollImageStyle() {
    setImageStyle((current) => pickRandomImageStyle(current || undefined));
  }

  function handleTraditionChange(next: TraditionId) {
    setTradition(next);
    const options = zodiacOptionsForTradition(next);
    if (!options.some((z) => z.id === zodiac)) {
      setZodiac(options[0]?.id ?? "");
    }
  }

  async function handleGenerate() {
    if (!zodiac) {
      setError("กรุณาเลือกราศี");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await cmsFetch("/api/cms/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          tradition,
          zodiac,
          timePeriod,
          focus,
          platform,
          imageStyle,
          imageSize,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "สร้างไม่สำเร็จ");
        return;
      }
      router.push(`/cms/posts/${data.id}`);
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel =
    mode === "both"
      ? "🔮 สร้าง Post + รูป พร้อมกัน"
      : mode === "post"
        ? "📝 สร้าง Post"
        : mode === "prompt"
          ? "📋 สร้าง Prompt"
          : "🎨 สร้างรูป";

  const showImageStyle = mode !== "post";
  const showImageSize = mode !== "post" && mode !== "prompt";
  const quoteCardSelected = isQuoteCardStyle(imageStyle);

  if (!ready) {
    return (
      <div className="cms-composer cms-composer-loading">
        <p className="cms-composer-loading-text">กำลังสุ่มค่าเริ่มต้น...</p>
      </div>
    );
  }

  return (
    <div className="cms-composer">
      <div className="cms-composer-tabs">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`cms-composer-tab${mode === m.id ? " active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      <div className="cms-composer-grid">
        <label className="cms-composer-field">
          <span className="cms-composer-label">แนวโหราศาสตร์</span>
          <select
            value={tradition}
            onChange={(e) => handleTraditionChange(e.target.value as TraditionId)}
            className="cms-composer-select"
          >
            {FORTUNE_TRADITIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="cms-composer-field">
          <span className="cms-composer-label">ราศี</span>
          <select
            value={zodiac}
            onChange={(e) => setZodiac(e.target.value)}
            className="cms-composer-select"
          >
            {zodiacOptions.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </label>

        <label className="cms-composer-field">
          <span className="cms-composer-label">ช่วงเวลา</span>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="cms-composer-select"
          >
            {TIME_PERIODS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="cms-composer-field">
          <span className="cms-composer-label">ด้านที่เน้น</span>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="cms-composer-select"
          >
            {FOCUS_AREAS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className="cms-composer-field">
          <span className="cms-composer-label">แพลตฟอร์ม</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="cms-composer-select"
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div className="cms-composer-field cms-composer-random-hint">
          <span className="cms-composer-label">ค่าเริ่มต้น</span>
          <p className="cms-composer-hint">
            สุ่มทุกช่องรวมสไตล์รูป — ปรับได้ก่อนกดสร้าง
          </p>
        </div>
      </div>

      {showImageStyle && (
        <>
          <div className="cms-composer-section-head">
            <p className="cms-composer-section-title">
              สไตล์รูปภาพ
              {mode === "prompt" ? " (สำหรับ prompt)" : ""}
            </p>
            <button
              type="button"
              className="cms-btn cms-btn-ghost cms-composer-reroll"
              onClick={rerollImageStyle}
            >
              สุ่มใหม่
            </button>
          </div>
          <div className="cms-composer-styles">
            {IMAGE_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`cms-composer-style${s.id === "quote_card" ? " cms-composer-style-quote" : ""}${imageStyle === s.id ? " active" : ""}`}
                onClick={() => setImageStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {quoteCardSelected && (
            <p className="cms-composer-quote-hint">
              {mode === "prompt"
                ? "การ์ดคำคม: prompt จะรวมคำคมไทยบนรูป + พื้นหลัง — คัดลอกจากบล็อก «รูป + คำคม (Overlay)»"
                : "การ์ดคำคม: คำคมสั้นบนรูป (สร้างด้วย AI + วางข้อความไทยบนเซิร์ฟเวอร์) และแคปชันด้านล่างโพสต์ — พื้นหลังไม่มีตัวอักษร"}
            </p>
          )}

          {mode === "prompt" && !quoteCardSelected && (
            <p className="cms-composer-quote-hint">
              เลือก «การ์ดคำคม» หากต้องการ prompt ที่มีข้อความไทยบนรูป
            </p>
          )}

          {showImageSize && (
            <>
          <p className="cms-composer-section-title">ขนาดรูป (DALL-E 3)</p>
          <div className="cms-composer-sizes">
            {(Object.keys(IMAGE_SIZES) as ImageSizeKey[]).map((key) => {
              const s = IMAGE_SIZES[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`cms-composer-size${imageSize === key ? " active" : ""}`}
                  onClick={() => setImageSize(key)}
                >
                  <span className="cms-composer-size-ratio">{s.ratio}</span>
                  <span className="cms-composer-size-label">
                    {s.label.replace(/^\d+:\d+\s*/, "")}
                  </span>
                  <span className="cms-composer-size-cost">{s.cost}</span>
                </button>
              );
            })}
          </div>
            </>
          )}
        </>
      )}

      {error && <p className="cms-composer-error">{error}</p>}

      <button
        type="button"
        className="cms-btn cms-btn-primary cms-composer-submit"
        onClick={handleGenerate}
        disabled={submitting}
      >
        {submitting ? "กำลังสร้าง..." : submitLabel}
      </button>
    </div>
  );
}
