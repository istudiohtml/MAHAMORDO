"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  amount: number;
}

/**
 * Shows a one-shot banner after the user receives the daily login bonus.
 * Strips the `?bonus=...` query param on mount so the banner doesn't reappear
 * on subsequent navigations within the dashboard.
 */
export default function DailyBonusBanner({ amount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    router.replace(pathname, { scroll: false });
    // We intentionally only run this once on mount; router/pathname identity
    // is stable across renders for the same route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

  return (
    <div className="dash-bonus-banner thai-font" role="status" aria-live="polite">
      <span className="dash-bonus-banner-icon" aria-hidden>
        ✦
      </span>
      <span className="dash-bonus-banner-text">
        ยินดีด้วย! คุณได้รับ <strong>{amount} เครดิต</strong>{" "}
        จากการเข้าสู่ระบบประจำวัน
      </span>
      <button
        type="button"
        className="dash-bonus-banner-close"
        onClick={() => setOpen(false)}
        aria-label="ปิด"
      >
        ×
      </button>
    </div>
  );
}
