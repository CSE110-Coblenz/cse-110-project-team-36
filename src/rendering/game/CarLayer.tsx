import { useMemo } from 'react';
import { Layer, Group, Rect } from 'react-konva';
import type { Track } from '../../game/models/track';
import type { Camera } from '../../game/types';
import type { Car } from '../../game/models/car';

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
    const { angleDeg, screen, scale } = useMemo(() => {
        const p = track.posAt(car.sPhys);
        const t = track.tangentAt(car.sPhys);
        const n = track.normalAt(car.sPhys);
        const wp = { x: p.x + n.x * car.lateral, y: p.y + n.y * car.lateral };
        const ang = Math.atan2(t.y, t.x);
        const angleDeg = (ang * 180) / Math.PI;
        const { pos, zoom } = camera;
        const tx = (wx: number) => (wx - pos.x) * zoom + stageWidth / 2;
        const ty = (wy: number) => (wy - pos.y) * zoom + stageHeight / 2;
        return {
            pos: wp,
            angleDeg,
            screen: { x: tx(wp.x), y: ty(wp.y) },
            scale: zoom,
        };
    }, [track, car.sPhys, car.lateral, camera, stageWidth, stageHeight]);

    const w = car.carLength * scale;
    const h = car.carWidth * scale;

    return (
        <Group x={screen.x} y={screen.y} rotation={angleDeg}>
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
