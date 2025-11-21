import { useMemo } from 'react';
import { Layer, Line } from 'react-konva';
import type { Camera } from '../../game/types';
import type { GameState } from '../../game/models/game-state';
import { worldToScreen } from './utils';

/**
 * Skid mark layer component
 *
 * This component renders skid marks on the track when cars are slipping.
 * Renders double skid marks (left and right) behind cars.
 *
 * @param gs - The game state
 * @param stageWidth - The width of the game stage
 * @param stageHeight - The height of the game stage
 * @param camera - The camera to render with
 * @returns The skid mark layer component
 */
export function SkidMarkLayer({
    gs,
    stageWidth,
    stageHeight,
    camera,
}: {
    gs: GameState;
    stageWidth: number;
    stageHeight: number;
    camera: Camera;
}) {
    const skidLines = useMemo(() => {
        const lines: { points: number[]; alpha: number }[] = [];

        // Get skid marks for each car
        const cars = gs.getCars();
        for (const car of cars) {
            const skidMark = gs.getSkidMarks(car);
            if (!skidMark || skidMark.isEmpty()) continue;
            
            // Process left skid marks
            const leftPoints = skidMark.getLeftPoints();
            const leftFlatPoints: number[] = [];

            for (let i = 0; i < leftPoints.length - 1; i++) {
                const p1 = leftPoints[i];
                const p2 = leftPoints[i + 1];

                // Average alpha for the segment
                const alpha = (p1.alpha + p2.alpha) / 2;

                // Only render if visible
                if (alpha > 0.01) {
                    const screenP1 = worldToScreen({ x: p1.x, y: p1.y }, camera, stageWidth, stageHeight);
                    leftFlatPoints.push(screenP1.x, screenP1.y);
                    if (i === leftPoints.length - 2) {
                        const screenP2 = worldToScreen({ x: p2.x, y: p2.y }, camera, stageWidth, stageHeight);
                        leftFlatPoints.push(screenP2.x, screenP2.y);
                    }
                }
            }

            if (leftFlatPoints.length >= 4) {
                lines.push({
                    points: leftFlatPoints,
                    alpha: leftPoints[0].alpha,
                });
            }

            // Process right skid marks
            const rightPoints = skidMark.getRightPoints();
            const rightFlatPoints: number[] = [];

            for (let i = 0; i < rightPoints.length - 1; i++) {
                const p1 = rightPoints[i];
                const p2 = rightPoints[i + 1];

                const alpha = (p1.alpha + p2.alpha) / 2;

                if (alpha > 0.01) {
                    const screenP1 = worldToScreen({ x: p1.x, y: p1.y }, camera, stageWidth, stageHeight);
                    rightFlatPoints.push(screenP1.x, screenP1.y);
                    if (i === rightPoints.length - 2) {
                        const screenP2 = worldToScreen({ x: p2.x, y: p2.y }, camera, stageWidth, stageHeight);
                        rightFlatPoints.push(screenP2.x, screenP2.y);
                    }
                }
            }

            if (rightFlatPoints.length >= 4) {
                lines.push({
                    points: rightFlatPoints,
                    alpha: rightPoints[0].alpha,
                });
            }
        }

        return lines;
    }, [gs, stageWidth, stageHeight, camera]);

    return (
        <Layer listening={false}>
            {skidLines.map((line, idx) => (
                <Line
                    key={idx}
                    points={line.points}
                    stroke="rgba(60, 60, 60, 0.8)"
                    strokeWidth={2.5}
                    opacity={line.alpha}
                    lineCap="round"
                    lineJoin="round"
                />
            ))}
        </Layer>
    );
}
