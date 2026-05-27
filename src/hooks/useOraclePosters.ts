"use client";

import { useEffect, useState } from "react";

/** Fetch custom poster URLs keyed by oracle slug (public API) */
export function useOraclePosters() {
  const [posters, setPosters] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/oracles/posters")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: unknown) => {
        if (!cancelled) {
          const map =
            data && typeof data === "object" && !Array.isArray(data)
              ? (data as Record<string, string>)
              : {};
          setPosters(map);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { posters, loaded };
}
