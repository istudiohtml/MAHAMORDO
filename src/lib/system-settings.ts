import { prisma } from "@/lib/prisma";

export async function getSettingValue(
  key: string,
  fallback: string
): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function getPostSettings() {
  const keys = [
    "fortune_post_enabled",
    "fortune_post_default_visibility",
    "fortune_post_image_style_suffix",
  ];
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: map.fortune_post_enabled !== "false",
    defaultVisibility:
      map.fortune_post_default_visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
    imageStyleSuffix: map.fortune_post_image_style_suffix ?? "",
  };
}

export type ArticleSettings = {
  enabled: boolean;
  defaultStatus: "DRAFT" | "PUBLISHED";
  imageStyleSuffix: string;
  cronEnabled: boolean;
  cronHour: number;
  cronCategoriesCsv: string;
  cronAutoPublish: boolean;
};

export async function getArticleSettings(): Promise<ArticleSettings> {
  const keys = [
    "articles_enabled",
    "articles_default_status",
    "articles_image_style_suffix",
    "articles_cron_enabled",
    "articles_cron_hour",
    "articles_cron_categories",
    "articles_cron_auto_publish",
  ];
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const cronHourRaw = Number.parseInt(map.articles_cron_hour ?? "7", 10);
  return {
    enabled: map.articles_enabled !== "false",
    defaultStatus:
      map.articles_default_status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    imageStyleSuffix: map.articles_image_style_suffix ?? "",
    cronEnabled: map.articles_cron_enabled === "true",
    cronHour: Number.isFinite(cronHourRaw)
      ? Math.min(23, Math.max(0, cronHourRaw))
      : 7,
    cronCategoriesCsv:
      map.articles_cron_categories ??
      "horoscope,tarot,feng_shui,lucky,general",
    cronAutoPublish: map.articles_cron_auto_publish !== "false",
  };
}
