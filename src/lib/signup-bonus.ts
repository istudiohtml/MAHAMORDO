import { prisma } from "@/lib/prisma";
import { getCreditSettings } from "@/lib/credit-settings";

export interface SignupBonusResult {
  granted: boolean;
  amount: number;
}

/**
 * Grant configurable signup credits once for a new account.
 */
export async function grantSignupBonus(
  userId: string
): Promise<SignupBonusResult> {
  const settings = await getCreditSettings();
  if (!settings.signupBonusEnabled || settings.signupBonusAmount <= 0) {
    return { granted: false, amount: 0 };
  }

  const amount = settings.signupBonusAmount;

  await prisma.$transaction([
    prisma.creditLog.create({
      data: { userId, amount, reason: "signup_bonus" },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
  ]);

  return { granted: true, amount };
}
