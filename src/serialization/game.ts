import type { GameState } from '../game/models/game-state';
import type { Car } from '../game/models/car';
import type { Track } from '../game/models/track';
import type { Camera } from '../game/types';
import { Track as TrackClass } from '../game/models/track';
import { Car as CarClass } from '../game/models/car';
import { GameState as GameStateClass } from '../game/models/game-state';

export interface SerializedCar {
    sProg: number;
    vProg: number;
    r: number;
    sPhys: number;
    vPhys: number;
    lateral: number;
    color: string;
    carLength: number;
    carWidth: number;
    lapCount: number;
    lastSProg: number;
    crossedFinish: boolean;
}

export interface SerializedTrack {
    width: number;
    samples: { x: number; y: number }[];
    sTable: number[];
    totalLength: number;
}

export interface SerializedGameState {
    version: string;
    timestamp: number;
    camera: Camera;
    track: SerializedTrack;
    cars: SerializedCar[];
    playerCarIndex: number;
}

/**
 * Serialize a car to a plain object
 */
function serializeCar(car: Car): SerializedCar {
    return car.toSerializedData();
}

/**
 * Deserialize a car from a plain object
 */
function deserializeCar(data: SerializedCar): Car {
    return CarClass.fromSerializedData(data);
}

/**
 * Serialize a track to a plain object
 */
function serializeTrack(track: Track): SerializedTrack {
    return track.toSerializedData();
}

/**
 * Deserialize a track from a plain object
 */
function deserializeTrack(data: SerializedTrack): Track {
    return TrackClass.fromSerializedData(data);
}

/**
 * Serialize the complete game state to a JSON string
 */
export function serializeGameState(gameState: GameState): string {
    const cars = gameState.getCars();
    const playerCar = gameState.playerCar;
    const playerCarIndex = cars.indexOf(playerCar);
    
    const serialized: SerializedGameState = {
        version: "1.0.0",
        timestamp: Date.now(),
        camera: {
            pos: { x: gameState.camera.pos.x, y: gameState.camera.pos.y },
            zoom: gameState.camera.zoom,
        },
        track: serializeTrack(gameState.track),
        cars: cars.map(car => serializeCar(car)),
        playerCarIndex: playerCarIndex,
    };
    
    return JSON.stringify(serialized, null, 2);
}

/**
 * Deserialize a complete game state from a JSON string
 */
export function deserializeGameState(jsonString: string): GameState {
    const data: SerializedGameState = JSON.parse(jsonString);
    
    // Validate version
    if (!data.version || data.version !== "1.0.0") {
        throw new Error(`Unsupported save file version: ${data.version}`);
    }
    
    // Reconstruct track
    const track = deserializeTrack(data.track);
    
    // Reconstruct cars
    const cars = data.cars.map(carData => deserializeCar(carData));
    
    // Create game state
    const gameState = new GameStateClass(data.camera, track);
    
    // Add cars in the correct order
    if (data.playerCarIndex >= 0 && data.playerCarIndex < cars.length) {
        // Add player car first
        gameState.addPlayerCar(cars[data.playerCarIndex]);
        
        // Add other cars
        cars.forEach((car, index) => {
            if (index !== data.playerCarIndex) {
                gameState.addCar(car);
            }
        });
    } else {
        // Fallback: add all cars, first one as player
        if (cars.length > 0) {
            gameState.addPlayerCar(cars[0]);
            cars.slice(1).forEach(car => gameState.addCar(car));
        }
    }
    
    return gameState;
}

/**
 * Save game state to localStorage
 */
export function saveGameToLocalStorage(gameState: GameState, slotName: string = 'default'): void {
    const serialized = serializeGameState(gameState);
    localStorage.setItem(`formulafun_save_${slotName}`, serialized);
}

/**
 * Load game state from localStorage
 */
export function loadGameFromLocalStorage(slotName: string = 'default'): GameState | null {
    const serialized = localStorage.getItem(`formulafun_save_${slotName}`);
    if (!serialized) {
        return null;
    }
    
    try {
        return deserializeGameState(serialized);
    } catch (error) {
        console.error('Failed to load game state:', error);
        return null;
    }
}

/**
 * Check if a save exists in localStorage
 */
export function hasSavedGame(slotName: string = 'default'): boolean {
    return localStorage.getItem(`formulafun_save_${slotName}`) !== null;
}

/**
 * Delete a save from localStorage
 */
export function deleteSavedGame(slotName: string = 'default'): void {
    localStorage.removeItem(`formulafun_save_${slotName}`);
}

/**
 * List all available save slots
 */
export function listSaveSlots(): string[] {
    const slots: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('formulafun_save_')) {
            slots.push(key.replace('formulafun_save_', ''));
        }
    }
    return slots;
}
