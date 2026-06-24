import { CmsProvider } from "@/components/cms/CmsProvider";
import Sidebar from "@/components/cms/Sidebar";
import CmsErrorBoundary from "@/components/cms/CmsErrorBoundary";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CMS — มาหาหมอดู" };

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CmsProvider>
      <div className="cms-shell">
        <Sidebar />
        <main className="cms-main">
          <CmsErrorBoundary>{children}</CmsErrorBoundary>
        </main>
      </div>
    </CmsProvider>
  );
}
