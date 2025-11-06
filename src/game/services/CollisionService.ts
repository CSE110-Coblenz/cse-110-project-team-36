import type { GameState } from '../models/game-state';
import type { Car } from '../models/car';
import type { LaneController } from '../controllers/LaneController';

/**
 * Collision service for detecting collisions between cars
 */
export class CollisionService {
    private readonly collisionThresholdMultiplier = 1;
    private laneIndex: Map<number, Set<Car>> = new Map();
    private readonly trackLength: number;

    constructor(private gameState: GameState) {
        this.trackLength = this.gameState.track.length;
    }

    /**
     * Get full track length (world units)
     */
    public getTrackLength(): number {
        return this.trackLength;
    }

    /**
     * Update lane-based spatial index for all cars
     *
     * @param cars - All cars in the game
     * @param laneController - The lane controller to get effective lanes
     */
    updateLaneIndex(cars: Car[], laneController: LaneController): void {
        this.laneIndex.clear();

        for (const car of cars) {
            const effectiveLanes = laneController.getEffectiveLanes(car);
            for (const lane of effectiveLanes) {
                if (!this.laneIndex.has(lane)) {
                    this.laneIndex.set(lane, new Set());
                }
                this.laneIndex.get(lane)!.add(car);
            }
        }
    }

    /**
     * Check if switching to target lane would cause a sideways collision
     */
    checkSidewaysCollision(car: Car, targetLane: number): boolean {
        const threshold = this.collisionThresholdMultiplier * car.carLength;
        const carsInTargetLane = this.laneIndex.get(targetLane);
        if (!carsInTargetLane) return false;

        for (const otherCar of carsInTargetLane) {
            if (otherCar === car) continue;

            const distance = Math.abs(car.sPhys - otherCar.sPhys);
            const wrappedDistance = Math.min(distance, this.trackLength - distance);
            if (wrappedDistance < threshold) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if two cars are colliding (0 units overlap or more)
     */
    checkCollision(car: Car, otherCar: Car, laneController: LaneController): boolean {
        const carLanes = laneController.getEffectiveLanes(car);
        const otherLanes = laneController.getEffectiveLanes(otherCar);
        const sameLane = carLanes.some(lane => otherLanes.includes(lane));
        if (!sameLane) return false;

        const distance = Math.abs(car.sPhys - otherCar.sPhys);
        const wrappedDistance = Math.min(distance, this.trackLength - distance);
        const collisionThreshold = (car.carLength + otherCar.carLength) / 2;
        if (wrappedDistance > collisionThreshold) return false;

        const wrappedDiff = (a: number, b: number) => {
            const d = a - b;
            const half = this.trackLength / 2;
            return d > half ? d - this.trackLength : (d < -half ? d + this.trackLength : d);
        };
        const wDiff = wrappedDiff(car.sPhys, otherCar.sPhys);
        return wDiff < 0;
    }

    /**
     * Scan all lanes and return rear/front collision pairs for this frame.
     * Uses lane index and adjacency checks to avoid O(n^2). Deduplicates pairs across lanes.
     */
    scanCollisions(cars: Car[], laneController: LaneController): Array<{ rear: Car; front: Car }> {
        const results: Array<{ rear: Car; front: Car }> = [];
        const pairKeys = new Set<string>();
        const indexByCar = new Map<Car, number>();
        for (let i = 0; i < cars.length; i++) indexByCar.set(cars[i], i);

        const wrapDist = (a: number, b: number) => {
            const d = Math.abs(a - b);
            return Math.min(d, this.trackLength - d);
        };

        for (const [, carSet] of this.laneIndex.entries()) {
            if (!carSet || carSet.size < 2) continue;
            const laneCars = Array.from(carSet);
            laneCars.sort((a, b) => a.sPhys - b.sPhys);

            const checkPair = (a: Car, b: Car) => {
                const aLanes = laneController.getEffectiveLanes(a);
                const bLanes = laneController.getEffectiveLanes(b);
                const same = aLanes.some(l => bLanes.includes(l));
                if (!same) return;
                const d = wrapDist(a.sPhys, b.sPhys);
                const threshold = (a.carLength + b.carLength) / 2;
                if (d > threshold) return;
                const half = this.trackLength / 2;
                const sDiff = a.sPhys - b.sPhys;
                const wDiff = sDiff > half ? sDiff - this.trackLength : (sDiff < -half ? sDiff + this.trackLength : sDiff);
                const rear = wDiff < 0 ? a : b;
                const front = wDiff < 0 ? b : a;
                const ra = indexByCar.get(rear)!;
                const fa = indexByCar.get(front)!;
                const key = `${ra}-${fa}`;
                if (pairKeys.has(key)) return;
                pairKeys.add(key);
                results.push({ rear, front });
            };

            for (let i = 0; i < laneCars.length - 1; i++) {
                checkPair(laneCars[i], laneCars[i + 1]);
            }
            checkPair(laneCars[laneCars.length - 1], laneCars[0]);
        }

        return results;
    }
}

