import { useMemo } from 'react';
import { Layer, Group, Rect, Image as KonvaImage } from 'react-konva';
import type { Track } from '../../game/models/track';
import type { Camera } from '../../game/types';
import type { Car } from '../../game/models/car';
import { worldToScreen } from './utils';
import useImage from 'use-image';

import playerCarSprite from '../../assets/cars/car-sprite.png';
import enemyCarSprite from '../../assets/cars/enemy-car-sprite.png';

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
                    isPlayer={i === 0}
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
    isPlayer,
}: {
    track: Track;
    car: Car;
    stageWidth: number;
    stageHeight: number;
    camera: Camera;
    isPlayer: boolean;

}) {
    const [playerSprite] = useImage(playerCarSprite);
    const [enemySprite] = useImage(enemyCarSprite);
    const sprite = isPlayer ? playerSprite : enemySprite;
    const { screenRotation, screen, scale } = useMemo(() => {
        const lateralOffset = car.lateral;
        const worldPos = car.getWorldPosition(track, lateralOffset);
        const screenPos = worldToScreen(
            { x: worldPos.x, y: worldPos.y },
            camera,
            stageWidth,
            stageHeight,
        );

        const carWorldRotationRad = (worldPos.angleDeg * Math.PI) / 180;
        const relativeRotationRad = carWorldRotationRad - camera.rotation;

        const relativeRotationDeg = (relativeRotationRad * 180) / Math.PI;
        const screenRotation = relativeRotationDeg + car.slipWobble;

        return {
            screenRotation,
            screen: screenPos,
            scale: camera.zoom,
        };
    }, [track, car, camera, stageWidth, stageHeight]);

    const w = car.carLength * scale * 1.4;
    const h = car.carWidth * scale * 2.0;

    return (
        <Group x={screen.x} y={screen.y} rotation={screenRotation}>
            {sprite ? (
                <KonvaImage
                    image={sprite}
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                />
            ) : (
                <Rect
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                    fill={car.color}
                    cornerRadius={Math.min(8, h * 0.4)}
                />
            )}
        </Group>
    );
}
