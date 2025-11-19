import { Stage } from 'react-konva';
import type { GameState } from '../../game/models/game-state';
import { TrackLayer } from './TrackLayer';
import { CarLayer } from './CarLayer';
import { SkidMarkLayer } from './SkidMarkLayer';

/**
 * Game stage component rendering the game state.
 *
 * @param gs - The game state
 * @param width - The width of the game stage
 * @param height - The height of the game stage
 * @returns The game stage component
 */
export function GameStage({
    gs,
    width,
    height,
}: {
    gs: GameState;
    width: number;
    height: number;
}) {
    if (!gs.track) {
        return <Stage width={width} height={height} listening={false} />;
    }

    const cars = gs.getCars();

    return (
        <Stage width={width} height={height} listening={false}>
            <TrackLayer
                track={gs.track}
                stageWidth={width}
                stageHeight={height}
                camera={gs.camera}
            />
            <SkidMarkLayer
                gs={gs}
                stageWidth={width}
                stageHeight={height}
                camera={gs.camera}
            />
            <CarLayer
                track={gs.track}
                cars={cars}
                stageWidth={width}
                stageHeight={height}
                camera={gs.camera}
            />
        </Stage>
    );
}
