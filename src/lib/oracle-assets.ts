/**
 * Canonical oracle avatar paths (public/avatars/).
 *
 * Active assets:
 * - template-*.jpg — posters / fortune UI (high detail)
 * - *.svg — icons / preload / DB avatarUrl fallback
 *
 * Unused source photos live in public/avatars/_archive/source-photos/
 */

export const ORACLE_SLUGS = ['mae-mor-jan', 'por-mor-son', 'ajarn-rahu'] as const
export type OracleSlug = (typeof ORACLE_SLUGS)[number]

/** Full poster images for UI cards and fortune session */
export const ORACLE_TEMPLATE_AVATAR: Record<OracleSlug, string> = {
  'mae-mor-jan': '/avatars/template-mae-mor-jan.jpg',
  'por-mor-son': '/avatars/template-por-mor-son.jpg',
  'ajarn-rahu': '/avatars/template-ajarn-rahu.jpg',
}

/** SVG icons (seed avatarUrl, loading screen preload) */
export const ORACLE_SVG_AVATAR: Record<OracleSlug, string> = {
  'mae-mor-jan': '/avatars/mae-mor-jan.svg',
  'por-mor-son': '/avatars/por-mor-son.svg',
  'ajarn-rahu': '/avatars/ajarn-rahu.svg',
}

/** Legacy slugs from older DB seeds / exports */
const LEGACY_SLUG_TO_CANONICAL: Record<string, OracleSlug> = {
  'yai-kham': 'mae-mor-jan',
  'nang-fah': 'por-mor-son',
  'mor-dum': 'ajarn-rahu',
}

export function resolveOracleSlug(slug: string): string {
  if (slug in ORACLE_TEMPLATE_AVATAR) return slug
  return LEGACY_SLUG_TO_CANONICAL[slug] ?? slug
}

export function getOracleTemplateAvatar(
  slug: string,
  posterUrl?: string | null
): string {
  if (posterUrl?.trim()) return posterUrl
  const canonical = resolveOracleSlug(slug)
  if (canonical in ORACLE_TEMPLATE_AVATAR) {
    return ORACLE_TEMPLATE_AVATAR[canonical as OracleSlug]
  }
  return `/avatars/template-${canonical}.jpg`
}

/** Cache-busted poster URL for CMS preview after upload */
export function oraclePosterSrc(
  slug: string,
  posterUrl?: string | null,
  version = 0
): string {
  const base = getOracleTemplateAvatar(slug, posterUrl)
  if (!version) return base
  const sep = base.includes("?") ? "&" : "?"
  return `${base}${sep}v=${version}`
}

export function getOracleSvgAvatar(
  slug: string,
  avatarUrl?: string | null
): string {
  if (avatarUrl) return avatarUrl
  const canonical = resolveOracleSlug(slug)
  if (canonical in ORACLE_SVG_AVATAR) {
    return ORACLE_SVG_AVATAR[canonical as OracleSlug]
  }
  return `/avatars/${canonical}.svg`
}

/** Preload list for loading screen */
export const ORACLE_PRELOAD_SVGS = ORACLE_SLUGS.map((slug) => ORACLE_SVG_AVATAR[slug])
