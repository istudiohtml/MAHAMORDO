import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  bonusDateKey,
  bonusReasonForDate,
  DAILY_LOGIN_BONUS_AMOUNT,
} from "./daily-bonus";

describe("bonusDateKey", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns YYYY-MM-DD shape", () => {
    const key = bonusDateKey(new Date("2026-06-04T12:00:00Z"));
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses Asia/Bangkok timezone (UTC+7) — late UTC night = next day in BKK", () => {
    // 2026-06-03 18:30 UTC == 2026-06-04 01:30 in Bangkok
    const key = bonusDateKey(new Date("2026-06-03T18:30:00Z"));
    expect(key).toBe("2026-06-04");
  });

  it("rolls over at Bangkok midnight, not UTC midnight", () => {
    // 2026-06-04 00:30 UTC == 2026-06-04 07:30 in Bangkok (still same day)
    const key = bonusDateKey(new Date("2026-06-04T00:30:00Z"));
    expect(key).toBe("2026-06-04");

    // 2026-06-03 16:00 UTC == 2026-06-03 23:00 in Bangkok (still previous day)
    const earlier = bonusDateKey(new Date("2026-06-03T16:00:00Z"));
    expect(earlier).toBe("2026-06-03");
  });
});

describe("bonusReasonForDate", () => {
  it("prefixes with daily_login_bonus", () => {
    expect(bonusReasonForDate("2026-06-04")).toBe(
      "daily_login_bonus:2026-06-04"
    );
  });

  it("produces stable, sortable strings", () => {
    const a = bonusReasonForDate("2026-06-03");
    const b = bonusReasonForDate("2026-06-04");
    expect(a < b).toBe(true);
  });
});

describe("DAILY_LOGIN_BONUS_AMOUNT", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(DAILY_LOGIN_BONUS_AMOUNT)).toBe(true);
    expect(DAILY_LOGIN_BONUS_AMOUNT).toBeGreaterThan(0);
  });
});
