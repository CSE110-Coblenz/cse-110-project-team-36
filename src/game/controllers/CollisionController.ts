import type { GameState } from '../models/game-state';
import type { Car } from '../models/car';
import type { LaneController } from './LaneController';
import type { CarController } from './CarController';
import type { PhysicsConfig } from '../config/types';
import { getWrappedDistance } from '../../utils/track';

/**
 * Collision controller for detecting collisions between cars
 */
export class CollisionController {
    private readonly trackLength: number;

    constructor(
        private gameState: GameState,
        private laneController: LaneController,
        private carController: CarController,
        private physicsConfig: PhysicsConfig,
    ) {
        this.trackLength = this.gameState.track.length;
    }

    /**
     * Get full track length (world units)
     */
    public getTrackLength(): number {
        return this.trackLength;
    }

    /**
     * Handle all collisions in a single unified method
     * Categorizes and handles: tiebreaker collisions, merge collisions, and regular collisions
     *
     * @param cars - All cars in the game
     * @param currentGameTime - Current game time in seconds
     */
    public handleAllCollisions(cars: Car[], currentGameTime: number): void {
        // Detect all potential collisions
        const collisions = this.detectAllCollisions(cars, currentGameTime);

        // Categorize and handle each collision
        for (const collision of collisions) {
            if (collision.type === 'tiebreaker') {
                this.handleTiebreakerCollision(collision);
            } else if (collision.type === 'merge') {
                this.handleMergeCollision(collision, currentGameTime);
            } else {
                this.handleRegularCollision(collision);
            }
        }
    }

    /**
     * Get the lanes where a collision occurred (intersection of both cars' effective lanes)
     *
     * @param car1 - First car
     * @param car2 - Second car
     * @param currentGameTime - Current game time in seconds
     * @returns Array of lane indices where collision occurred
     */
    private getCollisionLanes(
        car1: Car,
        car2: Car,
        currentGameTime: number,
    ): number[] {
        const car1Lanes = this.laneController.getEffectiveLanes(
            car1,
            currentGameTime,
        );
        const car2Lanes = this.laneController.getEffectiveLanes(
            car2,
            currentGameTime,
        );
        return car1Lanes.filter((lane) => car2Lanes.includes(lane));
    }

    /**
     * Check if a merging car's target lane is involved in the collision
     * and if the other car is/will be in that target lane
     *
     * @param mergingCar - The car that is changing lanes
     * @param otherCar - The other car involved in collision
     * @param collisionLanes - The lanes where collision occurred
     * @param currentGameTime - Current game time in seconds
     * @returns True if target lane is involved and other car is/will be there
     */
    private isTargetLaneInvolved(
        mergingCar: Car,
        otherCar: Car,
        collisionLanes: number[],
        currentGameTime: number,
    ): boolean {
        if (mergingCar.targetLaneIndex === null) {
            return false;
        }

        const targetLane = mergingCar.targetLaneIndex;

        // Check if target lane is in collision lanes
        if (!collisionLanes.includes(targetLane)) {
            return false;
        }

        // Check if other car is currently in or will be in the target lane
        const otherCarLanes = this.laneController.getEffectiveLanes(
            otherCar,
            currentGameTime,
        );
        if (otherCarLanes.includes(targetLane)) {
            return true;
        }

        // Check if other car is also changing into the target lane
        if (
            otherCar.isChangingLanes() &&
            otherCar.targetLaneIndex === targetLane
        ) {
            return true;
        }

        return false;
    }

    /**
     * Check if both cars' target lanes conflict (are the same)
     *
     * @param car1 - First car
     * @param car2 - Second car
     * @returns True if both are changing into the same target lane
     */
    private doTargetLanesConflict(car1: Car, car2: Car): boolean {
        if (!car1.isChangingLanes() || !car2.isChangingLanes()) {
            return false;
        }
        return (
            car1.targetLaneIndex !== null &&
            car2.targetLaneIndex !== null &&
            car1.targetLaneIndex === car2.targetLaneIndex
        );
    }

    /**
     * Detect all collisions and categorize them
     */
    private detectAllCollisions(
        cars: Car[],
        currentGameTime: number,
    ): Array<{
        type: 'tiebreaker' | 'merge' | 'regular';
        car1: Car;
        car2: Car;
        rear: Car;
        front: Car;
        car1Changing: boolean;
        car2Changing: boolean;
        car1TargetLane: number | null;
        car2TargetLane: number | null;
        car1SourceLane: number;
        car2SourceLane: number;
        collisionLanes: number[];
    }> {
        const results: Array<{
            type: 'tiebreaker' | 'merge' | 'regular';
            car1: Car;
            car2: Car;
            rear: Car;
            front: Car;
            car1Changing: boolean;
            car2Changing: boolean;
            car1TargetLane: number | null;
            car2TargetLane: number | null;
            car1SourceLane: number;
            car2SourceLane: number;
            collisionLanes: number[];
        }> = [];
        const pairKeys = new Set<string>();

        // Simple O(n²) all-pairs check
        for (let i = 0; i < cars.length; i++) {
            for (let j = i + 1; j < cars.length; j++) {
                const a = cars[i];
                const b = cars[j];

                // Check if they share lanes (call getEffectiveLanes once per car)
                const aLanes = this.laneController.getEffectiveLanes(
                    a,
                    currentGameTime,
                );
                const bLanes = this.laneController.getEffectiveLanes(
                    b,
                    currentGameTime,
                );
                const same = aLanes.some((l) => bLanes.includes(l));
                if (!same) continue;

                // Get the lanes where collision occurred (intersection)
                const collisionLanes = this.getCollisionLanes(
                    a,
                    b,
                    currentGameTime,
                );

                // Determine rear/front based on wrapped s position
                const half = this.trackLength / 2;
                const sDiff = a.s - b.s;
                const wDiff =
                    sDiff > half
                        ? sDiff - this.trackLength
                        : sDiff < -half
                          ? sDiff + this.trackLength
                          : sDiff;
                const rear = wDiff < 0 ? a : b;
                const front = wDiff < 0 ? b : a;

                // Deduplicate pairs
                const key = `${i}-${j}`;
                if (pairKeys.has(key)) continue;
                pairKeys.add(key);

                const aChanging = a.isChangingLanes();
                const bChanging = b.isChangingLanes();
                const aTargetLane = a.targetLaneIndex;
                const bTargetLane = b.targetLaneIndex;
                const aSourceLane = a.laneIndex;
                const bSourceLane = b.laneIndex;

                // Check for tiebreaker: both changing into same target lane
                if (
                    aChanging &&
                    bChanging &&
                    aTargetLane !== null &&
                    bTargetLane !== null &&
                    aTargetLane === bTargetLane
                ) {
                    const laneDistance = Math.abs(aSourceLane - bSourceLane);
                    const d = getWrappedDistance(a.s, b.s, this.trackLength);
                    const threshold = (a.carLength + b.carLength) / 2;

                    // Tiebreaker: same target, 1+ lanes apart, not overlapping yet
                    // Extended to handle 1-lane-apart cases for better prevention
                    if (laneDistance >= 1 && d >= threshold) {
                        results.push({
                            type: 'tiebreaker',
                            car1: a,
                            car2: b,
                            rear,
                            front,
                            car1Changing: aChanging,
                            car2Changing: bChanging,
                            car1TargetLane: aTargetLane,
                            car2TargetLane: bTargetLane,
                            car1SourceLane: aSourceLane,
                            car2SourceLane: bSourceLane,
                            collisionLanes,
                        });
                        continue;
                    }
                }

                // Check for overlap (actual collision)
                const d = getWrappedDistance(a.s, b.s, this.trackLength);
                const threshold = (a.carLength + b.carLength) / 2;
                if (d > threshold) continue;

                // Merge collision: at least one car is changing lanes and overlapping
                if (aChanging || bChanging) {
                    results.push({
                        type: 'merge',
                        car1: a,
                        car2: b,
                        rear,
                        front,
                        car1Changing: aChanging,
                        car2Changing: bChanging,
                        car1TargetLane: aTargetLane,
                        car2TargetLane: bTargetLane,
                        car1SourceLane: aSourceLane,
                        car2SourceLane: bSourceLane,
                        collisionLanes,
                    });
                } else {
                    // Regular collision: both in stable lanes
                    results.push({
                        type: 'regular',
                        car1: a,
                        car2: b,
                        rear,
                        front,
                        car1Changing: false,
                        car2Changing: false,
                        car1TargetLane: null,
                        car2TargetLane: null,
                        car1SourceLane: aSourceLane,
                        car2SourceLane: bSourceLane,
                        collisionLanes,
                    });
                }
            }
        }

        return results;
    }

    /**
     * Handle tiebreaker collision: two cars merging into same lane, faster car wins
     */
    private handleTiebreakerCollision(collision: {
        car1: Car;
        car2: Car;
        rear: Car;
        front: Car;
    }): void {
        const { car1, car2 } = collision;

        // Determine slower car (faster car continues lane change)
        const slowerCar = car1.v > car2.v ? car2 : car1;

        // Slower car: cancel lane change (faster car continues)
        this.laneController.cancelLaneChange(slowerCar);

        // No penalties for tiebreaker (not a crash, just a tiebreaker)
    }

    /**
     * Handle merge collision: one car merges onto another
     */
    private handleMergeCollision(
        collision: {
            car1: Car;
            car2: Car;
            rear: Car;
            front: Car;
            car1Changing: boolean;
            car2Changing: boolean;
            collisionLanes: number[];
        },
        currentGameTime: number,
    ): void {
        const {
            car1,
            car2,
            rear,
            front,
            car1Changing,
            car2Changing,
            collisionLanes,
        } = collision;

        // Apply crash effects regardless
        this.applyCrashEffects({ rear, front });

        // Case 1: One car is changing, other is stationary
        if (car1Changing && !car2Changing) {
            // Check if collision is in merging car's target lane and other car is there
            if (
                this.isTargetLaneInvolved(
                    car1,
                    car2,
                    collisionLanes,
                    currentGameTime,
                )
            ) {
                // Target lane is involved - cancel lane change
                this.carController.applyPenalty(car2, 0.4);
                this.carController.applyPenalty(car1, 0.8);
                this.laneController.cancelLaneChange(car1);
            } else {
                // Collision in source/intermediate lane, target lane is clear - allow lane change to continue
                this.carController.applyPenalty(car2, 0.4);
                this.carController.applyPenalty(car1, 0.8);
                // Don't cancel lane change - it can complete
            }
        } else if (car2Changing && !car1Changing) {
            // Same logic for car2 changing
            if (
                this.isTargetLaneInvolved(
                    car2,
                    car1,
                    collisionLanes,
                    currentGameTime,
                )
            ) {
                this.carController.applyPenalty(car1, 0.4);
                this.carController.applyPenalty(car2, 0.8);
                this.laneController.cancelLaneChange(car2);
            } else {
                this.carController.applyPenalty(car1, 0.4);
                this.carController.applyPenalty(car2, 0.8);
                // Don't cancel lane change
            }
        } else if (car1Changing && car2Changing) {
            // Case 2: Both cars are changing lanes
            // Check if target lanes conflict
            if (this.doTargetLanesConflict(car1, car2)) {
                // Both changing into same target lane - faster car wins (tiebreaker should have caught this, but handle it here too)
                const fasterCar = car1.v > car2.v ? car1 : car2;
                const slowerCar = car1.v > car2.v ? car2 : car1;
                this.carController.applyPenalty(slowerCar, 0.8);
                this.carController.applyPenalty(fasterCar, 0.8);
                this.laneController.cancelLaneChange(slowerCar);
            } else {
                // Different target lanes - check if each car's target lane is involved
                const car1TargetInvolved = this.isTargetLaneInvolved(
                    car1,
                    car2,
                    collisionLanes,
                    currentGameTime,
                );
                const car2TargetInvolved = this.isTargetLaneInvolved(
                    car2,
                    car1,
                    collisionLanes,
                    currentGameTime,
                );

                // Apply penalties to both
                this.carController.applyPenalty(car1, 0.8);
                this.carController.applyPenalty(car2, 0.8);

                // Only cancel if target lane is involved
                if (car1TargetInvolved) {
                    this.laneController.cancelLaneChange(car1);
                }
                if (car2TargetInvolved) {
                    this.laneController.cancelLaneChange(car2);
                }
            }
        } else {
            // Neither changing (shouldn't happen in merge collision, but handle gracefully)
            const fasterCar = car1.v > car2.v ? car1 : car2;
            const slowerCar = car1.v > car2.v ? car2 : car1;
            this.carController.applyPenalty(slowerCar, 0.8);
            this.carController.applyPenalty(fasterCar, 0.8);
        }
    }

    /**
     * Handle regular collision: both cars in stable lanes
     */
    private handleRegularCollision(collision: { rear: Car; front: Car }): void {
        const { rear, front } = collision;
        const track = this.gameState.track;
        this.applyCrashEffects({ rear, front });
        const separationDistance =
            (rear.carLength + front.carLength) / 2 + 1e-3;
        const epsilon = 1e-1;
        front.s = track.wrapS(front.s + epsilon);
        rear.s = track.wrapS(front.s - separationDistance);
    }

    /**
     * Apply crash effects (velocity, slip, rewards) without position separation
     * Used for lane-change collisions where only lateral position should change
     *
     * @param pair - The collision pair
     */
    public applyCrashEffects(pair: { rear: Car; front: Car }): void {
        const { rear, front } = pair;

        const originalRearV = rear.v;
        rear.v = this.physicsConfig.vMin;
        rear.r = 0;
        this.carController.resetPendingRewards(rear);
        rear.slipFactor = Math.min(1, rear.slipFactor + 0.8);

        const momentum = originalRearV * rear.carLength;
        const speedBump =
            (momentum * this.physicsConfig.momentumTransfer) / front.carLength;
        front.v = Math.min(front.v + speedBump, this.physicsConfig.vMax * 1.5);
        front.r = 0;
        this.carController.resetPendingRewards(front);
        front.slipFactor = Math.min(1, front.slipFactor + 0.8);
    }
}
