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
function CarRenderer({ track, car, stageWidth, stageHeight, camera }: { track: Track; car: Car; stageWidth: number; stageHeight: number; camera: Camera; }) {
    const { screenRotation, screen, scale } = useMemo(() => {
        const lateralOffset = car.lateral;
        const worldPos = car.getWorldPosition(track, lateralOffset);
        const screenPos = worldToScreen({ x: worldPos.x, y: worldPos.y }, camera, stageWidth, stageHeight);
        
        // Convert car's world rotation (degrees) to radians
        const carWorldRotationRad = (worldPos.angleDeg * Math.PI) / 180;
        
        // Calculate relative rotation: car rotation minus camera rotation
        // This compensates for the world rotation applied by the camera transform
        // For player car (at camera position): carWorldRotationRad ≈ camera.rotation, so relativeRotation ≈ 0
        // For other cars: relativeRotation is their rotation relative to the camera
        const relativeRotationRad = carWorldRotationRad - camera.rotation;
        
        // Convert back to degrees, add 90° to fix length/width alignment, and add wobble
        const relativeRotationDeg = (relativeRotationRad * 180) / Math.PI;
        const screenRotation = relativeRotationDeg + 90 + car.slipWobble;
        
        return {
            screenRotation,
            screen: screenPos,
            scale: camera.zoom,
        };
    }, [track, car, camera, stageWidth, stageHeight]);

    const w = car.carLength * scale;
    const h = car.carWidth * scale;

    return (
        <Group x={screen.x} y={screen.y} rotation={screenRotation}>
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
