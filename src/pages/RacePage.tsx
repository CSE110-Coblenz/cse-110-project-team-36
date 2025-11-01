import React, { useEffect, useRef, useState } from "react";
import { GameClock } from "../game/clock";
import { GameStage } from "../rendering/game/GameStage";
import { ResizeListener } from "../game/listeners/ResizeListener";
import { EscapeListener, SpaceRewardListener } from "../game/listeners/KeyboardListener";
import { RaceController } from "../game/controllers/RaceController";
import { ANIMATION_TICK, PAGE_WIDTH, PAGE_HEIGHT } from "../const";
import { QuestionAnswer } from "../rendering/game/QuestionAnswer";
import { events } from "../shared/events";
import { Track } from "../game/models/track";
import type { TrackJSON } from "../game/models/track";
import { QuestionManager } from "../game/managers/QuestionManager";

// TODO: manage track selection and loading
import sampleTrack from "../assets/tracks/track1.json";

interface RacePageProps {
    onExit: () => void;
    topics: string | null;
    difficulty: string | null;
}

export const RacePage: React.FC<RacePageProps> = ({ onExit, topics, difficulty }) => {
    const track = Track.fromJSON(sampleTrack as TrackJSON);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: PAGE_WIDTH, h: PAGE_HEIGHT });
    const [raceController] = useState(() => new RaceController(track));
    const [gs] = useState(() => raceController.getGameState());
    const [, setFrame] = useState(0);
    const [questionManager, setQuestionManager] = useState<QuestionManager | null>(null);

    useEffect(() => {
        if (topics && difficulty) {
            const qm = new QuestionManager(topics, difficulty);
            setQuestionManager(qm);
        }
    }, [topics, difficulty]);

    useEffect(() => {
        if (!containerRef.current) return;

        const resize = new ResizeListener(containerRef.current, (w, h) => setSize({ w, h }));
        resize.start();

        const esc = new EscapeListener(onExit);
        esc.start();

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
            // TODO: Placeholder
        });

        const clock = new GameClock(ANIMATION_TICK);
        let mounted = true;
        clock.start(
            (dt) => { raceController.step(dt); },
            () => { if (mounted) setFrame(f => f + 1); }
        );

        return () => {
            mounted = false;
            resize.stop();
            esc.stop();
            spaceReward.stop();
            unsubscribeCorrect();
            unsubscribeIncorrect();
        };
    }, [raceController, gs, onExit]);

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
                <button onClick={onExit}>⟵ Main Menu (Esc)</button>
            </div>
        </div>
    );
};
