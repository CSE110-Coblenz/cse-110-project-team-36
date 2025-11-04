import React, { useEffect, useRef, useState } from "react";
import { GameStage } from "../rendering/game/GameStage";
import { QuestionAnswer } from "../rendering/game/QuestionAnswer";
import { PauseOverlay } from "../rendering/game/PauseOverlay";
import { Hud } from "../rendering/game/Hud";
import { RaceService } from "../services/RaceService";
import { RaceController } from "../game/controllers/RaceController";
import { PAGE_WIDTH, PAGE_HEIGHT } from "../const";
import { events } from "../shared/events";
import { topicStringToEnum, difficultyStringToEnum } from "../utils/questionUtils";

interface RacePageProps {
    onExit: () => void;
    topics: string;
    difficulty: string;
    trackId: string;
    currentUser: string | null;
}

export const RacePage: React.FC<RacePageProps> = ({ 
    onExit, 
    topics, 
    difficulty, 
    trackId, 
    currentUser 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: PAGE_WIDTH, h: PAGE_HEIGHT });
    const [raceController, setRaceController] = useState<RaceController | null>(null);
    const [paused, setPaused] = useState(false);
    const [, setFrame] = useState(0);

    useEffect(() => {
        let controller: RaceController | null = null;

        RaceService.initializeRace(trackId, {
            topic: topicStringToEnum(topics),
            difficulty: difficultyStringToEnum(difficulty)
        })
        .then(c => {
            controller = c;
            setRaceController(c);
        })
        .catch(err => {
            console.error('Failed to load track:', err);
        });

        return () => {
            if (controller) {
                controller.stop();
            }
        };
    }, [trackId, topics, difficulty]);

    useEffect(() => {
        const unsub = events.on("PausedSet", ({ value }) => {
            setPaused(!!value);
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (!containerRef.current || !raceController) return;

        raceController.start(
            containerRef.current,
            (w, h) => setSize({ w, h }),
            () => setFrame(f => f + 1)
        );

        return () => {
            raceController.stop();
        };
    }, [raceController]);

    if (!raceController) {
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

    const gs = raceController.getGameState();
    const questionController = raceController.getQuestionController();
    const elapsedMs = raceController.getElapsedMs();
    const accuracy = raceController.getAccuracy();
    const correctCount = raceController.getCorrectCount();
    const incorrectCount = raceController.getIncorrectCount();

    const handleResume = () => raceController.resume();
    const handleSettings = () => events.emit("SettingsRequested", {});
    const handleExitToMenu = () => {
        raceController.exitRace(currentUser);
        onExit();
    };

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
            <QuestionAnswer questionController={questionController} />
            <GameStage gs={gs} width={size.w} height={size.h} />
            
            <div style={{ position: "absolute", left: 12, top: 12, zIndex: 9999 }}>
                <button
                    onClick={() => raceController.togglePause()}
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

            <Hud
                lap={(gs.playerCar?.lapCount ?? 0) + 1}
                elapsedMs={elapsedMs}
                accuracy={accuracy}
                correctCount={correctCount}
                incorrectCount={incorrectCount}
            />

            <PauseOverlay
                visible={paused}
                onResume={handleResume}
                onSettings={handleSettings}
                onExit={handleExitToMenu}
            />
        </div>
    );
};