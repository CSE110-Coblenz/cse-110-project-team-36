import React from "react";

/**
 * Simple overlay shown while the game is paused.
 * Renders centered dialog with actions: Resume, Settings, Exit.
 */
type Props = {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Callback to resume gameplay (typically toggles pause) */
  onResume: () => void;
  /** Opens settings UI (router, modal, or event-driven) */
  onSettings: () => void;
  /** Exits to main menu (parent handles actual navigation) */
  onExit: () => void;
  /** Optional: restart the race (if you expose reset() on controller) */
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
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
      }}
      aria-label="Pause Overlay"
    >
      <div
        style={{
          background: "#fff",
          padding: "20px 28px",
          borderRadius: 12,
          minWidth: 280,
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
        role="dialog"
        aria-modal="true"
      >
        <h2 style={{ margin: "0 0 10px" }}>Paused</h2>
        <p style={{ marginTop: 0, opacity: 0.75 }}>(Press Esc or P to resume)</p>

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <button onClick={onResume}>Resume</button>
          {onRestart && <button onClick={onRestart}>Restart Race</button>}
          <button onClick={onSettings}>Settings</button>
          <button onClick={onExit}>Exit to Main Menu</button>
        </div>
      </div>
    </div>
  );
};
