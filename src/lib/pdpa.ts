/**
 * PDPA (Thai Personal Data Protection Act B.E. 2562 / 2019) constants.
 * Bump CURRENT_POLICY_VERSION whenever the policy changes — users will
 * be re-prompted to accept the new version.
 */

export const CURRENT_POLICY_VERSION = "1.0";

export const PDPA_STORAGE_KEY = "mahamordo_pdpa_consent_v1";

export type PdpaPreferences = {
  necessary: true; // always true — required for the service to function
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string; // ISO datetime
  version: string;
};

export const DEFAULT_REJECTED: PdpaPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  acceptedAt: new Date(0).toISOString(),
  version: CURRENT_POLICY_VERSION,
};
