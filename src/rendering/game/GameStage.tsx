import { Stage } from "react-konva";
import type { GameState } from "../../game/models/game-state";
import { TrackLayer } from "./TrackLayer";
import { CarLayer } from "./CarLayer";
import { SkidMarkLayer } from "./SkidMarkLayer";
import { PitLaneHighlightLayer } from "./PitLaneHighlightLayer";
import {
    PIT_ENTRY_START_FRAC,
    PIT_LANE_START_FRAC,
    PIT_LANE_END_FRAC,
    PIT_EXIT_END_FRAC,
} from "../../const";


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

    const showPitHighlight = !!playerCar && (
        playerCar.pitRequired ||
        playerCar.inPitLane ||
        playerCar.fuel < 30 ||
        playerCar.tireLife < 20
    );

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
                    entryStartFrac={PIT_ENTRY_START_FRAC}
                    laneStartFrac={PIT_LANE_START_FRAC}
                    laneEndFrac={PIT_LANE_END_FRAC}
                    exitEndFrac={PIT_EXIT_END_FRAC}
                />
            )}

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
