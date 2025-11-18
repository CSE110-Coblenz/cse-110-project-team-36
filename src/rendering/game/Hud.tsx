import { formatRaceTime } from "../../utils/formatting";
import styles from "../styles/hud.module.css";

/**
 * Minimal HUD overlay: Lap / Time / Accuracy
 *
 * @param lap - The current lap
 * @param elapsedMs - The elapsed time in milliseconds
 * @param accuracy - The accuracy in 0..1
 * @param correctCount - The number of correct answers
 * @param incorrectCount - The number of incorrect answers
 * @returns The HUD component
 */
export function Hud({
  lap,
  elapsedMs,
  accuracy,
  correctCount,
  incorrectCount,
}: {
  lap: number;
  elapsedMs: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
}) {
  const time = formatRaceTime(elapsedMs);

  return (
    <div className={styles.hud} aria-label="HUD">
      <div>Lap: {lap}</div>
      <div>Time: {time}</div>
      <div>Acc: {(accuracy * 100).toFixed(0)}%</div>
      <div className={styles.hudSubtext}>Correct: {correctCount}</div>
      <div className={styles.hudSubtext}>Mistakes: {incorrectCount}</div>
    </div>
  );
}
