import { useMemo } from 'react';
import { Layer, Line, Group, Shape } from 'react-konva';
import type { Track } from '../../game/models/track';
import type { Camera } from '../../game/types';
import { transformTrackPointsAtOffset, worldToScreen } from './utils';

export function TrackLayer({
    track,
    stageWidth,
    stageHeight,
    camera,
    roadColor = '#646b75',
}: {
    track: Track;
    stageWidth: number;
    stageHeight: number;
    camera: Camera;
    roadColor?: string;
}) {
    const worldUnitSpacing = 10; // Fixed world-unit spacing for smooth rendering

    const leftEdgePoints = useMemo(() => {
        return transformTrackPointsAtOffset(
            track,
            -track.width / 2,
            camera,
            stageWidth,
            stageHeight,
            worldUnitSpacing,
        );
    }, [track, camera, stageWidth, stageHeight]);

    const rightEdgePoints = useMemo(() => {
        return transformTrackPointsAtOffset(
            track,
            track.width / 2,
            camera,
            stageWidth,
            stageHeight,
            worldUnitSpacing,
        );
    }, [track, camera, stageWidth, stageHeight]);

    const trackFillPoints = useMemo(() => {
        const points: number[] = [];
        points.push(...leftEdgePoints);
        for (let i = rightEdgePoints.length - 2; i >= 0; i -= 2) {
            points.push(rightEdgePoints[i], rightEdgePoints[i + 1]);
        }
        return points;
    }, [leftEdgePoints, rightEdgePoints]);

    const laneDividers = useMemo(() => {
        const dividers: number[] = [];
        const numLanes = track.numLanes;
        const laneWidth = track.laneWidth;
        const trackWidth = track.width;
        const rightEdge = trackWidth / 2;

        for (let i = 0; i < numLanes - 1; i++) {
            const dividerOffset = rightEdge - (i + 1) * laneWidth;
            dividers.push(dividerOffset);
        }

        return dividers;
    }, [track]);

    const laneDividerPoints = useMemo(() => {
        return laneDividers.map((offset) => ({
            points: transformTrackPointsAtOffset(
                track,
                offset,
                camera,
                stageWidth,
                stageHeight,
                worldUnitSpacing,
            ),
        }));
    }, [track, laneDividers, camera, stageWidth, stageHeight]);

    const finishLinePoints = useMemo(() => {
        // Draw a small perpendicular finish line stripe at s = 0
        const s = 0;
        const center = track.posAt(s);
        const normal = track.normalAt(s);
        const tangent = track.tangentAt(s);

        const halfWidth = track.width * 0.5;
        const halfThickness = Math.max(track.width / (track.numLanes * 6), 3);

        const cornersWorld = [
            {
                x: center.x + normal.x * halfWidth + tangent.x * halfThickness,
                y: center.y + normal.y * halfWidth + tangent.y * halfThickness,
            },
            {
                x: center.x - normal.x * halfWidth + tangent.x * halfThickness,
                y: center.y - normal.y * halfWidth + tangent.y * halfThickness,
            },
            {
                x: center.x - normal.x * halfWidth - tangent.x * halfThickness,
                y: center.y - normal.y * halfWidth - tangent.y * halfThickness,
            },
            {
                x: center.x + normal.x * halfWidth - tangent.x * halfThickness,
                y: center.y + normal.y * halfWidth - tangent.y * halfThickness,
            },
        ];

        const flat: number[] = [];
        for (const w of cornersWorld) {
            const p = worldToScreen(w, camera, stageWidth, stageHeight);
            flat.push(p.x, p.y);
        }

        return flat;
    }, [track, camera, stageWidth, stageHeight]);

    return (
        <Layer listening={false}>
            <Group>
                <Shape
                    sceneFunc={(context, shape) => {
                        context.beginPath();
                        const points = trackFillPoints;
                        if (points.length >= 2) {
                            context.moveTo(points[0], points[1]);
                            for (let i = 2; i < points.length; i += 2) {
                                context.lineTo(points[i], points[i + 1]);
                            }
                            context.closePath();
                        }
                        context.fillStyle = roadColor;
                        context.fill();
                        shape.fill(roadColor);
                    }}
                    closed
                />
                {laneDividerPoints.map((divider, i) => (
                    <Line
                        key={i}
                        points={divider.points}
                        closed
                        stroke="#8a8f97"
                        strokeWidth={1}
                        dash={[8, 6]}
                        lineCap="round"
                        lineJoin="round"
                    />
                ))}
                <Line
                    points={leftEdgePoints}
                    closed
                    stroke="#ffffff"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                />
                <Line
                    points={rightEdgePoints}
                    closed
                    stroke="#ffffff"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                />
                {/* Finish Line Stripe */}
                <Line
                    points={finishLinePoints}
                    closed
                    fill="#ffffff"
                    opacity={0.9}
                    shadowColor="black"
                    shadowBlur={10}
                    shadowOpacity={0.6}
                />
            </Group>
        </Layer>
    );
}
