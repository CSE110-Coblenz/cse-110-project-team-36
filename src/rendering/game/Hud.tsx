// NEW: src/rendering/game/Hud.tsx
import React from "react";

/**
 * Minimal HUD overlay: Lap / Time / Accuracy
 */
export function Hud({
  lap,
  elapsedMs,
  accuracy, // 0..1
  correctCount,   // total correct answers
  incorrectCount, // total incorrect answers
}: {
  lap: number;
  elapsedMs: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
}) {
  const mm = Math.floor(elapsedMs / 60000);
  const ss = Math.floor((elapsedMs % 60000) / 1000);
  const ms = Math.floor(elapsedMs % 1000);
  const time = `${mm}:${ss.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: 8,
        fontFamily: "monospace",
        zIndex: 1000,
        minWidth: 140,
      }}
      aria-label="HUD"
    >
      <div>Lap: {lap}</div>
      <div>Time: {time}</div>
      <div>Acc: {(accuracy * 100).toFixed(0)}%</div>
      <div style={{ opacity: 0.9, marginTop: 2 }}>Correct: {correctCount}</div>
      <div style={{ opacity: 0.9 }}>Mistakes: {incorrectCount}</div>
    </div>
  );
}