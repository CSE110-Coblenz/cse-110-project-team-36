import type { Camera } from "../../game/types";
import type { Track } from "../../game/models/track";

/**
 * Convert world coordinates to stage (screen) coordinates.
 * @param gs the game state
 * @param width the stage width
 * @param height the stage height
 * @returns transform functions and scale
 */
export function worldToStage(camera: Camera, width: number, height: number) {
    const { x, y } = camera.pos;
    const scale = camera.zoom;
    const tx = (wx: number) => (wx - x) * scale + width / 2;
    const ty = (wy: number) => (wy - y) * scale + height / 2;
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
    const { x: camX, y: camY } = camera.pos;
    const scale = camera.zoom;
    return {
        x: (worldPos.x - camX) * scale + width / 2,
        y: (worldPos.y - camY) * scale + height / 2,
    };
}

/**
 * Transform track points to screen coordinates using fixed world-unit spacing
 * This ensures smooth rendering at any camera zoom level
 * @param track - The track to transform
 * @param camera - The camera
 * @param width - The stage width
 * @param height - The stage height
 * @param worldUnitSpacing - Spacing between samples in world units (default: 0.5)
 * @returns Flat array of screen coordinates [x1, y1, x2, y2, ...]
 */
export function transformTrackPoints(
    track: Track,
    camera: Camera,
    width: number,
    height: number,
    worldUnitSpacing: number = 0.5
): number[] {
    const { x: camX, y: camY } = camera.pos;
    const scale = camera.zoom;
    const tx = (wx: number) => (wx - camX) * scale + width / 2;
    const ty = (wy: number) => (wy - camY) * scale + height / 2;
    
    const flat: number[] = [];
    const trackLength = track.length;
    const numSamples = Math.ceil(trackLength / worldUnitSpacing);
    
    // Sample at fixed world-unit intervals
    for (let i = 0; i <= numSamples; i++) {
        const s = (i / numSamples) * trackLength;
        const p = track.posAt(s);
        flat.push(tx(p.x), ty(p.y));
    }
    
    return flat;
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
    worldUnitSpacing: number = 0.5
): number[] {
    const { x: camX, y: camY } = camera.pos;
    const scale = camera.zoom;
    const tx = (wx: number) => (wx - camX) * scale + width / 2;
    const ty = (wy: number) => (wy - camY) * scale + height / 2;
    
    const flat: number[] = [];
    const trackLength = track.length;
    const numSamples = Math.ceil(trackLength / worldUnitSpacing);
    
    // Sample at fixed world-unit intervals
    for (let i = 0; i <= numSamples; i++) {
        const s = (i / numSamples) * trackLength;
        const p = track.posAt(s);
        const n = track.normalAt(s);
        const offsetPos = { x: p.x + n.x * offset, y: p.y + n.y * offset };
        flat.push(tx(offsetPos.x), ty(offsetPos.y));
    }
    
    return flat;
}