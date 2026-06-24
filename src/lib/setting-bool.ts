/** Normalize system_settings boolean strings to "true" | "false". */
export function normalizeBoolSetting(value: string | undefined | null): "true" | "false" {
  return value === "true" ? "true" : "false";
}
