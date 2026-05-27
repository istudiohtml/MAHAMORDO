/** Generate fortune post illustration via OpenAI Images API */

export type DallESize = "1024x1024" | "1792x1024" | "1024x1792";

const PLACEHOLDER_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export async function generateFortuneImage(
  prompt: string,
  size: DallESize = "1024x1024"
): Promise<Buffer> {
  if (process.env.E2E_MOCK_AI === "true") {
    return Buffer.from(PLACEHOLDER_PNG_BASE64, "base64");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: `${prompt}. No text, letters, or watermarks in the image.`,
      n: 1,
      size,
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image generation failed: ${err}`);
  }

  const data = (await res.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("No image data returned");
  }

  return Buffer.from(b64, "base64");
}

/** Legacy 1×1 marker used in tests and to detect old prompt-only posts */
export function placeholderImageBuffer(): Buffer {
  return Buffer.from(PLACEHOLDER_PNG_BASE64, "base64");
}

export const PLACEHOLDER_IMAGE_MAX_BYTES = 120;
