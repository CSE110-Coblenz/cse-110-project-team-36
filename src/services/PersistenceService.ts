import type { GameState } from '../game/models/game-state';
import type { QuestionConfig } from '../game/managers/QuestionManager';
import type { RaceConfig } from '../config/types';
import { serializeGameState, deserializeGameState } from '../serialization/game';
import type { StorageService } from './adapters/StorageService';
import { RaceControllerFactory } from '../game/factories/RaceControllerFactory';
import { RaceController } from '../game/controllers/RaceController';

/**
 * Service for persisting and loading game state
 * Abstracts storage operations from controllers
 */
export class PersistenceService {
    private readonly SAVE_PREFIX = 'formulafun_save_';

    constructor(private storageService: StorageService) {}

    /**
     * Serialize game state to JSON string
     *
     * @param gameState - The game state to serialize
     * @returns JSON string representation of the game state
     */
    serializeGameState(gameState: GameState): string {
        return serializeGameState(gameState);
    }

    /**
     * Deserialize game state from JSON string
     *
     * @param jsonString - JSON string representation of the game state
     * @returns Deserialized game state
     */
    deserializeGameState(jsonString: string): GameState {
        return deserializeGameState(jsonString);
    }

    /**
     * Save game state to storage
     *
     * @param gameState - The game state to save
     * @param slotName - The name of the save slot (default: 'default')
     */
    saveGame(gameState: GameState, slotName: string = 'default'): void {
        try {
            const serialized = this.serializeGameState(gameState);
            this.storageService.setItem(
                `${this.SAVE_PREFIX}${slotName}`,
                serialized,
            );
        } catch (error) {
            console.error('Failed to save game state:', error);
        }
    }

    /**
     * Load game state from storage
     *
     * @param slotName - The name of the save slot (default: 'default')
     * @returns The loaded game state, or null if no save exists
     */
    loadGame(slotName: string = 'default'): GameState | null {
        const serialized = this.storageService.getItem(
            `${this.SAVE_PREFIX}${slotName}`,
        );
        if (!serialized) {
            return null;
        }

        try {
            return this.deserializeGameState(serialized);
        } catch (error) {
            console.error('Failed to load game state:', error);
            return null;
        }
    }

    /**
     * Check if a save exists
     *
     * @param slotName - The name of the save slot (default: 'default')
     * @returns True if a save exists, false otherwise
     */
    hasSave(slotName: string = 'default'): boolean {
        return (
            this.storageService.getItem(`${this.SAVE_PREFIX}${slotName}`) !==
            null
        );
    }

    /**
     * Delete a save
     *
     * @param slotName - The name of the save slot (default: 'default')
     */
    deleteSave(slotName: string = 'default'): void {
        try {
            this.storageService.removeItem(`${this.SAVE_PREFIX}${slotName}`);
        } catch (error) {
            console.error('Failed to delete game state:', error);
        }
    }

    /**
     * List all available save slots
     *
     * @returns Array of save slot names
     */
    listSaveSlots(): string[] {
        const slots: string[] = [];
        for (let i = 0; i < this.storageService.length; i++) {
            const key = this.storageService.key(i);
            if (key && key.startsWith(this.SAVE_PREFIX)) {
                slots.push(key.replace(this.SAVE_PREFIX, ''));
            }
        }
        return slots;
    }

    /**
     * Create a RaceController from a saved game
     *
     * @param slotName - The name of the save slot (default: 'default')
     * @param questionConfig - Configuration for question generation
     * @param raceConfig - Race configuration (includes physics config)
     * @returns A new RaceController with the loaded state, or null if no save exists
     */
    loadRaceController(
        slotName: string,
        questionConfig: QuestionConfig,
        raceConfig: RaceConfig,
    ): RaceController | null {
        const gameState = this.loadGame(slotName);
        if (!gameState) {
            return null;
        }
        return RaceControllerFactory.createFromGameState(
            gameState,
            questionConfig,
            raceConfig,
        );
    }

    /**
     * Create a RaceController from a JSON string
     *
     * @param jsonString - JSON string representation of the game state
     * @param questionConfig - Configuration for question generation
     * @param raceConfig - Race configuration (includes physics config)
     * @returns A new RaceController with the loaded state
     */
    loadRaceControllerFromString(
        jsonString: string,
        questionConfig: QuestionConfig,
        raceConfig: RaceConfig,
    ): RaceController {
        const gameState = this.deserializeGameState(jsonString);
        return RaceControllerFactory.createFromGameState(
            gameState,
            questionConfig,
            raceConfig,
        );
    }
}

