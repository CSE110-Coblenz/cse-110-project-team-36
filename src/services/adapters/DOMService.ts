/**
 * DOM service interface for abstracting document access
 * Allows controllers to be decoupled from browser DOM APIs
 */
export interface DOMService {
    getBody(): HTMLElement;
}

/**
 * Browser implementation of DOMService
 * Wraps document.body access
 */
export class BrowserDOMService implements DOMService {
    getBody(): HTMLElement {
        return document.body;
    }
}

