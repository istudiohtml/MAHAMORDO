// Shared labels + descriptions for FortuneSession.status so the UI stays
// consistent across the dashboard, history list, and history detail page.

export type SessionStatus = "ACTIVE" | "COMPLETED" | "EXPIRED";

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  ACTIVE: "ยังคุยต่อได้",
  COMPLETED: "เสร็จสิ้น",
  EXPIRED: "หมดอายุ",
};

export const SESSION_STATUS_DESCRIPTION: Record<SessionStatus, string> = {
  ACTIVE: "เซสชันยังเปิดอยู่ คุยต่อกับหมอดูได้ภายใน 24 ชั่วโมงนับจากเปิด",
  COMPLETED: "ปิดเซสชันถาวรแล้ว (บันทึกเป็นโพสต์เรียบร้อย)",
  EXPIRED: "เกิน 24 ชั่วโมงแล้ว ไม่สามารถส่งข้อความเพิ่มได้",
};

/**
 * Returns the *effective* status the UI should display. ACTIVE sessions that
 * have already passed their expiry are reported as EXPIRED even before the
 * cron / next-message handler flips the column in the DB.
 */
export function getEffectiveSessionStatus(
  status: string,
  expiresAt: Date | string | null | undefined,
): SessionStatus {
  if (status === "ACTIVE" && expiresAt) {
    const exp = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    if (exp.getTime() < Date.now()) return "EXPIRED";
  }
  return (status as SessionStatus) ?? "ACTIVE";
}

export function getSessionStatusLabel(status: string): string {
  return SESSION_STATUS_LABEL[status as SessionStatus] ?? status;
}

export function getSessionStatusDescription(status: string): string {
  return SESSION_STATUS_DESCRIPTION[status as SessionStatus] ?? "";
}
