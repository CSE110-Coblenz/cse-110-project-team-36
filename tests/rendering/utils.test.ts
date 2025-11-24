/**
 * Unit tests for rendering utilities
 */

import { worldToScreen } from '../../src/rendering/game/utils';
import type { Camera } from '../../src/game/types';

describe('Rendering Utils', () => {
    describe('worldToScreen', () => {
        it('should transform camera position to screen center (width/2, height*0.75)', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 1,
                rotation: 0,
            };
            const screen = worldToScreen({ x: 0, y: 0 }, camera, 800, 600);
            expect(screen.x).toBe(400); // width / 2
            expect(screen.y).toBe(450); // height * 0.75
        });

        it('should apply camera position offset with rotation', () => {
            const camera: Camera = {
                pos: { x: 100, y: 50 },
                zoom: 1,
                rotation: 0,
            };
            // Camera position should map to screen center
            const cameraScreen = worldToScreen(
                { x: 100, y: 50 },
                camera,
                800,
                600,
            );
            expect(cameraScreen.x).toBe(400); // width / 2
            expect(cameraScreen.y).toBe(450); // height * 0.75

            // Point at origin (0, 0) relative to camera at (100, 50)
            // dx = -100, dy = -50
            // With rotation = 0, we apply -π/2 rotation (90° clockwise)
            // rotatedX = -100*cos(-π/2) - (-50)*sin(-π/2) = -100*0 - (-50)*(-1) = -50
            // rotatedY = -100*sin(-π/2) + (-50)*cos(-π/2) = -100*(-1) + (-50)*0 = 100
            // After scale and translate: x = -50 + 400 = 350, y = 100 + 450 = 550
            const originScreen = worldToScreen(
                { x: 0, y: 0 },
                camera,
                800,
                600,
            );
            expect(originScreen.x).toBeCloseTo(350, 1);
            expect(originScreen.y).toBeCloseTo(550, 1);
        });

        it('should apply camera zoom scale with rotation', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 2,
                rotation: 0,
            };
            // Point at (50, 0) relative to camera
            // dx = 50, dy = 0
            // After -π/2 rotation: rotatedX = 50*0 - 0*(-1) = 0, rotatedY = 50*(-1) + 0*0 = -50
            // After scale: scaledX = 0*2 = 0, scaledY = -50*2 = -100
            // After translate: x = 0 + 400 = 400, y = -100 + 450 = 350
            const screen = worldToScreen({ x: 50, y: 0 }, camera, 800, 600);
            expect(screen.x).toBeCloseTo(400, 1);
            expect(screen.y).toBeCloseTo(350, 1);
        });

        it('should center camera position at (width/2, height*0.75)', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 1,
                rotation: 0,
            };
            const screen = worldToScreen({ x: 0, y: 0 }, camera, 1920, 1080);
            expect(screen.x).toBe(960); // width / 2
            expect(screen.y).toBe(810); // height * 0.75
        });

        it('should return screen coordinates object', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 1.5,
                rotation: 0,
            };
            const result = worldToScreen({ x: 0, y: 0 }, camera, 800, 600);
            expect(result).toHaveProperty('x');
            expect(result).toHaveProperty('y');
            expect(typeof result.x).toBe('number');
            expect(typeof result.y).toBe('number');
        });

        it('should handle zero zoom', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 0,
                rotation: 0,
            };
            // With zero zoom, all points collapse to camera position on screen
            const screen1 = worldToScreen({ x: 0, y: 0 }, camera, 800, 600);
            const screen2 = worldToScreen({ x: 100, y: 100 }, camera, 800, 600);
            expect(screen1.x).toBe(400);
            expect(screen1.y).toBe(450);
            expect(screen2.x).toBe(400);
            expect(screen2.y).toBe(450);
        });

        it('should handle negative world coordinates', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 1,
                rotation: 0,
            };
            // Point at (-100, -200) relative to camera
            // dx = -100, dy = -200
            // After -π/2 rotation: rotatedX = -100*0 - (-200)*(-1) = -200
            // rotatedY = -100*(-1) + (-200)*0 = 100
            // After scale and translate: x = -200 + 400 = 200, y = 100 + 450 = 550
            const screen = worldToScreen(
                { x: -100, y: -200 },
                camera,
                800,
                600,
            );
            expect(screen.x).toBeCloseTo(200, 1);
            expect(screen.y).toBeCloseTo(550, 1);
        });

        it('should handle camera at origin', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 1,
                rotation: 0,
            };
            const screen = worldToScreen({ x: 0, y: 0 }, camera, 800, 600);
            expect(screen.x).toBe(400);
            expect(screen.y).toBe(450);
        });

        it('should handle large stage dimensions', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 1,
                rotation: 0,
            };
            const screen = worldToScreen({ x: 0, y: 0 }, camera, 3840, 2160);
            expect(screen.x).toBe(1920); // width / 2
            expect(screen.y).toBe(1620); // height * 0.75
        });

        it('should handle fractional zoom values', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 0.5,
                rotation: 0,
            };
            // Point at (200, 0) relative to camera
            // After -π/2 rotation and 0.5 scale: rotatedX = 0, rotatedY = -100
            // After translate: x = 0 + 400 = 400, y = -100 + 450 = 350
            const screen = worldToScreen({ x: 200, y: 0 }, camera, 800, 600);
            expect(screen.x).toBeCloseTo(400, 1);
            expect(screen.y).toBeCloseTo(350, 1);
        });

        it('should handle combined offset and zoom with rotation', () => {
            const camera: Camera = {
                pos: { x: 100, y: 200 },
                zoom: 2,
                rotation: 0,
            };
            // Camera position should map to screen center
            const cameraScreen = worldToScreen(
                { x: 100, y: 200 },
                camera,
                800,
                600,
            );
            expect(cameraScreen.x).toBe(400);
            expect(cameraScreen.y).toBe(450);

            // Point at (150, 250) relative to camera at (100, 200)
            // dx = 50, dy = 50
            // After -π/2 rotation: rotatedX = 50*0 - 50*(-1) = 50
            // rotatedY = 50*(-1) + 50*0 = -50
            // After scale: scaledX = 50*2 = 100, scaledY = -50*2 = -100
            // After translate: x = 100 + 400 = 500, y = -100 + 450 = 350
            const pointScreen = worldToScreen(
                { x: 150, y: 250 },
                camera,
                800,
                600,
            );
            expect(pointScreen.x).toBeCloseTo(500, 1);
            expect(pointScreen.y).toBeCloseTo(350, 1);
        });

        it('should maintain coordinate consistency', () => {
            const camera: Camera = {
                pos: { x: 50, y: 75 },
                zoom: 1.5,
                rotation: 0,
            };
            // Camera position should always map to screen center
            const cameraScreen = worldToScreen(
                { x: 50, y: 75 },
                camera,
                1024,
                768,
            );
            expect(cameraScreen.x).toBe(512); // width / 2
            expect(cameraScreen.y).toBe(576); // height * 0.75
        });

        it('should handle rotation transformations', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 1,
                rotation: Math.PI / 2,
            };
            // Point at (100, 0) in world, camera rotated 90° (pointing up in world)
            // Camera rotation compensates for world rotation
            // Combined rotation: -π/2 - π/2 = -π (180°)
            // dx = 100, dy = 0
            // After -π rotation: rotatedX = 100*cos(-π) - 0*sin(-π) = -100
            // rotatedY = 100*sin(-π) + 0*cos(-π) = 0
            // After scale and translate: x = -100 + 400 = 300, y = 0 + 450 = 450
            const screen = worldToScreen({ x: 100, y: 0 }, camera, 800, 600);
            expect(screen.x).toBeCloseTo(300, 1);
            expect(screen.y).toBeCloseTo(450, 1);
        });

        it('should be pure function with same inputs', () => {
            const camera: Camera = {
                pos: { x: 100, y: 200 },
                zoom: 2,
                rotation: 0,
            };
            const result1 = worldToScreen({ x: 50, y: 50 }, camera, 800, 600);
            const result2 = worldToScreen({ x: 50, y: 50 }, camera, 800, 600);
            expect(result1.x).toBe(result2.x);
            expect(result1.y).toBe(result2.y);
        });

        it('should be idempotent for multiple calls with same inputs', () => {
            const camera: Camera = {
                pos: { x: 0, y: 0 },
                zoom: 1,
                rotation: 0,
            };
            const worldPos = { x: 42, y: 84 };
            const result1 = worldToScreen(worldPos, camera, 800, 600);
            const result2 = worldToScreen(worldPos, camera, 800, 600);
            expect(result1.x).toBe(result2.x);
            expect(result1.y).toBe(result2.y);
        });
    });
});
