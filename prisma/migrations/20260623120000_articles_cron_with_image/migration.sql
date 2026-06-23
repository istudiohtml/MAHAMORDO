-- Add articles_cron_with_image setting (default: skip DALL-E on daily cron)
INSERT INTO `system_settings` (`id`, `key`, `value`, `label`, `updatedAt`)
SELECT
  'cmar1cronwithimg00001',
  'articles_cron_with_image',
  'false',
  'สร้างภาพปก AI เมื่อ cron รัน (true/false)',
  NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `system_settings` WHERE `key` = 'articles_cron_with_image'
);
