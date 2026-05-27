import { prisma } from "@/lib/prisma";

/**
 * PDPA-compliant "delete user" used by both the user self-service flow
 * and the CMS admin tool.
 *
 * We anonymise (not hard delete) so that:
 *   - Payment records remain auditable for 5 years (Thai tax law).
 *   - Foreign-key integrity is preserved (CreditLog, Payment, …).
 *
 * Personal identifiers are wiped:
 *   - email replaced with tombstone address
 *   - name, birth data, hashed password, OAuth image cleared
 *   - provider switched to "deleted"
 *   - consent fields cleared
 *
 * Sessions, refresh tokens, password reset tokens are HARD deleted so
 * the account can never log in again.
 */
export async function anonymiseUser(userId: string): Promise<void> {
  const stamp = `deleted-${Date.now()}-${userId.slice(0, 8)}`;

  await prisma.$transaction(async (tx) => {
    // Force logout everywhere by destroying auth tokens.
    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.passwordReset.deleteMany({ where: { userId } });

    // Drop fortune content (cascade deletes messages too).
    await tx.fortuneSession.deleteMany({ where: { userId } });

    // Anonymise the user row. Keep id + createdAt + payment fields.
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `${stamp}@deleted.mahamordo.local`,
        name: null,
        firstName: null,
        lastName: null,
        birthDate: null,
        birthTime: null,
        birthPlace: null,
        password: null,
        image: null,
        provider: "deleted",
        consentVersion: null,
        consentAcceptedAt: null,
        marketingConsent: false,
        deletionRequestedAt: new Date(),
      },
    });
  });
}

/**
 * Hard delete — only safe when there are NO payment records (tax law).
 * Returns false if the user has payments; caller should fall back to
 * `anonymiseUser` in that case.
 */
export async function hardDeleteUser(userId: string): Promise<boolean> {
  const payments = await prisma.payment.count({ where: { userId } });
  if (payments > 0) return false;
  await prisma.user.delete({ where: { id: userId } });
  return true;
}
