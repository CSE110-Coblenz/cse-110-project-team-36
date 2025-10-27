import type { Camera } from "../../game/types";

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