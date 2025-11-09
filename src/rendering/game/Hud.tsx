import React from "react";
import { formatRaceTime } from "../../utils/formatting";

type Props = {
  lap: number;
  elapsedMs: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
};

const cardBase: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(15,15,30,0.95), rgba(30,30,60,0.95))",
  border: "3px solid #fff",
  borderRadius: 18,
  padding: "10px 12px",
  color: "#fff",
  boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "flex-start",
  animation: "hudPulse 2s infinite",
};

const valueStyle: React.CSSProperties = { fontFamily: "monospace", fontWeight: 900 };

export function Hud({ lap, elapsedMs, accuracy, correctCount, incorrectCount }: Props) {
  const time = formatRaceTime(elapsedMs);
  const pct = Math.round(accuracy * 100);

  return (
    <div role="status" aria-live="polite" style={{ position: "absolute", top: 12, right: 12, zIndex: 10000, minWidth: 190, maxWidth: 260, fontFamily: '"Baloo 2", system-ui, sans-serif' }}>
      <div style={cardBase}>
        <Row label="Lap" value={<span style={valueStyle}>{lap}</span>} />
        <Row label="Time" value={<span style={valueStyle}>{time}</span>} />

        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: "0.85rem", color: "#ffd6a8" }}>Accuracy</div>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Correct / Mistakes</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ ...valueStyle, fontSize: "1.05rem", color: "#fff" }}>{pct}%</div>
            <div style={{ ...valueStyle, fontSize: "0.78rem", color: "#d1d5db", marginTop: 4 }}>{correctCount} / {incorrectCount}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hudPulse {
          0%,100% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.08); }
          50%    { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 34px rgba(255,255,255,0.18); }
        }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "#ffd6a8", textShadow: "0 0 4px #000" }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontWeight: 800 }}>{value}</div>
    </div>
  );
}