-- AlterTable
ALTER TABLE "fortune_sessions" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT now() + interval '24 hours';

-- CreateIndex
CREATE INDEX "fortune_sessions_userId_idx" ON "fortune_sessions"("userId");

-- CreateIndex
CREATE INDEX "fortune_sessions_expiresAt_idx" ON "fortune_sessions"("expiresAt");
