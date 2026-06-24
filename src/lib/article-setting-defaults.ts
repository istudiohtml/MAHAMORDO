/** Default rows for article-related system_settings keys. */
export const ARTICLE_SETTING_DEFAULTS: Record<
  string,
  { value: string; label: string }
> = {
  articles_enabled: {
    value: "true",
    label: "เปิดฟีเจอร์บทความ",
  },
  articles_default_status: {
    value: "DRAFT",
    label: "สถานะเริ่มต้นของบทความใหม่ (DRAFT/PUBLISHED)",
  },
  articles_image_style_suffix: {
    value:
      "elegant editorial illustration, soft cinematic lighting, ornate Thai mystical art",
    label: "คำเติมท้าย prompt ภาพปก AI",
  },
  articles_cron_enabled: {
    value: "false",
    label: "เปิดสร้างบทความอัตโนมัติรายวัน (cron)",
  },
  articles_cron_hour: {
    value: "7",
    label: "ชั่วโมงที่ cron รัน (0-23, เวลา Bangkok)",
  },
  articles_cron_categories: {
    value: "horoscope,tarot,feng_shui,lucky,general",
    label: "หมวดหมู่หมุนเวียนสำหรับ cron (คั่นด้วย ,)",
  },
  articles_cron_auto_publish: {
    value: "true",
    label: "publish ทันทีเมื่อ cron สร้างบทความ (true/false)",
  },
  articles_cron_with_image: {
    value: "false",
    label: "สร้างภาพปก AI เมื่อ cron รัน (true/false)",
  },
};

export const ARTICLE_SETTING_KEYS = Object.keys(ARTICLE_SETTING_DEFAULTS);
