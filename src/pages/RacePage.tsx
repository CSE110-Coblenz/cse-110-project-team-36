import React, { useEffect, useRef, useState } from "react";
import { GameClock } from "../game/clock";
import { GameState } from "../game/models/game-state";
import { GameStage } from "../rendering/game/GameStage";
import { ResizeListener } from "../game/listeners/ResizeListener";
import { EscapeListener } from "../game/listeners/KeyboardListener";
import { RaceController } from "../game/controllers/RaceController";
import { ANIMATION_TICK, PAGE_WIDTH, PAGE_HEIGHT } from "../const";

export const RacePage: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: PAGE_WIDTH, h: PAGE_HEIGHT });
    const [gs] = useState(() => new GameState());
    const [, setFrame] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        const resize = new ResizeListener(containerRef.current, (w, h) => setSize({ w, h }));
        resize.start();
        const esc = new EscapeListener(onExit);
        esc.start();

        const ctrl = new RaceController(gs);
        const clock = new GameClock(ANIMATION_TICK);
        let mounted = true;
        clock.start(
            (dt) => { ctrl.step(dt); },
            () => { if (mounted) setFrame(f => f + 1); }
        );

        return () => {
            mounted = false;
            resize.stop();
            esc.stop();
        };
    }, [gs, onExit]);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100vh', background: '#0b1020' }}>
            <GameStage gs={gs} width={size.w} height={size.h} />
            <div style={{ position: 'absolute', left: 12, top: 12 }}>
                <button onClick={onExit}>⟵ Main Menu (Esc)</button>
            </div>
        </div>
    );
};
