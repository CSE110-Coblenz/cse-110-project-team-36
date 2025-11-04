/**
 * Unit tests for ListenerController
 */

import { ListenerController } from '../../../src/game/controllers/ListenerController';

describe('ListenerController', () => {
    let containerElement: HTMLElement;
    let onResize: jest.Mock;
    let onPauseToggle: jest.Mock;
    let onSpaceReward: jest.Mock;

    beforeEach(() => {
        containerElement = document.createElement('div');
        document.body.appendChild(containerElement);
        
        onResize = jest.fn();
        onPauseToggle = jest.fn();
        onSpaceReward = jest.fn();
    });

    afterEach(() => {
        document.body.removeChild(containerElement);
    });

    describe('Instantiation', () => {
        it('should create a ListenerController', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            expect(controller).toBeDefined();
            expect(controller.isStarted()).toBe(false);
            expect(controller.isPaused()).toBe(false);
        });
    });

    describe('Start/Stop Lifecycle', () => {
        it('should start all listeners', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();

            expect(controller.isStarted()).toBe(true);
        });

        it('should throw error when starting twice', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();

            expect(() => {
                controller.start();
            }).toThrow('ListenerController is already started');
        });

        it('should stop all listeners', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();
            controller.stop();

            expect(controller.isStarted()).toBe(false);
        });

        it('should be safe to call stop() multiple times', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();
            controller.stop();
            
            expect(() => {
                controller.stop();
            }).not.toThrow();
        });

        it('should allow restarting after stop()', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();
            controller.stop();
            controller.start();

            expect(controller.isStarted()).toBe(true);
        });
    });

    describe('Pause Key Listener (Always Active)', () => {
        it('should trigger pause toggle on Escape key', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            window.dispatchEvent(escapeEvent);

            expect(onPauseToggle).toHaveBeenCalledTimes(1);
            controller.stop();
        });

        it('should trigger pause toggle on P key', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();

            const pEvent = new KeyboardEvent('keydown', { key: 'p' });
            window.dispatchEvent(pEvent);

            expect(onPauseToggle).toHaveBeenCalledTimes(1);
            controller.stop();
        });

        it('should work even when game inputs are paused', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();
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
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();

            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
            window.dispatchEvent(spaceEvent);

            expect(onSpaceReward).toHaveBeenCalledTimes(1);
            controller.stop();
        });

        it('should not trigger space reward when paused', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();
            controller.pause();

            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
            window.dispatchEvent(spaceEvent);

            expect(onSpaceReward).not.toHaveBeenCalled();
            controller.stop();
        });

        it('should resume space reward after resume()', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();
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
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            expect(() => {
                controller.pause();
            }).toThrow('Cannot pause: ListenerController is not started');
        });

        it('should throw error when resuming before start()', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            expect(() => {
                controller.resume();
            }).toThrow('Cannot resume: ListenerController is not started');
        });

        it('should set paused state correctly', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();
            expect(controller.isPaused()).toBe(false);

            controller.pause();
            expect(controller.isPaused()).toBe(true);

            controller.resume();
            expect(controller.isPaused()).toBe(false);

            controller.stop();
        });

        it('should reset paused state when stopped', () => {
            const controller = new ListenerController(
                containerElement,
                onResize,
                onPauseToggle,
                onSpaceReward
            );

            controller.start();
            controller.pause();
            controller.stop();

            expect(controller.isPaused()).toBe(false);
        });
    });
});
