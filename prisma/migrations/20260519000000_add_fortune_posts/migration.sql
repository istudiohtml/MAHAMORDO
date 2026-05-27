-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "fortune_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePrompt" TEXT,
    "topic" TEXT,
    "oracleName" TEXT NOT NULL,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fortune_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fortune_posts_sessionId_key" ON "fortune_posts"("sessionId");

-- CreateIndex
CREATE INDEX "fortune_posts_userId_createdAt_idx" ON "fortune_posts"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "fortune_posts_visibility_createdAt_idx" ON "fortune_posts"("visibility", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "fortune_posts" ADD CONSTRAINT "fortune_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fortune_posts" ADD CONSTRAINT "fortune_posts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "fortune_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
