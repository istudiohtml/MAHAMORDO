"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cmsFetch } from "@/components/cms/CmsProvider";
import CmsPostImage from "@/components/cms/CmsPostImage";
import {
  CHINESE_ZODIAC,
  FOCUS_AREAS,
  FORTUNE_TRADITIONS,
  WESTERN_ZODIAC,
  createModeLabel,
  type TraditionId,
} from "@/data/post-composer";

interface Post {
  id: string;
  title: string;
  caption: string;
  quoteLine: string | null;
  oracleName: string;
  visibility: string;
  imageUrl: string;
  createdAt: string;
  zodiac: string | null;
  tradition: string | null;
  focus: string | null;
  platform: string | null;
  createMode: string | null;
  user: { email: string; name: string | null };
  imageMeta?: {
    exists: boolean;
    isPlaceholder: boolean;
    byteLength: number;
  };
}

function metaLabel(
  list: readonly { id: string; label: string }[],
  id: string | null | undefined
) {
  if (!id) return null;
  return list.find((x) => x.id === id)?.label ?? id;
}

function zodiacLabel(
  tradition: string | null | undefined,
  zodiacId: string | null | undefined
) {
  if (!zodiacId) return null;
  const list = tradition === "chinese" ? CHINESE_ZODIAC : WESTERN_ZODIAC;
  return list.find((x) => x.id === zodiacId)?.label ?? zodiacId;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CmsPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    cmsFetch("/api/cms/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPosts(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const publicCount = posts.filter((p) => p.visibility === "PUBLIC").length;
    return { total: posts.length, publicCount };
  }, [posts]);

  async function handleDelete(id: string) {
    if (!confirm("ลบโพสต์นี้?")) return;
    setDeletingId(id);
    const res = await cmsFetch(`/api/cms/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="cms-page cms-posts-page">
      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Fortune Posts</p>
          <h1 className="cms-page-title">โพสต์ดูดวง</h1>
          <p className="cms-page-sub">
            สร้างและจัดการโพสต์พร้อมภาพ AI — ADMIN เท่านั้น
          </p>
        </div>
        <div className="cms-posts-header-actions">
          <Link href="/cms/posts/settings" className="cms-btn cms-btn-ghost">
            ตั้งค่า
          </Link>
          <Link href="/cms/posts/new" className="cms-page-cta">
            + สร้างโพสต์
          </Link>
        </div>
      </header>

      {!loading && posts.length > 0 && (
        <div className="cms-posts-stats">
          <div className="cms-posts-stat">
            <span className="cms-posts-stat-value">{stats.total}</span>
            <span className="cms-posts-stat-label">โพสต์ทั้งหมด</span>
          </div>
          <div className="cms-posts-stat">
            <span className="cms-posts-stat-value">{stats.publicCount}</span>
            <span className="cms-posts-stat-label">สาธารณะ</span>
          </div>
          <div className="cms-posts-stat">
            <span className="cms-posts-stat-value">
              {stats.total - stats.publicCount}
            </span>
            <span className="cms-posts-stat-label">ส่วนตัว</span>
          </div>
        </div>
      )}

      {error && <p className="cms-posts-error">{error}</p>}

      {loading && (
        <div className="cms-posts-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cms-post-card cms-post-card-skeleton">
              <div className="cms-post-card-media skeleton" />
              <div className="cms-post-card-body">
                <div className="skeleton cms-post-skel-line" />
                <div className="skeleton cms-post-skel-line short" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <div className="cms-posts-empty">
          <span className="cms-posts-empty-icon">✧</span>
          <h3>ยังไม่มีโพสต์</h3>
          <p>สร้างโพสต์ดูดวงแรกพร้อมภาพ AI ได้เลย</p>
          <Link href="/cms/posts/new" className="cms-page-cta">
            สร้างโพสต์แรก
          </Link>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="cms-posts-grid">
          {posts.map((post) => {
            const tradition = metaLabel(FORTUNE_TRADITIONS, post.tradition);
            const zodiac = zodiacLabel(
              post.tradition as TraditionId | null,
              post.zodiac
            );
            const focus = metaLabel(FOCUS_AREAS, post.focus);
            const captionPreview = post.caption?.trim().slice(0, 120);

            return (
              <article key={post.id} className="cms-post-card">
                <Link
                  href={`/cms/posts/${post.id}`}
                  className="cms-post-card-link"
                >
                  <div className="cms-post-card-media">
                    <CmsPostImage
                      postId={post.id}
                      imageUrl={post.imageUrl}
                      alt={post.title}
                      isPlaceholder={post.imageMeta?.isPlaceholder}
                    />
                    <div className="cms-post-card-badges">
                      <span
                        className={`cms-post-badge cms-post-badge-${post.visibility === "PUBLIC" ? "public" : "private"}`}
                      >
                        {post.visibility === "PUBLIC" ? "สาธารณะ" : "ส่วนตัว"}
                      </span>
                      {post.createMode && (
                        <span className="cms-post-badge cms-post-badge-mode">
                          {createModeLabel(post.createMode)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="cms-post-card-body">
                    <h3 className="cms-post-card-title">{post.title}</h3>
                    {post.quoteLine && (
                      <p className="cms-post-card-quote">「{post.quoteLine}」</p>
                    )}
                    {captionPreview && (
                      <p className="cms-post-card-caption">{captionPreview}</p>
                    )}

                    {(tradition || zodiac || focus) && (
                      <div className="cms-post-card-tags">
                        {tradition && (
                          <span className="cms-post-tag">{tradition}</span>
                        )}
                        {zodiac && (
                          <span className="cms-post-tag cms-post-tag-zodiac">
                            {zodiac}
                          </span>
                        )}
                        {focus && (
                          <span className="cms-post-tag">{focus}</span>
                        )}
                      </div>
                    )}

                    <footer className="cms-post-card-footer">
                      <span className="cms-post-card-date">
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="cms-post-card-author">
                        {post.user.name ?? post.user.email}
                      </span>
                    </footer>
                  </div>
                </Link>

                <div className="cms-post-card-actions">
                  <Link
                    href={`/cms/posts/${post.id}`}
                    className="cms-btn cms-btn-sm cms-btn-primary"
                  >
                    เปิด
                  </Link>
                  <button
                    type="button"
                    className="cms-btn cms-btn-sm cms-btn-danger"
                    disabled={deletingId === post.id}
                    onClick={() => handleDelete(post.id)}
                  >
                    {deletingId === post.id ? "..." : "ลบ"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
