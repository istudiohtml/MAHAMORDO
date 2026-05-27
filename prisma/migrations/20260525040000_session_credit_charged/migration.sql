-- Track per-session credit charging so /api/fortune/start no longer deducts.
ALTER TABLE "fortune_sessions"
  ADD COLUMN "creditCharged" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: assume any session that already has at least one assistant message
-- was charged under the old "charge on start" rule. This prevents free re-asks
-- on legacy sessions without forcing a charge on brand-new open sessions.
UPDATE "fortune_sessions" fs
SET "creditCharged" = true
WHERE EXISTS (
  SELECT 1 FROM "messages" m
  WHERE m."sessionId" = fs."id" AND m."role" = 'ASSISTANT'
);
