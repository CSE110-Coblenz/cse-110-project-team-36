import { GameState } from '../models/game-state';
import { Car } from '../models/car';
import { CarController } from './CarController';
import { BotController } from './BotController';
import { CameraController } from './CameraController';
import { LaneController } from './LaneController';
import { CollisionController } from './CollisionController';
import { SlipController } from './SlipController';
import { QuestionManager } from '../managers/QuestionManager';
import type { QuestionConfig } from '../managers/QuestionManager';
import { QuestionStatsManager } from '../managers/QuestionStatsManager';
import { Question, QuestionOutcome } from '../models/question';
import { events } from '../../shared/events';
import { GameClock } from '../clock';
import { ListenerController } from './ListenerController';
import { QuestionController } from './QuestionController';
import { StreakController } from './StreakController';
import { updateUserStats } from '../../services/localStorage';
import type { RaceConfig } from '../config/types';
import { RaceControllerFactory } from '../factories/RaceControllerFactory';
import {
    serializeGameState,
    deserializeGameState,
    saveGameToLocalStorage,
    loadGameFromLocalStorage,
    hasSavedGame,
    deleteSavedGame,
    listSaveSlots,
} from '../../serialization/game';

/**
 * Race controller class
 *
 * This class is responsible for updating the game state and the car controller.
 * It also manages question generation, statistics tracking, and race metrics.
 */
export class RaceController {
    private gameState: GameState;
    private carController: CarController;
    private cameraController: CameraController;
    private laneController: LaneController;
    private collisionController: CollisionController;
    private slipController: SlipController;
    private botController: BotController;
    private questionManager: QuestionManager;
    private statsManager: QuestionStatsManager;
    private questionController: QuestionController;
    private streakController: StreakController;
    private elapsedMs: number = 0;
    private eventUnsubscribers: Array<() => void> = [];
    private isRunning: boolean = false;
    private clock: GameClock;
    private listenerController: ListenerController;
    private raceCompleted: boolean = false;

    /**
     * Constructor with dependency injection
     * This is the preferred constructor for creating RaceController instances.
     * Use RaceControllerFactory for normal usage.
     *
     * @param gameState - The game state
     * @param carController - Car controller
     * @param cameraController - Camera controller
     * @param laneController - Lane controller
     * @param collisionController - Collision controller
     * @param slipController - Slip controller
     * @param botController - Bot controller
     * @param questionManager - Question manager
     * @param statsManager - Stats manager
     * @param questionController - Question controller
     * @param streakController - Streak controller
     * @param listenerController - Listener controller
     * @param clock - Game clock
     */
    constructor(
        gameState: GameState,
        carController: CarController,
        cameraController: CameraController,
        laneController: LaneController,
        collisionController: CollisionController,
        slipController: SlipController,
        botController: BotController,
        questionManager: QuestionManager,
        statsManager: QuestionStatsManager,
        questionController: QuestionController,
        streakController: StreakController,
        listenerController: ListenerController,
        clock: GameClock,
    ) {
        this.gameState = gameState;
        this.carController = carController;
        this.cameraController = cameraController;
        this.laneController = laneController;
        this.collisionController = collisionController;
        this.slipController = slipController;
        this.botController = botController;
        this.questionManager = questionManager;
        this.statsManager = statsManager;
        this.questionController = questionController;
        this.streakController = streakController;
        this.listenerController = listenerController;
        this.clock = clock;

        this.initialize();
    }


    /**
     * Initialize event listeners and other setup
     * Called after all dependencies are injected
     */
    private initialize(): void {
        this.setupQuestionEventListeners();
    }

    /**
     * Handle visibility lost event
     * Made package-private for use by factory
     */
    handleVisibilityLost(): void {
        if (this.isRunning && !this.gameState.paused) {
            this.pause();
        }
    }

    /**
     * Setup event listeners for question outcomes
     */
    private setupQuestionEventListeners(): void {
        const unsubCorrect = events.on('AnsweredCorrectly', () => {
            const playerCar = this.gameState.playerCar;
            this.queueReward(playerCar, 150);
        });

        const unsubIncorrect = events.on('AnsweredIncorrectly', () => {
            const playerCar = this.gameState.playerCar;
            this.applyPenalty(playerCar, 0.8);
        });

        const unsubSkipped = events.on('QuestionSkipped', () => {
            const playerCar = this.gameState.playerCar;
            this.applyPenalty(playerCar, 0.6);
        });

        const unsubCompleted = events.on('QuestionCompleted', (payload) => {
            const question = payload.question as Question;
            this.statsManager.recordQuestion(question);
        });

        this.eventUnsubscribers = [
            unsubCorrect,
            unsubIncorrect,
            unsubSkipped,
            unsubCompleted,
        ];
    }

    /**
     * Clean up event listeners
     */
    private cleanupEventListeners(): void {
        for (const unsub of this.eventUnsubscribers) {
            unsub();
        }
        this.eventUnsubscribers = [];
    }

    /**
     * Create a RaceController from a saved game state
     *
     * @param gameState - The saved game state
     * @param questionConfig - Configuration for question generation
     * @param raceConfig - Race configuration (includes physics config)
     * @returns A new RaceController with the loaded state
     */
    static fromGameState(
        gameState: GameState,
        questionConfig: QuestionConfig,
        raceConfig: RaceConfig,
    ): RaceController {
        return RaceControllerFactory.createFromGameState(
            gameState,
            questionConfig,
            raceConfig,
        );
    }

    /**
     * Step the race controller
     *
     * @param dt - The time step in seconds
     */
    step(dt: number) {
        if (!this.gameState.paused && !this.raceCompleted) {
            const currentGameTime = this.elapsedMs / 1000;

            this.laneController.updateLaneChanges(currentGameTime);

            const cars = Array.from(this.gameState.getCars());

            // Handle all collisions in a single unified method call
            this.collisionController.handleAllCollisions(cars, currentGameTime);

            // Update bot AI behavior
            this.botController.updateBots(currentGameTime);

            this.carController.step(dt);

            // Update slip effects for all cars
            this.slipController.updateAllSlips(cars, dt);

            this.gameState.updateSkidMarks(dt);

            this.elapsedMs += dt * 1000;

            // Check for race completion only during active gameplay
            if (this.gameState.playerCar.hasFinished()) {
                this.raceCompleted = true;
                this.stop();
                events.emit('RaceFinished', {});
            }
        }

        const playerCar = this.gameState.playerCar;
        this.cameraController.update(dt, playerCar, this.gameState.track);
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
     * Get the question manager
     *
     * @returns The question manager
     */
    getQuestionManager(): QuestionManager {
        return this.questionManager;
    }

    /**
     * Get the question controller
     *
     * @returns The question controller
     */
    getQuestionController(): QuestionController {
        return this.questionController;
    }

    getStreakController(): StreakController {
        return this.streakController;
    }

    /**
     * Get the stats manager
     *
     * @returns The stats manager
     */
    getStatsManager(): QuestionStatsManager {
        return this.statsManager;
    }

    /**
     * Get elapsed race time in milliseconds (pause-aware)
     *
     * @returns Elapsed time in milliseconds
     */
    getElapsedMs(): number {
        return this.elapsedMs;
    }

    /**
     * Get current accuracy (0-1)
     *
     * @returns Accuracy as a value between 0 and 1
     */
    getAccuracy(): number {
        const stats = this.statsManager.getStats();
        let correct = 0,
            incorrect = 0;
        for (const s of stats) {
            if (s.outcome === QuestionOutcome.CORRECT) correct++;
            else if (s.outcome === QuestionOutcome.INCORRECT) incorrect++;
        }
        const denom = correct + incorrect;
        return denom > 0 ? correct / denom : 0;
    }

    /**
     * Get correct answer count
     *
     * @returns Number of correct answers
     */
    getCorrectCount(): number {
        const stats = this.statsManager.getStats();
        return stats.filter((s) => s.outcome === QuestionOutcome.CORRECT)
            .length;
    }

    /**
     * Get incorrect answer count
     *
     * @returns Number of incorrect answers
     */
    getIncorrectCount(): number {
        const stats = this.statsManager.getStats();
        return stats.filter((s) => s.outcome === QuestionOutcome.INCORRECT)
            .length;
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
     * Apply penalty to a car
     *
     * @param car - The car to apply penalty to
     * @param magnitude - The penalty magnitude (0-1)
     */
    applyPenalty(car: Car, magnitude: number) {
        this.carController.applyPenalty(car, magnitude);
    }

    /**
     * Start the race (starts game loop and input listeners)
     *
     * @param containerElement - The container element for resize tracking
     * @param onResize - Callback when container is resized
     * @param onFrame - Callback for each frame (for React re-renders)
     * @throws Error if the race is already started
     */
    start(
        containerElement: HTMLElement,
        onResize: (w: number, h: number) => void,
        onFrame: () => void,
    ): void {
        if (this.isRunning) {
            throw new Error(
                'RaceController is already started. Call stop() before starting again.',
            );
        }

        // Start listener controller (pass containerElement and onResize)
        this.listenerController.start(containerElement, onResize);

        // Start game clock
        this.clock.start((dt) => this.step(dt), onFrame);

        this.isRunning = true;
    }

    /**
     * Stop the race
     */
    stop(): void {
        if (!this.isRunning) {
            return;
        }

        // Stop game clock
        this.clock.stop();

        // Stop all listeners
        this.listenerController.stop();
        this.isRunning = false;
    }

    /**
     * Check if the race is currently running
     *
     * @returns True if the race is started, false otherwise
     */
    isStarted(): boolean {
        return this.isRunning;
    }

    /**
     * Toggle pause state
     *
     * @throws Error if the race is not started
     */
    togglePause(): void {
        if (!this.isRunning) {
            throw new Error(
                'Cannot toggle pause: RaceController is not started. Call start() first.',
            );
        }
        this.gameState.paused = !this.gameState.paused;

        // Update listener controller pause state
        if (this.gameState.paused) {
            this.listenerController.pause();
        } else {
            this.listenerController.resume();
        }

        events.emit('PausedSet', { value: this.gameState.paused });
    }

    /**
     * Pause the race
     *
     * @throws Error if the race is not started
     */
    pause(): void {
        if (!this.isRunning) {
            throw new Error(
                'Cannot pause: RaceController is not started. Call start() first.',
            );
        }
        if (!this.gameState.paused) {
            this.togglePause();
        }
    }

    /**
     * Resume the race
     *
     * @throws Error if the race is not started
     */
    resume(): void {
        if (!this.isRunning) {
            throw new Error(
                'Cannot resume: RaceController is not started. Call start() first.',
            );
        }
        if (this.gameState.paused) {
            this.togglePause();
        }
    }

    /**
     * Get pause state
     *
     * @returns True if paused, false otherwise
     */
    isPaused(): boolean {
        return this.gameState.paused;
    }

    /**
     * Save stats for current user
     *
     * @param username - The username to save stats for
     */
    saveStatsForUser(username: string): void {
        const stats = this.statsManager.getStats();
        updateUserStats(username, Array.from(stats));
    }

    /**
     * Exit the race, optionally saving stats for a user
     *
     * @param username - Optional username to save stats for
     */
    exitRace(username?: string | null): void {
        if (username) {
            this.saveStatsForUser(username);
        }
        this.stop();
    }

    /**
     * Destroy the controller and clean up all resources
     *
     * This should be called when the controller is no longer needed (e.g., when exiting the game).
     * It stops the controller if running, disposes of all resources, and cleans up event listeners.
     */
    destroy(): void {
        if (this.isRunning) {
            this.stop();
        }
        this.questionController.destroy();
        this.cleanupEventListeners();
        this.listenerController.destroy();
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
     * @param questionConfig - Configuration for question generation
     * @param raceConfig - Race configuration (includes physics config)
     * @returns A new RaceController with the loaded state
     */
    static loadFromString(
        jsonString: string,
        questionConfig: QuestionConfig,
        raceConfig: RaceConfig,
    ): RaceController {
        const gameState = deserializeGameState(jsonString);
        return RaceController.fromGameState(
            gameState,
            questionConfig,
            raceConfig,
        );
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
     * @param questionConfig - Configuration for question generation
     * @param raceConfig - Race configuration (includes physics config)
     * @param slotName - The name of the save slot (default: 'default')
     * @returns A new RaceController with the loaded state, or null if no save exists
     */
    static loadFromLocalStorage(
        questionConfig: QuestionConfig,
        raceConfig: RaceConfig,
        slotName: string = 'default',
    ): RaceController | null {
        const gameState = loadGameFromLocalStorage(slotName);
        if (!gameState) {
            return null;
        }
        return RaceController.fromGameState(
            gameState,
            questionConfig,
            raceConfig,
        );
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
