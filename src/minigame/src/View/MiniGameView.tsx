import React, { useEffect, useRef, useState } from "react";
import { MiniGameController } from "../Controller/MiniGameController";
import type { MiniGameResult, PitServiceTask } from "../Model/MiniGameModel";
import type { QuestionManager } from "../../../game/managers/QuestionManager";


/**
 * MiniGameView
 *
 * Fullscreen overlay version of the pit-stop minigame.
 * This locks the player's attention on the pit crew
 * while the race is paused.
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
    const [tasks, setTasks] = useState<PitServiceTask[]>([]);
    const [activeTaskIndex, setActiveTaskIndex] = useState<number>(0);

    // For computing dt between animation frames
    const lastTimestampRef = useRef<number | null>(null);

    /**
     * When the panel becomes visible, create a fresh controller
     * and reset local UI state.
     */
    useEffect(() => {
        if (!visible) {
            setController(null);
            setTasks([]);
            setActiveTaskIndex(0);
            return;
        }

        const ctrl = new MiniGameController(durationSeconds, questionManager);
        setController(ctrl);

        const model = ctrl.getModel();
        setRemainingTime(model.remainingTime);
        setCorrectCount(model.correctCount);
        setAttemptedCount(model.attemptedCount);
        setAnswerText("");
        setTasks(model.getTasks().map((task) => ({ ...task })));
        setActiveTaskIndex(model.getActiveTaskIndex());

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
                setTasks(model.getTasks().map((task) => ({ ...task })));
                setActiveTaskIndex(model.getActiveTaskIndex());

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
        setTasks(updatedModel.getTasks().map((task) => ({ ...task })));
        setActiveTaskIndex(updatedModel.getActiveTaskIndex());
    };

    const question = controller.getCurrentQuestion();
    const overlayStyle: React.CSSProperties = {
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "24px",
    };

    const cardStyle: React.CSSProperties = {
        width: "min(720px, 90vw)",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 60%, #111827 100%)",
        borderRadius: 24,
        border: "1px solid rgba(148,163,184,0.35)",
        boxShadow: "0 25px 60px rgba(15,23,42,0.65)",
        color: "#f8fafc",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        position: "relative",
    };

    const sectionHeading: React.CSSProperties = {
        fontSize: "0.85rem",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        color: "rgba(248,250,252,0.75)",
        marginBottom: 6,
    };

    const questionBoxStyle: React.CSSProperties = {
        background: "rgba(15,23,42,0.8)",
        borderRadius: 16,
        padding: "18px",
        border: "1px solid rgba(148,163,184,0.2)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
    };

    const instructionStyle: React.CSSProperties = {
        fontSize: "0.95rem",
        color: "rgba(226,232,240,0.9)",
    };

    const activeIndex = activeTaskIndex;
    const missionComplete = activeIndex === -1;

    const renderTask = (task: PitServiceTask, index: number) => {
        const isActiveTask = index === activeIndex;
        const statusText = task.completed
            ? "Complete"
            : isActiveTask
                ? "Crew working"
                : "Queued";
        const barColor = task.completed
            ? "linear-gradient(90deg,#34d399,#10b981)"
            : isActiveTask
                ? "linear-gradient(90deg,#facc15,#f97316)"
                : "linear-gradient(90deg,#94a3b8,#475569)";
        const borderColor = task.completed
            ? "rgba(52,211,153,0.35)"
            : isActiveTask
                ? "rgba(250,204,21,0.4)"
                : "rgba(148,163,184,0.25)";

        return (
            <div
                key={task.id}
                style={{
                    borderRadius: 16,
                    border: `1px solid ${borderColor}`,
                    padding: "12px 16px",
                    background: "rgba(15,23,42,0.6)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                    <span>{task.label}</span>
                    <span>{Math.round(task.progress * 100)}%</span>
                </div>
                <div
                    style={{
                        width: "100%",
                        height: 12,
                        borderRadius: 999,
                        background: "rgba(15,23,42,0.9)",
                        overflow: "hidden",
                        border: "1px solid rgba(15,23,42,0.8)",
                    }}
                >
                    <div
                        style={{
                            width: `${Math.min(100, task.progress * 100)}%`,
                            height: "100%",
                            background: barColor,
                            transition: "width 120ms linear",
                        }}
                    />
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>{statusText}</div>
            </div>
        );
    };

    return (
        <div style={overlayStyle}>
            <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div>
                        <div style={sectionHeading}>Pit Stop Active</div>
                        <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
                            {missionComplete ? "Systems Go!" : "Crew in Motion"}
                        </div>
                        <p style={{ marginTop: 4, color: "rgba(226,232,240,0.8)", maxWidth: 360 }}>
                            Answer correctly to push each task's gauge while it slowly bleeds off. Fill every bar to launch back onto the track.
                        </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={sectionHeading}>Timer</div>
                        <div style={{ fontSize: "2.4rem", fontWeight: 800 }}>
                            {model.remainingTime.toFixed(1)}s
                        </div>
                        <div style={{ fontSize: "0.85rem", opacity: 0.75 }}>Stops when the crew is done.</div>
                    </div>
                </div>

                <div>
                    <div style={sectionHeading}>Service Checklist</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                        {tasks.map(renderTask)}
                    </div>
                </div>

                <div style={questionBoxStyle}>
                    <div style={sectionHeading}>Current Challenge</div>
                    <div style={instructionStyle}>
                        {model.isActive && question
                            ? question.questionText
                            : missionComplete
                                ? "Crew finished! Let’s blast out of the lane."
                                : "Time's up. Brace for a slower release."}
                    </div>

                    {model.isActive && question && (
                        <form
                            onSubmit={handleSubmit}
                            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
                        >
                            <input
                                type="text"
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                autoFocus
                                style={{
                                    flex: 1,
                                    minWidth: 180,
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(148,163,184,0.4)",
                                    background: "rgba(2,6,23,0.9)",
                                    color: "#f8fafc",
                                    fontSize: "1rem",
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: "10px 18px",
                                    borderRadius: 10,
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    background: "linear-gradient(90deg,#38bdf8,#6366f1)",
                                    color: "#020617",
                                    fontSize: "0.95rem",
                                    boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
                                }}
                            >
                                Boost Gauge
                            </button>
                        </form>
                    )}

                    <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                        Correct answers: {correctCount} / {attemptedCount}
                    </div>
                </div>

                {!model.isActive && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            onClick={() => {
                                const tier = controller.getResultTier();
                                onResult(tier);
                                onClose();
                            }}
                            style={{
                                padding: "10px 26px",
                                borderRadius: 999,
                                border: "none",
                                fontWeight: 700,
                                cursor: "pointer",
                                background: "linear-gradient(90deg,#22c55e,#4ade80)",
                                color: "#022c22",
                                boxShadow: "0 15px 35px rgba(34,197,94,0.35)",
                            }}
                        >
                            Launch Back Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MiniGameView;
