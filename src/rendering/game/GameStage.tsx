import { Stage } from "react-konva";
import type { GameState } from "../../game/models/game-state";
import { TrackLayer } from "./TrackLayer";
import { CarLayer } from "./CarLayer";
import { SkidMarkLayer } from "./SkidMarkLayer";
import { PitLaneHighlightLayer } from "./PitLaneHighlightLayer";


/**
 * Game stage component rendering the game state.
 * 
 * @param gs - The game state
 * @param width - The width of the game stage
 * @param height - The height of the game stage
 * @returns The game stage component
 */
export function GameStage({ gs, width, height, }: { gs: GameState; width: number; height: number; }) {
    if (!gs.track) {
        return <Stage width={width} height={height} listening={false} />;
    }

    const cars = gs.getCars();
    const playerCar = gs.playerCar;

    // show pit highlight only if fuel or tires are low
    const showPitHighlight =
        !!playerCar &&
        (playerCar.fuel < 30 || playerCar.tireLife < 20); 

    return (

        <Stage width={width} height={height} listening={false}>
            <TrackLayer
                track={gs.track}
                stageWidth={width}
                stageHeight={height}
                camera={gs.camera}
            />
            
            {/**
             * Pit entry highlight:
             * We use the same fractional positions as the pit entry region
             * in your pit logic. For now, hard-code them here; later, you
             * can centralize these constants in a shared config file.
             *
             * laneIndex = 0 => leftmost lane.
             */}

             {showPitHighlight && (
            <PitLaneHighlightLayer
                track={gs.track}
                camera={gs.camera}
                stageWidth={width}
                stageHeight={height}
                pitStartFrac={0.05}
                pitEndFrac={0.10}
                laneIndex={3}
            />)}

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
