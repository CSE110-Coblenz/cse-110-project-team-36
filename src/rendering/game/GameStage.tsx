import { Stage, Layer, Line, Group, Rect } from "react-konva";
import type { GameState } from "../../game/models/game-state";

/**
 * Convert world coordinates to stage (screen) coordinates.
 * @param gs the game state
 * @param width the stage width
 * @param height the stage height
 * @returns transform functions and scale
 */
export function worldToStage(gs: GameState, width: number, height: number) {
    const { x, y } = gs.camera.pos;
    const scale = gs.camera.zoom;
    const tx = (wx: number) => (wx - x) * scale + width / 2;
    const ty = (wy: number) => (wy - y) * scale + height / 2;
    return { tx, ty, scale };
}

/**
 * Game stage component rendering the game state.
 * @param param0 props
 * @returns JSX element
 */
export function GameStage({ gs, width, height }: { gs: GameState; width: number; height: number }) {
    const { tx, ty, scale } = worldToStage(gs, width, height);

    const circle: number[] = [];
    const R = 240;
    for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        circle.push(tx(Math.cos(t) * R), ty(Math.sin(t) * R));
    }

    const carW = 40 * scale, carH = 22 * scale;

    return (
        <Stage width={width} height={height} listening={false}>
            <Layer>
                <Line points={circle} stroke="#4b5563" strokeWidth={60 * scale} lineCap="round" lineJoin="round" />
                <Line points={circle} stroke="#9ca3af" strokeWidth={2} />
            </Layer>
            <Layer>
                <Group
                    x={tx(gs.carPos.x)} y={ty(gs.carPos.y)}
                    rotation={(gs.carHeading * 180) / Math.PI}
                >
                    <Rect x={-carW / 2} y={-carH / 2} width={carW} height={carH} fill="#22c55e" shadowBlur={10} />
                </Group>
            </Layer>
        </Stage>
    );
}
