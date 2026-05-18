/**
 * Auth provider feature flags.
 * Single source of truth — do not add Apple UI or routes while `apple` is false.
 * See docs/REMAINING.md for backlog and re-enable steps.
 */
export const AUTH_PROVIDERS = {
  email: true,
  google: true,
  /** Sign in with Apple — deferred; do not implement without explicit approval */
  apple: false,
} as const

export type AuthProviderKey = keyof typeof AUTH_PROVIDERS

export function isAuthProviderEnabled(provider: AuthProviderKey): boolean {
  return AUTH_PROVIDERS[provider]
}
