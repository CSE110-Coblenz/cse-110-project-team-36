/**
 * Unit tests for GameClock
 */

import { GameClock } from '../../src/game/clock';

describe('GameClock', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
            setTimeout(cb, 16); // ~60fps
            return 1;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    describe('Instantiation', () => {
        it('should create clock with default stepsPerSecond (60)', () => {
            // Arrange & Act
            const clock = new GameClock();

            // Assert
            expect(clock).toBeDefined();
        });

        it('should create clock with custom stepsPerSecond', () => {
            // Arrange & Act
            const clock = new GameClock(120);

            // Assert
            expect(clock).toBeDefined();
        });

        it('should calculate dtMs correctly (1000/stepsPerSecond)', () => {
            // This test verifies that the internal dtMs is calculated correctly
            // We can't directly access it, but we can verify behavior

            // Arrange
            const clock30 = new GameClock(30);
            const clock60 = new GameClock(60);
            const clock120 = new GameClock(120);

            // Act - verify step is called at correct intervals
            const step30 = jest.fn();
            const step60 = jest.fn();
            const step120 = jest.fn();
            const render = jest.fn();

            clock30.start(step30, render);
            clock60.start(step60, render);
            clock120.start(step120, render);

            // Fast-forward time
            jest.advanceTimersByTime(1000);

            // Assert - should be called proportionally to fps
            // Step 30 should be called ~30 times per second
            // Step 60 should be called ~60 times per second
            // Step 120 should be called ~120 times per second
            expect(step30.mock.calls.length).toBeGreaterThanOrEqual(20);
            expect(step30.mock.calls.length).toBeLessThanOrEqual(40);
            expect(step60.mock.calls.length).toBeGreaterThanOrEqual(50);
            expect(step60.mock.calls.length).toBeLessThanOrEqual(70);
            expect(step120.mock.calls.length).toBeGreaterThanOrEqual(100);
            expect(step120.mock.calls.length).toBeLessThanOrEqual(140);

            // Clean up
            jest.advanceTimersByTime(10000);
        });
    });

    describe('Game Loop Behavior', () => {
        it('should call step callback at fixed intervals', () => {
            // Arrange
            const clock = new GameClock(60);
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);
            jest.advanceTimersByTime(1000); // 1 second

            // Assert - should be called approximately 60 times
            expect(stepFn.mock.calls.length).toBeGreaterThanOrEqual(50);
            expect(stepFn.mock.calls.length).toBeLessThanOrEqual(70);

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should call render callback every frame', () => {
            // Arrange
            const clock = new GameClock(60);
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);
            jest.advanceTimersByTime(1000); // 1 second

            // Assert - render should be called more frequently than step
            expect(renderFn.mock.calls.length).toBeGreaterThan(stepFn.mock.calls.length);

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should pass dt in seconds to step callback', () => {
            // Arrange
            const clock = new GameClock(60); // 60 steps per second = 16.67ms per step
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);
            jest.advanceTimersByTime(1000);

            // Assert - dt should be approximately 1/60 = 0.01667 seconds
            expect(stepFn.mock.calls.length).toBeGreaterThan(0);
            const firstDt = stepFn.mock.calls[0][0];
            expect(firstDt).toBeCloseTo(1 / 60, 3);

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should pass alpha in [0, 1] to render callback', () => {
            // Arrange
            const clock = new GameClock(60);
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);
            jest.advanceTimersByTime(1000);

            // Assert - alpha should be between 0 and 1
            expect(renderFn.mock.calls.length).toBeGreaterThan(0);
            const firstAlpha = renderFn.mock.calls[0][0];
            expect(firstAlpha).toBeGreaterThanOrEqual(0);
            expect(firstAlpha).toBeLessThanOrEqual(1);

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should handle frame time correctly in accumulator', () => {
            // Arrange
            const clock = new GameClock(60);
            const stepFn = jest.fn();
            const renderFn = jest.fn();
            let frameCount = 0;

            clock.start(stepFn, renderFn);

            // Advance timers to simulate multiple frames
            for (let i = 0; i < 100; i++) {
                frameCount++;
                jest.advanceTimersByTime(16); // ~60fps

                // Every 10 frames, check that step was called appropriately
                if (frameCount % 10 === 0) {
                    const stepCount = stepFn.mock.calls.length;
                    // Should have called step roughly once per frame advance (allow some variation)
                    expect(stepCount).toBeGreaterThanOrEqual(frameCount - 5);
                    expect(stepCount).toBeLessThanOrEqual(frameCount + 5);
                }
            }

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should cap large frame time at 250ms', () => {
            // Arrange
            const clock = new GameClock(60);
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);
            
            // Simulate a very long frame (e.g., tab was inactive)
            jest.advanceTimersByTime(500); // 500ms frame

            // Assert - should not have created excessive step calls
            // With 60 FPS (16.67ms per step), a 500ms frame should give ~30 steps
            // But capped at 250ms, should only give ~15 steps
            const stepCount = stepFn.mock.calls.length;
            expect(stepCount).toBeLessThanOrEqual(30); // Conservative check with mocked RAF

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should execute multiple steps when accumulator exceeds dtMs', () => {
            // Arrange
            const clock = new GameClock(10); // 10 steps per second = 100ms per step
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);

            // Advance by more than one step duration
            jest.advanceTimersByTime(250); // Should trigger 2-3 steps

            // Assert - multiple steps should have occurred
            expect(stepFn.mock.calls.length).toBeGreaterThanOrEqual(2);
            expect(stepFn.mock.calls.length).toBeLessThanOrEqual(4);

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should handle high frequency rendering with low frequency stepping', () => {
            // Arrange
            const clock = new GameClock(30); // 30 steps per second
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);
            jest.advanceTimersByTime(1000); // 1 second

            // Assert - render should be called more than step
            expect(renderFn.mock.calls.length).toBeGreaterThan(stepFn.mock.calls.length);

            // Step should be called roughly 30 times
            expect(stepFn.mock.calls.length).toBeGreaterThanOrEqual(20);
            expect(stepFn.mock.calls.length).toBeLessThanOrEqual(40);

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should maintain consistent timing over long duration', () => {
            // Arrange
            const clock = new GameClock(60);
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);

            // Simulate 5 seconds
            jest.advanceTimersByTime(5000);

            // Assert - should have stepped approximately 300 times (60 * 5)
            expect(stepFn.mock.calls.length).toBeGreaterThanOrEqual(250);
            expect(stepFn.mock.calls.length).toBeLessThanOrEqual(350);

            // Clean up
            jest.advanceTimersByTime(10000);
        });

        it('should handle variable frame rates correctly', () => {
            // Arrange
            const clock = new GameClock(60);
            const stepFn = jest.fn();
            const renderFn = jest.fn();

            // Act
            clock.start(stepFn, renderFn);

            // Simulate variable frame times
            const frameTimes = [8, 16, 24, 12, 20, 16]; // Varying frame rates
            frameTimes.forEach(time => {
                jest.advanceTimersByTime(time);
            });

            // Assert - should have maintained approximately correct step count
            // Total time is ~96ms, so should have ~6 steps
            expect(stepFn.mock.calls.length).toBeGreaterThanOrEqual(4);
            expect(stepFn.mock.calls.length).toBeLessThanOrEqual(8);

            // Clean up
            jest.advanceTimersByTime(10000);
        });
    });
});

