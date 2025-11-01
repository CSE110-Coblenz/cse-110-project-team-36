/**
 * Shared test utilities and helpers
 */

import { Track, TrackJSON } from '../../src/game/models/track';
import { Car } from '../../src/game/models/car';
import { GameState } from '../../src/game/models/game-state';
import { Camera } from '../../src/game/types';

/**
 * Creates a simple rectangular test track
 */
export function createSimpleTestTrack(width: number = 20): Track {
    const trackJSON: TrackJSON = {
        version: 1,
        width,
        points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
        ],
        smoothIterations: 1,
        sampleSpacing: 10
    };
    return Track.fromJSON(trackJSON);
}

/**
 * Creates a complex curved test track
 */
export function createComplexTestTrack(): Track {
    const trackJSON: TrackJSON = {
        version: 1,
        width: 25,
        points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 150, y: 50 },
            { x: 100, y: 100 },
            { x: 50, y: 150 },
            { x: 0, y: 100 },
            { x: -50, y: 50 }
        ],
        smoothIterations: 3,
        sampleSpacing: 5
    };
    return Track.fromJSON(trackJSON);
}

/**
 * Creates a test car with specified properties
 */
export function createTestCar(
    sProg: number = 0,
    color: string = '#test',
    options: Partial<{
        vProg: number;
        r: number;
        sPhys: number;
        vPhys: number;
        lateral: number;
        lapCount: number;
        carLength: number;
        carWidth: number;
    }> = {}
): Car {
    const car = new Car(
        sProg,
        color,
        options.carLength || 40,
        options.carWidth || 22
    );

    if (options.vProg !== undefined) car.vProg = options.vProg;
    if (options.r !== undefined) car.r = options.r;
    if (options.sPhys !== undefined) car.sPhys = options.sPhys;
    if (options.vPhys !== undefined) car.vPhys = options.vPhys;
    if (options.lateral !== undefined) car.lateral = options.lateral;
    if (options.lapCount !== undefined) car.lapCount = options.lapCount;

    return car;
}

/**
 * Creates a test GameState with specified number of cars
 */
export function createTestGameState(
    numAiCars: number = 2,
    trackType: 'simple' | 'complex' = 'simple'
): GameState {
    const track = trackType === 'simple' ? createSimpleTestTrack() : createComplexTestTrack();
    const camera: Camera = { pos: { x: 50, y: 50 }, zoom: 1.0 };
    const gameState = new GameState(camera, track);

    // Add player car
    const playerCar = createTestCar(0, '#00ff00', { vProg: 60, r: 10 });
    gameState.addPlayerCar(playerCar);

    // Add AI cars
    for (let i = 0; i < numAiCars; i++) {
        const aiCar = createTestCar(
            -(i + 1) * 50,
            `#ff${(i * 50).toString(16).padStart(4, '0')}`,
            { vProg: 55 - i * 5, lapCount: i }
        );
        gameState.addCar(aiCar);
    }

    return gameState;
}

/**
 * Asserts that two Vec2 objects are approximately equal
 */
export function expectVec2ToBeCloseTo(
    actual: { x: number; y: number },
    expected: { x: number; y: number },
    precision: number = 5
) {
    expect(actual.x).toBeCloseTo(expected.x, precision);
    expect(actual.y).toBeCloseTo(expected.y, precision);
}

/**
 * Asserts that two arrays of numbers are approximately equal
 */
export function expectArrayToBeCloseTo(
    actual: number[],
    expected: number[],
    precision: number = 5
) {
    expect(actual).toHaveLength(expected.length);
    for (let i = 0; i < actual.length; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], precision);
    }
}

/**
 * Creates a mock localStorage implementation for testing
 */
export function createMockLocalStorage() {
    const store: { [key: string]: string } = {};

    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach(key => delete store[key]);
        }),
        length: 0,
        key: jest.fn((index: number) => Object.keys(store)[index] || null),
        _store: store // For test inspection
    };
}

/**
 * Validates that a serialized object has all required properties
 */
export function validateSerializedCar(serialized: any) {
    const requiredProps = [
        'sProg', 'vProg', 'r', 'sPhys', 'vPhys', 'lateral',
        'color', 'carLength', 'carWidth', 'lapCount', 'lastSProg', 'crossedFinish'
    ];

    requiredProps.forEach(prop => {
        expect(serialized).toHaveProperty(prop);
    });
}

/**
 * Validates that a serialized track has all required properties
 */
export function validateSerializedTrack(serialized: any) {
    const requiredProps = ['width', 'samples', 'sTable', 'totalLength'];

    requiredProps.forEach(prop => {
        expect(serialized).toHaveProperty(prop);
    });

    expect(Array.isArray(serialized.samples)).toBe(true);
    expect(Array.isArray(serialized.sTable)).toBe(true);
    expect(serialized.samples.length).toBeGreaterThan(0);
    expect(serialized.sTable).toHaveLength(serialized.samples.length);
}

/**
 * Validates that a serialized game state has all required properties
 */
export function validateSerializedGameState(serialized: any) {
    const requiredProps = ['version', 'timestamp', 'camera', 'track', 'cars', 'playerCarIndex'];

    requiredProps.forEach(prop => {
        expect(serialized).toHaveProperty(prop);
    });

    expect(Array.isArray(serialized.cars)).toBe(true);
    expect(typeof serialized.playerCarIndex).toBe('number');
    expect(serialized.playerCarIndex).toBeGreaterThanOrEqual(0);
    expect(serialized.playerCarIndex).toBeLessThan(serialized.cars.length);

    validateSerializedTrack(serialized.track);
    serialized.cars.forEach(validateSerializedCar);
}
