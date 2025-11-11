import React, { useEffect, useRef, useState } from "react";
import { MiniGameController } from "../Controller/MiniGameController";
import type { MiniGameResult } from "../Model/MiniGameModel";
import type { QuestionManager } from "../../../game/managers/QuestionManager";


/**
 * MiniGameView
 *
 * Compact HUD panel version of the pit-stop minigame.
 * This is intended to be rendered on the RacePage UI,
 * next to the main answer box.
 *
 * Flow:
 *  - When `visible` flips false → true, we create a new MiniGameController
 *    and reset all local UI state.
 *  - We run a requestAnimationFrame loop to advance the timer.
 *  - When the minigame finishes, we call onResult(tier) then onClose().
 */
export interface MiniGameViewProps {
    /**
     * Whether the panel is visible.
     * When this is false, the component returns null and renders nothing.
     */
    visible: boolean;

    /**
     * Called when the minigame has computed a final result tier,
     * typically when time has run out.
     *
     * RacePage should forward this into the global EventBus
     * (e.g., emit PitMinigameCompleted) so that PitController /
     * RaceController can apply fuel/tire rewards.
     */
    onResult: (tier: MiniGameResult) => void;

    /**
     * Called when the panel should be closed (for example,
     * after onResult is fired).
     */
    onClose: () => void;

    /**
     * Optional duration override for the minigame (in seconds).
     * If omitted, a default duration is used.
     */
    durationSeconds?: number;

    questionManager: QuestionManager;
}

const MiniGameView: React.FC<MiniGameViewProps> = ({
    visible,
    onResult,
    onClose,
    durationSeconds = 25,
    questionManager,
}) => {
    // Local controller for this pit-stop session
    const [controller, setController] = useState<MiniGameController | null>(null);

    // UI state mirrored from the controller's model and _remainingTime is set for later usage
    const [_remainingTime, setRemainingTime] = useState<number>(durationSeconds);
    const [correctCount, setCorrectCount] = useState<number>(0);
    const [attemptedCount, setAttemptedCount] = useState<number>(0);
    const [answerText, setAnswerText] = useState<string>("");

    // For computing dt between animation frames
    const lastTimestampRef = useRef<number | null>(null);

    /**
     * When the panel becomes visible, create a fresh controller
     * and reset local UI state.
     */
    useEffect(() => {
        if (!visible) {
            setController(null);
            return;
        }

        const ctrl = new MiniGameController(durationSeconds, questionManager);
        setController(ctrl);

        const model = ctrl.getModel();
        setRemainingTime(model.remainingTime);
        setCorrectCount(model.correctCount);
        setAttemptedCount(model.attemptedCount);
        setAnswerText("");

        lastTimestampRef.current = null;
    }, [visible, durationSeconds, questionManager]);

    /**
     * Animation loop: while visible and the controller is active,
     * advance the timer and mirror the model into React state.
     */
    useEffect(() => {
        if (!visible || !controller) {
            return;
        }

        let animationFrameId: number;

        const loop = (timestamp: number) => {
            if (!controller) return;

            const last = lastTimestampRef.current;
            if (last === null) {
                lastTimestampRef.current = timestamp;
            } else {
                const dtMs = timestamp - last;
                lastTimestampRef.current = timestamp;

                const dtSeconds = dtMs / 1000;
                controller.tick(dtSeconds);

                const model = controller.getModel();
                setRemainingTime(model.remainingTime);
                setCorrectCount(model.correctCount);
                setAttemptedCount(model.attemptedCount);

                if (controller.isFinished()) {
                    const tier = controller.getResultTier();
                    onResult(tier);
                    onClose();
                    return;
                }
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        // Cleanup animation frame on unmount or when visible flips.
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [visible, controller, onResult, onClose]);

    /**
     * If not visible, render nothing.
     * The RacePage controls when to show this panel.
     */
    if (!visible || !controller) {
        return null;
    }

    const model = controller.getModel();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        controller.setCurrentAnswerText(answerText);
        controller.submitAnswer();
        const updatedModel = controller.getModel();
        setRemainingTime(updatedModel.remainingTime);
        setCorrectCount(updatedModel.correctCount);
        setAttemptedCount(updatedModel.attemptedCount);
        setAnswerText("");
    };

    const question = controller.getCurrentQuestion();

    // Compact panel styling to sit in the RacePage sidebar/HUD
    const panelStyle: React.CSSProperties = {
        background: "#020617",
        borderRadius: 12,
        padding: "16px 20px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.55)",
        color: "#f9fafb",
        minWidth: 260,
        maxWidth: 360,
        textAlign: "left",
        border: "1px solid #1f2933",
        display: "flex",
        flexDirection: "column",
        gap: 8,
    };

    const headerRowStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    };

    const timerStyle: React.CSSProperties = {
        fontSize: "1.6rem",
        fontWeight: 800,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: "0.8rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        opacity: 0.8,
    };

    return (
        <div style={panelStyle}>
            <div style={headerRowStyle}>
                <div style={labelStyle}>Pit Stop Challenge</div>
                <div style={timerStyle}>{model.remainingTime.toFixed(1)}s</div>
            </div>

            <div style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: 4 }}>
                Answer as many as you can before the timer hits 0!
            </div>

            <div style={{ margin: "6px 0 8px", fontSize: "1.1rem", minHeight: 24 }}>
                {question ? question.questionText : "Time's up!"}
            </div>

            {model.isActive && question && (
                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", gap: 8, marginBottom: 4 }}
                >
                    <input
                        type="text"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        autoFocus
                        style={{
                            flex: 1,
                            padding: "6px 8px",
                            borderRadius: 8,
                            border: "1px solid #4b5563",
                            fontSize: "0.95rem",
                            background: "#020617",
                            color: "#f9fafb",
                            outline: "none",
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                            background:
                                "linear-gradient(90deg,#22c55e 0%,#16a34a 50%,#15803d 100%)",
                            color: "#020617",
                            fontSize: "0.85rem",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Submit
                    </button>
                </form>
            )}

            <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                Correct: {correctCount} / {attemptedCount}
            </div>

            {!model.isActive && (
                <button
                    onClick={() => {
                        const tier = controller.getResultTier();
                        onResult(tier);
                        onClose();
                    }}
                    style={{
                        marginTop: 6,
                        alignSelf: "flex-end",
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        background: "#e5e7eb",
                        color: "#111827",
                        fontSize: "0.85rem",
                    }}
                >
                    Continue Race
                </button>
            )}
        </div>
    );
};

export default MiniGameView;
