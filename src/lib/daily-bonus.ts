import { prisma } from "@/lib/prisma";
import {
  DEFAULT_DAILY_LOGIN_BONUS_AMOUNT,
  getCreditSettings,
} from "@/lib/credit-settings";

/** @deprecated Use getCreditSettings().dailyLoginBonusAmount */
export const DAILY_LOGIN_BONUS_AMOUNT = DEFAULT_DAILY_LOGIN_BONUS_AMOUNT;

const REASON_PREFIX = "daily_login_bonus";

/**
 * Build the YYYY-MM-DD bucket in Asia/Bangkok so the bonus rolls over at
 * midnight local time, not UTC.
 */
export function bonusDateKey(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // en-CA → YYYY-MM-DD
}

export function bonusReasonForDate(dateKey: string): string {
  return `${REASON_PREFIX}:${dateKey}`;
}

export interface DailyBonusResult {
  granted: boolean;
  amount: number;
  /** Skip reasons surfaced for telemetry / UI debugging. */
  skipped?:
    | "disabled"
    | "subscribed"
    | "already_claimed"
    | "missing_user"
    | "zero_amount";
  /** Updated balance after grant — only meaningful when `granted=true`. */
  newBalance?: number;
}

/**
 * Grant the daily login bonus exactly once per Asia/Bangkok day.
 * Safe to call on every login; subsequent calls in the same day are no-ops.
 */
export async function grantDailyLoginBonus(
  userId: string
): Promise<DailyBonusResult> {
  const settings = await getCreditSettings();

  if (!settings.dailyLoginBonusEnabled) {
    return { granted: false, amount: 0, skipped: "disabled" };
  }

  const bonusAmount = settings.dailyLoginBonusAmount;
  if (bonusAmount <= 0) {
    return { granted: false, amount: 0, skipped: "zero_amount" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true, subscriptionExpiresAt: true },
  });

  if (!user) {
    return { granted: false, amount: 0, skipped: "missing_user" };
  }

  const now = new Date();
  const hasActiveSubscription =
    user.subscriptionPlan !== "NONE" &&
    (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > now);

  if (hasActiveSubscription) {
    return { granted: false, amount: 0, skipped: "subscribed" };
  }

  const reason = bonusReasonForDate(bonusDateKey(now));

  const existing = await prisma.creditLog.findFirst({
    where: { userId, reason },
    select: { id: true },
  });
  if (existing) {
    return { granted: false, amount: 0, skipped: "already_claimed" };
  }

  // Atomic: increment + log together so we never end up with a phantom log.
  const [, updated] = await prisma.$transaction([
    prisma.creditLog.create({
      data: { userId, amount: bonusAmount, reason },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: bonusAmount } },
      select: { credits: true },
    }),
  ]);

  return {
    granted: true,
    amount: bonusAmount,
    newBalance: updated.credits,
  };
}
