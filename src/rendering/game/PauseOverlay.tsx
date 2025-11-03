import React from "react";

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
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        fontFamily: '"Baloo 2", "Comic Sans MS", system-ui, sans-serif',
      }}
      aria-label="Pause Overlay"
    >
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(15,15,30,0.95) 0%, rgba(30,30,60,0.95) 100%)",
          border: "3px solid #fff",
          borderRadius: 24,
          padding: "28px 32px",
          minWidth: 320,
          textAlign: "center",
          boxShadow:
            "0 20px 40px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.2)",
          animation: "cardPulse 2s infinite",
          zIndex: 10000,
        }}
        role="dialog"
        aria-modal="true"
      >
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: "2rem",
            fontWeight: 900,
            color: "#fff",
            textShadow:
              "0 0 6px #ff0, 0 0 12px #ff8000, 0 0 24px #ff4000, 0 0 36px #ff0000",
            letterSpacing: "0.04em",
          }}
        >
          PAUSED 🏁
        </h2>
        <p
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#ffd6a8",
            fontWeight: 600,
            textShadow: "0 0 4px #000",
          }}
        >
          Press Esc or P to resume
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <button style={btnYellow} onClick={onResume}>
            Resume
          </button>
          {onRestart && (
            <button style={btnBlue} onClick={onRestart}>
              Restart Race
            </button>
          )}
          <button style={btnGreen} onClick={onSettings}>
            Settings
          </button>
          <button style={btnGray} onClick={onExit}>
            Exit to Menu
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes cardPulse {
            0%, 100% {
              box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.15);
            }
            50% {
              box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 35px rgba(255,255,255,0.35);
            }
          }

          button:hover {
            transform: scale(1.05);
            transition: transform 0.15s ease;
          }

          button:active {
            transform: scale(0.95);
          }
        `}
      </style>
    </div>
  );
};

// --- Shared button styles (from MainMenuPage) ---
const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 16,
  border: "2px solid #fff",
  fontWeight: 800,
  fontSize: "1rem",
  color: "#000",
  cursor: "pointer",
  textShadow: "0 0 4px rgba(255,255,255,0.6)",
  transition: "transform 0.12s ease",
  WebkitTapHighlightColor: "transparent",
};

const btnYellow: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(90deg,#ffef00 0%,#ff9a00 50%,#ff2a00 100%)",
  boxShadow: "0 8px 16px rgba(255,180,0,0.5), 0 0 12px rgba(255,100,0,0.6)",
};

const btnBlue: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(90deg,#00ff95 0%,#00d4ff 50%,#0077ff 100%)",
  boxShadow: "0 8px 16px rgba(0,255,200,0.4), 0 0 12px rgba(0,255,255,0.6)",
};

const btnGreen: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(90deg,#a8ff00 0%,#5cff00 50%,#00ff88 100%)",
  boxShadow: "0 8px 16px rgba(100,255,100,0.5), 0 0 12px rgba(0,255,150,0.5)",
};

const btnGray: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(90deg,#555 0%,#333 100%)",
  color: "#fff",
  boxShadow: "0 4px 8px rgba(0,0,0,0.6)",
};
