/**
 * Service interface for window event handling
 * Abstracts window.addEventListener and window.removeEventListener for testability
 */
export interface WindowService {
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
}

/**
 * Browser implementation of WindowService
 * Uses the actual window object
 */
export class BrowserWindowService implements WindowService {
    addEventListener(type: string, listener: EventListener): void {
        window.addEventListener(type, listener);
    }

    removeEventListener(type: string, listener: EventListener): void {
        window.removeEventListener(type, listener);
    }
}

