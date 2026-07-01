/**
 * Thai date formatters for the dashboard / CMS UI.
 * Default toLocaleDateString('th-TH') returns ambiguous "15/4/2569" — we use
 * a long Thai month form ("15 เม.ย. 2569") that's easier to read.
 */

export function formatThaiDate(
  value: Date | string | null | undefined
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatThaiDateTime(
  value: Date | string | null | undefined
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isExpired(
  value: Date | string | null | undefined
): boolean {
  if (!value) return false;
  const d = typeof value === "string" ? new Date(value) : value;
  return d.getTime() < Date.now();
}

/** Midnight today in Asia/Bangkok — for daily fortune / coin flip date keys */
export function todayBangkokDate(): Date {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  // UTC noon keeps the calendar day stable for Prisma @db.Date reads/writes
  return new Date(`${dateKey}T12:00:00.000Z`);
}
