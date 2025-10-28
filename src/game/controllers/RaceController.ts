import { GameState } from "../models/game-state";
import { Track } from "../models/track";
import { Car } from "../models/car";
import { CarController } from "./CarController";
import { 
    serializeGameState, 
    deserializeGameState, 
    saveGameToLocalStorage, 
    loadGameFromLocalStorage,
    hasSavedGame,
    deleteSavedGame,
    listSaveSlots
} from "../../serialization/game";

/**
 * Race controller class
 * 
 * This class is responsible for updating the game state and the car controller.
 */
export class RaceController {
    private gameState: GameState;
    private carController: CarController;

    /**
     * Constructor
     * 
     * @param track - The track to initialize the race controller on
     */
    constructor(track: Track) {
        const camera = { pos: { x: 0, y: 0 }, zoom: 1 };
        this.gameState = new GameState(camera, track);
        this.gameState.addPlayerCar(new Car(0, '#22c55e'));
        this.gameState.addCar(new Car(-100, '#ef4444'));
        this.gameState.addCar(new Car(-200, '#ef4444'));
        this.gameState.addCar(new Car(-300, '#ef4444'));
        this.carController = new CarController(this.gameState);
        this.carController.initializeCars();
    }

    /**
     * Create a RaceController from a saved game state
     * 
     * @param gameState - The saved game state
     * @returns A new RaceController with the loaded state
     */
    static fromGameState(gameState: GameState): RaceController {
        // Create a dummy track for the constructor, then replace with loaded state
        const dummyTrack = Track.fromJSON({ version: 1, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] });
        const controller = new RaceController(dummyTrack);
        
        // Replace with the loaded game state
        controller.gameState = gameState;
        controller.carController = new CarController(gameState);
        controller.carController.initializeCars();
        
        return controller;
    }

    /**
     * Step the race controller
     * 
     * @param dt - The time step in seconds
     */
    step(dt: number) {
        this.carController.step(dt);
        const pos = this.gameState.track.posAt(this.gameState.playerCar.sPhys);
        this.gameState.updateCamera({ pos, zoom: this.gameState.camera.zoom });
    }

    /**
     * Get the game state
     * 
     * @returns The game state
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * Queue a reward for a car
     * 
     * @param car - The car to queue the reward for
     * @param magnitude - The magnitude of the reward
     */
    queueReward(car: Car, magnitude: number) {
        this.carController.queueReward(car, magnitude);
    }

    /**
     * Queue a reward for a car by index
     * 
     * @param index - The index of the car to queue the reward for
     * @param magnitude - The magnitude of the reward
     */
    queueRewardByIndex(index: number, magnitude: number) {
        this.carController.queueRewardByIndex(index, magnitude);
    }

    /**
     * Serialize the current game state to a JSON string
     * 
     * @returns The serialized game state as JSON string
     */
    saveToString(): string {
        return serializeGameState(this.gameState);
    }

    /**
     * Load game state from a JSON string
     * 
     * @param jsonString - The serialized game state
     * @returns A new RaceController with the loaded state
     */
    static loadFromString(jsonString: string): RaceController {
        const gameState = deserializeGameState(jsonString);
        return RaceController.fromGameState(gameState);
    }

    /**
     * Save the current game state to localStorage
     * 
     * @param slotName - The name of the save slot (default: 'default')
     */
    saveToLocalStorage(slotName: string = 'default'): void {
        saveGameToLocalStorage(this.gameState, slotName);
    }

    /**
     * Load game state from localStorage
     * 
     * @param slotName - The name of the save slot (default: 'default')
     * @returns A new RaceController with the loaded state, or null if no save exists
     */
    static loadFromLocalStorage(slotName: string = 'default'): RaceController | null {
        const gameState = loadGameFromLocalStorage(slotName);
        if (!gameState) {
            return null;
        }
        return RaceController.fromGameState(gameState);
    }

    /**
     * Check if a save exists in localStorage
     * 
     * @param slotName - The name of the save slot (default: 'default')
     * @returns True if a save exists, false otherwise
     */
    static hasSavedGame(slotName: string = 'default'): boolean {
        return hasSavedGame(slotName);
    }

    /**
     * Delete a save from localStorage
     * 
     * @param slotName - The name of the save slot (default: 'default')
     */
    static deleteSavedGame(slotName: string = 'default'): void {
        deleteSavedGame(slotName);
    }

    /**
     * List all available save slots
     * 
     * @returns Array of save slot names
     */
    static listSaveSlots(): string[] {
        return listSaveSlots();
    }
}
