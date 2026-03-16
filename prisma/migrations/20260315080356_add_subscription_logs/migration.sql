-- AlterTable
ALTER TABLE "fortune_sessions" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '24 hours';

-- CreateTable
CREATE TABLE "subscription_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "planType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_logs_userId_idx" ON "subscription_logs"("userId");

-- CreateIndex
CREATE INDEX "subscription_logs_createdAt_idx" ON "subscription_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "subscription_logs" ADD CONSTRAINT "subscription_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
