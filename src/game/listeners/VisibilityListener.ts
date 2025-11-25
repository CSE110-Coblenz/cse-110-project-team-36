/**
 * Listener for browser visibility changes (tab focus/blur)
 */
export class VisibilityListener {
    private isActive: boolean = false;
    private visibilityHandler: (() => void) | null = null;
    private blurHandler: (() => void) | null = null;

    constructor(private onVisibilityChange: (isVisible: boolean) => void) {}

    /**
     * Start listening for visibility/blur changes
     */
    start(): void {
        if (this.isActive) return;

        this.visibilityHandler = () => {
            this.onVisibilityChange(!document.hidden);
        };

        this.blurHandler = () => {
            this.onVisibilityChange(false);
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);
        window.addEventListener('blur', this.blurHandler);
        this.isActive = true;
    }

    /**
     * Stop listening for visibility/blur changes
     */
    stop(): void {
        if (!this.isActive) return;

        if (this.visibilityHandler) {
            document.removeEventListener(
                'visibilitychange',
                this.visibilityHandler,
            );
            this.visibilityHandler = null;
        }
        if (this.blurHandler) {
            window.removeEventListener('blur', this.blurHandler);
            this.blurHandler = null;
        }
        this.isActive = false;
    }

    /**
     * Check if listener is active
     */
    isStarted(): boolean {
        return this.isActive;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.stop();
    }
}
