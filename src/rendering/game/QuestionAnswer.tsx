import React, { useState, useEffect } from "react";
import { QuestionController } from "../../game/controllers/QuestionController";
// import { StreakBar } from "./streakBar";
import { events } from "../../shared/events";

interface QuestionAnswerProps {
  questionController: QuestionController;
  // streakBar: streakBar;
}

export function QuestionAnswer({ questionController }: QuestionAnswerProps) {
  // Force re-render to sync with controller state
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Subscribe to state change events from controller
    const unsubscribe = events.on("QuestionStateChanged", () => {
      forceUpdate((n) => n + 1);
    });

    return unsubscribe;
  }, [questionController]);

  // Get state from controller
  const answer = questionController.getAnswer();
  const feedback = questionController.getFeedback();
  const currentQuestion = questionController.getCurrentQuestion();

  // Handlers are now simple - they just call controller methods
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    questionController.submitAnswer();
  };

  const handleSkip = () => {
    questionController.skipQuestion();
  };

  const btnBase: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 16,
    border: "2px solid #fff",
    fontWeight: 800,
    fontSize: "1rem",
    color: "#000",
    cursor: "pointer",
    textShadow: "0 0 4px rgba(255,255,255,0.6)",
    transition:
      "transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease",
    WebkitTapHighlightColor: "transparent",
  };
  const btnGreen: React.CSSProperties = {
    ...btnBase,
    background: "linear-gradient(90deg,#ffef00 0%,#ff9a00 50%,#ff2a00 100%)",
    boxShadow:
      "0 8px 16px rgba(55, 255, 0, 0.5), 0 0 12px rgba(10, 224, 6, 0.6)",
  };
  const btnGray: React.CSSProperties = {
    ...btnBase,
    background: "linear-gradient(90deg,#555 0%,#333 100%)",
    color: "#fff",
    boxShadow: "0 4px 8px rgba(0,0,0,0.6)",
    border: "2px solid #fff",
  };

  const cardBase: React.CSSProperties = {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background:
      "linear-gradient(180deg, rgba(15,15,30,0.9) 0%, rgba(30,30,60,0.9) 100%)",
    border: "3px solid #fff",
    borderRadius: 24,
    color: "#fff",
    zIndex: 10,
    padding: "1.25rem 1.5rem",
    boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.2)",
    animation: "cardPulse 2s infinite",
    minWidth: 420,
  };

  const halo = (color: "green" | "red" | "none"): React.CSSProperties => {
    if (color === "green")
      return {
        boxShadow:
          "0 0 18px rgba(16, 185, 129, 0.85), 0 20px 40px rgba(0,0,0,0.8)",
      };
    if (color === "red")
      return {
        boxShadow:
          "0 0 18px rgba(239, 68, 68, 0.85), 0 20px 40px rgba(0,0,0,0.8)",
      };
    return {};
  };

  const feedbackAnimClass =
    feedback === "incorrect"
      ? "qa-shake"
      : feedback === "correct"
      ? "qa-pulse"
      : "";

  return (
    <div>
      <form
        aria-label="Math question input"
        className={feedbackAnimClass}
        style={{
          ...cardBase,
          ...(feedback === "correct"
            ? halo("green")
            : feedback === "incorrect"
            ? halo("red")
            : halo("none")),
        }}
        onSubmit={handleSubmit}
      >
        {/* Title */}
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            marginBottom: "0.5rem",
            textShadow:
              "0 0 6px #ff0, 0 0 12px #ff8000, 0 0 24px #ff4000, 0 0 36px #ff0000",
            letterSpacing: "0.04em",
          }}
        >
          SOLVE 🏁
        </div>

        {/* Question */}
        <div
          style={{
            fontSize: "1.3rem",
            fontWeight: 800,
            marginBottom: "0.75rem",
            color: feedback === "none" ? "#ffd6a8" : "#fff",
            textShadow: "0 0 4px #000",
          }}
        >
          {feedback === "correct" && "✅ "}
          {feedback === "incorrect" && "❌ "}
          <span>Question: </span>
          <b>{currentQuestion}</b>
        </div>

        {/* Input + Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 12,
            alignItems: "center",
          }}
        >
          {/* Display-only input (typed via keyboard listeners) */}
          <div
            aria-label="Your answer"
            style={{
              width: "100%",
              padding: "12px 14px",
              fontSize: "1.25rem",
              borderRadius: 12,
              border: "2px solid rgba(148, 163, 184, 0.35)",
              background: "rgba(30, 41, 59, 0.9)",
              color: answer ? "#fff" : "rgba(148, 163, 184, 0.7)",
              minHeight: "1.4em",
              display: "flex",
              alignItems: "center",
              letterSpacing: "0.02em",
              boxShadow: "inset 0 0 8px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ whiteSpace: "pre-wrap" }}>
              {answer}
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 1,
                  height: "1.2em",
                  marginLeft: 2,
                  backgroundColor: "white",
                  animation: "blink 1s step-start infinite",
                }}
              />
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={btnGreen}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 10px 18px rgba(231, 255, 12, 0.9), 0 0 16px rgba(229, 226, 68, 0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 16px rgba(231, 255, 12, 0.9), 0 0 16px rgba(229, 226, 68, 0.9)";
            }}
          >
            Submit
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={handleSkip}
            style={btnGray}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter = "brightness(1)";
            }}
            title="Skip (S)"
          >
            Skip
          </button>
        </div>

        {/* Hint row */}
        <div
          style={{
            marginTop: 10,
            fontSize: "0.85rem",
            color: "#9ca3af",
            textShadow: "0 0 4px #000",
          }}
        >
          Type numbers with your keyboard • Press <b>Enter</b> to submit • Press{" "}
          <b>S</b> to skip
        </div>
      </form>

      {/* Animations */}
      <style>
        {`
          @keyframes cardPulse {
            0%, 100% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.15); }
            50% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 35px rgba(255,255,255,0.35); }
          }
          @keyframes blink { 50% { opacity: 0; } }

          .qa-pulse {
            animation: qa-correct 0.35s ease-out, cardPulse 2s infinite !important;
          }
          @keyframes qa-correct {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.03); }
            100% { transform: translateX(-50%) scale(1); }
          }

          .qa-shake {
            animation: qa-incorrect 0.26s ease-in-out, cardPulse 2s infinite !important;
          }
          @keyframes qa-incorrect {
            0%   { transform: translateX(calc(-50% - 2px)); }
            25%  { transform: translateX(calc(-50% + 4px)); }
            50%  { transform: translateX(calc(-50% - 4px)); }
            75%  { transform: translateX(calc(-50% + 2px)); }
            100% { transform: translateX(-50%); }
          }

          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; transition: none !important; }
          }
        `}
      </style>
    </div>
  );
}
