import { ResizeListener } from "../listeners/ResizeListener";
import {
    SpaceRewardListener,
    NumberInputListener,
    DeleteListener,
    EnterSubmitListener,
    SkipQuestionListener,
} from "../listeners/KeyboardListener";

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

    // Always-active listeners
    private pauseKeyListener: ((e: KeyboardEvent) => void) | null = null;
    private resizeListener: ResizeListener | null = null;

    // Pause-aware game input listeners
    private spaceRewardListener: SpaceRewardListener | null = null;
    private numberInputListener: NumberInputListener | null = null;
    private deleteListener: DeleteListener | null = null;
    private enterSubmitListener: EnterSubmitListener | null = null;
    private skipQuestionListener: SkipQuestionListener | null = null;

    constructor(
        private containerElement: HTMLElement,
        private onResize: (w: number, h: number) => void,
        private onPauseToggle: () => void,
        private onSpaceReward: () => void,
        private questionCallbacks: {
            onNumberInput: (char: string) => void;
            onDelete: () => void;
            onEnterSubmit: () => void;
            onSkip: () => void;
        }
    ) {}

    /**
     * Start all listeners
     * 
     * @throws Error if already started
     */
    start(): void {
        if (this.isRunning) {
            throw new Error("ListenerController is already started. Call stop() before starting again.");
        }

        // Setup pause keyboard handler (always active)
        this.pauseKeyListener = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (k === "escape" || k === "p") {
                e.preventDefault();
                this.onPauseToggle();
            }
        };
        window.addEventListener("keydown", this.pauseKeyListener);

        // Setup resize listener (always active)
        this.resizeListener = new ResizeListener(this.containerElement, this.onResize);
        this.resizeListener.start();

        // Setup space key reward (pause-aware)
        this.spaceRewardListener = new SpaceRewardListener(() => {
            if (!this.gameInputsPaused) {
                this.onSpaceReward();
            }
        });
        this.spaceRewardListener.start();

        // Setup question input listeners (pause-aware)
        this.numberInputListener = new NumberInputListener((char: string) => {
            if (!this.gameInputsPaused) {
                this.questionCallbacks.onNumberInput(char);
            }
        });
        this.numberInputListener.start();

        this.deleteListener = new DeleteListener(() => {
            if (!this.gameInputsPaused) {
                this.questionCallbacks.onDelete();
            }
        });
        this.deleteListener.start();

        this.enterSubmitListener = new EnterSubmitListener(() => {
            if (!this.gameInputsPaused) {
                this.questionCallbacks.onEnterSubmit();
            }
        });
        this.enterSubmitListener.start();

        this.skipQuestionListener = new SkipQuestionListener(() => {
            if (!this.gameInputsPaused) {
                this.questionCallbacks.onSkip();
            }
        });
        this.skipQuestionListener.start();

        this.isRunning = true;
    }

    /**
     * Stop all listeners
     */
    stop(): void {
        if (!this.isRunning) {
            return;
        }

        // Stop pause key listener
        if (this.pauseKeyListener) {
            window.removeEventListener("keydown", this.pauseKeyListener);
            this.pauseKeyListener = null;
        }

        // Stop resize listener
        if (this.resizeListener) {
            this.resizeListener.stop();
            this.resizeListener = null;
        }

        // Stop space reward listener
        if (this.spaceRewardListener) {
            this.spaceRewardListener.stop();
            this.spaceRewardListener = null;
        }

        // Stop question input listeners
        if (this.numberInputListener) {
            this.numberInputListener.stop();
            this.numberInputListener = null;
        }
        if (this.deleteListener) {
            this.deleteListener.stop();
            this.deleteListener = null;
        }
        if (this.enterSubmitListener) {
            this.enterSubmitListener.stop();
            this.enterSubmitListener = null;
        }
        if (this.skipQuestionListener) {
            this.skipQuestionListener.stop();
            this.skipQuestionListener = null;
        }

        this.isRunning = false;
        this.gameInputsPaused = false;
    }

    /**
     * Pause game input listeners (pause/resume keys and resize remain active)
     */
    pause(): void {
        if (!this.isRunning) {
            throw new Error("Cannot pause: ListenerController is not started. Call start() first.");
        }
        this.gameInputsPaused = true;
    }

    /**
     * Resume game input listeners
     */
    resume(): void {
        if (!this.isRunning) {
            throw new Error("Cannot resume: ListenerController is not started. Call start() first.");
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
}
