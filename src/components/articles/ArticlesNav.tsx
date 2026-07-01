import Link from "next/link";

export default function ArticlesNav() {
  return (
    <nav className="articles-nav" aria-label="นำทางหลัก">
      <div className="articles-nav-inner">
        <Link href="/" className="articles-nav-back thai-font">
          <span className="articles-nav-back-line" aria-hidden />
          หน้าแรก
        </Link>
        <Link href="/" className="articles-nav-brand">
          <span className="articles-nav-brand-dot" aria-hidden />
          มาหาหมอดู
        </Link>
      </div>
    </nav>
  );
}
