/**
 * Unit tests for rendering utilities
 */

import { worldToStage } from '../../src/rendering/game/utils';
import type { Camera } from '../../src/game/types';

describe('Rendering Utils', () => {
    describe('worldToStage', () => {
        it('should transform world coordinates to screen coordinates', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const { tx, ty } = worldToStage(camera, 800, 600);
            expect(tx(0)).toBe(400); // width / 2
            expect(ty(0)).toBe(300); // height / 2
        });

        it('should apply camera position offset', () => {
            const camera: Camera = { pos: { x: 100, y: 50 }, zoom: 1 };
            const { tx, ty } = worldToStage(camera, 800, 600);
            expect(tx(100)).toBe(400); // width / 2
            expect(ty(50)).toBe(300);  // height / 2

            // World origin should be offset
            expect(tx(0)).toBe(300); // 0 - 100 + 400 = 300
            expect(ty(0)).toBe(250); // 0 - 50 + 300 = 250
        });

        it('should apply camera zoom scale', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 2 };
            const { tx, ty, scale } = worldToStage(camera, 800, 600);
            expect(scale).toBe(2);

            // World point (50, 50) should be at (400 + 50*2, 300 + 50*2) = (500, 400)
            expect(tx(50)).toBe(500);
            expect(ty(50)).toBe(400);
        });

        it('should center transformation at stage width/2, height/2', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const { tx, ty } = worldToStage(camera, 1920, 1080);
            expect(tx(0)).toBe(960); // width / 2
            expect(ty(0)).toBe(540); // height / 2
        });

        it('should return tx, ty functions and scale', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 1.5 };
            const result = worldToStage(camera, 800, 600);
            expect(result).toHaveProperty('tx');
            expect(result).toHaveProperty('ty');
            expect(result).toHaveProperty('scale');
            expect(typeof result.tx).toBe('function');
            expect(typeof result.ty).toBe('function');
            expect(typeof result.scale).toBe('number');
            expect(result.scale).toBe(1.5);
        });

        it('should handle zero zoom', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 0 };
            const { tx, ty } = worldToStage(camera, 800, 600);
            expect(tx(0)).toBe(400);
            expect(tx(100)).toBe(400);
            expect(tx(-100)).toBe(400);
            expect(ty(0)).toBe(300);
            expect(ty(100)).toBe(300);
            expect(ty(-100)).toBe(300);
        });

        it('should handle negative world coordinates', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const { tx, ty } = worldToStage(camera, 800, 600);
            expect(tx(-100)).toBe(300); // -100 - 0 + 400 = 300
            expect(ty(-200)).toBe(100); // -200 - 0 + 300 = 100
        });

        it('should handle camera at origin', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const { tx, ty } = worldToStage(camera, 800, 600);
            expect(tx(0)).toBe(400);
            expect(ty(0)).toBe(300);
        });

        it('should handle large stage dimensions', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const { tx, ty } = worldToStage(camera, 3840, 2160);
            expect(tx(0)).toBe(1920); // width / 2
            expect(ty(0)).toBe(1080); // height / 2
        });

        it('should handle fractional zoom values', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 0.5 };
            const { tx, ty, scale } = worldToStage(camera, 800, 600);
            expect(scale).toBe(0.5);

            // World point (200, 200) should be at (400 + 200*0.5, 300 + 200*0.5) = (500, 400)
            expect(tx(200)).toBe(500);
            expect(ty(200)).toBe(400);
        });

        it('should handle combined offset and zoom', () => {
            const camera: Camera = { pos: { x: 100, y: 200 }, zoom: 2 };
            const { tx, ty } = worldToStage(camera, 800, 600);
            // Formula: (world - cameraPos) * zoom + center
            // tx(100) = (100 - 100) * 2 + 400 = 400
            // ty(200) = (200 - 200) * 2 + 300 = 300
            expect(tx(100)).toBe(400);
            expect(ty(200)).toBe(300);

            // Point (150, 250) should be at (400 + (150-100)*2, 300 + (250-200)*2) = (500, 400)
            expect(tx(150)).toBe(500);
            expect(ty(250)).toBe(400);
        });

        it('should maintain coordinate consistency', () => {
            const camera: Camera = { pos: { x: 50, y: 75 }, zoom: 1.5 };
            const { tx, ty } = worldToStage(camera, 1024, 768);
            expect(tx(camera.pos.x)).toBe(512); // width / 2
            expect(ty(camera.pos.y)).toBe(384); // height / 2

            // Verify surrounding points scale correctly
            expect(tx(camera.pos.x + 10)).toBe(512 + 10 * camera.zoom);
            expect(ty(camera.pos.y + 10)).toBe(384 + 10 * camera.zoom);
        });

        it('should handle extreme coordinates', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const { tx, ty } = worldToStage(camera, 800, 600);
            expect(tx(10000)).toBe(10400);
            expect(ty(-5000)).toBe(-4700);

            // Should handle floating point
            expect(tx(123.456)).toBeCloseTo(523.456, 3);
            expect(ty(789.123)).toBeCloseTo(1089.123, 3);
        });

        it('should be pure function with same inputs', () => {
            const camera: Camera = { pos: { x: 100, y: 200 }, zoom: 2 };
            const result1 = worldToStage(camera, 800, 600);
            const result2 = worldToStage(camera, 800, 600);
            expect(result1.scale).toBe(result2.scale);
            expect(result1.tx(50)).toBe(result2.tx(50));
            expect(result1.ty(50)).toBe(result2.ty(50));
        });

        it('should be idempotent for multiple calls with same camera', () => {
            const camera: Camera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const { tx, ty } = worldToStage(camera, 800, 600);
            const worldX = 42;
            const worldY = 84;

            expect(tx(worldX)).toBe(tx(worldX));
            expect(ty(worldY)).toBe(ty(worldY));
            expect(tx(worldX)).toBe(tx(worldX));
        });
    });
});

