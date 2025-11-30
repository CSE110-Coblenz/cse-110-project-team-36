import type { GameState } from '../game/models/game-state';
import type { Car } from '../game/models/car';
import type { Camera } from '../game/types';
import { Track } from '../game/models/track';
import { UserCar } from '../game/models/user-car';
import { BotCar } from '../game/models/bot-car';
import { GameState as GameStateClass } from '../game/models/game-state';
import type { Difficulty } from '../game/config/types';

export interface SerializedCar {
    type: 'user' | 'bot';
    r: number;
    s: number;
    v: number;
    lateral: number;
    color: string;
    carLength: number;
    carWidth: number;
    laneIndex: number;
    targetLaneIndex: number | null;
    laneChangeStartTime: number | null;
    pendingLaneChanges: number;
    laneChangeStartOffset: number | null;
    laneChangeStartVelocity: number | null;
    lapCount: number;
    lastS: number;
    crossedFinish: boolean;
    // Bot-specific fields (only present for bot cars)
    difficulty?: number;
    gameDifficulty?: Difficulty | undefined;
    answerSpeed?: number;
    answerSpeedStdDev?: number;
    accuracy?: number;
    safetyTimeThreshold?: number;
    nextAnswerTime?: number;
}

export interface SerializedTrack {
    laneWidth: number;
    numLanes: number;
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
    const base = car.toSerializedData();
    if (car instanceof UserCar) {
        return { ...base, type: 'user' };
    } else if (car instanceof BotCar) {
        return {
            ...base,
            type: 'bot',
            difficulty: car.difficulty,
            gameDifficulty: car.gameDifficulty,
            answerSpeed: car.answerSpeed,
            answerSpeedStdDev: car.answerSpeedStdDev,
            accuracy: car.accuracy,
            safetyTimeThreshold: car.safetyTimeThreshold,
            nextAnswerTime: car.nextAnswerTime,
        };
    } else {
        // User car
        return { ...base, type: 'user' };
    }
}

/**
 * Deserialize a car from a plain object
 */
function deserializeCar(data: SerializedCar): Car {
    const baseData = {
        r: data.r,
        s: data.s,
        v: data.v,
        lateral: data.lateral,
        color: data.color,
        carLength: data.carLength,
        carWidth: data.carWidth,
        laneIndex: data.laneIndex,
        targetLaneIndex: data.targetLaneIndex,
        laneChangeStartTime: data.laneChangeStartTime,
        pendingLaneChanges: data.pendingLaneChanges,
        laneChangeStartOffset: data.laneChangeStartOffset,
        laneChangeStartVelocity: data.laneChangeStartVelocity,
        lapCount: data.lapCount,
        lastS: data.lastS,
        crossedFinish: data.crossedFinish,
    };

    if (data.type === 'bot' && data.difficulty !== undefined) {
        // For bot cars, we need the config to recreate them properly
        // Since we don't have access to config here, we'll create a minimal bot car
        // The config will need to be provided when loading from game state
        // Use zero stdDev to prevent regeneration of stats
        const botCar = new BotCar(
            data.s,
            data.color,
            data.carLength,
            data.carWidth,
            data.difficulty,
            data.gameDifficulty,
            {
                answerSpeedBase: data.answerSpeed || 2.0,
                answerSpeedStdDev: data.answerSpeedStdDev || 0.5,
                accuracyBase: data.accuracy || 0.7,
                accuracyStdDev: 0,
                safetyTimeBase: data.safetyTimeThreshold || 1.5,
                safetyTimeStdDev: 0,
            },
            data.laneIndex,
        );
        // Override with exact serialized values to preserve round-trip integrity
        botCar.answerSpeed = data.answerSpeed ?? botCar.answerSpeed;
        botCar.answerSpeedStdDev = data.answerSpeedStdDev ?? 0.5;
        botCar.accuracy = data.accuracy ?? botCar.accuracy;
        botCar.safetyTimeThreshold =
            data.safetyTimeThreshold ?? botCar.safetyTimeThreshold;
        botCar.nextAnswerTime = data.nextAnswerTime ?? Infinity;
        // Restore base state
        Object.assign(botCar, baseData);
        return botCar;
    } else {
        // User car
        return UserCar.fromSerializedData(baseData);
    }
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
    return Track.fromSerializedData(data);
}

/**
 * Serialize the complete game state to a JSON string
 */
export function serializeGameState(gameState: GameState): string {
    const cars = gameState.getCars();
    const playerCar = gameState.playerCar;
    const playerCarIndex = cars.indexOf(playerCar);

    const serialized: SerializedGameState = {
        version: '1.0.0',
        timestamp: Date.now(),
        camera: {
            pos: { x: gameState.camera.pos.x, y: gameState.camera.pos.y },
            zoom: gameState.camera.zoom,
            rotation: gameState.camera.rotation,
        },
        track: serializeTrack(gameState.track),
        cars: cars.map((car) => serializeCar(car)),
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
    if (!data.version || data.version !== '1.0.0') {
        throw new Error(`Unsupported save file version: ${data.version}`);
    }

    // Reconstruct track
    const track = deserializeTrack(data.track);

    // Reconstruct cars
    const cars = data.cars.map((carData) => deserializeCar(carData));

    // Reconstruct camera
    const camera: Camera = {
        pos: data.camera.pos,
        zoom: data.camera.zoom,
        rotation: data.camera.rotation,
    };

    const gameState = new GameStateClass(camera, track);
    gameState.addPlayerCar(cars[data.playerCarIndex]);

    cars.forEach((car, index) => {
        if (index !== data.playerCarIndex) {
            gameState.addCar(car as BotCar);
        }
    });

    return gameState;
}

/**
 * Save game state to localStorage
 */
export function saveGameToLocalStorage(
    gameState: GameState,
    slotName: string = 'default',
): void {
    try {
        const serialized = serializeGameState(gameState);
        localStorage.setItem(`formulafun_save_${slotName}`, serialized);
    } catch (error) {
        console.error('Failed to save game state:', error);
    }
}

/**
 * Load game state from localStorage
 */
export function loadGameFromLocalStorage(
    slotName: string = 'default',
): GameState | null {
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
    try {
        localStorage.removeItem(`formulafun_save_${slotName}`);
    } catch (error) {
        console.error('Failed to delete game state:', error);
    }
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
