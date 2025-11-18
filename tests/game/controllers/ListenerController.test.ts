/**
 * Unit tests for ListenerController
 */

import { ListenerController } from '../../../src/game/controllers/ListenerController';

describe('ListenerController', () => {
    let containerElement: HTMLElement;
    let onResize: jest.Mock;
    let onPauseToggle: jest.Mock;
    let onSpaceReward: jest.Mock;
    let questionCallbacks: {
        onNumberInput: jest.Mock;
        onDelete: jest.Mock;
        onEnterSubmit: jest.Mock;
        onSkip: jest.Mock;
    };
    let laneChangeCallbacks: {
        onLaneChangeLeft: jest.Mock;
        onLaneChangeRight: jest.Mock;
    };

    beforeEach(() => {
        containerElement = document.createElement('div');
        document.body.appendChild(containerElement);

        onResize = jest.fn();
        onPauseToggle = jest.fn();
        onSpaceReward = jest.fn();
        questionCallbacks = {
            onNumberInput: jest.fn(),
            onDelete: jest.fn(),
            onEnterSubmit: jest.fn(),
            onSkip: jest.fn(),
        };
        laneChangeCallbacks = {
            onLaneChangeLeft: jest.fn(),
            onLaneChangeRight: jest.fn(),
        };
    });

    afterEach(() => {
        document.body.removeChild(containerElement);
    });

    describe('Instantiation', () => {
        it('should create a ListenerController', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            expect(controller).toBeDefined();
            expect(controller.isStarted()).toBe(false);
            expect(controller.isPaused()).toBe(false);
        });
    });

    describe('Start/Stop Lifecycle', () => {
        it('should start all listeners', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);

            expect(controller.isStarted()).toBe(true);
        });

        it('should throw error when starting twice', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);

            expect(() => {
                controller.start(containerElement, onResize);
            }).toThrow('ListenerController is already started. Call stop() before starting again.');
        });

        it('should stop all listeners', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            controller.stop();

            expect(controller.isStarted()).toBe(false);
        });

        it('should be safe to call stop() multiple times', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            controller.stop();

            expect(() => {
                controller.stop();
            }).not.toThrow();
        });

        it('should allow restarting after stop()', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            controller.stop();
            controller.start(containerElement, onResize);

            expect(controller.isStarted()).toBe(true);
        });
    });

    describe('Pause Key Listener (Always Active)', () => {
        it('should trigger pause toggle on Escape key', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            window.dispatchEvent(escapeEvent);

            expect(onPauseToggle).toHaveBeenCalledTimes(1);
            controller.stop();
        });

        it('should trigger pause toggle on P key', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);

            const pEvent = new KeyboardEvent('keydown', { key: 'p' });
            window.dispatchEvent(pEvent);

            expect(onPauseToggle).toHaveBeenCalledTimes(1);
            controller.stop();
        });

        it('should work even when game inputs are paused', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            controller.pause();

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            window.dispatchEvent(escapeEvent);

            expect(onPauseToggle).toHaveBeenCalledTimes(1);
            controller.stop();
        });
    });

    describe('Space Reward Listener (Pause-Aware)', () => {
        it('should trigger space reward when not paused', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);

            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
            window.dispatchEvent(spaceEvent);

            expect(onSpaceReward).toHaveBeenCalledTimes(1);
            controller.stop();
        });

        it('should not trigger space reward when paused', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            controller.pause();

            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
            window.dispatchEvent(spaceEvent);

            expect(onSpaceReward).not.toHaveBeenCalled();
            controller.stop();
        });

        it('should resume space reward after resume()', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            controller.pause();

            const spaceEvent1 = new KeyboardEvent('keydown', { key: ' ' });
            window.dispatchEvent(spaceEvent1);
            expect(onSpaceReward).not.toHaveBeenCalled();

            controller.resume();

            const spaceEvent2 = new KeyboardEvent('keydown', { key: ' ' });
            window.dispatchEvent(spaceEvent2);
            expect(onSpaceReward).toHaveBeenCalledTimes(1);

            controller.stop();
        });
    });

    describe('Pause/Resume', () => {
        it('should throw error when pausing before start()', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            expect(() => {
                controller.pause();
            }).toThrow('Cannot pause: ListenerController is not started. Call start() first.');
        });

        it('should throw error when resuming before start()', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            expect(() => {
                controller.resume();
            }).toThrow('Cannot resume: ListenerController is not started. Call start() first.');
        });

        it('should set paused state correctly', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            expect(controller.isPaused()).toBe(false);

            controller.pause();
            expect(controller.isPaused()).toBe(true);

            controller.resume();
            expect(controller.isPaused()).toBe(false);

            controller.stop();
        });

        it('should reset paused state when stopped', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            controller.pause();
            controller.stop();

            expect(controller.isPaused()).toBe(false);
        });
    });

    describe('Destroy', () => {
        it('should destroy controller when not running', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            expect(() => {
                controller.destroy();
            }).not.toThrow();
        });

        it('should destroy controller and stop if running', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            controller.start(containerElement, onResize);
            expect(controller.isStarted()).toBe(true);

            controller.destroy();
            expect(controller.isStarted()).toBe(false);
        });

        it('should be safe to call destroy() multiple times', () => {
            const controller = new ListenerController(
                onPauseToggle,
                onSpaceReward,
                questionCallbacks,
                laneChangeCallbacks
            );

            expect(() => {
                controller.destroy();
                controller.destroy();
            }).not.toThrow();
        });
    });
});
