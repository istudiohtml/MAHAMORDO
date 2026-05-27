import { describe, expect, it } from "vitest";
import { slugifyTitle, slugNeedsEncoding } from "./article-slug";

describe("slugifyTitle", () => {
  it("lowercases ascii and replaces spaces with dashes", () => {
    expect(slugifyTitle("Hello World Article")).toBe("hello-world-article");
  });

  it("collapses repeated separators", () => {
    expect(slugifyTitle("a   b___c!!!d")).toBe("a-b-c-d");
  });

  it("preserves Thai characters", () => {
    const slug = slugifyTitle("ดวงราศีกรกฎ วันนี้");
    expect(slug).toBe("ดวงราศีกรกฎ-วันนี้");
  });

  it("strips edge dashes", () => {
    expect(slugifyTitle("--hello--")).toBe("hello");
  });

  it("falls back to a random article-* slug when empty", () => {
    const slug = slugifyTitle("!!! ###");
    expect(slug.startsWith("article-")).toBe(true);
  });

  it("caps length to 80 chars", () => {
    const long = "a".repeat(200);
    expect(slugifyTitle(long).length).toBe(80);
  });
});

describe("slugNeedsEncoding", () => {
  it("returns true for Thai slugs", () => {
    expect(slugNeedsEncoding("ดวงราศี")).toBe(true);
  });

  it("returns false for ascii slugs", () => {
    expect(slugNeedsEncoding("hello-world")).toBe(false);
  });
});
