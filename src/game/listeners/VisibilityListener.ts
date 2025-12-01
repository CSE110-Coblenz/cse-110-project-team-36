import type { WindowService } from '../../services/adapters/WindowService';
import type { DocumentService } from '../../services/adapters/DocumentService';

/**
 * Listener for browser visibility changes (tab focus/blur)
 */
export class VisibilityListener {
    private isActive: boolean = false;
    private visibilityHandler: (() => void) | null = null;
    private blurHandler: (() => void) | null = null;

    constructor(
        private onVisibilityChange: (isVisible: boolean) => void,
        private windowService: WindowService,
        private documentService: DocumentService,
    ) {}

    /**
     * Start listening for visibility/blur changes
     */
    start(): void {
        if (this.isActive) return;

        this.visibilityHandler = () => {
            this.onVisibilityChange(!this.documentService.getHidden());
        };

        this.blurHandler = () => {
            this.onVisibilityChange(false);
        };

        this.documentService.addEventListener(
            'visibilitychange',
            this.visibilityHandler,
        );
        this.windowService.addEventListener('blur', this.blurHandler);
        this.isActive = true;
    }

    /**
     * Stop listening for visibility/blur changes
     */
    stop(): void {
        if (!this.isActive) return;

        if (this.visibilityHandler) {
            this.documentService.removeEventListener(
                'visibilitychange',
                this.visibilityHandler,
            );
            this.visibilityHandler = null;
        }
        if (this.blurHandler) {
            this.windowService.removeEventListener('blur', this.blurHandler);
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
