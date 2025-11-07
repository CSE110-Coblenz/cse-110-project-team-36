import type { Camera } from "../../game/types";
import type { Track } from "../../game/models/track";

/**
 * Creates transformation functions for converting world coordinates to screen coordinates.
 * This is the single source of truth for camera transformation logic.
 * 
 * @param camera - The camera with position and zoom
 * @param width - The stage width
 * @param height - The stage height
 * @returns Object containing transform functions (tx, ty) and scale
 */
function createTransformFunctions(
    camera: Camera,
    width: number,
    height: number
): { tx: (wx: number) => number; ty: (wy: number) => number; scale: number } {
    const { x: camX, y: camY } = camera.pos;
    const scale = camera.zoom;
    const tx = (wx: number) => (wx - camX) * scale + width / 2;
    const ty = (wy: number) => (wy - camY) * scale + height / 2;
    return { tx, ty, scale };
}

/**
 * Convert a world position to screen coordinates
 * @param worldPos - The world position { x, y }
 * @param camera - The camera
 * @param width - The stage width
 * @param height - The stage height
 * @returns The screen position { x, y }
 */
export function worldToScreen(
    worldPos: { x: number; y: number },
    camera: Camera,
    width: number,
    height: number
): { x: number; y: number } {
    const { tx, ty } = createTransformFunctions(camera, width, height);
    return {
        x: tx(worldPos.x),
        y: ty(worldPos.y),
    };
}

/**
 * Transform track points at a specific offset to screen coordinates using fixed world-unit spacing
 * @param track - The track to transform
 * @param offset - Lateral offset from centerline in world units
 * @param camera - The camera
 * @param width - The stage width
 * @param height - The stage height
 * @param worldUnitSpacing - Spacing between samples in world units (default: 0.5)
 * @returns Flat array of screen coordinates [x1, y1, x2, y2, ...]
 */
export function transformTrackPointsAtOffset(
    track: Track,
    offset: number,
    camera: Camera,
    width: number,
    height: number,
    worldUnitSpacing: number = 10
): number[] {
    const { tx, ty } = createTransformFunctions(camera, width, height);
    
    const flat: number[] = [];
    const trackLength = track.length;
    const numSamples = Math.ceil(trackLength / worldUnitSpacing);

    for (let i = 0; i <= numSamples; i++) {
        const s = (i / numSamples) * trackLength;
        const p = track.posAt(s);
        const n = track.normalAt(s);
        const offsetPos = { x: p.x + n.x * offset, y: p.y + n.y * offset };
        flat.push(tx(offsetPos.x), ty(offsetPos.y));
    }
    
    return flat;
}