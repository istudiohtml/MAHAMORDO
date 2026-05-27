"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cmsFetch } from "@/components/cms/CmsProvider";
import { getOracleTemplateAvatar } from "@/lib/oracle-assets";

interface Oracle {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  speciality: string;
  creditCost: number;
  isActive: boolean;
  sortOrder: number;
  posterUrl: string | null;
}

const ACCENTS = ["gold", "violet", "emerald", "slate"] as const;
const ICONS = ["☽", "◈", "✦", "✧"] as const;

function accentForOracle(oracle: Oracle, index: number) {
  const bySpeciality: Record<string, (typeof ACCENTS)[number]> = {
    "โหราศาสตร์ไทย": "gold",
    "ซาจูเกาหลี": "emerald",
    "ไพ่ทาโรต์": "violet",
    "ศาสตร์มืด": "slate",
  };
  return bySpeciality[oracle.speciality] ?? ACCENTS[index % ACCENTS.length];
}

function iconForOracle(oracle: Oracle, index: number) {
  const bySpeciality: Record<string, string> = {
    "โหราศาสตร์ไทย": "☽",
    "ซาจูเกาหลี": "◈",
    "ไพ่ทาโรต์": "✦",
    "ศาสตร์มืด": "☾",
  };
  return bySpeciality[oracle.speciality] ?? ICONS[index % ICONS.length];
}

function OracleCardPoster({
  slug,
  name,
  posterUrl,
  fallbackIcon,
}: {
  slug: string;
  name: string;
  posterUrl: string | null;
  fallbackIcon: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = getOracleTemplateAvatar(slug, posterUrl);

  if (failed) {
    return <span className="cms-oracle-card-icon">{fallbackIcon}</span>;
  }

  return (
    <img
      src={src}
      alt={name}
      className="cms-oracle-card-avatar"
      onError={() => setFailed(true)}
    />
  );
}

export default function OraclesPage() {
  const [oracles, setOracles] = useState<Oracle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    cmsFetch("/api/cms/oracles")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setOracles(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const activeCount = oracles.filter((o) => o.isActive).length;
    return {
      total: oracles.length,
      activeCount,
      inactiveCount: oracles.length - activeCount,
    };
  }, [oracles]);

  async function toggleActive(id: string, current: boolean) {
    setTogglingId(id);
    await cmsFetch(`/api/cms/oracles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setOracles((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isActive: !current } : o))
    );
    setTogglingId(null);
  }

  return (
    <div className="cms-page cms-oracles-page">
      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Oracles</p>
          <h1 className="cms-page-title">หมอดู</h1>
          <p className="cms-page-sub">
            จัดการตัวละคร รูป poster และ system prompt
          </p>
        </div>
      </header>

      {!loading && oracles.length > 0 && (
        <div className="cms-oracles-stats">
          <div className="cms-oracles-stat">
            <span className="cms-oracles-stat-value">{stats.total}</span>
            <span className="cms-oracles-stat-label">หมอดูทั้งหมด</span>
          </div>
          <div className="cms-oracles-stat">
            <span className="cms-oracles-stat-value">{stats.activeCount}</span>
            <span className="cms-oracles-stat-label">เปิดใช้งาน</span>
          </div>
          <div className="cms-oracles-stat">
            <span className="cms-oracles-stat-value">{stats.inactiveCount}</span>
            <span className="cms-oracles-stat-label">ปิดใช้งาน</span>
          </div>
        </div>
      )}

      {error && <p className="cms-oracles-error">{error}</p>}

      {loading && (
        <div className="cms-oracles-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cms-oracle-card cms-oracle-card-skeleton">
              <div className="cms-oracle-card-poster-skeleton skeleton" />
              <div className="cms-oracle-skel-text">
                <div className="skeleton cms-oracle-skel-line" />
                <div className="skeleton cms-oracle-skel-line short" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && oracles.length === 0 && !error && (
        <div className="cms-oracles-empty">
          <span className="cms-oracles-empty-icon">✦</span>
          <h3>ยังไม่มีหมอดู</h3>
          <p>เพิ่มตัวละครหมอดูในระบบเพื่อเริ่มใช้งาน</p>
        </div>
      )}

      {!loading && oracles.length > 0 && (
        <div className="cms-oracles-grid">
          {oracles.map((oracle, index) => {
            const accent = accentForOracle(oracle, index);
            const icon = iconForOracle(oracle, index);
            const descPreview = oracle.description?.trim().slice(0, 90);

            return (
              <article
                key={oracle.id}
                className={`cms-oracle-card accent-${accent}${oracle.isActive ? "" : " is-inactive"}`}
              >
                <div className="cms-oracle-card-poster-wrap">
                  <OracleCardPoster
                    slug={oracle.slug}
                    name={oracle.name}
                    posterUrl={oracle.posterUrl}
                    fallbackIcon={icon}
                  />
                  <span
                    className={`cms-oracle-badge cms-oracle-card-poster-badge${oracle.isActive ? " cms-oracle-badge-active" : " cms-oracle-badge-inactive"}`}
                  >
                    {oracle.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </div>

                <div className="cms-oracle-card-body">
                  <h3 className="cms-oracle-card-name">{oracle.name}</h3>
                  <p className="cms-oracle-card-title">{oracle.title}</p>
                  <code className="cms-oracle-card-slug">{oracle.slug}</code>

                  {descPreview && (
                    <p className="cms-oracle-card-desc">{descPreview}</p>
                  )}

                  <div className="cms-oracle-card-tags">
                    <span className="cms-oracle-tag cms-oracle-tag-speciality">
                      {oracle.speciality}
                    </span>
                    <span className="cms-oracle-tag">
                      {oracle.creditCost} เครดิต
                    </span>
                    <span className="cms-oracle-tag cms-oracle-tag-order">
                      ลำดับ {oracle.sortOrder}
                    </span>
                  </div>
                </div>

                <footer className="cms-oracle-card-actions">
                  <button
                    type="button"
                    className={`cms-btn cms-btn-sm ${oracle.isActive ? "cms-btn-ghost" : "cms-btn-primary"}`}
                    disabled={togglingId === oracle.id}
                    onClick={() => toggleActive(oracle.id, oracle.isActive)}
                  >
                    {togglingId === oracle.id
                      ? "..."
                      : oracle.isActive
                        ? "ปิดใช้งาน"
                        : "เปิดใช้งาน"}
                  </button>
                  <Link
                    href={`/cms/oracles/${oracle.id}`}
                    className="cms-btn cms-btn-sm cms-btn-primary"
                  >
                    แก้ไข
                  </Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
