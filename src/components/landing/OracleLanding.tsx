import Link from "next/link";
import {
  LANDING_PAGES,
  landingJsonLd,
  type LandingSlug,
} from "@/lib/landing-pages";
import { oracles } from "@/data/oracles";

interface Props {
  slug: LandingSlug;
  isLoggedIn: boolean;
}

export default function OracleLanding({ slug, isLoggedIn }: Props) {
  const page = LANDING_PAGES[slug];
  const oracle = oracles[page.oracleId];
  const otherPages = Object.values(LANDING_PAGES).filter((p) => p.slug !== slug);

  const dailyHref = isLoggedIn
    ? "/dashboard/daily"
    : `/auth/login?redirect=${encodeURIComponent("/dashboard/daily")}`;
  const fortuneHref = isLoggedIn
    ? `/fortune/${page.oracleId}`
    : `/auth/login?redirect=${encodeURIComponent(`/fortune/${page.oracleId}`)}`;
  const registerHref = `/auth/register?redirect=${encodeURIComponent(`/fortune/${page.oracleId}`)}`;

  return (
    <div className="ol-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd(slug)) }}
      />

      <nav className="ol-nav">
        <Link href="/" className="ol-back">
          <span className="ol-back-line" />
          หน้าแรก
        </Link>
        <Link href="/" className="ol-brand">
          <span className="ol-brand-dot" />
          Maha Mordo
        </Link>
      </nav>

      <header className="ol-hero">
        <p className="ol-eyebrow">{oracle.eyebrow}</p>
        <h1 className="ol-title thai-font">{page.h1}</h1>
        <p className="ol-subtitle thai-font">{oracle.subtitle}</p>
        <div className="ol-divider" />
        <p className="ol-intro thai-font">{page.intro}</p>
      </header>

      <section className="ol-oracle-card">
        <div className="ol-oracle-symbol" aria-hidden>
          {oracle.avatar}
        </div>
        <div className="ol-oracle-body">
          <h2 className="ol-oracle-name thai-font">{oracle.name}</h2>
          <p className="ol-oracle-desc thai-font">
            {oracle.desc.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < oracle.desc.split("\n").length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="ol-section">
        <p className="ol-section-label">ความสามารถ</p>
        <ul className="ol-highlights">
          {page.highlights.map((item) => (
            <li key={item} className="thai-font">
              <span className="ol-highlight-dot" aria-hidden>
                ✦
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="ol-pricing-note">
        <p className="ol-pricing-free thai-font">
          <strong>ดูดวงวันนี้ฟรี</strong> — สมาชิกทุกคนดูดวงรายวันได้วันละ 1 ครั้ง
          ไม่ต้องใช้เครดิต
        </p>
        <p className="ol-pricing-paid thai-font">
          สนทนากับ{oracle.name} ใช้{" "}
          <strong>{oracle.creditCost} เครดิต</strong> ต่อการดูดวง
          (สมาชิกแพ็กเกจไม่จำกัดไม่ต้องใช้เครดิต)
        </p>
      </section>

      <div className="ol-cta-row">
        <Link href={dailyHref} className="ol-btn ol-btn-outline thai-font">
          ดูดวงวันนี้ฟรี ✦
        </Link>
        <Link href={fortuneHref} className="ol-btn ol-btn-primary thai-font">
          เริ่มดูดวงกับ{oracle.name}
        </Link>
      </div>

      {!isLoggedIn && (
        <p className="ol-register-hint thai-font">
          ยังไม่มีบัญชี?{" "}
          <Link href={registerHref} className="ol-link">
            สมัครสมาชิกฟรี
          </Link>
        </p>
      )}

      <section className="ol-section ol-related">
        <p className="ol-section-label">หมอดูสำนักอื่น</p>
        <div className="ol-related-grid">
          {otherPages.map((other) => {
            const o = oracles[other.oracleId];
            return (
              <Link
                key={other.slug}
                href={other.path}
                className="ol-related-card"
              >
                <span className="ol-related-symbol" aria-hidden>
                  {o.avatar}
                </span>
                <span className="ol-related-name thai-font">{o.name}</span>
                <span className="ol-related-path thai-font">{other.h1}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="ol-footer">
        <Link href="/articles" className="ol-footer-link thai-font">
          บทความดูดวง
        </Link>
        <span className="ol-footer-sep">·</span>
        <Link href="/pricing" className="ol-footer-link thai-font">
          ราคาและแพ็กเกจ
        </Link>
      </footer>
    </div>
  );
}
