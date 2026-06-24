import { prisma } from "@/lib/prisma";
import {
  ARTICLE_SETTING_DEFAULTS,
  ARTICLE_SETTING_KEYS,
} from "@/lib/article-setting-defaults";

/**
 * Ensure all article setting keys exist in system_settings.
 * Safe on every GET — missing keys are inserted with seed defaults.
 */
export async function ensureArticleSettings(): Promise<void> {
  const existing = await prisma.systemSetting.findMany({
    where: { key: { in: ARTICLE_SETTING_KEYS } },
    select: { key: true },
  });
  const have = new Set(existing.map((r) => r.key));
  const missing = ARTICLE_SETTING_KEYS.filter((key) => !have.has(key));
  if (missing.length === 0) return;

  await prisma.$transaction(
    missing.map((key) => {
      const def = ARTICLE_SETTING_DEFAULTS[key];
      return prisma.systemSetting.create({
        data: { key, value: def.value, label: def.label },
      });
    })
  );
}
