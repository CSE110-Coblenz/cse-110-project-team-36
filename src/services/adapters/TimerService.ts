/**
 * Timer service interface for abstracting setTimeout/clearTimeout
 * Allows controllers to be decoupled from browser globals
 */
export interface TimerService {
    setTimeout(callback: () => void, delay: number): number;
    clearTimeout(id: number): void;
}

/**
 * Browser implementation of TimerService
 * Wraps window.setTimeout and window.clearTimeout
 */
export class BrowserTimerService implements TimerService {
    setTimeout(callback: () => void, delay: number): number {
        return window.setTimeout(callback, delay);
    }

    clearTimeout(id: number): void {
        window.clearTimeout(id);
    }
}

