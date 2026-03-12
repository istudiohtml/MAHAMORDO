import { CmsProvider } from "@/components/cms/CmsProvider";
import Sidebar from "@/components/cms/Sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CMS — มหาหมอดู" };

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CmsProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-56 p-8">{children}</main>
      </div>
    </CmsProvider>
  );
}
