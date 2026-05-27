import { CmsProvider } from "@/components/cms/CmsProvider";
import Sidebar from "@/components/cms/Sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CMS — มหาหมอดู" };

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CmsProvider>
      <div className="cms-shell">
        <Sidebar />
        <main className="cms-main">{children}</main>
      </div>
    </CmsProvider>
  );
}
