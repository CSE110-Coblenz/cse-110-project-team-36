import { GameState } from '../models/game-state';
import { Track } from '../models/track';
import { UserCar } from '../models/user-car';
import { BotCar } from '../models/bot-car';
import type { RaceConfig } from '../config/types';
import type { Camera } from '../types';

/**
 * Factory for creating GameState instances
 * Extracts game state initialization logic from RaceController
 */
export class GameStateFactory {
    /**
     * Create a new GameState with player and bot cars initialized
     *
     * @param track - The track to use
     * @param raceConfig - Race configuration containing car setup
     * @param camera - Optional camera (defaults to initial camera)
     * @returns A new GameState instance with cars initialized
     */
    static createGameState(
        track: Track,
        raceConfig: RaceConfig,
        camera?: Camera,
    ): GameState {
        const initialCamera: Camera = camera || {
            pos: { x: 0, y: 0 },
            zoom: 1,
            rotation: 0,
        };
        const gameState = new GameState(initialCamera, track);

        // Add player car
        gameState.addPlayerCar(
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
        const raceDifficulty = raceConfig.raceDifficulty;

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
                raceDifficulty,
                botConfig,
                laneIndices[i],
            );
            // Initialize next answer time based on bot's answer speed
            botCar.nextAnswerTime = botCar.answerSpeed;
            gameState.addCar(botCar);
        }

        return gameState;
    }

    /**
     * Create a GameState with custom cars (useful for testing or loading saved games)
     *
     * @param track - The track to use
     * @param camera - The camera
     * @param playerCar - Optional player car (if not provided, creates default)
     * @param botCars - Optional bot cars (if not provided, creates none)
     * @returns A new GameState instance
     */
    static createGameStateWithCars(
        track: Track,
        camera: Camera,
        playerCar?: UserCar,
        botCars?: BotCar[],
    ): GameState {
        const gameState = new GameState(camera, track);

        if (playerCar) {
            gameState.addPlayerCar(playerCar);
        }

        if (botCars) {
            for (const botCar of botCars) {
                gameState.addCar(botCar);
            }
        }

        return gameState;
    }
}
