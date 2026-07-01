import type { Metadata } from "next";
import LegalFooter from "@/components/legal/LegalFooter";
import ArticlesNav from "@/components/articles/ArticlesNav";

export const metadata: Metadata = {
  title: "บทความ — มาหาหมอดู",
  description:
    "บทความดูดวง ทาโรต์ ฮวงจุ้ย และเสริมโชค จากมาหาหมอดู อ่านใหม่ทุกวัน",
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="articles-layout">
      <ArticlesNav />
      {children}
      <LegalFooter />
    </div>
  );
}
