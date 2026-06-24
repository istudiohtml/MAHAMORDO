import type { OracleId } from "@/data/oracles";

export type ShareCardInput = {
  oracleId: OracleId;
  oracleName: string;
  oracleSubtitle?: string;
  quoteLine: string;
  summary: string;
  topicLabel?: string | null;
  posterUrl?: string | null;
};

export type ShareCardTheme = {
  bg: [string, string];
  accent: string;
  accentSoft: string;
};

export const SHARE_CARD_THEME: Record<OracleId, ShareCardTheme> = {
  1: {
    bg: ["#1E0F04", "#2A1C0C"],
    accent: "#D4AF37",
    accentSoft: "rgba(212, 175, 55, 0.35)",
  },
  2: {
    bg: ["#080F1A", "#0D1A2E"],
    accent: "#7EB8FF",
    accentSoft: "rgba(126, 184, 255, 0.35)",
  },
  3: {
    bg: ["#100820", "#1A0D30"],
    accent: "#C084FC",
    accentSoft: "rgba(192, 132, 252, 0.35)",
  },
};

export const DAILY_SHARE_THEME: ShareCardTheme = {
  bg: ["#0a0a12", "#151528"],
  accent: "#F0C060",
  accentSoft: "rgba(240, 192, 96, 0.35)",
};

const CARD_W = 1080;
const CARD_H = 1350;

function cssFontFamily(varName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return raw ? `${raw}, ${fallback}` : fallback;
}

async function ensureFonts(promptFamily: string, cinzelFamily: string) {
  await Promise.all([
    document.fonts.load(`600 52px ${promptFamily}`),
    document.fonts.load(`400 34px ${promptFamily}`),
    document.fonts.load(`600 28px ${cinzelFamily}`),
  ]);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];

  const hasSpaces = /\s/.test(text);
  if (hasSpaces) {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [text];
  }

  // Thai / CJK — break by character
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = ch;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function loadPosterImage(url: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("poster load failed"));
      img.src = url;
    });
    return img;
  } catch {
    return null;
  }
}

export async function renderShareCardToBlob(
  input: ShareCardInput,
  theme: ShareCardTheme = SHARE_CARD_THEME[input.oracleId]
): Promise<Blob> {
  const promptFamily = cssFontFamily("--font-prompt", "Prompt, sans-serif");
  const cinzelFamily = cssFontFamily("--font-cinzel", "Cinzel, serif");
  await ensureFonts(promptFamily, cinzelFamily);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, theme.bg[0]);
  grad.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle grid overlay
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < CARD_W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_H);
    ctx.stroke();
  }
  for (let y = 0; y < CARD_H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_W, y);
    ctx.stroke();
  }

  // Frame border
  ctx.strokeStyle = theme.accentSoft;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 48, 48, CARD_W - 96, CARD_H - 96, 28);
  ctx.stroke();

  const pad = 120;
  let y = 130;

  // Poster circle (optional)
  if (input.posterUrl) {
    const poster = await loadPosterImage(input.posterUrl);
    if (poster) {
      const size = 140;
      const cx = CARD_W / 2;
      const cy = y + size / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(poster, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.stroke();
      y += size + 36;
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = theme.accent;
  ctx.font = `600 28px ${cinzelFamily}`;
  ctx.fillText(input.oracleName.toUpperCase(), CARD_W / 2, y);
  y += 40;

  if (input.oracleSubtitle) {
    ctx.fillStyle = "rgba(253, 251, 247, 0.45)";
    ctx.font = `400 22px ${promptFamily}`;
    ctx.fillText(input.oracleSubtitle, CARD_W / 2, y);
    y += 36;
  }

  if (input.topicLabel) {
    const pillW = ctx.measureText(input.topicLabel).width + 48;
    const pillX = (CARD_W - pillW) / 2;
    ctx.fillStyle = theme.accentSoft;
    drawRoundedRect(ctx, pillX, y - 28, pillW, 44, 22);
    ctx.fill();
    ctx.fillStyle = theme.accent;
    ctx.font = `400 24px ${promptFamily}`;
    ctx.fillText(input.topicLabel, CARD_W / 2, y + 2);
    y += 56;
  } else {
    y += 20;
  }

  // Decorative divider
  ctx.strokeStyle = theme.accentSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 80, y);
  ctx.lineTo(CARD_W / 2 + 80, y);
  ctx.stroke();
  y += 48;

  // Quote line
  ctx.fillStyle = "#FDFBF7";
  ctx.font = `600 52px ${promptFamily}`;
  const quoteLines = wrapText(ctx, `"${input.quoteLine}"`, CARD_W - pad * 2);
  for (const line of quoteLines.slice(0, 3)) {
    ctx.fillText(line, CARD_W / 2, y);
    y += 64;
  }
  y += 24;

  // Summary
  ctx.fillStyle = "rgba(253, 251, 247, 0.82)";
  ctx.font = `400 34px ${promptFamily}`;
  const summaryLines = wrapText(ctx, input.summary, CARD_W - pad * 2);
  for (const line of summaryLines.slice(0, 6)) {
    ctx.fillText(line, CARD_W / 2, y);
    y += 52;
  }

  // Footer brand
  ctx.fillStyle = theme.accent;
  ctx.font = `600 26px ${cinzelFamily}`;
  ctx.fillText("มาหาหมอดู", CARD_W / 2, CARD_H - 120);
  ctx.fillStyle = "rgba(253, 251, 247, 0.35)";
  ctx.font = `400 22px ${promptFamily}`;
  ctx.fillText("mahamordo.com", CARD_W / 2, CARD_H - 82);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to export image"));
      },
      "image/png",
      1
    );
  });
}

export function downloadShareBlob(blob: Blob, filename = "mahamordo-fortune.png") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShare(
  blob: Blob,
  text: string,
  title: string
): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    const file = new File([blob], "mahamordo-fortune.png", { type: "image/png" });
    const payload: ShareData = {
      title,
      text,
      files: [file],
    };
    if (navigator.canShare && !navigator.canShare(payload)) {
      await navigator.share({ title, text });
      return true;
    }
    await navigator.share(payload);
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return true;
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }
}
