"use client";

import { useState } from "react";
import type { OracleId } from "@/data/oracles";
import FortuneShareModal from "@/components/fortune/FortuneShareModal";

type Props = {
  sessionId: string;
  oracleId: OracleId;
  oracleName: string;
  oracleSubtitle?: string;
  posterUrl?: string | null;
  readingText?: string | null;
};

export default function HistoryShareButton({
  sessionId,
  oracleId,
  oracleName,
  oracleSubtitle,
  posterUrl,
  readingText,
}: Props) {
  const [open, setOpen] = useState(false);
  const text = readingText?.trim();

  if (!text || text.length < 20) return null;

  return (
    <>
      <button
        type="button"
        className="dash-btn dash-btn-outline history-share-btn thai-font"
        onClick={() => setOpen(true)}
      >
        ↗ แชร์คำทำนาย
      </button>
      <FortuneShareModal
        open={open}
        onClose={() => setOpen(false)}
        oracleId={oracleId}
        oracleName={oracleName}
        oracleSubtitle={oracleSubtitle}
        posterUrl={posterUrl}
        sessionId={sessionId}
        readingText={text}
      />
    </>
  );
}
