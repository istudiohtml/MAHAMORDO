-- MAHAMORDO: add credit bonus system_settings keys
-- Safe to re-run — inserts only when key is missing; updates label only.
-- Target: MySQL (Hostinger / prisma schema)

-- ── 1. New setting keys ──────────────────────────────────────

INSERT INTO `system_settings` (`id`, `key`, `value`, `label`, `updatedAt`, `updatedBy`)
SELECT 'cmsignupbonusenabled01', 'signup_bonus_enabled', 'false',
       'เปิดโบนัสเครดิตเมื่อสมัครสมาชิก (true/false)', NOW(3), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `system_settings` WHERE `key` = 'signup_bonus_enabled'
);

INSERT INTO `system_settings` (`id`, `key`, `value`, `label`, `updatedAt`, `updatedBy`)
SELECT 'cmdailyloginenabled01', 'daily_login_bonus_enabled', 'false',
       'เปิดโบนัสเครดิตเมื่อเข้าสู่ระบบรายวัน (true/false)', NOW(3), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `system_settings` WHERE `key` = 'daily_login_bonus_enabled'
);

INSERT INTO `system_settings` (`id`, `key`, `value`, `label`, `updatedAt`, `updatedBy`)
SELECT 'cmdailyloginamount001', 'daily_login_bonus_amount', '1',
       'จำนวนเครดิตฟรีต่อวันเมื่อเข้าสู่ระบบ (ใช้เมื่อเปิด daily_login_bonus_enabled)', NOW(3), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `system_settings` WHERE `key` = 'daily_login_bonus_amount'
);

-- ── 2. Refresh label on existing key (does not change value) ─

UPDATE `system_settings`
SET
  `label` = 'จำนวนเครดิตฟรีเมื่อสมัคร (ใช้เมื่อเปิด signup_bonus_enabled)',
  `updatedAt` = NOW(3)
WHERE `key` = 'free_credits_on_signup';

-- ── 3. Optional: new users start at 0 credits ───────────────
-- Existing users are not affected — only changes the column default.

ALTER TABLE `users` MODIFY `credits` INTEGER NOT NULL DEFAULT 0;

-- ── Verify ───────────────────────────────────────────────────

SELECT `key`, `value`, `label`
FROM `system_settings`
WHERE `key` IN (
  'signup_bonus_enabled',
  'free_credits_on_signup',
  'daily_login_bonus_enabled',
  'daily_login_bonus_amount',
  'credit_price_thb'
)
ORDER BY `key`;
