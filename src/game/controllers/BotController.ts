import type { GameState } from '../models/game-state';
import { BotCar } from '../models/bot-car';
import type { Car } from '../models/car';
import type { LaneController } from './LaneController';
import type { CarController } from './CarController';
import { gaussian } from '../../utils/math';
import { getWrappedDistance, getWrappedSDiff } from '../../utils/track';

/**
 * Safety metric result
 */
interface SafetyMetric {
    timeAhead: number; // Time to collision with car ahead (Infinity if none)
    timeBehind: number; // Time to collision with car behind (Infinity if none)
}

/**
 * Bot controller for managing bot car AI behavior
 */
export class BotController {
    private readonly trackLength: number;

    constructor(
        private gameState: GameState,
        private laneController: LaneController,
        private carController: CarController,
    ) {
        this.trackLength = this.gameState.track.length;
    }

    /**
     * Update all bot cars
     *
     * @param currentGameTime - Current game time in seconds
     */
    updateBots(currentGameTime: number): void {
        const bots = this.getBotCars();

        for (const bot of bots) {
            if (currentGameTime >= bot.nextAnswerTime) {
                this.processQuestionAnswer(bot, currentGameTime);
            }

            // Evaluate safety metric and decide on lane changes
            if (!bot.isChangingLanes()) {
                const direction = this.shouldLaneChange(bot, currentGameTime);
                if (direction !== 0) {
                    this.laneController.switchLane(
                        bot,
                        direction,
                        currentGameTime,
                    );
                }
            }
        }
    }

    /**
     * Calculate time to collision between two cars
     * Returns null if cars are not approaching each other
     *
     * @param bot - The bot car
     * @param car - The other car
     * @returns Time to collision in seconds, or null if not approaching
     */
    private calculateTimeToCollision(bot: BotCar, car: Car): number | null {
        const distance = getWrappedDistance(bot.s, car.s, this.trackLength);
        const relativeVelocity = bot.v - car.v;

        const minSafeDistance = (bot.carLength + car.carLength) / 2 + 20;
        if (distance < minSafeDistance) {
            if (Math.abs(relativeVelocity) <= 0.1) {
                return 0.1;
            }
            return distance / Math.max(Math.abs(relativeVelocity), 0.5);
        }

        if (Math.abs(relativeVelocity) <= 0.1) {
            return null;
        }

        return distance / Math.abs(relativeVelocity);
    }

    /**
     * Evaluate safety metric for a bot car
     * Calculates time to collision with cars in the same lane(s)
     *
     * @param bot - The bot car to evaluate
     * @param currentGameTime - Current game time in seconds
     * @returns Safety metric with time ahead and behind
     */
    evaluateSafetyMetric(bot: BotCar, currentGameTime: number): SafetyMetric {
        const botLanes = this.laneController.getEffectiveLanes(
            bot,
            currentGameTime,
        );
        const allCars = this.gameState.getCars();

        let minTimeAhead = Infinity;
        let minTimeBehind = Infinity;

        for (const car of allCars) {
            if (car === bot) continue;

            const carLanes = this.laneController.getEffectiveLanes(
                car,
                currentGameTime,
            );
            const sameLane = botLanes.some((l) => carLanes.includes(l));
            if (!sameLane) continue;

            const timeToCollision = this.calculateTimeToCollision(bot, car);
            if (timeToCollision === null) continue;

            const sDiff = getWrappedSDiff(car.s, bot.s, this.trackLength);
            const isAhead = sDiff > 0;
            const relativeVelocity = bot.v - car.v;

            if (isAhead && relativeVelocity > 0) {
                minTimeAhead = Math.min(minTimeAhead, timeToCollision);
            } else if (!isAhead && relativeVelocity < 0) {
                minTimeBehind = Math.min(minTimeBehind, timeToCollision);
            }
        }

        return {
            timeAhead: minTimeAhead,
            timeBehind: minTimeBehind,
        };
    }

    /**
     * Determine if bot should change lanes
     * Proactively evaluates all available lanes and chooses the safest one
     *
     * @param bot - The bot car to evaluate
     * @param currentGameTime - Current game time in seconds
     * @returns -1 for left, 1 for right, 0 for no change
     */
    shouldLaneChange(bot: BotCar, currentGameTime: number): -1 | 0 | 1 {
        const currentSafety = this.evaluateSafetyMetric(bot, currentGameTime);
        const currentMinSafety = Math.min(
            currentSafety.timeAhead,
            currentSafety.timeBehind,
        );

        const track = this.gameState.track;
        const currentLane = bot.laneIndex;
        const leftLane = currentLane - 1;
        const rightLane = currentLane + 1;

        let bestLane: number | null = null;
        let bestSafety = currentMinSafety;

        if (leftLane >= 0) {
            const leftMetric = this.evaluateLaneSafetyMetric(
                bot,
                leftLane,
                currentGameTime,
            );
            if (
                leftMetric.safetyTime > bestSafety &&
                leftMetric.isSafeToChange
            ) {
                bestLane = leftLane;
                bestSafety = leftMetric.safetyTime;
            }
        }

        if (rightLane < track.numLanes) {
            const rightMetric = this.evaluateLaneSafetyMetric(
                bot,
                rightLane,
                currentGameTime,
            );
            if (
                rightMetric.safetyTime > bestSafety &&
                rightMetric.isSafeToChange
            ) {
                bestLane = rightLane;
                bestSafety = rightMetric.safetyTime;
            }
        }

        if (bestLane !== null && bestSafety > currentMinSafety * 1.1) {
            return bestLane < currentLane ? -1 : 1;
        }

        return 0;
    }

    /**
     * Unified lane safety evaluation
     * Returns both the minimum safety time and whether it's safe to change into the lane
     *
     * @param bot - The bot car
     * @param laneIndex - The lane to evaluate
     * @param currentGameTime - Current game time in seconds
     * @returns Object with safetyTime and isSafeToChange
     */
    private evaluateLaneSafetyMetric(
        bot: BotCar,
        laneIndex: number,
        currentGameTime: number,
    ): { safetyTime: number; isSafeToChange: boolean } {
        const allCars = this.gameState.getCars();
        let minTime = Infinity;
        const minDistance = bot.carLength * 2; // Minimum safe distance (2 car lengths)

        for (const car of allCars) {
            if (car === bot) continue;

            const carLanes = this.laneController.getEffectiveLanes(
                car,
                currentGameTime,
            );
            const carInLane = carLanes.includes(laneIndex);
            const isChangingInto =
                car.isChangingLanes() && car.targetLaneIndex === laneIndex;

            if (carInLane || isChangingInto) {
                const distance = getWrappedDistance(
                    bot.s,
                    car.s,
                    this.trackLength,
                );

                const timeToCollision = this.calculateTimeToCollision(bot, car);
                if (timeToCollision !== null) {
                    minTime = Math.min(minTime, timeToCollision);
                }

                if (distance < minDistance) {
                    return {
                        safetyTime: minTime,
                        isSafeToChange: false,
                    };
                }
            }
        }

        const isSafeToChange = minTime >= bot.safetyTimeThreshold;

        return {
            safetyTime: minTime,
            isSafeToChange,
        };
    }

    /**
     * Process question answer for a bot
     * Dummy function that simulates answering a question and sets the next answer time
     *
     * @param bot - The bot car
     * @param currentGameTime - Current game time in seconds
     */
    processQuestionAnswer(bot: BotCar, currentGameTime: number): void {
        const isCorrect = Math.random() < bot.accuracy;

        if (isCorrect) {
            this.carController.queueReward(bot, 150);
        } else {
            this.carController.applySlowdownPenalty(bot, 0.8);
        }

        const nextSpeed = Math.max(
            0.1,
            gaussian(bot.answerSpeed, bot.answerSpeedStdDev),
        );
        bot.nextAnswerTime = currentGameTime + nextSpeed;
    }

    /**
     * Get all bot cars from game state
     *
     * @returns Array of BotCar instances
     */
    private getBotCars(): BotCar[] {
        const cars = this.gameState.getCars();
        return cars.filter((car): car is BotCar => car instanceof BotCar);
    }
}
