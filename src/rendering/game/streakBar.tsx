import { useEffect, useState } from "react";
import { StreakController } from "../../game/controllers/StreakController";
import styles from "../styles/streakBar.module.css";

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

  const barClass =
    state === "active"
      ? `${styles.barFill} ${styles.barActive}`
      : `${styles.barFill} ${styles.barInactive}`;

  // visible bar style
  return (
    <div className={styles.barContainer}>
      <div className={barClass} style={{ width: `${gauge}%` }} />
      <div className={styles.barText}>🔥 {state.toUpperCase()}</div>
    </div>
  );
};
