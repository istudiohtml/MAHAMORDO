import Link from "next/link";
import PostComposerForm from "@/components/cms/PostComposerForm";

export default function CmsNewPostPage() {
  return (
    <div className="cms-page">
      <Link
        href="/cms/posts"
        className="text-sm text-slate-500 hover:text-slate-900 no-underline"
      >
        ← กลับรายการโพสต์
      </Link>
      <header className="cms-page-header">
        <div>
        <h2 className="cms-page-title">สร้างโพสต์ดูดวง</h2>
        <p className="cms-page-sub">
          สุ่มทุกช่องรวมสไตล์รูป — เปิดหน้านี้ใหม่ทุกครั้ง
        </p>
        </div>
      </header>
      <PostComposerForm />
    </div>
  );
}
