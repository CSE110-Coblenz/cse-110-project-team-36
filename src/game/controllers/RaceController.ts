import { GameState } from '../models/game-state';
import { Track } from '../models/track';
import { Car } from '../models/car';
import { UserCar } from '../models/user-car';
import { BotCar } from '../models/bot-car';
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
import { ANIMATION_TICK } from '../../const';
import { updateUserStats } from '../../services/localStorage';
import type { RaceConfig } from '../config/types';
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
     * Constructor
     *
     * @param track - The track to initialize the race controller on
     * @param questionConfig - Configuration for question generation
     * @param raceConfig - Race configuration (includes physics config)
     */
    constructor(
        track: Track,
        questionConfig: QuestionConfig,
        raceConfig: RaceConfig,
    ) {
        const camera = { pos: { x: 0, y: 0 }, zoom: 1, rotation: 0 };
        this.gameState = new GameState(camera, track);

        this.gameState.addPlayerCar(
            new UserCar(
                raceConfig.userCarInitialPosition,
                '#22c55e',
                40,
                22,
                raceConfig.userCarLaneIndex,
            ),
        );

        // Create bot cars with configurations
        const botConfig = raceConfig.botConfig;
        const difficultyRanges = raceConfig.botDifficultyRanges;
        const initialPositions = raceConfig.initialPositions;
        const laneIndices = raceConfig.laneIndices;

        for (let i = 0; i < difficultyRanges.length; i++) {
            const [minDifficulty, maxDifficulty] = difficultyRanges[i];
            // Generate random difficulty within range
            const difficulty =
                minDifficulty + Math.random() * (maxDifficulty - minDifficulty);

            const botCar = new BotCar(
                initialPositions[i],
                '#ef4444',
                40,
                22,
                difficulty,
                botConfig,
                laneIndices[i],
            );
            // Initialize next answer time based on bot's answer speed
            botCar.nextAnswerTime = botCar.answerSpeed;
            this.gameState.addCar(botCar);
        }

        this.carController = new CarController(
            this.gameState,
            raceConfig.physics,
        );
        this.carController.initializeCars();

        this.cameraController = new CameraController(this.gameState);

        // Create lane controller first
        this.laneController = new LaneController(
            this.gameState,
            this.carController,
        );

        // Create collision controller with dependencies
        this.collisionController = new CollisionController(
            this.gameState,
            this.laneController,
            this.carController,
            raceConfig.physics,
        );

        // Create slip controller
        this.slipController = new SlipController(
            this.gameState,
            raceConfig.physics,
        );

        this.questionManager = new QuestionManager(questionConfig);
        this.statsManager = new QuestionStatsManager();
        this.questionController = new QuestionController(this.questionManager);

        // Create bot controller
        this.botController = new BotController(
            this.gameState,
            this.laneController,
            this.carController,
        );

        // Create listener controller with all callbacks
        this.listenerController = new ListenerController(
            () => this.togglePause(),
            () => this.queueReward(this.gameState.playerCar, 150),
            {
                onNumberInput: (char) => this.questionController.addChar(char),
                onDelete: () => this.questionController.deleteChar(),
                onEnterSubmit: () => this.questionController.submitAnswer(),
                onSkip: () => this.questionController.skipQuestion(),
            },
            {
                onLaneChangeLeft: () => {
                    this.laneController.switchLane(
                        this.gameState.playerCar,
                        -1,
                        this.elapsedMs / 1000,
                    );
                },
                onLaneChangeRight: () => {
                    this.laneController.switchLane(
                        this.gameState.playerCar,
                        1,
                        this.elapsedMs / 1000,
                    );
                },
            },
            () => this.handleVisibilityLost(),
        );

        this.setupQuestionEventListeners();
        this.clock = new GameClock(ANIMATION_TICK);

        this.streakController = new StreakController();
    }

    private handleVisibilityLost(): void {
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
        // Create a dummy track for the constructor, then replace with loaded state
        const dummyTrack = Track.fromJSON({
            version: 1,
            numLanes: 4,
            laneWidth: 10,
            points: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
            ],
        });
        const controller = new RaceController(
            dummyTrack,
            questionConfig,
            raceConfig,
        );

        // Replace with the loaded game state
        controller.gameState = gameState;
        controller.cameraController = new CameraController(gameState);
        controller.carController = new CarController(
            gameState,
            raceConfig.physics,
        );
        controller.carController.initializeCars();

        // Recreate lane controller first
        controller.laneController = new LaneController(
            gameState,
            controller.carController,
        );

        // Recreate collision controller with dependencies
        controller.collisionController = new CollisionController(
            gameState,
            controller.laneController,
            controller.carController,
            raceConfig.physics,
        );

        // Recreate slip controller
        controller.slipController = new SlipController(
            gameState,
            raceConfig.physics,
        );

        // Recreate bot controller
        controller.botController = new BotController(
            gameState,
            controller.laneController,
            controller.carController,
        );

        // Recreate listener controller with lane change callbacks
        controller.listenerController = new ListenerController(
            () => controller.togglePause(),
            () => controller.queueReward(gameState.playerCar, 150),
            {
                onNumberInput: (char) =>
                    controller.questionController.addChar(char),
                onDelete: () => controller.questionController.deleteChar(),
                onEnterSubmit: () =>
                    controller.questionController.submitAnswer(),
                onSkip: () => controller.questionController.skipQuestion(),
            },
            {
                onLaneChangeLeft: () => {
                    controller.laneController.switchLane(
                        gameState.playerCar,
                        -1,
                        controller.elapsedMs / 1000,
                    );
                },
                onLaneChangeRight: () => {
                    controller.laneController.switchLane(
                        gameState.playerCar,
                        1,
                        controller.elapsedMs / 1000,
                    );
                },
            },
        );

        return controller;
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
        }

        if (this.gameState.playerCar.hasFinished()) {
            this.raceCompleted = true;
            this.stop();
            events.emit('RaceFinished', {});
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
