import React from "react";
import { Layer, Line } from "react-konva";
import type { Track } from "../../game/models/track";
import type { Camera } from "../../game/types";

/**
 * Props for PitLaneHighlightLayer.
 *
 * This component is a *pure rendering helper* that:
 *  - Takes the current Track and Camera,
 *  - Computes a series of world-space points along a specific lane
 *    between two fractional positions of the track length,
 *  - Transforms those points into screen-space using the camera,
 *  - Draws a red polyline over that lane segment.
 *
 * It does not know anything about game logic (fuel, pits, etc.);
 * it only visualizes the region that is considered the pit entry.
 */
export interface PitLaneHighlightLayerProps {
    /**
     * The track geometry used to compute positions along the lap.
     */
    track: Track;

    /**
     * Camera that defines how world space is mapped to the stage.
     * Same camera object that TrackLayer / CarLayer use.
     */
    camera: Camera;

    /**
     * Width of the Konva Stage in pixels.
     */
    stageWidth: number;

    /**
     * Height of the Konva Stage in pixels.
     */
    stageHeight: number;

    /**
     * Fraction [0, 1) of the lap where the pit entry highlight starts.
     * This will be multiplied by track.length to get an along-track
     * distance in world units.
     */
    pitStartFrac: number;

    /**
     * Fraction [0, 1) of the lap where the pit entry highlight ends.
     */
    pitEndFrac: number;

    /**
     * Lane index to highlight.
     * 0 = leftmost lane, (numLanes - 1) = rightmost lane.
     *
     * For your pit lane, we use 0 to highlight the very left lane.
     */
    laneIndex: number;
}

/**
 * Helper function to convert world-space coordinates into screen-space
 * coordinates using the same convention as TrackLayer / CarLayer:
 *
 *  - Translate by camera position (camera.pos is the "center" of the view),
 *  - Scale by camera.zoom,
 *  - Offset by half the stage size so that camera.pos is centered.
 */
function worldToScreen(
    x: number,
    y: number,
    camera: Camera,
    stageWidth: number,
    stageHeight: number
): { x: number; y: number } {
    const dx = (x - camera.pos.x) * camera.zoom;
    const dy = (y - camera.pos.y) * camera.zoom;
    return {
        x: stageWidth / 2 + dx,
        y: stageHeight / 2 + dy,
    };
}

/**
 * PitLaneHighlightLayer
 *
 * This Konva layer draws a red polyline over a selected lane segment
 * of the track to visually indicate the pit entry region.
 *
 * How it works:
 *  1. Compute sStart and sEnd in world units from pitStartFrac/pitEndFrac.
 *  2. Sample N points along [sStart, sEnd].
 *  3. For each s:
 *      - Get the centerline position via track.posAt(s),
 *      - Get the track normal via track.normalAt(s),
 *      - Compute the lane center position by adding laneOffset * normal,
 *        where laneOffset = track.getLaneOffset(laneIndex).
 *  4. Convert each world-space point to screen-space using the camera.
 *  5. Flatten all points into a single Konva Line.
 */
export const PitLaneHighlightLayer: React.FC<PitLaneHighlightLayerProps> = ({
    track,
    camera,
    stageWidth,
    stageHeight,
    pitStartFrac,
    pitEndFrac,
    laneIndex,
}) => {
    // Safety: ensure fracs are in [0, 1] and ordered.
    const startFrac = Math.max(0, Math.min(1, pitStartFrac));
    const endFrac = Math.max(0, Math.min(1, pitEndFrac));
    if (endFrac <= startFrac) {
        return null;
    }

    const L = track.length;
    const sStart = startFrac * L;
    const sEnd = endFrac * L;

    /**
     * Number of samples along the pit region.
     * Higher -> smoother line, but more draw cost.
     */
    const NUM_SAMPLES = 60;

    const laneOffset = track.getLaneOffset(laneIndex);

    const points: number[] = [];

    for (let i = 0; i <= NUM_SAMPLES; i++) {
        const t = i / NUM_SAMPLES;
        const s = sStart + (sEnd - sStart) * t;

        // Centerline position at s.
        const center = track.posAt(s);
        // Unit normal pointing "to the side" of the track.
        const normal = track.normalAt(s);

        // Lane center position = centerline + laneOffset * normal.
        const wx = center.x + normal.x * laneOffset;
        const wy = center.y + normal.y * laneOffset;

        // Convert from world to screen space.
        const screen = worldToScreen(wx, wy, camera, stageWidth, stageHeight);
        points.push(screen.x, screen.y);
    }

    // If for some reason we have too few points, don't draw.
    if (points.length < 4) {
        return null;
    }

    return (
        <Layer listening={false}>
            <Line
                points={points}
                stroke="red"
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
                opacity={0.9}
            />
        </Layer>
    );
};
