/**
 * Unit tests for GameState serialization and localStorage functions
 */

import {
    serializeGameState,
    deserializeGameState,
    saveGameToLocalStorage,
    loadGameFromLocalStorage,
    hasSavedGame,
    deleteSavedGame,
    listSaveSlots
} from '../../src/serialization/game';
import { GameState } from '../../src/game/models/game-state';
import { Car } from '../../src/game/models/car';
import { Track, TrackJSON } from '../../src/game/models/track';
import { Camera } from '../../src/game/types';
import { RaceController } from '../../src/game/controllers/RaceController';

describe('GameState Serialization', () => {
    const createTestGameState = (): GameState => {
        const trackJSON: TrackJSON = {
            version: 1,
            width: 20,
            points: [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 100 },
                { x: 0, y: 100 }
            ],
            smoothIterations: 1,
            sampleSpacing: 10
        };
        const track = Track.fromJSON(trackJSON);

        const camera: Camera = { pos: { x: 50, y: 50 }, zoom: 1.5 };
        const gameState = new GameState(camera, track);

        const playerCar = new Car(0, '#00ff00', 40, 22);
        playerCar.vProg = 60;
        playerCar.r = 10;

        const aiCar1 = new Car(-50, '#ff0000', 35, 20);
        aiCar1.vProg = 55;
        aiCar1.lapCount = 1;

        const aiCar2 = new Car(-100, '#0000ff', 45, 25);
        aiCar2.vProg = 50;
        aiCar2.lateral = 5;

        gameState.addPlayerCar(playerCar);
        gameState.addCar(aiCar1);
        gameState.addCar(aiCar2);

        return gameState;
    };

    describe('serializeGameState', () => {
        it('should serialize complete game state to JSON string', () => {
            const gameState = createTestGameState();

            const jsonString = serializeGameState(gameState);

            expect(typeof jsonString).toBe('string');
            expect(() => JSON.parse(jsonString)).not.toThrow();

            const parsed = JSON.parse(jsonString);
            expect(parsed).toHaveProperty('version');
            expect(parsed).toHaveProperty('timestamp');
            expect(parsed).toHaveProperty('camera');
            expect(parsed).toHaveProperty('track');
            expect(parsed).toHaveProperty('cars');
            expect(parsed).toHaveProperty('playerCarIndex');
        });

        it('should include all camera properties', () => {
            const gameState = createTestGameState();
            gameState.updateCamera({ pos: { x: 123, y: 456 }, zoom: 2.5 });

            const jsonString = serializeGameState(gameState);
            const parsed = JSON.parse(jsonString);

            expect(parsed.camera).toEqual({
                pos: { x: 123, y: 456 },
                zoom: 2.5
            });
        });

        it('should serialize all cars with correct player index', () => {
            const gameState = createTestGameState();

            const jsonString = serializeGameState(gameState);
            const parsed = JSON.parse(jsonString);

            expect(parsed.cars).toHaveLength(3);
            expect(parsed.playerCarIndex).toBe(0); // Player car was added first

            parsed.cars.forEach((car: any) => {
                expect(car).toHaveProperty('sProg');
                expect(car).toHaveProperty('vProg');
                expect(car).toHaveProperty('r');
                expect(car).toHaveProperty('color');
                expect(car).toHaveProperty('lapCount');
            });
        });

        it('should serialize track data completely', () => {
            const gameState = createTestGameState();

            const jsonString = serializeGameState(gameState);
            const parsed = JSON.parse(jsonString);

            expect(parsed.track).toHaveProperty('width');
            expect(parsed.track).toHaveProperty('samples');
            expect(parsed.track).toHaveProperty('sTable');
            expect(parsed.track).toHaveProperty('totalLength');

            expect(Array.isArray(parsed.track.samples)).toBe(true);
            expect(Array.isArray(parsed.track.sTable)).toBe(true);
            expect(parsed.track.samples.length).toBeGreaterThan(0);
        });

        it('should include version and timestamp', () => {
            const gameState = createTestGameState();
            const beforeTime = Date.now();

            const jsonString = serializeGameState(gameState);
            const parsed = JSON.parse(jsonString);
            const afterTime = Date.now();

            expect(parsed.version).toBe('1.0.0');
            expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(parsed.timestamp).toBeLessThanOrEqual(afterTime);
        });
    });

    describe('deserializeGameState', () => {
        it('should deserialize complete game state from JSON string', () => {
            const originalGameState = createTestGameState();
            const jsonString = serializeGameState(originalGameState);

            const deserializedGameState = deserializeGameState(jsonString);

            expect(deserializedGameState).toBeInstanceOf(GameState);
            expect(deserializedGameState.getCars()).toHaveLength(3);
            expect(deserializedGameState.track.width).toBe(originalGameState.track.width);
            expect(deserializedGameState.camera.zoom).toBe(originalGameState.camera.zoom);
        });

        it('should preserve player car identity', () => {
            const originalGameState = createTestGameState();
            const originalPlayerCar = originalGameState.playerCar;
            const jsonString = serializeGameState(originalGameState);

            const deserializedGameState = deserializeGameState(jsonString);
            const deserializedPlayerCar = deserializedGameState.playerCar;

            expect(deserializedPlayerCar.color).toBe(originalPlayerCar.color);
            expect(deserializedPlayerCar.sProg).toBe(originalPlayerCar.sProg);
            expect(deserializedPlayerCar.vProg).toBe(originalPlayerCar.vProg);
        });

        it('should preserve AI cars correctly', () => {
            const originalGameState = createTestGameState();
            const originalAiCars = originalGameState.aiCars;
            const jsonString = serializeGameState(originalGameState);

            const deserializedGameState = deserializeGameState(jsonString);
            const deserializedAiCars = deserializedGameState.aiCars;

            expect(deserializedAiCars).toHaveLength(originalAiCars.length);

            for (let i = 0; i < originalAiCars.length; i++) {
                expect(deserializedAiCars[i].color).toBe(originalAiCars[i].color);
                expect(deserializedAiCars[i].sProg).toBe(originalAiCars[i].sProg);
                expect(deserializedAiCars[i].lapCount).toBe(originalAiCars[i].lapCount);
            }
        });

        it('should throw error for unsupported version', () => {
            const invalidJson = JSON.stringify({
                version: '2.0.0',
                timestamp: Date.now(),
                camera: { pos: { x: 0, y: 0 }, zoom: 1 },
                track: { width: 20, samples: [], sTable: [], totalLength: 0 },
                cars: [],
                playerCarIndex: 0
            });

            expect(() => deserializeGameState(invalidJson)).toThrow('Unsupported save file version: 2.0.0');
        });

        it('should handle malformed JSON gracefully', () => {
            const malformedJson = '{ invalid json }';

            expect(() => deserializeGameState(malformedJson)).toThrow();
        });
    });

    describe('Serialization Round-trip', () => {
        it('should maintain complete data integrity', () => {
            const originalGameState = createTestGameState();

            originalGameState.updateCamera({ pos: { x: 200, y: 300 }, zoom: 0.8 });

            originalGameState.playerCar.r += 50;

            const jsonString = serializeGameState(originalGameState);
            const deserializedGameState = deserializeGameState(jsonString);
            const reSerializedString = serializeGameState(deserializedGameState);

            const original = JSON.parse(jsonString);
            const reSerialized = JSON.parse(reSerializedString);

            expect(reSerialized.version).toBe(original.version);
            expect(reSerialized.camera).toEqual(original.camera);
            expect(reSerialized.track).toEqual(original.track);
            expect(reSerialized.cars).toEqual(original.cars);
            expect(reSerialized.playerCarIndex).toBe(original.playerCarIndex);
        });

        it('should preserve game functionality after round-trip', () => {
            const originalGameState = createTestGameState();
            const jsonString = serializeGameState(originalGameState);
            const deserializedGameState = deserializeGameState(jsonString);

            const deserializedPlayerCar = deserializedGameState.playerCar;

            const originalReward = deserializedPlayerCar.r;
            deserializedPlayerCar.r += 25;

            deserializedGameState.updateCamera({ pos: { x: 100, y: 100 }, zoom: 2.0 });

            expect(deserializedPlayerCar.r).toBe(originalReward + 25);
            expect(deserializedGameState.camera.pos.x).toBe(100);
            expect(deserializedGameState.camera.zoom).toBe(2.0);
        });

        it('should work with RaceController reward system', () => {
            const trackJSON: TrackJSON = {
                version: 1,
                width: 20,
                points: [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    { x: 100, y: 100 },
                    { x: 0, y: 100 }
                ]
            };
            const track = Track.fromJSON(trackJSON);
            const raceController = new RaceController(track);

            raceController.queueReward(raceController.getGameState().playerCar, 100);
            raceController.queueRewardByIndex(1, 50); // AI car

            raceController.step(1 / 60);

            const jsonString = raceController.saveToString();
            const loadedController = RaceController.loadFromString(jsonString);

            const originalPlayerReward = raceController.getGameState().playerCar.r;
            const loadedPlayerReward = loadedController.getGameState().playerCar.r;

            expect(loadedPlayerReward).toBeCloseTo(originalPlayerReward, 5);
            expect(loadedController.getGameState().getCars()).toHaveLength(4); // 1 player + 3 AI
        });
    });

    describe('localStorage Integration', () => {
        beforeEach(() => {
            (global as any).testUtils.localStorage.getItem.mockClear();
            (global as any).testUtils.localStorage.setItem.mockClear();
            (global as any).testUtils.localStorage.removeItem.mockClear();
            (global as any).testUtils.localStorage.key.mockClear();
        });

        describe('saveGameToLocalStorage', () => {
            it('should save game state to localStorage', () => {
                const gameState = createTestGameState();
                const mockSetItem = (global as any).testUtils.localStorage.setItem;

                saveGameToLocalStorage(gameState, 'test-slot');

                expect(mockSetItem).toHaveBeenCalledWith(
                    'formulafun_save_test-slot',
                    expect.any(String)
                );

                const savedData = mockSetItem.mock.calls[0][1];
                expect(() => JSON.parse(savedData)).not.toThrow();
            });

            it('should use default slot name when not provided', () => {
                const gameState = createTestGameState();
                const mockSetItem = (global as any).testUtils.localStorage.setItem;

                saveGameToLocalStorage(gameState);

                expect(mockSetItem).toHaveBeenCalledWith(
                    'formulafun_save_default',
                    expect.any(String)
                );
            });

            it('should handle localStorage errors gracefully', () => {
                const gameState = createTestGameState();
                const mockSetItem = (global as any).testUtils.localStorage.setItem;
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

                mockSetItem.mockImplementation(() => {
                    throw new Error('Storage quota exceeded');
                });

                expect(() => saveGameToLocalStorage(gameState, 'test')).not.toThrow();
                expect(consoleSpy).toHaveBeenCalledWith('Failed to save game state:', expect.any(Error));

                consoleSpy.mockRestore();
            });
        });

        describe('loadGameFromLocalStorage', () => {
            it('should load game state from localStorage', () => {
                const originalGameState = createTestGameState();
                const serializedData = serializeGameState(originalGameState);
                const mockGetItem = (global as any).testUtils.localStorage.getItem;
                mockGetItem.mockReturnValue(serializedData);

                const loadedGameState = loadGameFromLocalStorage('test-slot');

                expect(mockGetItem).toHaveBeenCalledWith('formulafun_save_test-slot');
                expect(loadedGameState).toBeInstanceOf(GameState);
                expect(loadedGameState!.getCars()).toHaveLength(3);
            });

            it('should return null when no saved game exists', () => {
                const mockGetItem = (global as any).testUtils.localStorage.getItem;
                mockGetItem.mockReturnValue(null);

                const loadedGameState = loadGameFromLocalStorage('nonexistent');

                expect(loadedGameState).toBeNull();
            });

            it('should handle corrupted save data gracefully', () => {
                const mockGetItem = (global as any).testUtils.localStorage.getItem;
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

                mockGetItem.mockReturnValue('corrupted data');

                const loadedGameState = loadGameFromLocalStorage('corrupted');

                expect(loadedGameState).toBeNull();
                expect(consoleSpy).toHaveBeenCalledWith('Failed to load game state:', expect.any(SyntaxError));

                consoleSpy.mockRestore();
            });
        });

        describe('hasSavedGame', () => {
            it('should return true when saved game exists', () => {
                const mockGetItem = (global as any).testUtils.localStorage.getItem;
                mockGetItem.mockReturnValue('some data');

                const exists = hasSavedGame('test-slot');

                expect(exists).toBe(true);
                expect(mockGetItem).toHaveBeenCalledWith('formulafun_save_test-slot');
            });

            it('should return false when no saved game exists', () => {
                const mockGetItem = (global as any).testUtils.localStorage.getItem;
                mockGetItem.mockReturnValue(null);

                const exists = hasSavedGame('test-slot');

                expect(exists).toBe(false);
            });
        });

        describe('deleteSavedGame', () => {
            it('should remove saved game from localStorage', () => {
                const mockRemoveItem = (global as any).testUtils.localStorage.removeItem;

                deleteSavedGame('test-slot');

                expect(mockRemoveItem).toHaveBeenCalledWith('formulafun_save_test-slot');
            });

            it('should handle removal errors gracefully', () => {
                const mockRemoveItem = (global as any).testUtils.localStorage.removeItem;
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

                mockRemoveItem.mockImplementation(() => {
                    throw new Error('Access denied');
                });

                expect(() => deleteSavedGame('test-slot')).not.toThrow();
                expect(consoleSpy).toHaveBeenCalledWith('Failed to delete game state:', expect.any(Error));

                consoleSpy.mockRestore();
            });
        });

        describe('listSaveSlots', () => {
            it('should return list of save slot names', () => {
                const mockKey = (global as any).testUtils.localStorage.key;
                const keys = [
                    'formulafun_save_slot1',
                    'formulafun_save_slot2',
                    'other_app_data',
                    'formulafun_save_default',
                    'more_other_data'
                ];

                Object.defineProperty((global as any).testUtils.localStorage, 'length', {
                    value: keys.length,
                    writable: true
                });

                mockKey.mockImplementation((index: number) => {
                    return keys[index] || null;
                });

                const slots = listSaveSlots();

                expect(slots).toEqual(['slot1', 'slot2', 'default']);
                expect(slots).toHaveLength(3);
            });

            it('should return empty array when no saves exist', () => {
                Object.defineProperty((global as any).testUtils.localStorage, 'length', {
                    value: 0,
                    writable: true
                });
                const slots = listSaveSlots();

                expect(slots).toEqual([]);
            });
        });
    });
});
