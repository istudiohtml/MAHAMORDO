-- Drop unique constraint on sessionId (allow multiple admin posts without session)
DROP INDEX IF EXISTS "fortune_posts_sessionId_key";

-- sessionId optional for CMS composer posts
ALTER TABLE "fortune_posts" ALTER COLUMN "sessionId" DROP NOT NULL;

-- Composer metadata
ALTER TABLE "fortune_posts" ADD COLUMN IF NOT EXISTS "zodiac" TEXT;
ALTER TABLE "fortune_posts" ADD COLUMN IF NOT EXISTS "tradition" TEXT;
ALTER TABLE "fortune_posts" ADD COLUMN IF NOT EXISTS "timePeriod" TEXT;
ALTER TABLE "fortune_posts" ADD COLUMN IF NOT EXISTS "focus" TEXT;
ALTER TABLE "fortune_posts" ADD COLUMN IF NOT EXISTS "platform" TEXT;
ALTER TABLE "fortune_posts" ADD COLUMN IF NOT EXISTS "imageStyle" TEXT;
ALTER TABLE "fortune_posts" ADD COLUMN IF NOT EXISTS "imageSize" TEXT;
ALTER TABLE "fortune_posts" ADD COLUMN IF NOT EXISTS "createMode" TEXT;

-- FK: SET NULL when session deleted
ALTER TABLE "fortune_posts" DROP CONSTRAINT IF EXISTS "fortune_posts_sessionId_fkey";
ALTER TABLE "fortune_posts" ADD CONSTRAINT "fortune_posts_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "fortune_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "fortune_posts_sessionId_idx" ON "fortune_posts"("sessionId");
