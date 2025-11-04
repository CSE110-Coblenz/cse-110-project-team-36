import { useMemo } from 'react';
import { Layer, Line, Group } from 'react-konva';
import type { Track } from '../../game/models/track';
import type { Camera } from '../../game/types';
import { transformTrackPoints } from './utils';

/**
 * Track layer component
 * 
 * This component renders the track on the game stage.
 * 
 * @param track - The track to render
 * @param stageWidth - The width of the game stage
 * @param stageHeight - The height of the game stage
 * @param camera - The camera to render the track with
 * @param roadColor - The color of the road
 * @param centerlineColor - The color of the centerline
 * @param detailStep - The step to skip for performance if needed
 * @returns The track layer component
 */
export function TrackLayer({ track, stageWidth, stageHeight, camera, roadColor = '#646b75', centerlineColor = '#b7bdc7', detailStep = 1 }: { track: Track; stageWidth: number; stageHeight: number; camera: Camera; roadColor?: string; centerlineColor?: string; detailStep?: number }) {
    const screenPts = useMemo(() => {
        return transformTrackPoints(track, camera, stageWidth, stageHeight, detailStep);
    }, [track, camera, stageWidth, stageHeight, detailStep]);

    const roadWidthPx = track.width * camera.zoom;

    return (
        <Layer listening={false}>
            <Group>
                <Line
                    points={screenPts}
                    closed
                    stroke={roadColor}
                    strokeWidth={roadWidthPx}
                    lineCap="round"
                    lineJoin="round"
                />
                <Line
                    points={screenPts}
                    closed
                    stroke={centerlineColor}
                    strokeWidth={Math.max(2, 2)}
                    dash={[16, 12]}
                    lineCap="round"
                    lineJoin="round"
                />
            </Group>
        </Layer>
    );
}
