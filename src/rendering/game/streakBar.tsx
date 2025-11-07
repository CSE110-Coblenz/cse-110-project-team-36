import { useEffect, useState } from "react";
import { StreakController } from "../../game/controllers/StreakController";

interface StreakBarProps {
  streakController: StreakController;
}

export const StreakBar: React.FC<StreakBarProps> = ({ streakController }) => {
  const [gauge, setGauge] = useState(0);
  const [state, setState] = useState("idle");

  useEffect(() => {
    const id = setInterval(() => {
      setGauge(streakController.getGauge());
      setState(streakController.getState());
    }, 100);
    return () => clearInterval(id);
  }, [streakController]);

  // visible bar style
  return (
    <div
      style={{
        width: 200,
        height: 24,
        borderRadius: 12,
        border: "2px solid white",
        overflow: "hidden",
        background: "rgba(255,255,255,0.1)",
        position: "relative",
      }}
    >
      <div
        style={{
          width: `${gauge}%`,
          height: "100%",
          background:
            state === "active"
              ? "linear-gradient(90deg, #ffef00, #ff9a00, #ff2a00)"
              : "linear-gradient(90deg, #888, #555)",
          transition: "width 0.2s ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          textAlign: "center",
          lineHeight: "24px",
          fontWeight: 700,
          fontSize: "0.85rem",
          color: "white",
        }}
      >
        🔥 {state.toUpperCase()}
      </div>
    </div>
  );
};
