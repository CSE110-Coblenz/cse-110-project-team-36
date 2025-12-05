/**
 * Service interface for document operations
 * Abstracts document APIs for testability
 */
export interface DocumentService {
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    getHidden(): boolean;
    getDocumentElement(): HTMLElement;
    requestFullscreen(element: HTMLElement): Promise<void>;
    exitFullscreen(): Promise<void>;
}

/**
 * Browser implementation of DocumentService
 * Uses the actual document object
 */
export class BrowserDocumentService implements DocumentService {
    addEventListener(type: string, listener: EventListener): void {
        document.addEventListener(type, listener);
    }

    removeEventListener(type: string, listener: EventListener): void {
        document.removeEventListener(type, listener);
    }

    getHidden(): boolean {
        return document.hidden;
    }

    getDocumentElement(): HTMLElement {
        return document.documentElement;
    }

    async requestFullscreen(element: HTMLElement): Promise<void> {
        await element.requestFullscreen?.();
    }

    async exitFullscreen(): Promise<void> {
        await document.exitFullscreen?.();
    }
}
