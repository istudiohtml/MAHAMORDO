"use client";

import { useEffect, useState } from "react";
import { COIN_LABEL, type CoinSide } from "@/lib/daily-coin-flip-shared";

type Props = {
  flipping: boolean;
  outcome: CoinSide | null;
};

export default function CoinFlipAnimation({ flipping, outcome }: Props) {
  const [spinClass, setSpinClass] = useState("");

  useEffect(() => {
    if (!flipping || !outcome) {
      setSpinClass("");
      return;
    }
    setSpinClass(outcome === "HEAD" ? "coin-spin-heads" : "coin-spin-tails");
  }, [flipping, outcome]);

  return (
    <div className="coin-scene" aria-hidden={!flipping && !outcome}>
      <div className={`coin-3d ${spinClass}`}>
        <div className="coin-face coin-heads">
          <span className="coin-face-label thai-font">หัว</span>
          <span className="coin-face-symbol">✦</span>
        </div>
        <div className="coin-face coin-tails">
          <span className="coin-face-label thai-font">ก้อย</span>
          <span className="coin-face-symbol">☽</span>
        </div>
      </div>
      {outcome && !flipping && (
        <p className="coin-result-label thai-font">
          ผล: {COIN_LABEL[outcome]}
        </p>
      )}
    </div>
  );
}
