import React from "react";
import styles from "../styles/pauseOverlay.module.css";
import { Button } from "../../components/button";

/**
 * PauseOverlay
 * made the style similar to the overal game.
 *
 *
 */
type Props = {
  visible: boolean;
  onResume: () => void;
  onSettings: () => void;
  onExit: () => void;
  onRestart?: () => void;
};

export const PauseOverlay: React.FC<Props> = ({
  visible,
  onResume,
  onSettings,
  onExit,
  onRestart,
}) => {
  if (!visible) return null;

  return (
    <div className={styles.overlay} aria-label="Pause Overlay">
      <div className={styles.card} role="dialog" aria-modal="true">
        <h2 className={styles.title}>PAUSED 🏁</h2>
        <p className={styles.subtitle}>Press Esc or P to resume</p>

        <div className={styles.buttonGrid}>
          <Button className={styles.btnYellow} onClick={onResume}>
            Resume
          </Button>

          {onRestart && (
            <Button className={styles.btnBlue} onClick={onRestart}>
              Restart Race
            </Button>
          )}

          <Button className={styles.btnGreen} onClick={onSettings}>
            Settings
          </Button>

          <Button className={styles.btnGray} onClick={onExit}>
            Exit to Menu
          </Button>
        </div>
      </div>
    </div>
  );
};
