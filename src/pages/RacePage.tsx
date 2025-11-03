import React, { useEffect, useRef, useState } from "react";
import { GameClock } from "../game/clock";
import { GameStage } from "../rendering/game/GameStage";
import { ResizeListener } from "../game/listeners/ResizeListener";
import { SpaceRewardListener } from "../game/listeners/KeyboardListener";
import { RaceController } from "../game/controllers/RaceController";
import { ANIMATION_TICK, PAGE_WIDTH, PAGE_HEIGHT } from "../const";
import { QuestionAnswer } from "../rendering/game/QuestionAnswer";
import { events } from "../shared/events";
import { Track } from "../game/models/track";
import { QuestionStatsManager } from "../game/managers/QuestionStatsManager";
import { Question, QuestionTopic, QuestionDifficulty } from "../game/models/question";
import { QuestionManager } from "../game/managers/QuestionManager";
import { PauseOverlay } from "../rendering/game/PauseOverlay";
import { updateUserStats } from "../services/localStorage";
import { loadTrack } from "../utils/trackList";

interface RacePageProps {
    onExit: () => void;
    topics: string;
    difficulty: string;
    trackId: string;
    currentUser: string | null;
}

// Helper function to convert Capital string to enum value
const topicStringToEnum = (topic: string): QuestionTopic => {
    return topic.toLowerCase() as QuestionTopic;
};

const difficultyStringToEnum = (difficulty: string): QuestionDifficulty => {
    return difficulty.toLowerCase() as QuestionDifficulty;
};

export const RacePage: React.FC<RacePageProps> = ({ onExit, topics, difficulty, trackId, currentUser }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: PAGE_WIDTH, h: PAGE_HEIGHT });
    const [track, setTrack] = useState<Track | null>(null);
    const [raceController, setRaceController] = useState<RaceController | null>(null);
    const [gs, setGs] = useState<ReturnType<RaceController['getGameState']> | null>(null);
    const [, setFrame] = useState(0);
    const [statsManager, setStatsManager] = useState<QuestionStatsManager | null>(null);
    const [questionManager, setQuestionManager] = useState<QuestionManager | null>(null);
    const [paused, setPaused] = useState(false);

    // Load track and initialize controllers/managers
    useEffect(() => {
        loadTrack(trackId)
            .then(trackData => {
                const loadedTrack = Track.fromJSON(trackData);
                setTrack(loadedTrack);

                // Initialize controllers and managers after track loads
                const controller = new RaceController(loadedTrack);
                const gameState = controller.getGameState();
                const stats = new QuestionStatsManager();
                const questions = new QuestionManager({
                    topic: topicStringToEnum(topics),
                    difficulty: difficultyStringToEnum(difficulty)
                });

                setRaceController(controller);
                setGs(gameState);
                setStatsManager(stats);
                setQuestionManager(questions);
            })
            .catch(err => {
                console.error('Failed to load track:', err);
                // Could show error UI here
            });
    }, [trackId, topics, difficulty]);

    // Set up game loop and event listeners once controllers are ready
    useEffect(() => {
        if (!containerRef.current || !raceController || !gs || !statsManager) return;

        const resize = new ResizeListener(containerRef.current, (w, h) => setSize({ w, h }));
        resize.start();

        const spaceReward = new SpaceRewardListener(() => {
            const playerCar = gs.playerCar;
            raceController.queueReward(playerCar, 150);
        });
        spaceReward.start();

        const unsubscribeCorrect = events.on("AnsweredCorrectly", () => {
            const playerCar = gs.playerCar;
            raceController.queueReward(playerCar, 150);
        });
        const unsubscribeIncorrect = events.on("AnsweredIncorrectly", () => {
            const playerCar = gs.playerCar;
            raceController.applyPenalty(playerCar, 0.8);
        });

        const unsubscribeSkipped = events.on("QuestionSkipped", () => {
            const playerCar = gs.playerCar;
            raceController.applyPenalty(playerCar, 0.6);
        });

        const unsubscribeCompleted = events.on("QuestionCompleted", (payload) => {
            const question = payload.question as Question;
            statsManager.recordQuestion(question);
        });

        // Pause events: toggle (mutates gs.paused) and reflect into React state
        const unsubToggle = events.on("TogglePause", () => {
            gs.paused = !gs.paused;
            events.emit("PausedSet", { value: gs.paused });
        });
        const unsubSet = events.on("PausedSet", ({ value }) => setPaused(!!value));

        // Keyboard: Esc or P toggles pause (no longer exits)
        const onKey = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (k === "escape" || k === "p") {
                e.preventDefault();
                events.emit("TogglePause", {});
            }
        };
        window.addEventListener("keydown", onKey);

        const clock = new GameClock(ANIMATION_TICK);
        let mounted = true;
        clock.start(
            // Freeze simulation while paused; still render overlay
            (dt) => { if (!gs.paused) raceController.step(dt); },
            () => { if (mounted) setFrame(f => f + 1); }
        );

        return () => {
            mounted = false;
            resize.stop();
            spaceReward.stop();
            unsubscribeCorrect();
            unsubscribeIncorrect();
            unsubscribeSkipped();
            unsubscribeCompleted();

            unsubToggle();
            unsubSet();
            window.removeEventListener("keydown", onKey);
        };
    }, [raceController, gs, statsManager]);

    // Pause overlay actions
    const handleResume = () => events.emit("TogglePause", {});
    const handleSettings = () => events.emit("SettingsRequested", {});
    const handleExitToMenu = () => {
        // Save stats if user is logged in
        if (currentUser && statsManager) {
            const stats = statsManager.getStats();
            updateUserStats(currentUser, Array.from(stats));
        }

        events.emit("PausedSet", { value: false });
        onExit();
    };

    // Loading state
    if (!track || !raceController || !gs || !questionManager) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100vh",
                    background: "#0b1020",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                }}
            >
                Loading track...
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                background: "#0b1020",
            }}
        >
            <QuestionAnswer questionManager={questionManager} />

            <GameStage gs={gs} width={size.w} height={size.h} />
            <div style={{ position: "absolute", left: 12, top: 12, zIndex: 9999 }}>
                <button
                    onClick={() => events.emit("TogglePause", {})}
                    aria-pressed={paused ? "true" : "false"}
                    title="Pause / Open Menu"
                    style={{
                        padding: "8px 14px",
                        borderRadius: 12,
                        border: "2px solid #fff",
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        color: "#000",
                        cursor: "pointer",
                        background: "linear-gradient(90deg,#ffef00 0%,#ff9a00 50%,#ff2a00 100%)",
                        boxShadow: "0 4px 10px rgba(255,180,0,0.5), 0 0 12px rgba(255,100,0,0.6)",
                        textShadow: "0 0 4px rgba(255,255,255,0.6)",
                        transition: "all 0.15s ease",
                        WebkitTapHighlightColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow =
                            "0 6px 14px rgba(255,180,0,0.7), 0 0 16px rgba(254, 75, 10, 0.8)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                            "0 4px 10px rgba(255, 77, 0, 0.5), 0 0 12px rgba(255,100,0,0.6)";
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                >
                    Pause
                </button>
            </div>


            {/* Pause overlay with Resume / Settings / Exit */}
            <PauseOverlay
                visible={paused}
                onResume={handleResume}
                onSettings={handleSettings}
                onExit={handleExitToMenu}
            />
        </div>
    );
};
