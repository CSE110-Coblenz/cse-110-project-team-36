import type { Camera } from '../../game/types';
import type { Track } from '../../game/models/track';

/**
 * Transforms a single world point to screen coordinates with rotation.
 * Internal helper function that handles the full transformation.
 */
function transformPointInternal(
    wx: number,
    wy: number,
    camX: number,
    camY: number,
    theta: number,
    scale: number,
    screenCenterX: number,
    screenCenterY: number,
): { x: number; y: number } {
    // Translate relative to camera position
    const dx = wx - camX;
    const dy = wy - camY;

    // Rotate by theta (counterclockwise rotation matrix)
    const rotatedX = dx * Math.cos(theta) - dy * Math.sin(theta);
    const rotatedY = dx * Math.sin(theta) + dy * Math.cos(theta);

    // Scale
    const scaledX = rotatedX * scale;
    const scaledY = rotatedY * scale;

    // Translate to screen space
    return {
        x: scaledX + screenCenterX,
        y: scaledY + screenCenterY,
    };
}

/**
 * Creates transformation functions for converting world coordinates to screen coordinates.
 * This is the single source of truth for camera transformation logic.
 *
 * The transformation applies rotation around the camera position (player car position),
 * then scales and translates to screen space. The player car appears at (width/2, height * 0.75).
 *
 * @param camera - The camera with position, zoom, and rotation
 * @param width - The stage width
 * @param height - The stage height
 * @returns Object containing transform functions (tx, ty) and scale
 */
function createTransformFunctions(
    camera: Camera,
    width: number,
    height: number,
): {
    tx: (wx: number) => number;
    ty: (wy: number) => number;
    scale: number;
    transformPoint: (wx: number, wy: number) => { x: number; y: number };
} {
    const { x: camX, y: camY } = camera.pos;
    const scale = camera.zoom;

    // Combined rotation: negative camera rotation + 90° clockwise (-π/2)
    // This makes the car appear going up on screen when world rotation is 0 (pointing right)
    const theta = -camera.rotation - Math.PI / 2;

    // Player car screen position: centered horizontally, 75% from top
    const screenCenterX = width / 2;
    const screenCenterY = height * 0.75;

    // State for tx/ty API compatibility (used when coordinates are passed separately)
    let storedWx = 0;
    let storedResult: { x: number; y: number } | null = null;

    // Transform point function (preferred API when both coordinates are available)
    const transformPoint = (
        wx: number,
        wy: number,
    ): { x: number; y: number } => {
        return transformPointInternal(
            wx,
            wy,
            camX,
            camY,
            theta,
            scale,
            screenCenterX,
            screenCenterY,
        );
    };

    // Separate tx/ty functions for API compatibility
    // Note: These work by storing x when tx is called, then computing both x and y when ty is called
    // This requires tx to be called before ty for the same point
    const tx = (wx: number) => {
        storedWx = wx;
        storedResult = null; // Reset stored result
        // Return placeholder - actual value computed when ty is called
        // For rotation to work correctly, we need both coordinates
        return 0;
    };

    const ty = (wy: number) => {
        // Compute transformation with stored x and provided y
        storedResult = transformPoint(storedWx, wy);
        return storedResult.y;
    };

    return { tx, ty, scale, transformPoint };
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
    height: number,
): { x: number; y: number } {
    const { transformPoint } = createTransformFunctions(camera, width, height);
    return transformPoint(worldPos.x, worldPos.y);
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
    worldUnitSpacing: number = 10,
): number[] {
    const { transformPoint } = createTransformFunctions(camera, width, height);

    const flat: number[] = [];
    const trackLength = track.length;
    const numSamples = Math.ceil(trackLength / worldUnitSpacing);

    for (let i = 0; i <= numSamples; i++) {
        const s = (i / numSamples) * trackLength;
        const p = track.posAt(s);
        const n = track.normalAt(s);
        const offsetPos = { x: p.x + n.x * offset, y: p.y + n.y * offset };
        const screenPos = transformPoint(offsetPos.x, offsetPos.y);
        flat.push(screenPos.x, screenPos.y);
    }

    return flat;
}
