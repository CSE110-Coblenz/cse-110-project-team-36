import React, { useEffect, useRef, useState } from "react";
import { GameStage } from "../rendering/game/GameStage";
import { QuestionAnswer } from "../rendering/game/QuestionAnswer";
import { PauseOverlay } from "../rendering/game/PauseOverlay";
import { Hud } from "../rendering/game/Hud";
import { RaceController } from "../game/controllers/RaceController";
import { PAGE_WIDTH, PAGE_HEIGHT } from "../const";
import { events } from "../shared/events";
import type { MiniGameResult } from "../minigame/src/Model/MiniGameModel";
import MiniGameView from "../minigame/src/View/MiniGameView";

interface RacePageProps {
    raceController: RaceController;
    currentUser: string | null;
    onExit: () => void;
}

export const RacePage: React.FC<RacePageProps> = ({
    raceController,
    currentUser,
    onExit
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: PAGE_WIDTH, h: PAGE_HEIGHT });
    const [, setFrame] = useState(0);

    // controls the visibility of the pit-stop 
    const [pitStopActive, setPitStopActive] = useState(false);

    const paused = raceController.getGameState().paused;

    useEffect(() => {
        if (!containerRef.current) return;

        raceController.start(
            containerRef.current,
            (w, h) => setSize({ w, h }),
            () => setFrame(f => f + 1)
        );

        return () => {
            raceController.stop();
        };
    }, [raceController]);

    /**
     * Effect that sets up a listener for the MiniGameRequested event.
     * When RaceController emits this event, we show the minigame panel.
     */
    useEffect(() => {
        const unsubscribe = events.on("MiniGameRequested", () => {
            setPitStopActive(true);
        });

        return unsubscribe;
    }, []);

    const gs = raceController.getGameState();
    const questionController = raceController.getQuestionController();
    const questionManager = raceController.getQuestionManager();
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


    /**
     * Called when the pitstop finishes and returns a result tier.
     * Here we simply forward the result into the EventBus so that RaceController,
     * which subscribed to PitMinigameCompleted, can handle the outcome.
     */

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
            <GameStage 
            gs={gs} 
            width={size.w} 
            height={size.h} 
            />

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
                tireDecay={gs.playerCar?.tireLife ?? 0}
                fuelLevel={gs.playerCar?.fuel ?? 0}
                speed={gs.playerCar?.vPhys ?? 0}
            />

            <PauseOverlay
                visible={paused}
                onResume={handleResume}
                onSettings={handleSettings}
                onExit={handleExitToMenu}
            />

            {pitStopActive && (
                <MiniGameView
                    visible={pitStopActive}
                    questionManager={questionManager}
                    onResult={(tier: MiniGameResult) => {
                        events.emit("MiniGameCompleted", { tier });
                    }}
                    onClose={() => setPitStopActive(false)}
                />
            )}

        </div>

    );
};
