import React from "react";
import { QuestionStatsManager } from "../../game/managers/QuestionStatsManager";

interface PostRaceStatsProps {
    statsManager: QuestionStatsManager;
    time: number;
    onExit: () => void;
}

export const PostRaceStats: React.FC<PostRaceStatsProps> = ({ statsManager, time, onExit }) => {
    const stats = statsManager.getStats();

    const correct = stats.filter(s => s.outcome === "correct").length;
    const incorrect = stats.filter(s => s.outcome === "incorrect").length;
    const skipped = stats.filter(s => s.outcome === "skipped").length;

    const formatTime = (t: number) => {
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#111",
                color: "#fff",
                padding: 32,
                borderRadius: 16,
                boxShadow: "0 0 20px rgba(0,0,0,0.8)",
                zIndex: 10000,
                textAlign: "center",
                minWidth: 300,
            }}
        >
            <h2 style={{ marginBottom: 16 }}>Race Complete!</h2>
            <div style={{ marginBottom: 8 }}>Correct Answers: {correct}</div>
            <div style={{ marginBottom: 8 }}>Wrong Answers: {incorrect}</div>
            <div style={{ marginBottom: 8 }}>Skipped Questions: {skipped}</div>
            <div style={{ marginBottom: 16 }}>Time: {formatTime(time)}</div>
            <button
                onClick={onExit}
                style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(90deg,#ffef00,#ff2a00)",
                    color: "#000",
                    fontWeight: "bold",
                    cursor: "pointer",
                }}
            >
                Back to Home
            </button>
        </div>
    );
};
