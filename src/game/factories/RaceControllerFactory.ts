import { RaceController } from '../controllers/RaceController';
import { GameStateFactory } from './GameStateFactory';
import { CarController } from '../controllers/CarController';
import { CameraController } from '../controllers/CameraController';
import { LaneController } from '../controllers/LaneController';
import { CollisionController } from '../controllers/CollisionController';
import { SlipController } from '../controllers/SlipController';
import { BotController } from '../controllers/BotController';
import { QuestionManager } from '../managers/QuestionManager';
import type { QuestionConfig } from '../managers/QuestionManager';
import { QuestionStatsManager } from '../managers/QuestionStatsManager';
import { QuestionController } from '../controllers/QuestionController';
import { StreakController } from '../controllers/StreakController';
import { ListenerController } from '../controllers/ListenerController';
import { GameClock } from '../clock';
import { ANIMATION_TICK } from '../../const';
import { Track } from '../models/track';
import type { RaceConfig } from '../config/types';
import { ConfigController } from '../controllers/ConfigController';
import { loadTrack } from '../../utils/trackList';
import { BrowserTimerService } from '../../services/adapters/TimerService';
import { BrowserStorageService } from '../../services/adapters/StorageService';
import { BrowserDOMService } from '../../services/adapters/DOMService';
import { BrowserWindowService } from '../../services/adapters/WindowService';
import { BrowserDocumentService } from '../../services/adapters/DocumentService';
import { PersistenceService } from '../../services/PersistenceService';
import { UserService } from '../../services/UserService';
import { UserStatsService } from '../../services/UserStatsService';

/**
 * Factory for creating RaceController instances
 * Handles all dependency wiring and initialization
 * Also provides async methods for loading race configs and tracks
 */
export class RaceControllerFactory {
    /**
     * Initialize a race controller asynchronously
     * Loads race config and track data, then creates the controller
     *
     * @param raceFile - The race config file to load (e.g., "race1.json")
     * @param questionConfig - Configuration for question generation
     * @returns A promise that resolves to a RaceController
     */
    static async createRaceControllerAsync(
        raceFile: string,
        questionConfig: QuestionConfig,
    ): Promise<RaceController> {
        // Load race config (includes physics config via inheritance)
        const raceConfig = await ConfigController.loadRaceConfig(raceFile);

        // Load track from trackFile reference
        const trackData = await loadTrack(
            raceConfig.trackFile.replace('.json', ''),
        );
        const track = Track.fromJSON(trackData);

        return this.createRaceController(track, questionConfig, raceConfig);
    }

    /**
     * Create a new RaceController with all dependencies wired
     *
     * @param track - The track to use
     * @param questionConfig - Configuration for question generation
     * @param raceConfig - Race configuration (includes physics config)
     * @returns A fully initialized RaceController
     */
    static createRaceController(
        track: Track,
        questionConfig: QuestionConfig,
        raceConfig: RaceConfig,
    ): RaceController {
        // Create game state with cars
        const gameState = GameStateFactory.createGameState(track, raceConfig);

        // Create controllers in dependency order
        const carController = new CarController(
            gameState,
            raceConfig.physics,
        );
        carController.initializeCars();

        const cameraController = new CameraController(gameState);

        const laneController = new LaneController(gameState, carController);

        const collisionController = new CollisionController(
            gameState,
            laneController,
            carController,
            raceConfig.physics,
        );

        const slipController = new SlipController(
            gameState,
            raceConfig.physics,
        );

        // Create browser API adapters
        const timerService = new BrowserTimerService();
        const storageService = new BrowserStorageService();
        const domService = new BrowserDOMService();
        const windowService = new BrowserWindowService();
        const documentService = new BrowserDocumentService();

        // Create persistence service
        const persistenceService = new PersistenceService(storageService);

        // Create user service and user stats service
        const userService = new UserService(storageService);
        const userStatsService = new UserStatsService(userService);

        const questionManager = new QuestionManager(questionConfig);
        const statsManager = new QuestionStatsManager();
        const questionController = new QuestionController(
            questionManager,
            timerService,
        );

        const botController = new BotController(
            gameState,
            laneController,
            carController,
        );

        const streakController = new StreakController();

        const clock = new GameClock(ANIMATION_TICK);

        // Create listener controller with callbacks that will reference the controller
        // We need to create a partial controller first to get the callbacks
        // Use a temporary approach: create callbacks that will be bound later
        let raceControllerInstance: RaceController | null = null;

        const listenerController = new ListenerController(
            () => raceControllerInstance?.togglePause() ?? undefined,
            () =>
                raceControllerInstance?.queueReward(
                    gameState.playerCar,
                    150,
                ) ?? undefined,
            {
                onNumberInput: (char) => questionController.addChar(char),
                onDelete: () => questionController.deleteChar(),
                onEnterSubmit: () => questionController.submitAnswer(),
                onSkip: () => questionController.skipQuestion(),
            },
            {
                onLaneChangeLeft: () => {
                    if (raceControllerInstance) {
                        laneController.switchLane(
                            gameState.playerCar,
                            -1,
                            raceControllerInstance.getElapsedMs() / 1000,
                        );
                    }
                },
                onLaneChangeRight: () => {
                    if (raceControllerInstance) {
                        laneController.switchLane(
                            gameState.playerCar,
                            1,
                            raceControllerInstance.getElapsedMs() / 1000,
                        );
                    }
                },
            },
            domService,
            windowService,
            documentService,
            () => raceControllerInstance?.handleVisibilityLost(),
        );

        // Now create the RaceController with all dependencies
        raceControllerInstance = new RaceController(
            gameState,
            carController,
            cameraController,
            laneController,
            collisionController,
            slipController,
            botController,
            questionManager,
            statsManager,
            questionController,
            streakController,
            listenerController,
            clock,
            persistenceService,
            userStatsService,
        );

        return raceControllerInstance;
    }

    /**
     * Create a RaceController from an existing GameState
     * Useful for loading saved games
     *
     * @param gameState - The game state to use
     * @param questionConfig - Configuration for question generation
     * @param raceConfig - Race configuration (includes physics config)
     * @returns A fully initialized RaceController
     */
    static createFromGameState(
        gameState: import('../models/game-state').GameState,
        questionConfig: QuestionConfig,
        raceConfig: RaceConfig,
    ): RaceController {
        // Create controllers in dependency order
        const carController = new CarController(
            gameState,
            raceConfig.physics,
        );
        carController.initializeCars();

        const cameraController = new CameraController(gameState);

        const laneController = new LaneController(gameState, carController);

        const collisionController = new CollisionController(
            gameState,
            laneController,
            carController,
            raceConfig.physics,
        );

        const slipController = new SlipController(
            gameState,
            raceConfig.physics,
        );

        // Create browser API adapters
        const timerService = new BrowserTimerService();
        const storageService = new BrowserStorageService();
        const domService = new BrowserDOMService();
        const windowService = new BrowserWindowService();
        const documentService = new BrowserDocumentService();

        // Create persistence service
        const persistenceService = new PersistenceService(storageService);

        // Create user service and user stats service
        const userService = new UserService(storageService);
        const userStatsService = new UserStatsService(userService);

        const questionManager = new QuestionManager(questionConfig);
        const statsManager = new QuestionStatsManager();
        const questionController = new QuestionController(
            questionManager,
            timerService,
        );

        const botController = new BotController(
            gameState,
            laneController,
            carController,
        );

        const streakController = new StreakController();

        const clock = new GameClock(ANIMATION_TICK);

        // Create listener controller with callbacks
        let raceControllerInstance: RaceController | null = null;

        const listenerController = new ListenerController(
            () => raceControllerInstance?.togglePause() ?? undefined,
            () =>
                raceControllerInstance?.queueReward(
                    gameState.playerCar,
                    150,
                ) ?? undefined,
            {
                onNumberInput: (char) => questionController.addChar(char),
                onDelete: () => questionController.deleteChar(),
                onEnterSubmit: () => questionController.submitAnswer(),
                onSkip: () => questionController.skipQuestion(),
            },
            {
                onLaneChangeLeft: () => {
                    if (raceControllerInstance) {
                        laneController.switchLane(
                            gameState.playerCar,
                            -1,
                            raceControllerInstance.getElapsedMs() / 1000,
                        );
                    }
                },
                onLaneChangeRight: () => {
                    if (raceControllerInstance) {
                        laneController.switchLane(
                            gameState.playerCar,
                            1,
                            raceControllerInstance.getElapsedMs() / 1000,
                        );
                    }
                },
            },
            domService,
            windowService,
            documentService,
            () => raceControllerInstance?.handleVisibilityLost(),
        );

        // Now create the RaceController with all dependencies
        raceControllerInstance = new RaceController(
            gameState,
            carController,
            cameraController,
            laneController,
            collisionController,
            slipController,
            botController,
            questionManager,
            statsManager,
            questionController,
            streakController,
            listenerController,
            clock,
            persistenceService,
            userStatsService,
        );

        return raceControllerInstance;
    }
}

