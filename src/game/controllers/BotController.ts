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
                    // Before committing to lane change, do a predictive collision check
                    if (
                        this.wouldLaneChangeCauseCollision(
                            bot,
                            direction,
                            currentGameTime,
                        )
                    ) {
                        // Skip this lane change to avoid immediate collision
                        continue;
                    }
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

        // Only calculate if cars are approaching each other
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

            // Determine if car is ahead or behind
            const sDiff = getWrappedSDiff(car.s, bot.s, this.trackLength);
            const isAhead = sDiff > 0;
            const relativeVelocity = bot.v - car.v;

            if (isAhead && relativeVelocity > 0) {
                // Car ahead, bot catching up
                minTimeAhead = Math.min(minTimeAhead, timeToCollision);
            } else if (!isAhead && relativeVelocity < 0) {
                // Car behind, bot being caught
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
     *
     * @param bot - The bot car to evaluate
     * @param currentGameTime - Current game time in seconds
     * @returns -1 for left, 1 for right, 0 for no change
     */
    shouldLaneChange(bot: BotCar, currentGameTime: number): -1 | 0 | 1 {
        const currentSafety = this.evaluateSafetyMetric(bot, currentGameTime);
        const minSafety = Math.min(
            currentSafety.timeAhead,
            currentSafety.timeBehind,
        );

        // If current lane is safe enough, don't change
        if (minSafety >= bot.safetyTimeThreshold) {
            return 0;
        }

        const track = this.gameState.track;
        const currentLane = bot.laneIndex;
        const leftLane = currentLane - 1;
        const rightLane = currentLane + 1;

        let bestLane: number | null = null;
        let bestSafety = minSafety;

        // Check left lane
        if (leftLane >= 0) {
            const leftSafety = this.evaluateLaneSafety(
                bot,
                leftLane,
                currentGameTime,
            );
            if (
                leftSafety > bestSafety &&
                this.isLaneSafeToChangeInto(
                    bot,
                    leftLane,
                    currentGameTime,
                    leftSafety,
                )
            ) {
                bestLane = leftLane;
                bestSafety = leftSafety;
            }
        }

        // Check right lane
        if (rightLane < track.numLanes) {
            const rightSafety = this.evaluateLaneSafety(
                bot,
                rightLane,
                currentGameTime,
            );
            if (
                rightSafety > bestSafety &&
                this.isLaneSafeToChangeInto(
                    bot,
                    rightLane,
                    currentGameTime,
                    rightSafety,
                )
            ) {
                bestLane = rightLane;
                bestSafety = rightSafety;
            }
        }

        if (bestLane === null) {
            return 0;
        }

        return bestLane < currentLane ? -1 : 1;
    }

    /**
     * Evaluate safety of a specific lane for a bot
     *
     * @param bot - The bot car
     * @param laneIndex - The lane to evaluate
     * @param currentGameTime - Current game time in seconds
     * @returns Minimum safety time for that lane
     */
    private evaluateLaneSafety(
        bot: BotCar,
        laneIndex: number,
        currentGameTime: number,
    ): number {
        const allCars = this.gameState.getCars();
        let minTime = Infinity;

        for (const car of allCars) {
            if (car === bot) continue;

            const carLanes = this.laneController.getEffectiveLanes(
                car,
                currentGameTime,
            );
            if (!carLanes.includes(laneIndex)) continue;

            const timeToCollision = this.calculateTimeToCollision(bot, car);
            if (timeToCollision !== null) {
                minTime = Math.min(minTime, timeToCollision);
            }
        }

        return minTime;
    }

    /**
     * Check if a lane is safe to change into
     * Checks both cars already in the lane and cars attempting to change into it
     *
     * @param bot - The bot car
     * @param laneIndex - The lane to check
     * @param currentGameTime - Current game time in seconds
     * @param laneSafetyTime - The minimum safety time for this lane (from evaluateLaneSafety)
     * @returns True if safe to change into
     */
    private isLaneSafeToChangeInto(
        bot: BotCar,
        laneIndex: number,
        currentGameTime: number,
        laneSafetyTime: number,
    ): boolean {
        // First check: lane must have acceptable safety time (accounts for cars already in lane)
        if (laneSafetyTime < bot.safetyTimeThreshold) {
            return false;
        }

        const allCars = this.gameState.getCars();
        const minDistance = (bot.carLength + 40) * 2; // Minimum 2 car lengths of clearance

        for (const car of allCars) {
            if (car === bot) continue;

            const carLanes = this.laneController.getEffectiveLanes(
                car,
                currentGameTime,
            );
            const carInTargetLane = carLanes.includes(laneIndex);

            // Check if car is attempting to change into this lane OR already in it
            const isChangingIntoTarget =
                car.isChangingLanes() && car.targetLaneIndex === laneIndex;

            if (carInTargetLane || isChangingIntoTarget) {
                const distance = getWrappedDistance(
                    bot.s,
                    car.s,
                    this.trackLength,
                );

                // Minimum distance check: don't change if too close
                if (distance < minDistance) {
                    return false;
                }

                // Dynamic safety distance based on relative velocity
                const relativeVelocity = bot.v - car.v;
                const maxVelocity = Math.max(bot.v, car.v);

                // For cars approaching from behind (faster car catching up), use larger safety distance
                const sDiff = getWrappedSDiff(car.s, bot.s, this.trackLength);
                const isCarBehind = sDiff < 0;
                const isApproaching = isCarBehind
                    ? relativeVelocity < 0
                    : relativeVelocity > 0;

                // Use relative velocity for safety distance calculation
                const effectiveVelocity = isApproaching
                    ? maxVelocity
                    : Math.abs(relativeVelocity);
                const safetyDistance =
                    bot.safetyTimeThreshold * effectiveVelocity;

                if (distance < safetyDistance) {
                    return false;
                }
            }
        }

        return true;
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
            this.carController.applyPenalty(bot, 0.8);
        }

        // Generate next answer time with Gaussian variation
        const nextSpeed = Math.max(
            0.1,
            gaussian(bot.answerSpeed, bot.answerSpeedStdDev),
        );
        bot.nextAnswerTime = currentGameTime + nextSpeed;
    }

    /**
     * Check if a lane change would cause an immediate collision
     * Predictive check before committing to lane change
     *
     * @param bot - The bot car
     * @param direction - The direction of lane change (-1 or 1)
     * @param currentGameTime - Current game time in seconds
     * @returns True if lane change would cause collision
     */
    private wouldLaneChangeCauseCollision(
        bot: BotCar,
        direction: -1 | 1,
        currentGameTime: number,
    ): boolean {
        const track = this.gameState.track;
        const targetLane = bot.laneIndex + direction;

        // Check bounds
        if (targetLane < 0 || targetLane >= track.numLanes) {
            return true; // Would cause out-of-bounds, treat as collision
        }

        const allCars = this.gameState.getCars();
        const minDistance = (bot.carLength + 40) / 2; // Half car length overlap threshold

        // Check all other cars to see if we'd overlap during lane change
        for (const car of allCars) {
            if (car === bot) continue;

            // Get lanes this car will be in during the lane change
            // We'll be in both source and target lanes during transition
            const botFutureLanes = [bot.laneIndex, targetLane];
            const carLanes = this.laneController.getEffectiveLanes(
                car,
                currentGameTime,
            );

            // Check if we'd share any lanes
            const wouldShareLane = botFutureLanes.some((l) =>
                carLanes.includes(l),
            );
            if (!wouldShareLane) continue;

            // Check if we'd be too close
            const distance = getWrappedDistance(bot.s, car.s, this.trackLength);
            if (distance < minDistance) {
                return true; // Would cause immediate collision
            }

            // Check relative velocity - if approaching quickly, avoid
            const timeToCollision = this.calculateTimeToCollision(bot, car);
            if (timeToCollision !== null && timeToCollision < 0.5) {
                // Would collide within 0.5 seconds
                return true;
            }
        }

        return false;
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
