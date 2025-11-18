import { useMemo } from 'react';
import { Layer, Group, Rect } from 'react-konva';
import type { Track } from '../../game/models/track';
import type { Camera } from '../../game/types';
import type { Car } from '../../game/models/car';
import { worldToScreen } from './utils';

/**
 * Car layer component
 */
export function CarLayer({
    track,
    cars,
    stageWidth,
    stageHeight,
    camera,
}: {
    track: Track;
    cars: readonly Car[];
    stageWidth: number;
    stageHeight: number;
    camera: Camera;
}) {
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
 */
function CarRenderer({
    track,
    car,
    stageWidth,
    stageHeight,
    camera,
}: {
    track: Track;
    car: Car;
    stageWidth: number;
    stageHeight: number;
    camera: Camera;
}) {
    const { angleDeg, screen, scale, wobble } = useMemo(() => {
        const lateralOffset = car.lateral;
        const worldPos = car.getWorldPosition(track, lateralOffset);
        const screenPos = worldToScreen(
            { x: worldPos.x, y: worldPos.y },
            camera,
            stageWidth,
            stageHeight,
        );
        return {
            angleDeg: worldPos.angleDeg,
            screen: screenPos,
            scale: camera.zoom,
            wobble: car.slipWobble,
        };
    }, [track, car, camera, stageWidth, stageHeight]);

    const w = car.carLength * scale;
    const h = car.carWidth * scale;

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
