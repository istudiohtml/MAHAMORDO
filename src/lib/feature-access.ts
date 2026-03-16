import { prisma } from './prisma'

export type FeatureType = 'ai_overview' | 'daily_fortune_aspect'

const FREE_TIER_LIMITS = {
  ai_overview: 2, // 2 per day
  daily_fortune_aspect: 1, // 1 aspect per reading
}

/**
 * Check if user can access a feature
 * Free tier: limited quota
 * Paid tier: unlimited
 */
export async function canAccessFeature(
  userId: string,
  feature: FeatureType
): Promise<{ allowed: boolean; remaining?: number; limit?: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { allowed: false }
  }

  // Paid users (with active subscription or enough credits) can access everything
  const now = new Date()
  const hasActiveSubscription =
    user.subscriptionPlan &&
    user.subscriptionPlan !== 'NONE' &&
    user.subscriptionExpiresAt !== null &&
    user.subscriptionExpiresAt > now

  // Allow if has active subscription OR has credits (but not 1000000 which is obsolete)
  if (hasActiveSubscription || (user.credits > 0 && user.credits < 999999)) {
    return { allowed: true }
  }

  // Free tier: check quota
  if (user.userPlan === 'FREE') {
    const limit = FREE_TIER_LIMITS[feature]
    if (!limit) {
      return { allowed: true } // unknown feature, allow
    }

    // Get today's quota usage
    const today = new Date().toISOString().split('T')[0]
    const usage = await prisma.quotaUsage.findUnique({
      where: {
        userId_quotaType_date: {
          userId,
          quotaType: feature,
          date: new Date(today),
        },
      },
    })

    const used = usage?.usedCount || 0
    const remaining = Math.max(0, limit - used)

    return {
      allowed: remaining > 0,
      remaining,
      limit,
    }
  }

  return { allowed: false }
}

/**
 * Track feature usage for free tier users
 */
export async function trackFeatureUsage(
  userId: string,
  feature: FeatureType
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  await prisma.quotaUsage.upsert({
    where: {
      userId_quotaType_date: {
        userId,
        quotaType: feature,
        date: new Date(today),
      },
    },
    create: {
      userId,
      quotaType: feature,
      usedCount: 1,
      date: new Date(today),
    },
    update: {
      usedCount: { increment: 1 },
    },
  })
}
