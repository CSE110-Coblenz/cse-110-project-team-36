import { Car } from './car';
import type { BotConfig } from '../config/types';
import { gaussian, clamp } from '../../utils/math';

/**
 * Bot statistics interface
 */
export interface BotStats {
    answerSpeed: number;
    accuracy: number;
    safetyTimeThreshold: number;
}

/**
 * BotCar class
 *
 * Represents an AI-controlled car with bot-specific statistics and behavior.
 */
export class BotCar extends Car {
    public difficulty: number; // Master difficulty scalar [a, b]
    public answerSpeed: number; // Mean time to answer questions (seconds)
    public answerSpeedStdDev: number; // Standard deviation for answer speed variation
    public accuracy: number; // Probability of answering correctly [0, 1]
    public safetyTimeThreshold: number; // Minimum safe time to car ahead/behind (seconds)
    public nextAnswerTime: number = Infinity; // Game time when bot will next attempt to answer

    constructor(
        initialS: number = 0,
        color: string = '#ef4444',
        carLength: number = 40,
        carWidth: number = 22,
        difficulty: number = 1.0,
        config: BotConfig,
        laneIndex?: number,
    ) {
        super(initialS, color, carLength, carWidth, laneIndex);
        this.difficulty = difficulty;

        // Generate bot statistics based on difficulty and config
        const stats = BotCar.generateBotStats(difficulty, config);
        this.answerSpeed = stats.answerSpeed;
        this.answerSpeedStdDev = config.answerSpeedStdDev;
        this.accuracy = stats.accuracy;
        this.safetyTimeThreshold = stats.safetyTimeThreshold;
    }

    /**
     * Generate bot statistics using Gaussian randomness scaled by difficulty
     *
     * @param difficulty - Master difficulty scalar
     * @param config - Bot configuration
     * @returns Generated bot statistics
     */
    static generateBotStats(difficulty: number, config: BotConfig): BotStats {
        const answerSpeed = Math.max(
            0.1,
            config.answerSpeedBase / difficulty +
                gaussian(0, config.answerSpeedStdDev),
        );
        const accuracy = clamp(
            config.accuracyBase * difficulty +
                gaussian(0, config.accuracyStdDev),
            0,
            1,
        );
        const safetyTimeThreshold = Math.max(
            0.5,
            config.safetyTimeBase * difficulty +
                gaussian(0, config.safetyTimeStdDev),
        );
        return {
            answerSpeed,
            accuracy,
            safetyTimeThreshold,
        };
    }
}
