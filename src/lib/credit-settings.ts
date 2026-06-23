import { prisma } from "@/lib/prisma";

export const DEFAULT_SIGNUP_BONUS_AMOUNT = 0;
export const DEFAULT_DAILY_LOGIN_BONUS_AMOUNT = 1;

export type CreditSettings = {
  signupBonusEnabled: boolean;
  signupBonusAmount: number;
  dailyLoginBonusEnabled: boolean;
  dailyLoginBonusAmount: number;
};

function parseAmount(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, 999);
}

export async function getCreditSettings(): Promise<CreditSettings> {
  const keys = [
    "signup_bonus_enabled",
    "free_credits_on_signup",
    "daily_login_bonus_enabled",
    "daily_login_bonus_amount",
  ];
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    signupBonusEnabled: map.signup_bonus_enabled === "true",
    signupBonusAmount: parseAmount(
      map.free_credits_on_signup,
      DEFAULT_SIGNUP_BONUS_AMOUNT
    ),
    dailyLoginBonusEnabled: map.daily_login_bonus_enabled === "true",
    dailyLoginBonusAmount: parseAmount(
      map.daily_login_bonus_amount,
      DEFAULT_DAILY_LOGIN_BONUS_AMOUNT
    ),
  };
}
