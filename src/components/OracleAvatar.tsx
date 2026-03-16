'use client'

import { useState } from 'react'

interface OracleAvatarProps {
  slug: string
  emoji: string
  className?: string
  /** Optional: use this to force image URL (e.g. from DB avatarUrl) */
  avatarUrl?: string | null
}

/**
 * Shows oracle avatar: image from /avatars/{slug}.svg with emoji fallback.
 * Use wherever the fortune teller (หมอดู) is displayed.
 */
export default function OracleAvatar({ slug, emoji, className = '', avatarUrl }: OracleAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const src = avatarUrl || `/avatars/${slug}.svg`

  return (
    <div className={`oracle-avatar ${className}`.trim()}>
      {!imgError ? (
        <img
          src={src}
          alt=""
          role="presentation"
          onError={() => setImgError(true)}
          className="oracle-avatar-img"
        />
      ) : (
        <span className="oracle-avatar-emoji">{emoji}</span>
      )}
    </div>
  )
}
