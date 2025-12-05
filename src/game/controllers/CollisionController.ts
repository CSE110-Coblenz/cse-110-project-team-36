import type { GameState } from '../models/game-state';
import type { Car } from '../models/car';
import type { LaneController } from './LaneController';
import type { CarController } from './CarController';
import { getWrappedSDiff } from '../../utils/track';

/**
 * Hitbox representation for a car in world space
 */
interface Hitbox {
    centerX: number;
    centerY: number;
    halfLength: number; // carLength / 2
    halfWidth: number;  // carWidth / 2
    rotation: number;   // rotation angle in radians
}

/**
 * Simplified collision record
 */
interface Collision {
    car1: Car;
    car2: Car;
    rear: Car;
    front: Car;
    isSideCollision: boolean; // true if lateral overlap > longitudinal overlap
}

/**
 * Collision controller for detecting collisions between cars
 * Uses hitbox-based detection for accurate visual overlap detection
 */
export class CollisionController {
    private readonly trackLength: number;

    private static readonly POSITION_ADJUSTMENT_EPSILON = 1e-1; // Small boost to front car position
    private static readonly MAX_COLLISION_VELOCITY = 50.0; // Maximum velocity for collision

    constructor(
        private gameState: GameState,
        private laneController: LaneController,
        private carController: CarController,
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
     * Calculate hitbox for a car in world space
     * Uses the car's world position and dimensions to create a bounding box
     * Assumes rotation 0 (axis-aligned) for simplicity
     *
     * @param car - The car to calculate hitbox for
     * @returns Hitbox in world coordinates
     */
    private getCarHitbox(car: Car): Hitbox {
        const track = this.gameState.track;
        const worldPos = car.getWorldPosition(track, car.lateral);

        return {
            centerX: worldPos.x,
            centerY: worldPos.y,
            halfLength: car.carLength / 2,
            halfWidth: car.carWidth / 2,
            rotation: 0, // Assume no rotation for simplified collision detection
        };
    }

    /**
     * Check if two hitboxes overlap using simple AABB (Axis-Aligned Bounding Box) detection
     * Assumes cars are axis-aligned (rotation 0)
     *
     * @param h1 - First hitbox
     * @param h2 - Second hitbox
     * @returns True if hitboxes overlap
     */
    private doHitboxesOverlap(h1: Hitbox, h2: Hitbox): boolean {
        // Quick distance check: if cars are far apart, they can't overlap
        const dx = h1.centerX - h2.centerX;
        const dy = h1.centerY - h2.centerY;
        const maxDistance = Math.max(
            h1.halfLength + h1.halfWidth,
            h2.halfLength + h2.halfWidth,
        ) * 2;
        if (dx * dx + dy * dy > maxDistance * maxDistance) {
            return false;
        }

        return (
            Math.abs(h1.centerX - h2.centerX) < h1.halfLength + h2.halfLength &&
            Math.abs(h1.centerY - h2.centerY) < h1.halfWidth + h2.halfWidth
        );
    }

    /**
     * Handle all collisions in a single unified method
     * Uses hitbox-based detection to only detect actual visual overlaps
     *
     * @param cars - All cars in the game
     * @param currentGameTime - Current game time in seconds
     */
    public handleAllCollisions(cars: Car[], currentGameTime: number): void {
        const collisions = this.detectAllCollisions(cars);
        for (const collision of collisions) {
            this.handleCollision(collision, currentGameTime);
        }
    }

    /**
     * Detect all collisions using hitbox overlap detection
     * Only detects collisions when cars actually overlap visually
     *
     * @param cars - All cars in the game
     * @returns Array of detected collisions
     */
    private detectAllCollisions(cars: Car[]): Collision[] {
        const collisions: Collision[] = [];

        for (let i = 0; i < cars.length; i++) {
            for (let j = i + 1; j < cars.length; j++) {
                const car1 = cars[i];
                const car2 = cars[j];

                const hitbox1 = this.getCarHitbox(car1);
                const hitbox2 = this.getCarHitbox(car2);

                if (!this.doHitboxesOverlap(hitbox1, hitbox2)) {
                        continue;
                }

                const sDiff = getWrappedSDiff(car1.s, car2.s, this.trackLength);
                const rear = sDiff < 0 ? car1 : car2;
                const front = sDiff < 0 ? car2 : car1;

                const longitudinalDistance = Math.abs(sDiff);
                const lateralDistance = Math.abs(car1.lateral - car2.lateral);
                const isSideCollision = lateralDistance > longitudinalDistance;

                collisions.push({
                    car1,
                    car2,
                    rear,
                    front,
                    isSideCollision,
                });
            }
        }

        return collisions;
    }

    /**
     * Handle a single collision
     * Applies crash effects and handles based on collision type
     *
     * @param collision - The collision to handle
     * @param currentGameTime - Current game time in seconds
     */
    private handleCollision(collision: Collision, currentGameTime: number): void {
        const { car1, car2, rear, front, isSideCollision } = collision;

        // Apply crash effects to both cars (symmetric) - only clears rewards, no penalties
        this.applyCrashEffects(car1);
        this.applyCrashEffects(car2);

        if (isSideCollision) {
            if (car1.isChangingLanes()) {
                this.laneController.cancelLaneChange(car1, currentGameTime);
            }
            if (car2.isChangingLanes()) {
                this.laneController.cancelLaneChange(car2, currentGameTime);
            }
        } else {
            this.applyMomentumTransfer(rear, front);
            const track = this.gameState.track;
            const epsilon = CollisionController.POSITION_ADJUSTMENT_EPSILON;
            front.s = track.wrapS(front.s + epsilon);
        }
    }

    /**
     * Apply symmetric crash effects to a single car
     * Effects: clear rewards only (no penalties)
     *
     * @param car - The car to apply effects to
     */
    private applyCrashEffects(car: Car): void {
        car.r = 0;
        this.carController.resetPendingRewards(car);
        this.carController.applySlipFactor(car, 0.8);
    }

    /**
     * Apply full momentum transfer physics between two cars
     * Rear car stops completely (velocity goes to 0)
     * Front car gets all momentum from both cars
     * Ensures velocities never go negative (cars never go backwards)
     *
     * @param rear - The car behind (stops completely)
     * @param front - The car ahead (gets all momentum)
     */
    private applyMomentumTransfer(rear: Car, front: Car): void {
        const totalMomentum = rear.v * rear.carLength + front.v * front.carLength;
        rear.v = 0;
        front.v = Math.max(
            0, 
            Math.min(
                totalMomentum / front.carLength,
                CollisionController.MAX_COLLISION_VELOCITY
            )
        );
    }
}
