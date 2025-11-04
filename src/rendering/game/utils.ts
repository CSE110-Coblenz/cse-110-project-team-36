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
 * Transform track points to screen coordinates
 * @param track - The track to transform
 * @param camera - The camera
 * @param width - The stage width
 * @param height - The stage height
 * @param detailStep - The step to skip for performance (default: 1)
 * @returns Flat array of screen coordinates [x1, y1, x2, y2, ...]
 */
export function transformTrackPoints(
    track: Track,
    camera: Camera,
    width: number,
    height: number,
    detailStep: number = 1
): number[] {
    const pts = track.getSamples();
    const skip = Math.max(1, Math.floor(detailStep));
    const { x: camX, y: camY } = camera.pos;
    const scale = camera.zoom;
    const tx = (wx: number) => (wx - camX) * scale + width / 2;
    const ty = (wy: number) => (wy - camY) * scale + height / 2;
    
    const flat: number[] = [];
    for (let i = 0; i < pts.length; i += skip) {
        flat.push(tx(pts[i].x), ty(pts[i].y));
    }
    return flat;
}