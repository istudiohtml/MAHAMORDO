-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PAID');

-- AlterTable
ALTER TABLE "fortune_sessions" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '24 hours';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiOverviewQuotaResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "aiOverviewQuotaUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "userPlan" "UserPlan" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "quota_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quotaType" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quota_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quota_usages_userId_quotaType_date_key" ON "quota_usages"("userId", "quotaType", "date");

-- AddForeignKey
ALTER TABLE "quota_usages" ADD CONSTRAINT "quota_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
