/**
 * Unit tests for GameState serialization functions
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
  // Helper function to create a test GameState
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
    
    // Add some cars
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
      // Arrange
      const gameState = createTestGameState();

      // Act
      const jsonString = serializeGameState(gameState);

      // Assert
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
      // Arrange
      const gameState = createTestGameState();
      gameState.updateCamera({ pos: { x: 123, y: 456 }, zoom: 2.5 });

      // Act
      const jsonString = serializeGameState(gameState);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(parsed.camera).toEqual({
        pos: { x: 123, y: 456 },
        zoom: 2.5
      });
    });

    it('should serialize all cars with correct player index', () => {
      // Arrange
      const gameState = createTestGameState();

      // Act
      const jsonString = serializeGameState(gameState);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(parsed.cars).toHaveLength(3);
      expect(parsed.playerCarIndex).toBe(0); // Player car was added first
      
      // Check that cars have all required properties
      parsed.cars.forEach((car: any) => {
        expect(car).toHaveProperty('sProg');
        expect(car).toHaveProperty('vProg');
        expect(car).toHaveProperty('r');
        expect(car).toHaveProperty('color');
        expect(car).toHaveProperty('lapCount');
      });
    });

    it('should serialize track data completely', () => {
      // Arrange
      const gameState = createTestGameState();

      // Act
      const jsonString = serializeGameState(gameState);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(parsed.track).toHaveProperty('width');
      expect(parsed.track).toHaveProperty('samples');
      expect(parsed.track).toHaveProperty('sTable');
      expect(parsed.track).toHaveProperty('totalLength');
      
      expect(Array.isArray(parsed.track.samples)).toBe(true);
      expect(Array.isArray(parsed.track.sTable)).toBe(true);
      expect(parsed.track.samples.length).toBeGreaterThan(0);
    });

    it('should include version and timestamp', () => {
      // Arrange
      const gameState = createTestGameState();
      const beforeTime = Date.now();

      // Act
      const jsonString = serializeGameState(gameState);
      const parsed = JSON.parse(jsonString);
      const afterTime = Date.now();

      // Assert
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(parsed.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('deserializeGameState', () => {
    it('should deserialize complete game state from JSON string', () => {
      // Arrange
      const originalGameState = createTestGameState();
      const jsonString = serializeGameState(originalGameState);

      // Act
      const deserializedGameState = deserializeGameState(jsonString);

      // Assert
      expect(deserializedGameState).toBeInstanceOf(GameState);
      expect(deserializedGameState.getCars()).toHaveLength(3);
      expect(deserializedGameState.track.width).toBe(originalGameState.track.width);
      expect(deserializedGameState.camera.zoom).toBe(originalGameState.camera.zoom);
    });

    it('should preserve player car identity', () => {
      // Arrange
      const originalGameState = createTestGameState();
      const originalPlayerCar = originalGameState.playerCar;
      const jsonString = serializeGameState(originalGameState);

      // Act
      const deserializedGameState = deserializeGameState(jsonString);
      const deserializedPlayerCar = deserializedGameState.playerCar;

      // Assert
      expect(deserializedPlayerCar.color).toBe(originalPlayerCar.color);
      expect(deserializedPlayerCar.sProg).toBe(originalPlayerCar.sProg);
      expect(deserializedPlayerCar.vProg).toBe(originalPlayerCar.vProg);
    });

    it('should preserve AI cars correctly', () => {
      // Arrange
      const originalGameState = createTestGameState();
      const originalAiCars = originalGameState.aiCars;
      const jsonString = serializeGameState(originalGameState);

      // Act
      const deserializedGameState = deserializeGameState(jsonString);
      const deserializedAiCars = deserializedGameState.aiCars;

      // Assert
      expect(deserializedAiCars).toHaveLength(originalAiCars.length);
      
      for (let i = 0; i < originalAiCars.length; i++) {
        expect(deserializedAiCars[i].color).toBe(originalAiCars[i].color);
        expect(deserializedAiCars[i].sProg).toBe(originalAiCars[i].sProg);
        expect(deserializedAiCars[i].lapCount).toBe(originalAiCars[i].lapCount);
      }
    });

    it('should throw error for unsupported version', () => {
      // Arrange
      const invalidJson = JSON.stringify({
        version: '2.0.0',
        timestamp: Date.now(),
        camera: { pos: { x: 0, y: 0 }, zoom: 1 },
        track: { width: 20, samples: [], sTable: [], totalLength: 0 },
        cars: [],
        playerCarIndex: 0
      });

      // Act & Assert
      expect(() => deserializeGameState(invalidJson)).toThrow('Unsupported save file version: 2.0.0');
    });

    it('should handle malformed JSON gracefully', () => {
      // Arrange
      const malformedJson = '{ invalid json }';

      // Act & Assert
      expect(() => deserializeGameState(malformedJson)).toThrow();
    });
  });

  describe('Serialization Round-trip', () => {
    it('should maintain complete data integrity', () => {
      // Arrange
      const originalGameState = createTestGameState();
      
      // Modify some state to make it more interesting
      originalGameState.updateCamera({ pos: { x: 200, y: 300 }, zoom: 0.8 });
      
      // Apply reward directly to car (simulating what queueReward would do after processing)
      originalGameState.playerCar.r += 50;

      // Act
      const jsonString = serializeGameState(originalGameState);
      const deserializedGameState = deserializeGameState(jsonString);
      const reSerializedString = serializeGameState(deserializedGameState);

      // Parse both for comparison (timestamps will differ)
      const original = JSON.parse(jsonString);
      const reSerialized = JSON.parse(reSerializedString);

      // Assert - compare everything except timestamp
      expect(reSerialized.version).toBe(original.version);
      expect(reSerialized.camera).toEqual(original.camera);
      expect(reSerialized.track).toEqual(original.track);
      expect(reSerialized.cars).toEqual(original.cars);
      expect(reSerialized.playerCarIndex).toBe(original.playerCarIndex);
    });

    it('should preserve game functionality after round-trip', () => {
      // Arrange
      const originalGameState = createTestGameState();
      const jsonString = serializeGameState(originalGameState);
      const deserializedGameState = deserializeGameState(jsonString);

      // Act - test that game state methods still work
      const deserializedPlayerCar = deserializedGameState.playerCar;

      // Test reward application (simulate what queueReward would do)
      const originalReward = deserializedPlayerCar.r;
      deserializedPlayerCar.r += 25;
      
      // Test camera update
      deserializedGameState.updateCamera({ pos: { x: 100, y: 100 }, zoom: 2.0 });

      // Assert
      expect(deserializedPlayerCar.r).toBe(originalReward + 25);
      expect(deserializedGameState.camera.pos.x).toBe(100);
      expect(deserializedGameState.camera.zoom).toBe(2.0);
    });

    it('should work with RaceController reward system', () => {
      // Arrange - create a RaceController with a simple track
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
      
      // Apply rewards using the proper queueReward system
      raceController.queueReward(raceController.getGameState().playerCar, 100);
      raceController.queueRewardByIndex(1, 50); // AI car
      
      // Process one step to apply queued rewards
      raceController.step(1/60);
      
      // Act - serialize and deserialize
      const jsonString = raceController.saveToString();
      const loadedController = RaceController.loadFromString(jsonString);
      
      // Assert - rewards should be preserved
      const originalPlayerReward = raceController.getGameState().playerCar.r;
      const loadedPlayerReward = loadedController.getGameState().playerCar.r;
      
      expect(loadedPlayerReward).toBeCloseTo(originalPlayerReward, 5);
      expect(loadedController.getGameState().getCars()).toHaveLength(4); // 1 player + 3 AI
    });
  });

  describe('localStorage Integration', () => {
    beforeEach(() => {
      // Clear localStorage mock before each test
      (global as any).testUtils.localStorage.getItem.mockClear();
      (global as any).testUtils.localStorage.setItem.mockClear();
      (global as any).testUtils.localStorage.removeItem.mockClear();
      (global as any).testUtils.localStorage.key.mockClear();
    });

    describe('saveGameToLocalStorage', () => {
      it('should save game state to localStorage', () => {
        // Arrange
        const gameState = createTestGameState();
        const mockSetItem = (global as any).testUtils.localStorage.setItem;

        // Act
        saveGameToLocalStorage(gameState, 'test-slot');

        // Assert
        expect(mockSetItem).toHaveBeenCalledWith(
          'formulafun_save_test-slot',
          expect.any(String)
        );
        
        const savedData = mockSetItem.mock.calls[0][1];
        expect(() => JSON.parse(savedData)).not.toThrow();
      });

      it('should use default slot name when not provided', () => {
        // Arrange
        const gameState = createTestGameState();
        const mockSetItem = (global as any).testUtils.localStorage.setItem;

        // Act
        saveGameToLocalStorage(gameState);

        // Assert
        expect(mockSetItem).toHaveBeenCalledWith(
          'formulafun_save_default',
          expect.any(String)
        );
      });

      it('should handle localStorage errors gracefully', () => {
        // Arrange
        const gameState = createTestGameState();
        const mockSetItem = (global as any).testUtils.localStorage.setItem;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockSetItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        // Act & Assert - should not throw
        expect(() => saveGameToLocalStorage(gameState, 'test')).not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save game state:', expect.any(Error));
        
        consoleSpy.mockRestore();
      });
    });

    describe('loadGameFromLocalStorage', () => {
      it('should load game state from localStorage', () => {
        // Arrange
        const originalGameState = createTestGameState();
        const serializedData = serializeGameState(originalGameState);
        const mockGetItem = (global as any).testUtils.localStorage.getItem;
        mockGetItem.mockReturnValue(serializedData);

        // Act
        const loadedGameState = loadGameFromLocalStorage('test-slot');

        // Assert
        expect(mockGetItem).toHaveBeenCalledWith('formulafun_save_test-slot');
        expect(loadedGameState).toBeInstanceOf(GameState);
        expect(loadedGameState!.getCars()).toHaveLength(3);
      });

      it('should return null when no saved game exists', () => {
        // Arrange
        const mockGetItem = (global as any).testUtils.localStorage.getItem;
        mockGetItem.mockReturnValue(null);

        // Act
        const loadedGameState = loadGameFromLocalStorage('nonexistent');

        // Assert
        expect(loadedGameState).toBeNull();
      });

      it('should handle corrupted save data gracefully', () => {
        // Arrange
        const mockGetItem = (global as any).testUtils.localStorage.getItem;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockGetItem.mockReturnValue('corrupted data');

        // Act
        const loadedGameState = loadGameFromLocalStorage('corrupted');

        // Assert
        expect(loadedGameState).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load game state:', expect.any(SyntaxError));
        
        consoleSpy.mockRestore();
      });
    });

    describe('hasSavedGame', () => {
      it('should return true when saved game exists', () => {
        // Arrange
        const mockGetItem = (global as any).testUtils.localStorage.getItem;
        mockGetItem.mockReturnValue('some data');

        // Act
        const exists = hasSavedGame('test-slot');

        // Assert
        expect(exists).toBe(true);
        expect(mockGetItem).toHaveBeenCalledWith('formulafun_save_test-slot');
      });

      it('should return false when no saved game exists', () => {
        // Arrange
        const mockGetItem = (global as any).testUtils.localStorage.getItem;
        mockGetItem.mockReturnValue(null);

        // Act
        const exists = hasSavedGame('test-slot');

        // Assert
        expect(exists).toBe(false);
      });
    });

    describe('deleteSavedGame', () => {
      it('should remove saved game from localStorage', () => {
        // Arrange
        const mockRemoveItem = (global as any).testUtils.localStorage.removeItem;

        // Act
        deleteSavedGame('test-slot');

        // Assert
        expect(mockRemoveItem).toHaveBeenCalledWith('formulafun_save_test-slot');
      });

      it('should handle removal errors gracefully', () => {
        // Arrange
        const mockRemoveItem = (global as any).testUtils.localStorage.removeItem;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockRemoveItem.mockImplementation(() => {
          throw new Error('Access denied');
        });

        // Act & Assert
        expect(() => deleteSavedGame('test-slot')).not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete game state:', expect.any(Error));
        
        consoleSpy.mockRestore();
      });
    });

    describe('listSaveSlots', () => {
      it('should return list of save slot names', () => {
        // Arrange
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

        // Act
        const slots = listSaveSlots();

        // Assert
        expect(slots).toEqual(['slot1', 'slot2', 'default']);
        expect(slots).toHaveLength(3);
      });

      it('should return empty array when no saves exist', () => {
        // Arrange
        Object.defineProperty((global as any).testUtils.localStorage, 'length', {
          value: 0,
          writable: true
        });

        // Act
        const slots = listSaveSlots();

        // Assert
        expect(slots).toEqual([]);
      });
    });
  });
});
