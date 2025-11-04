import { useMemo } from 'react';
import { Layer, Group, Rect } from 'react-konva';
import type { Track } from '../../game/models/track';
import type { Camera } from '../../game/types';
import type { Car } from '../../game/models/car';
import { worldToScreen } from './utils';

/**
 * Car layer component
 * 
 * This component renders the cars on the game stage.
 * 
 * @param track - The track to render
 * @param cars - The cars to render
 * @param stageWidth - The width of the game stage
 * @param stageHeight - The height of the game stage
 * @param camera - The camera to render the cars with
 * @returns The car layer component
 */
export function CarLayer({ track, cars, stageWidth, stageHeight, camera }: { track: Track; cars: readonly Car[]; stageWidth: number; stageHeight: number; camera: Camera }) {
    return (
        <Layer listening={false}>
            {cars.map((car, i) => (
                <CarRenderer
                    key={i}
                    track={track}
                    car={car}
                    stageWidth={stageWidth}
                    stageHeight={stageHeight}
                    camera={camera}
                />
            ))}
        </Layer>
    );
}

/**
 * Car renderer component
 * 
 * This component renders a single car on the game stage.
 * 
 * @param track - The track to render the car on
 * @param car - The car to render
 * @param stageWidth - The width of the game stage
 * @param stageHeight - The height of the game stage
 * @param camera - The camera to render the car with
 * @returns The car renderer component
 */
function CarRenderer({ track, car, stageWidth, stageHeight, camera }: { track: Track; car: Car; stageWidth: number; stageHeight: number; camera: Camera }) {
    const { angleDeg, screen, scale, wobble } = useMemo(() => {
        const worldPos = car.getWorldPosition(track);
        const screenPos = worldToScreen({ x: worldPos.x, y: worldPos.y }, camera, stageWidth, stageHeight);
        return {
            angleDeg: worldPos.angleDeg,
            screen: screenPos,
            scale: camera.zoom,
            wobble: car.slipWobble,
        };
    }, [track, car, camera, stageWidth, stageHeight]);

    const w = car.carLength * scale;
    const h = car.carWidth * scale;

    // Add wobble to rotation
    const totalRotation = angleDeg + wobble;

    return (
        <Group x={screen.x} y={screen.y} rotation={totalRotation}>
            <Rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                fill={car.color}
                cornerRadius={Math.min(8, h * 0.4)}
            />
        </Group>
    );
}
