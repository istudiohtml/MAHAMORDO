"use client";

import { useEffect, useState } from "react";
import CoinFlipAnimation from "@/components/fortune/CoinFlipAnimation";
import { COIN_LABEL, type CoinSide } from "@/lib/daily-coin-flip-shared";

type CoinFlip = {
  userChoice: CoinSide;
  outcome: CoinSide;
  matched: boolean;
  headline: string;
  message: string;
};

type Phase = "loading" | "pick" | "flipping" | "result";

export default function CoinFlipPanel() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [flip, setFlip] = useState<CoinFlip | null>(null);
  const [pendingChoice, setPendingChoice] = useState<CoinSide | null>(null);
  const [flipOutcome, setFlipOutcome] = useState<CoinSide | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/fortune/coin")
      .then((r) => r.json())
      .then((data) => {
        if (data.error && !data.flip) {
          setError(data.error);
          return;
        }
        if (data.flip) {
          setFlip(data.flip);
          setFlipOutcome(data.flip.outcome);
          setPhase("result");
        } else {
          setPhase("pick");
        }
      })
      .catch(() => setError("โหลดไม่สำเร็จ"));
  }, []);

  async function onPick(choice: CoinSide) {
    setError("");
    setPendingChoice(choice);
    setPhase("flipping");
    setFlipOutcome(null);

    const res = await fetch("/api/fortune/coin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice }),
    });
    const data = await res.json();

    if (!res.ok) {
      setPhase("pick");
      setPendingChoice(null);
      setError(data.error || "ทอยเหรียญไม่สำเร็จ");
      return;
    }

    const result = data.flip as CoinFlip;
    setFlip(result);
    setFlipOutcome(result.outcome);

    setTimeout(() => {
      setPhase("result");
      setPendingChoice(null);
    }, 2200);
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <p className="dash-page-eyebrow">Coin Flip</p>
        <h1 className="dash-page-title thai-font">หัว หรือ ก้อย?</h1>
        <p className="dash-page-sub thai-font">
          คิดเรื่องที่อยากรู้ในใจ แล้วเลือกด้านที่ใจบอก — ถ้าตรงกัน สิ่งที่คุณกำลังคิดอยู่จะเป็นจริง · วันละ 1 ครั้ง
        </p>
      </div>

      <div className="dash-coin-body">
        <CoinFlipAnimation
          flipping={phase === "flipping"}
          outcome={flipOutcome}
        />

        {phase === "loading" && !error && (
          <p className="dash-coin-muted thai-font">กำลังโหลด...</p>
        )}

        {phase === "pick" && (
          <section className="profile-section dash-coin-pick">
            <p className="dash-coin-pick-hint thai-font">
              นึกเรื่องที่อยากรู้ในใจ แล้วเลือกหัวหรือก้อย
            </p>
            <div className="dash-coin-pick-btns">
              <button
                type="button"
                className="dash-coin-pick-btn thai-font"
                onClick={() => onPick("HEAD")}
              >
                หัว
              </button>
              <button
                type="button"
                className="dash-coin-pick-btn thai-font"
                onClick={() => onPick("TAIL")}
              >
                ก้อย
              </button>
            </div>
          </section>
        )}

        {phase === "flipping" && pendingChoice && (
          <p className="dash-coin-muted thai-font">
            กำลังทอยเหรียญ… คุณเลือก{COIN_LABEL[pendingChoice]}
          </p>
        )}

        {phase === "result" && flip && (
          <section className="profile-section dash-coin-result">
            <p className="dash-coin-result-meta thai-font">
              คุณเลือก <strong>{COIN_LABEL[flip.userChoice]}</strong> · เหรียญออก{" "}
              <strong>{COIN_LABEL[flip.outcome]}</strong>
              {flip.matched ? " · ตรง!" : ""}
            </p>
            <h2 className="dash-coin-result-headline thai-font">{flip.headline}</h2>
            <p className="dash-coin-result-message thai-font">{flip.message}</p>
            <p className="dash-coin-result-note thai-font">
              ทอยได้วันละครั้ง — พรุ่งนี้มาลองใหม่ได้
            </p>
          </section>
        )}

        {error && <p className="profile-error thai-font">{error}</p>}
      </div>
    </div>
  );
}
