/**
 * Service interface for window event handling
 * Abstracts window.addEventListener and window.removeEventListener for testability
 * Uses DOM types to match the actual window API
 */
export interface WindowService {
    addEventListener(
        type: string,
        listener: EventListener | EventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListener | EventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

/**
 * Browser implementation of WindowService
 * Uses the actual window object
 */
export class BrowserWindowService implements WindowService {
    addEventListener(
        type: string,
        listener: EventListener | EventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void {
        window.addEventListener(type, listener, options);
    }

    removeEventListener(
        type: string,
        listener: EventListener | EventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void {
        window.removeEventListener(type, listener, options);
    }
}
