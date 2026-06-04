"use client";

import { useEffect, useState } from "react";
import {
  ALL_ORACLE_IDS,
  activeIdsFromSlugs,
  type OracleId,
} from "@/data/oracles";

/**
 * Fetch the list of OracleIds currently enabled in the CMS.
 * `loaded=false` until the response arrives — UIs should render a fallback
 * (commonly `ALL_ORACLE_IDS`) until then to avoid a flash of empty state.
 */
export function useActiveOracleIds() {
  const [ids, setIds] = useState<OracleId[]>(ALL_ORACLE_IDS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/oracles/active")
      .then((r) => (r.ok ? r.json() : { slugs: [] }))
      .then((data: { slugs?: string[] }) => {
        if (cancelled) return;
        const next = activeIdsFromSlugs(data.slugs ?? []);
        // Only commit if we actually got data; otherwise keep the optimistic
        // fallback so a transient API error doesn't blank the homepage.
        if (next.length > 0) setIds(next);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ids, loaded };
}
