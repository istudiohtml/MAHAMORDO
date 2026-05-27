import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders headings, paragraphs and lists", () => {
    const html = renderMarkdown(
      "## หัวข้อ\n\nบทความ\n\n- รายการ 1\n- รายการ 2"
    );
    expect(html).toMatch(/<h2>.*หัวข้อ.*<\/h2>/);
    expect(html).toMatch(/<ul>/);
    expect(html).toMatch(/<li>รายการ 1<\/li>/);
  });

  it("renders bold using **text**", () => {
    const html = renderMarkdown("**สำคัญ**");
    expect(html).toMatch(/<strong>สำคัญ<\/strong>/);
  });

  it("strips disallowed tags like script", () => {
    const html = renderMarkdown(
      "ปกติ\n\n<script>alert('xss')</script>\n\n<a href=\"javascript:bad()\">click</a>"
    );
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/javascript:/i);
  });

  it("keeps safe links", () => {
    const html = renderMarkdown("[คลิก](https://example.com)");
    expect(html).toMatch(/href="https:\/\/example\.com"/);
  });
});
