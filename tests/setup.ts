/**
 * Jest setup file for global test configuration
 */

// Mock localStorage for testing
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Reset localStorage mock before each test
beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    localStorageMock.key.mockClear();
});

// Mock ResizeObserver for testing
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    constructor(public callback: ResizeObserverCallback) {}
} as any;

// Global test utilities
global.testUtils = {
    localStorage: localStorageMock,
};
