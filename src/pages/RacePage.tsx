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
import type { TrackJSON } from "../game/models/track";
import { QuestionStatsManager } from "../game/managers/QuestionStatsManager";
import { Question, QuestionTopic, QuestionDifficulty } from "../game/models/question";
import { QuestionManager } from "../game/managers/QuestionManager";
import { PauseOverlay } from "../rendering/game/PauseOverlay";

// TODO: manage track selection and loading
import sampleTrack from "../assets/tracks/track1.json";

interface RacePageProps {
    onExit: () => void;
    topics: string;
    difficulty: string;
}

// Helper function to convert Capital string to enum value
const topicStringToEnum = (topic: string): QuestionTopic => {
    return topic.toLowerCase() as QuestionTopic;
};

const difficultyStringToEnum = (difficulty: string): QuestionDifficulty => {
    return difficulty.toLowerCase() as QuestionDifficulty;
};

export const RacePage: React.FC<RacePageProps> = ({ onExit, topics, difficulty }) => {
    const track = Track.fromJSON(sampleTrack as TrackJSON);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: PAGE_WIDTH, h: PAGE_HEIGHT });
    const [raceController] = useState(() => new RaceController(track));
    const [gs] = useState(() => raceController.getGameState());
    const [, setFrame] = useState(0);
    const [statsManager] = useState(() => new QuestionStatsManager());
    const [questionManager] = useState(() => {
        const topicEnum = topicStringToEnum(topics);
        const difficultyEnum = difficultyStringToEnum(difficulty);
        return new QuestionManager({ topic: topicEnum, difficulty: difficultyEnum });
    });

    // React state reflecting pause (mirrors gs.paused via events)
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

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
    }, [raceController, gs, onExit, statsManager]);

    // Pause overlay actions
    const handleResume = () => events.emit("TogglePause", {});
    const handleSettings = () => events.emit("SettingsRequested", {});
    const handleExitToMenu = () => {
        events.emit("PausedSet", { value: false });
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
            <QuestionAnswer questionManager={questionManager} />

            <GameStage gs={gs} width={size.w} height={size.h} />
            <div style={{ position: "absolute", left: 12, top: 12 }}>
                {/* Direct exit button (redundant with Pause → Exit) */}
                <button onClick={handleExitToMenu}>⟵ Pause (Main Menu + Settings)</button>
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
