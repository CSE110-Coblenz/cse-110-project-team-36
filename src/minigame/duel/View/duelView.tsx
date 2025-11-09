import React, { useEffect, useState } from "react";
import { DuelController } from "../Controller/DuelController";
import type { DuelState, DuelResultTier } from "../Model/duel-model";
import type { BotDifficulty } from "../Model/duel-config";
import type { DuelQuestion } from "../Model/duel-question-service";

function Bar(props: { label: string; value: number; color: string }) {
  const { label, value, color } = props;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ marginBottom: 6, minWidth: 200 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        {label}: {pct.toFixed(0)}%
      </div>
      <div style={{ height: 10, background: "#111827", borderRadius: 999 }}>
        <div
          style={{
            width: `${pct}%`,
            height: 10,
            borderRadius: 999,
            transition: "width 0.15s linear",
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface DuelViewProps {
  difficulty?: BotDifficulty;
  onFinished?: (tier: DuelResultTier) => void; // controller notifies via callback
}

const containerStyle: React.CSSProperties = {
  padding: 16,
  background: "#020617",
  color: "#f9fafb",
  borderRadius: 16,
  maxWidth: 720,
  margin: "0 auto",
  boxShadow: "0 18px 40px rgba(0,0,0,0.75)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const cardStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 10,
  padding: 10,
  borderRadius: 12,
  background: "rgba(15,23,42,0.95)",
  border: "1px solid rgba(148,163,184,0.5)",
};

const buttonStyle: React.CSSProperties = {
  flex: "1 0 45%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.6)",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 16,
};

const forfeitStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #ef4444",
  background: "transparent",
  color: "#fca5a5",
  fontSize: 12,
  cursor: "pointer",
};

const DuelView: React.FC<DuelViewProps> = ({
  difficulty = "MEDIUM",
  onFinished,
}) => {
  const [controller] = useState(
    () => new DuelController(difficulty, undefined, onFinished)
  );
  const [state, setState] = useState<DuelState>(() => controller.getState());
  const [question, setQuestion] = useState<DuelQuestion | null>(
    () => controller.getQuestion()
  );

  // Tick loop -> delegates to controller
  useEffect(() => {
    const id = window.setInterval(() => {
      controller.tick(100);
      setState({ ...controller.getState() });
      setQuestion(controller.getQuestion());
    }, 100);
    return () => window.clearInterval(id);
  }, [controller]);

  const handleOptionClick = (value: number) => {
    if (state.phase !== "PLAYING") return;
    controller.submitPlayerAnswer(value);
    setState({ ...controller.getState() });
    setQuestion(controller.getQuestion());
  };

  const handleForfeit = () => {
    controller.forfeit();
    setState({ ...controller.getState() });
  };

  return (
    <div style={containerStyle}>
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: 22, margin: 0 }}>Pit Crew Duel</h2>
        <div style={{ fontSize: 14, opacity: 0.85 }}>
          {state.phase === "COUNTDOWN" ? (
            <>
              Starting in{" "}
              <strong>{(state.countdownMs / 1000).toFixed(1)}s</strong>
            </>
          ) : (
            <>
              Time left: <strong>{formatTime(state.remainingMs)}</strong>
            </>
          )}
        </div>
      </div>

      {/* HP + combo */}
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <Bar label="Your HP" value={state.player.hp} color="#22c55e" />
          <Bar label="Bot HP" value={state.bot.hp} color="#f97316" />
        </div>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Combo multiplier</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#a855f7",
              textShadow: "0 0 10px rgba(168,85,247,0.45)",
            }}
          >
            x{state.comboMultiplier.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Chain correct answers to unleash critical hits and crush the bot.
          </div>
        </div>
      </div>

      {/* event text */}
      {state.lastEventText && (
        <div
          style={{
            marginBottom: 12,
            padding: 8,
            borderRadius: 8,
            background: "rgba(148,163,184,0.18)",
            fontSize: 13,
          }}
        >
          {state.lastEventText}
        </div>
      )}

      {/* main content */}
      {state.phase !== "RESULTS" ? (
        <>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
              Current challenge
            </div>

            {state.phase === "COUNTDOWN" && (
              <div style={{ fontSize: 18 }}>
                Get ready… your pit crew is counting on you.
              </div>
            )}

            {state.phase === "PLAYING" && question && (
              <>
                <div style={{ fontSize: 22, marginBottom: 10 }}>
                  {question.text}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {question.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleOptionClick(opt)}
                      style={buttonStyle}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Beat the bot to earn a{" "}
              <strong>faster, fuller pit stop</strong>. Lose, and your crew
              fumbles the refuel.
            </div>
            <button onClick={handleForfeit} style={forfeitStyle}>
              Forfeit
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            background: "rgba(15,23,42,0.95)",
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Duel results</h3>
          <p style={{ margin: 0, marginBottom: 4 }}>
            Your HP: <strong>{state.player.hp}</strong> — Bot HP:{" "}
            <strong>{state.bot.hp}</strong>
          </p>
          <p style={{ margin: 0, marginBottom: 4 }}>
            Correct: <strong>{state.player.totalCorrect}</strong> &nbsp; Misses:{" "}
            <strong>{state.player.totalIncorrect}</strong>
          </p>

          {state.resultTier === "WIN_BIG" && (
            <p style={{ margin: 0, marginTop: 6, color: "#22c55e" }}>
              HUGE win! Your pit crew nails a{" "}
              <strong>full tank & fresh tires</strong> with a lightning-fast
              stop.
            </p>
          )}
          {state.resultTier === "WIN_CLOSE" && (
            <p style={{ margin: 0, marginTop: 6, color: "#a3e635" }}>
              Solid win. You earn a{" "}
              <strong>strong refuel and quick service</strong>.
            </p>
          )}
          {state.resultTier === "LOSE" && (
            <p style={{ margin: 0, marginTop: 6, color: "#f97316" }}>
              The bot outpaced you. Pit crew struggles—expect{" "}
              <strong>slower service and less fuel</strong>.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DuelView;
