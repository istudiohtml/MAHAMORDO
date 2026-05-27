import { describe, expect, it } from "vitest";
import {
  createPendingPostImageBuffer,
  isPlaceholderImageBuffer,
} from "@/lib/post-storage";
import { placeholderImageBuffer } from "@/lib/image-gen";

describe("isPlaceholderImageBuffer", () => {
  it("detects legacy 1×1 marker", async () => {
    expect(await isPlaceholderImageBuffer(placeholderImageBuffer())).toBe(
      true
    );
  });

  it("treats full pending canvas as real image", async () => {
    const pending = await createPendingPostImageBuffer("1024x1024");
    expect(pending.length).toBeGreaterThan(1000);
    expect(await isPlaceholderImageBuffer(pending)).toBe(false);
  });
});
