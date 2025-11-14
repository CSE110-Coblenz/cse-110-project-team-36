import type { GameState } from '../models/game-state';
import type { Car } from '../models/car';
import type { LaneController } from './LaneController';
import type { CarController } from './CarController';
import type { PhysicsConfig } from '../config/types';

/**
 * Collision controller for detecting collisions between cars
 */
export class CollisionController {
    private readonly trackLength: number;

    constructor(
        private gameState: GameState,
        private laneController: LaneController,
        private carController: CarController,
        private physicsConfig: PhysicsConfig
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
                this.handleMergeCollision(collision);
            } else {
                this.handleRegularCollision(collision);
            }
        }
    }

    /**
     * Detect all collisions and categorize them
     */
    private detectAllCollisions(cars: Car[], currentGameTime: number): Array<{
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
        }> = [];
        const pairKeys = new Set<string>();

        const wrapDist = (a: number, b: number) => {
            const d = Math.abs(a - b);
            return Math.min(d, this.trackLength - d);
        };

        // Simple O(n²) all-pairs check
        for (let i = 0; i < cars.length; i++) {
            for (let j = i + 1; j < cars.length; j++) {
                const a = cars[i];
                const b = cars[j];

                // Check if they share lanes (call getEffectiveLanes once per car)
                const aLanes = this.laneController.getEffectiveLanes(a, currentGameTime);
                const bLanes = this.laneController.getEffectiveLanes(b, currentGameTime);
                const same = aLanes.some(l => bLanes.includes(l));
                if (!same) continue;

                // Determine rear/front based on wrapped s position
                const half = this.trackLength / 2;
                const sDiff = a.s - b.s;
                const wDiff = sDiff > half ? sDiff - this.trackLength : (sDiff < -half ? sDiff + this.trackLength : sDiff);
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

                // Check for tiebreaker: both changing into same target lane, 2+ lanes apart
                if (aChanging && bChanging && aTargetLane !== null && bTargetLane !== null && aTargetLane === bTargetLane) {
                    const laneDistance = Math.abs(aSourceLane - bSourceLane);
                    const d = wrapDist(a.s, b.s);
                    const threshold = (a.carLength + b.carLength) / 2;

                    // Tiebreaker: same target, 2+ lanes apart, not overlapping yet
                    if (laneDistance >= 2 && d >= threshold) {
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
                            car2SourceLane: bSourceLane
                        });
                        continue;
                    }
                }

                // Check for overlap (actual collision)
                const d = wrapDist(a.s, b.s);
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
                        car2SourceLane: bSourceLane
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
                        car2SourceLane: bSourceLane
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
    private handleMergeCollision(collision: {
        car1: Car;
        car2: Car;
        rear: Car;
        front: Car;
        car1Changing: boolean;
        car2Changing: boolean;
    }): void {
        const { car1, car2, rear, front, car1Changing, car2Changing } = collision;

        const mergingCar = car1Changing ? car1 : (car2Changing ? car2 : null);
        const stationaryCar = car1Changing ? car2 : (car2Changing ? car1 : null);

        this.applyCrashEffects({ rear, front });

        if (mergingCar && stationaryCar) {
            this.carController.applyPenalty(stationaryCar, 0.4);
            this.carController.applyPenalty(mergingCar, 0.8);
            this.laneController.cancelLaneChange(mergingCar);
        } else {
            const fasterCar = car1.v > car2.v ? car1 : car2;
            const slowerCar = car1.v > car2.v ? car2 : car1;
            this.carController.applyPenalty(slowerCar, 0.8);
            this.carController.applyPenalty(fasterCar, 0.8);
            if (slowerCar.isChangingLanes()) {
                this.laneController.cancelLaneChange(slowerCar);
            }
        }
    }

    /**
     * Handle regular collision: both cars in stable lanes
     */
    private handleRegularCollision(collision: {
        rear: Car;
        front: Car;
    }): void {
        const { rear, front } = collision;
        const track = this.gameState.track;
        this.applyCrashEffects({ rear, front });
        const separationDistance = (rear.carLength + front.carLength) / 2 + 1e-3;
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
        const speedBump = (momentum * this.physicsConfig.momentumTransfer) / front.carLength;
        front.v = Math.min(front.v + speedBump, this.physicsConfig.vMax * 1.5);
        front.r = 0;
        this.carController.resetPendingRewards(front);
        front.slipFactor = Math.min(1, front.slipFactor + 0.8);
    }
}

