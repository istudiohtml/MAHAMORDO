import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { placeholderImageBuffer } from "@/lib/image-gen";
import {
  buildContextualQuoteFallback,
} from "@/data/post-composer";
import {
  composeQuoteCardImage,
  wrapQuoteLines,
} from "@/lib/quote-card-image";

describe("buildContextualQuoteFallback", () => {
  it("returns month + rooster quote", () => {
    expect(
      buildContextualQuoteFallback(
        "chinese",
        "rooster",
        "month",
        "ระกา (ไก่)",
        "เดือนนี้"
      )
    ).toBe("เดือนชาวไก่มีโชคดี ปังปรุเย่");
  });
});

describe("wrapQuoteLines", () => {
  it("keeps short quotes on one line", () => {
    expect(wrapQuoteLines("ดวงเปิดทาง")).toEqual(["ดวงเปิดทาง"]);
  });

  it("wraps long quotes into multiple lines", () => {
    const lines = wrapQuoteLines("เดือนชาวไก่มีโชคดี ปังปรุเย่ รับโชคใหญ่", 12);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("").replace(/\s/g, "").length).toBeGreaterThan(10);
  });
});

describe("composeQuoteCardImage", () => {
  it("renders visible Thai text on placeholder background", async () => {
    const quote = buildContextualQuoteFallback(
      "chinese",
      "rooster",
      "month",
      "ระกา (ไก่)",
      "เดือนนี้"
    );
    const out = await composeQuoteCardImage(
      placeholderImageBuffer(),
      quote,
      "1024x1024"
    );

    expect(out.length).toBeGreaterThan(1000);

    const region = await sharp(out)
      .extract({ left: 150, top: 350, width: 724, height: 350 })
      .raw()
      .toBuffer();

    let lightPixels = 0;
    const total = region.length / 3;
    for (let i = 0; i < region.length; i += 3) {
      if (region[i] > 230 && region[i + 1] > 230 && region[i + 2] > 200) {
        lightPixels++;
      }
    }

    expect(lightPixels / total).toBeGreaterThan(0.02);
  });
});
