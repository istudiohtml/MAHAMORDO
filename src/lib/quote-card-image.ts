import { createRequire } from "node:module";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  generateFortuneImage,
  type DallESize,
} from "@/lib/image-gen";

const require = createRequire(import.meta.url);

const NO_TEXT_BG_SUFFIX =
  "Absolutely no text, letters, numbers, typography, captions, logos, watermarks, or written symbols anywhere in the image.";

const SIZE_PX: Record<DallESize, { width: number; height: number }> = {
  "1024x1024": { width: 1024, height: 1024 },
  "1792x1024": { width: 1792, height: 1024 },
  "1024x1792": { width: 1024, height: 1792 },
};

let cachedFontBase64: string | undefined;
let cachedFontPath: string | null | undefined;

function resolveThaiFontPath(): string {
  if (cachedFontPath) return cachedFontPath;

  const candidates = [
    () =>
      require.resolve(
        "@fontsource/prompt/files/prompt-thai-600-normal.woff2"
      ),
    () =>
      path.join(
        process.cwd(),
        "node_modules/@fontsource/prompt/files/prompt-thai-600-normal.woff2"
      ),
    () =>
      path.join(
        process.cwd(),
        "node_modules/@fontsource/prompt/files/prompt-thai-600-normal.woff"
      ),
  ];

  for (const pick of candidates) {
    try {
      const resolved = pick();
      if (fs.existsSync(resolved)) {
        cachedFontPath = resolved;
        return resolved;
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    "Thai font (Prompt) not found — install @fontsource/prompt or check deployment file tracing"
  );
}

function loadFontBase64(): string {
  if (cachedFontBase64 !== undefined) return cachedFontBase64;

  const fontPath = resolveThaiFontPath();
  cachedFontBase64 = fs.readFileSync(fontPath).toString("base64");
  console.info("[quote-card] loaded Thai font:", path.basename(fontPath));
  return cachedFontBase64;
}

export function quoteCardBackgroundPrompt(basePrompt: string): string {
  return `${basePrompt}. ${NO_TEXT_BG_SUFFIX}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Break Thai quote into 1–3 centered lines for overlay */
export function wrapQuoteLines(text: string, maxCharsPerLine = 20): string[] {
  const trimmed = text.trim();
  if (!trimmed) return ["ดวงชะตาเปิดทาง"];
  if (trimmed.length <= maxCharsPerLine) return [trimmed];

  const lines: string[] = [];
  let rest = trimmed;

  while (rest.length > 0 && lines.length < 3) {
    if (rest.length <= maxCharsPerLine) {
      lines.push(rest);
      break;
    }
    let breakAt = rest.lastIndexOf(" ", maxCharsPerLine);
    if (breakAt < 8) breakAt = maxCharsPerLine;
    lines.push(rest.slice(0, breakAt).trim());
    rest = rest.slice(breakAt).trim();
  }

  return lines.length > 0 ? lines : [trimmed.slice(0, maxCharsPerLine)];
}

function buildTextOverlaySvg(
  width: number,
  height: number,
  lines: string[],
  fontBase64: string
): string {
  const lineCount = lines.length;
  const baseSize = Math.min(width, height) * 0.065;
  const fontSize = Math.round(
    baseSize / (lineCount > 2 ? 1.35 : lineCount > 1 ? 1.15 : 1)
  );
  const lineHeight = fontSize * 1.4;
  const blockHeight = lineCount * lineHeight;
  const startY = Math.round((height - blockHeight) / 2 + fontSize * 0.9);
  const centerX = Math.round(width / 2);
  const fontFormat = cachedFontPath?.endsWith(".woff2") ? "woff2" : "woff";

  const fontFace = `@font-face{font-family:'Prompt';src:url('data:font/${fontFormat};base64,${fontBase64}') format('${fontFormat}');font-weight:600;}`;

  const tspans = lines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      return `<tspan x="${centerX}" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>${fontFace}</style>
    <filter id="qs" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
    <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(10,8,6,0.15)"/>
      <stop offset="45%" stop-color="rgba(10,8,6,0.55)"/>
      <stop offset="100%" stop-color="rgba(10,8,6,0.15)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#vg)"/>
  <text
    filter="url(#qs)"
    font-family="Prompt, Thonburi, sans-serif"
    font-size="${fontSize}"
    font-weight="600"
    fill="#FFF8E7"
    stroke="#1A1510"
    stroke-width="2"
    paint-order="stroke fill"
    text-anchor="middle"
  >${tspans}</text>
</svg>`;
}

export async function composeQuoteCardImage(
  backgroundBuffer: Buffer,
  quoteLine: string,
  size: DallESize
): Promise<Buffer> {
  const trimmed = quoteLine.trim();
  if (!trimmed) {
    throw new Error("quoteLine is empty — cannot compose quote card");
  }

  const { width, height } = SIZE_PX[size];
  const lines = wrapQuoteLines(trimmed);
  let fontBase64: string;
  try {
    fontBase64 = loadFontBase64();
  } catch (err) {
    console.error("[quote-card] font load failed:", err);
    throw err;
  }

  const svg = buildTextOverlaySvg(width, height, lines, fontBase64);

  const base = await sharp(backgroundBuffer)
    .resize(width, height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  try {
    return await sharp(base)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();
  } catch (err) {
    console.error("[quote-card] sharp composite failed:", err);
    throw new Error(
      `Failed to overlay Thai quote on image: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function generateQuoteCardImage(
  backgroundPrompt: string,
  quoteLine: string,
  size: DallESize
): Promise<{ buffer: Buffer; fullBackgroundPrompt: string }> {
  const fullBackgroundPrompt = quoteCardBackgroundPrompt(backgroundPrompt);
  const background = await generateFortuneImage(fullBackgroundPrompt, size);
  const buffer = await composeQuoteCardImage(background, quoteLine, size);
  return { buffer, fullBackgroundPrompt };
}
