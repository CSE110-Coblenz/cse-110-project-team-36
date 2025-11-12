import React, { useMemo } from "react";
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
    track: Track;
    camera: Camera;
    stageWidth: number;
    stageHeight: number;
    entryStartFrac: number;
    laneStartFrac: number;
    laneEndFrac: number;
    exitEndFrac: number;
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

type ScreenPoint = { x: number; y: number };

interface SegmentSamples {
    inner: ScreenPoint[];
    outer: ScreenPoint[];
    center: ScreenPoint[];
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function sampleSegment(params: {
    track: Track;
    camera: Camera;
    stageWidth: number;
    stageHeight: number;
    startFrac: number;
    endFrac: number;
    innerStart: number;
    innerEnd: number;
    widthStart: number;
    widthEnd: number;
    samples?: number;
}): SegmentSamples {
    const {
        track,
        camera,
        stageWidth,
        stageHeight,
        startFrac,
        endFrac,
        innerStart,
        innerEnd,
        widthStart,
        widthEnd,
        samples = 36,
    } = params;

    const length = track.length;
    const fracSpan = Math.max(0, endFrac - startFrac);
    const steps = Math.max(2, Math.round(samples * fracSpan * 60));

    const innerPoints: ScreenPoint[] = [];
    const outerPoints: ScreenPoint[] = [];
    const centerPoints: ScreenPoint[] = [];

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const frac = startFrac + (endFrac - startFrac) * t;
        const s = frac * length;

        const innerOffset = lerp(innerStart, innerEnd, t);
        const width = lerp(widthStart, widthEnd, t);
        const centerOffset = innerOffset + width / 2;

        const center = track.posAt(s);
        const normal = track.normalAt(s);

        const innerWorld = {
            x: center.x + normal.x * innerOffset,
            y: center.y + normal.y * innerOffset,
        };
        const outerWorld = {
            x: center.x + normal.x * (innerOffset + width),
            y: center.y + normal.y * (innerOffset + width),
        };
        const centerWorld = {
            x: center.x + normal.x * centerOffset,
            y: center.y + normal.y * centerOffset,
        };

        innerPoints.push(worldToScreen(innerWorld.x, innerWorld.y, camera, stageWidth, stageHeight));
        outerPoints.push(worldToScreen(outerWorld.x, outerWorld.y, camera, stageWidth, stageHeight));
        centerPoints.push(worldToScreen(centerWorld.x, centerWorld.y, camera, stageWidth, stageHeight));
    }

    return { inner: innerPoints, outer: outerPoints, center: centerPoints };
}

function flatten(points: ScreenPoint[]): number[] {
    const out: number[] = [];
    for (const p of points) {
        out.push(p.x, p.y);
    }
    return out;
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
    entryStartFrac,
    laneStartFrac,
    laneEndFrac,
    exitEndFrac,
}) => {
    const { polygonPoints, centerLinePoints } = useMemo(() => {
        const safeEntry = Math.max(0, Math.min(1, entryStartFrac));
        const safeLaneStart = Math.max(safeEntry, Math.min(1, laneStartFrac));
        const safeLaneEnd = Math.max(safeLaneStart, Math.min(1, laneEndFrac));
        const safeExit = Math.max(safeLaneEnd, Math.min(1, exitEndFrac));

        if (safeExit <= safeEntry) {
            return { polygonPoints: [] as number[], centerLinePoints: [] as number[] };
        }

        const laneOuterEdge = track.width / 2;
        const rampGap = track.laneWidth * 0.35;
        const pitLaneWidth = track.laneWidth * 1.15;
        const rampWidth = Math.max(6, track.laneWidth * 0.2);

        const entrySegment = sampleSegment({
            track,
            camera,
            stageWidth,
            stageHeight,
            startFrac: safeEntry,
            endFrac: safeLaneStart,
            innerStart: laneOuterEdge,
            innerEnd: laneOuterEdge + rampGap,
            widthStart: rampWidth,
            widthEnd: pitLaneWidth,
        });

        const serviceSegment = sampleSegment({
            track,
            camera,
            stageWidth,
            stageHeight,
            startFrac: safeLaneStart,
            endFrac: safeLaneEnd,
            innerStart: laneOuterEdge + rampGap,
            innerEnd: laneOuterEdge + rampGap,
            widthStart: pitLaneWidth,
            widthEnd: pitLaneWidth,
        });

        const exitSegment = sampleSegment({
            track,
            camera,
            stageWidth,
            stageHeight,
            startFrac: safeLaneEnd,
            endFrac: safeExit,
            innerStart: laneOuterEdge + rampGap,
            innerEnd: laneOuterEdge,
            widthStart: pitLaneWidth,
            widthEnd: rampWidth,
        });

        const segments = [entrySegment, serviceSegment, exitSegment];

        const outerPoints: ScreenPoint[] = [];
        segments.forEach((seg, idx) => {
            const pts = idx === 0 ? seg.outer : seg.outer.slice(1);
            outerPoints.push(...pts);
        });

        const innerPoints: ScreenPoint[] = [];
        segments
            .slice()
            .reverse()
            .forEach((seg, idx) => {
                const pts = idx === 0 ? seg.inner.slice().reverse() : seg.inner.slice(0, -1).reverse();
                innerPoints.push(...pts);
            });

        const polygonPoints = flatten([...outerPoints, ...innerPoints]);

        const centerPoints: ScreenPoint[] = [];
        segments.forEach((seg, idx) => {
            const pts = idx === 0 ? seg.center : seg.center.slice(1);
            centerPoints.push(...pts);
        });

        return {
            polygonPoints,
            centerLinePoints: flatten(centerPoints),
        };
    }, [
        track,
        camera,
        stageWidth,
        stageHeight,
        entryStartFrac,
        laneStartFrac,
        laneEndFrac,
        exitEndFrac,
    ]);

    if (polygonPoints.length < 6) {
        return null;
    }

    return (
        <Layer listening={false}>
            <Line
                points={polygonPoints}
                closed
                fill="rgba(244, 114, 182, 0.28)"
                stroke="rgba(248, 113, 113, 0.9)"
                strokeWidth={2}
                lineJoin="round"
            />
            <Line
                points={centerLinePoints}
                stroke="#fecaca"
                strokeWidth={3}
                dash={[12, 10]}
                lineCap="round"
                lineJoin="round"
            />
        </Layer>
    );
};
