import { ResizeListener } from '../listeners/ResizeListener';
import { VisibilityListener } from '../listeners/VisibilityListener';
import {
    SpaceRewardListener,
    NumberInputListener,
    DeleteListener,
    EnterSubmitListener,
    SkipQuestionListener,
    LaneChangeListener,
} from '../listeners/KeyboardListener';
import type { DOMService } from '../../services/adapters/DOMService';

/**
 * Listener controller class
 *
 * Manages all input listeners with pause-aware behavior:
 * - Always active: pause/resume listeners (Escape/P keys), resize observer
 * - Pause-aware: game input listeners (space for rewards, question input)
 */
export class ListenerController {
    private isRunning: boolean = false;
    private gameInputsPaused: boolean = false;

    private pauseKeyListener: (e: KeyboardEvent) => void;
    private resizeListener: ResizeListener;
    private visibilityListener: VisibilityListener;
    private spaceRewardListener: SpaceRewardListener;
    private numberInputListener: NumberInputListener;
    private deleteListener: DeleteListener;
    private enterSubmitListener: EnterSubmitListener;
    private skipQuestionListener: SkipQuestionListener;
    private laneChangeListener: LaneChangeListener;

    constructor(
        private onPauseToggle: () => void,
        private onSpaceReward: () => void,
        private questionCallbacks: {
            onNumberInput: (char: string) => void;
            onDelete: () => void;
            onEnterSubmit: () => void;
            onSkip: () => void;
        },
        private laneChangeCallbacks: {
            onLaneChangeLeft: () => void;
            onLaneChangeRight: () => void;
        },
        private domService: DOMService,
        private onVisibilityLost?: () => void,
    ) {
        this.pauseKeyListener = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (k === 'escape' || k === 'p') {
                e.preventDefault();
                this.onPauseToggle();
            }
        };

        this.visibilityListener = new VisibilityListener(
            (isVisible: boolean) => {
                if (!isVisible && this.onVisibilityLost) {
                    this.onVisibilityLost();
                }
            },
        );

        this.spaceRewardListener = new SpaceRewardListener(() => {
            if (!this.gameInputsPaused) {
                this.onSpaceReward();
            }
        });

        this.numberInputListener = new NumberInputListener((char: string) => {
            if (!this.gameInputsPaused) {
                this.questionCallbacks.onNumberInput(char);
            }
        });

        this.deleteListener = new DeleteListener(() => {
            if (!this.gameInputsPaused) {
                this.questionCallbacks.onDelete();
            }
        });

        this.enterSubmitListener = new EnterSubmitListener(() => {
            if (!this.gameInputsPaused) {
                this.questionCallbacks.onEnterSubmit();
            }
        });

        this.skipQuestionListener = new SkipQuestionListener(() => {
            if (!this.gameInputsPaused) {
                this.questionCallbacks.onSkip();
            }
        });

        this.laneChangeListener = new LaneChangeListener(
            (direction: -1 | 1) => {
                if (!this.gameInputsPaused) {
                    if (direction === -1) {
                        this.laneChangeCallbacks.onLaneChangeLeft();
                    } else {
                        this.laneChangeCallbacks.onLaneChangeRight();
                    }
                }
            },
        );

        this.resizeListener = new ResizeListener(this.domService.getBody(), () => {});
    }

    /**
     * Start all listeners
     *
     * @param containerElement - The container element for resize listener
     * @param onResize - Callback for resize events
     * @throws Error if already started
     */
    start(
        containerElement: HTMLElement,
        onResize: (w: number, h: number) => void,
    ): void {
        if (this.isRunning) {
            throw new Error(
                'ListenerController is already started. Call stop() before starting again.',
            );
        }

        this.resizeListener.stop();
        this.resizeListener = new ResizeListener(containerElement, onResize);
        this.resizeListener.start();

        this.visibilityListener.start();

        window.addEventListener('keydown', this.pauseKeyListener);

        this.spaceRewardListener.start();
        this.numberInputListener.start();
        this.deleteListener.start();
        this.enterSubmitListener.start();
        this.skipQuestionListener.start();
        this.laneChangeListener.start();

        this.isRunning = true;
    }

    /**
     * Stop all listeners (deactivates but doesn't destroy them)
     */
    stop(): void {
        if (!this.isRunning) {
            return;
        }

        window.removeEventListener('keydown', this.pauseKeyListener);

        this.resizeListener.stop();
        this.visibilityListener.stop();
        this.spaceRewardListener.stop();
        this.numberInputListener.stop();
        this.deleteListener.stop();
        this.enterSubmitListener.stop();
        this.skipQuestionListener.stop();
        this.laneChangeListener.stop();
        this.isRunning = false;
        this.gameInputsPaused = false;
    }

    /**
     * Pause game input listeners (pause/resume keys and resize remain active)
     */
    pause(): void {
        if (!this.isRunning) {
            throw new Error(
                'Cannot pause: ListenerController is not started. Call start() first.',
            );
        }
        this.gameInputsPaused = true;
    }

    /**
     * Resume game input listeners
     */
    resume(): void {
        if (!this.isRunning) {
            throw new Error(
                'Cannot resume: ListenerController is not started. Call start() first.',
            );
        }
        this.gameInputsPaused = false;
    }

    /**
     * Check if the controller is started
     *
     * @returns True if started, false otherwise
     */
    isStarted(): boolean {
        return this.isRunning;
    }

    /**
     * Check if game inputs are paused
     *
     * @returns True if game inputs are paused, false otherwise
     */
    isPaused(): boolean {
        return this.gameInputsPaused;
    }

    /**
     * Destroy the controller and clean up all resources
     *
     * This should be called when the controller is no longer needed (e.g., when exiting the game).
     * It stops the controller if running. References will be garbage collected when the controller
     * is no longer referenced.
     */
    destroy(): void {
        if (this.isRunning) {
            this.stop();
        }
    }
}
