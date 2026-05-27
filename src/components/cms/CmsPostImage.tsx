"use client";

import { useEffect, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

type Props = {
  postId: string;
  imageUrl: string;
  alt: string;
  version?: number;
  /** When true, show a friendly empty state instead of a tiny legacy placeholder */
  isPlaceholder?: boolean;
  className?: string;
};

function cacheBustedUrl(url: string, version: number) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${version}`;
}

function isLegacyPublicUpload(url: string) {
  return url.startsWith("/uploads/");
}

export default function CmsPostImage({
  postId,
  imageUrl,
  alt,
  version = 0,
  isPlaceholder: isPlaceholderProp,
  className,
}: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [legacyPlaceholder, setLegacyPlaceholder] = useState(false);

  const showEmpty = isPlaceholderProp === true || legacyPlaceholder;

  useEffect(() => {
    if (isPlaceholderProp === true) {
      setLoading(false);
      setBlobUrl(null);
      setLoadError(null);
      setLegacyPlaceholder(false);
      return;
    }

    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setLegacyPlaceholder(false);
      setBlobUrl(null);

      if (isLegacyPublicUpload(imageUrl)) {
        if (!cancelled) {
          setBlobUrl(cacheBustedUrl(imageUrl, version));
          setLoading(false);
        }
        return;
      }

      const res = await cmsFetch(cacheBustedUrl(imageUrl, version));
      if (cancelled) return;

      if (!res.ok) {
        setLoadError(
          res.status === 404
            ? "ไม่พบไฟล์รูปภาพ"
            : res.status === 403
              ? "ไม่มีสิทธิ์โหลดรูป — ลองเข้าสู่ระบบ CMS ใหม่"
              : "โหลดรูปไม่สำเร็จ"
        );
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      if (cancelled) return;

      if (blob.size <= 120) {
        setLegacyPlaceholder(true);
        setLoading(false);
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      revoked = objectUrl;
      setBlobUrl(objectUrl);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [imageUrl, version, isPlaceholderProp]);

  if (showEmpty) {
    return (
      <div
        className={`cms-post-image-empty${className ? ` ${className}` : ""}`}
        role="img"
        aria-label={alt}
      >
        <span className="cms-post-image-empty-icon" aria-hidden>
          🖼
        </span>
        <p className="cms-post-image-empty-title">ยังไม่มีรูปจริง</p>
        <p className="cms-post-image-empty-hint">
          โหมด Prompt/Post — อัปโหลดรูปหรือสร้างจากคำคมด้านล่าง
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={`cms-post-image-error${className ? ` ${className}` : ""}`}
        role="alert"
      >
        <p>{loadError}</p>
        <p className="cms-post-image-error-id">โพสต์: {postId}</p>
      </div>
    );
  }

  if (loading || !blobUrl) {
    return (
      <div
        className={`cms-post-image-loading${className ? ` ${className}` : ""}`}
        aria-busy="true"
        aria-label="กำลังโหลดรูป"
      />
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onError={() => {
        setBlobUrl(null);
        setLoadError("แสดงรูปไม่สำเร็จ");
      }}
    />
  );
}
