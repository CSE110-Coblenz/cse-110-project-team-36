import { formatRaceTime } from "../../utils/formatting";

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