/**
 * Storage service interface for abstracting localStorage/sessionStorage
 * Allows controllers to be decoupled from browser storage APIs
 */
export interface StorageService {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    key(index: number): string | null;
    get length(): number;
}

/**
 * Browser implementation of StorageService
 * Wraps localStorage or sessionStorage
 */
export class BrowserStorageService implements StorageService {
    private storage: Storage;

    constructor(storage: Storage = localStorage) {
        this.storage = storage;
    }

    getItem(key: string): string | null {
        return this.storage.getItem(key);
    }

    setItem(key: string, value: string): void {
        this.storage.setItem(key, value);
    }

    removeItem(key: string): void {
        this.storage.removeItem(key);
    }

    key(index: number): string | null {
        return this.storage.key(index);
    }

    get length(): number {
        return this.storage.length;
    }
}
