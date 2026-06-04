// Article.tags is stored as a JSON column (MySQL has no scalar array type).
// At the application layer we always treat it as string[]; these helpers
// keep the cast in one place so callers don't need to scatter `as string[]`.

import type { Prisma } from "@prisma/client";

/**
 * Safely coerce the JSON value returned by Prisma for `Article.tags` into
 * a string[]. Empty / malformed values become [].
 */
export function parseTags(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const v of value) {
    if (typeof v === "string" && v.trim()) out.push(v);
  }
  return out;
}

/**
 * Normalize an arbitrary input (CSV string or array) into the JSON-storable
 * string[] used by the `tags` column.
 */
export function normalizeTags(
  input: unknown,
  { max = 8 }: { max?: number } = {}
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const candidates: string[] = Array.isArray(input)
    ? input.flatMap((x) => (typeof x === "string" ? [x] : []))
    : typeof input === "string"
      ? input.split(",")
      : [];

  for (const raw of candidates) {
    const s = raw.trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}
