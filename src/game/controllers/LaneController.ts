import type { GameState } from '../models/game-state';
import type { Car } from '../models/car';
import type { Track } from '../models/track';
import { CarController } from './CarController';
import { CollisionService } from '../services/CollisionService';

/**
 * Ease-in-out cubic interpolation function
 */
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Derivative of ease-in-out cubic interpolation function
 * Used for velocity calculation
 */
function easeInOutCubicDerivative(t: number): number {
    if (t < 0.5) {
        return 12 * t * t;  // derivative of 4t³
    } else {
        return 12 * t * t - 24 * t + 12;  // derivative of 1 - (-2t + 2)³/2
    }
}

/**
 * Interpolate lane change position and velocity based on starting offset and velocity, and target
 * offset and duration. Progress is the normalized time of the lane change, between 0 and 1.
 * 
 * @param params - Interpolation parameters
 * @returns Interpolated offset and velocity
 */
function interpolateLaneChange(params: {
    startOffset: number;         // Starting lateral offset (world units)
    targetOffset: number;        // Target lateral offset (world units)
    startVelocity: number;       // Starting lateral velocity (world units/sec)
    progress: number;            // Normalized progress [0, 1], precondition: 0 <= progress <= 1
    duration: number;            // Total duration of lane change (seconds)
}): { offset: number; velocity: number; } {
    const { startOffset, targetOffset, startVelocity, progress, duration } = params;
    const easedProgress = easeInOutCubic(progress);
    const offset = startOffset + (targetOffset - startOffset) * easedProgress;
    const easingVelocity = (targetOffset - startOffset) * easeInOutCubicDerivative(progress) / duration;
    const velocity = easingVelocity + startVelocity * (1 - easedProgress);
    return { offset, velocity };
}

/**
 * Lane controller for managing lane changes
 */
export class LaneController {
    constructor(
        private gameState: GameState,
        private carController: CarController,
        private collisionService: CollisionService
    ) {}

    /**
     * Attempt to switch lanes for a car using direction-based queue
     * 
     * @param car - The car to switch lanes
     * @param direction - -1 for left, 1 for right
     * @param currentGameTime - Current game time in seconds
     * @returns True if lane change was initiated, false if blocked
     */
    switchLane(car: Car, direction: -1 | 1, currentGameTime: number): boolean {
        const track = this.gameState.track;
        car.pendingLaneChanges += direction;
        const targetLane = car.laneIndex + car.pendingLaneChanges;
        if (targetLane < 0 || targetLane >= track.numLanes) {
            // Invalid target - revert change and apply penalty
            car.pendingLaneChanges -= direction;
            this.carController.applyPenalty(car, 0.8);
            return false;
        }
        if (this.collisionService.checkSidewaysCollision(car, targetLane)) {
            // Collision detected - revert change and apply penalty
            car.pendingLaneChanges -= direction;
            this.carController.applyPenalty(car, 0.8);
            return false;
        }
        if (!this.resolveLaneChangeConflict(car, targetLane)) {
            // Conflict detected - revert change (penalty already applied in resolveLaneChangeConflict)
            car.pendingLaneChanges -= direction;
            return false;
        }

        // Capture current state for smooth interruptions
        const currentState = this.getLaneChangeState(car, track, currentGameTime);
        car.laneChangeStartOffset = currentState.offset;
        car.laneChangeStartVelocity = currentState.velocity;
        
        car.targetLaneIndex = targetLane;
        car.laneChangeStartTime = currentGameTime;
        return true;
    }

    /**
     * Get wrapped signed difference between two s positions
     * Returns positive if s1 is ahead of s2. Normalized to [-trackLength/2, trackLength/2].
     * 
     * @param s1 - First position
     * @param s2 - Second position
     * @param trackLength - Total track length
     * @returns Signed difference accounting for wrapping
     */
    public getWrappedSDiff(s1: number, s2: number, trackLength: number): number {
        const diff = s1 - s2;
        if (diff > trackLength / 2) {
            return diff - trackLength;
        } else if (diff < -trackLength / 2) {
            return diff + trackLength;
        }
        return diff;
    }

    /**
     * Resolve conflicts for lane change requests
     * Position (s) is the sole decider
     * 
     * @param car - The car attempting to change lanes
     * @param targetLane - The target lane index
     * @param currentGameTime - Current game time in seconds
     * @returns True if lane change should proceed, false if blocked
     */
    private resolveLaneChangeConflict(car: Car, targetLane: number): boolean {
        const cars = this.gameState.getCars();
        const trackLength = this.gameState.track.length;
        const positionThreshold = 0.1; // Threshold for considering cars at same position
        
        for (const otherCar of cars) {
            if (otherCar === car) continue;
            
            // Also check cars already in the target lane
            if (!otherCar.isChangingLanes() && otherCar.laneIndex === targetLane) {
                const wrappedSDiff = this.getWrappedSDiff(car.s, otherCar.s, trackLength);
                const threshold = (car.carLength + otherCar.carLength) * 1.5 / 2;
                
                if (Math.abs(wrappedSDiff) < threshold) {
                    this.carController.applyPenalty(car, 0.8);
                    return false;
                }
            }

            // Check if other car is changing to same target lane
            if (otherCar.isChangingLanes() && otherCar.targetLaneIndex === targetLane) {
                const wrappedSDiff = this.getWrappedSDiff(car.s, otherCar.s, trackLength);
                
                // If car is behind other car (wrappedSDiff < -threshold), deny
                if (wrappedSDiff < -positionThreshold) {
                    this.carController.applyPenalty(car, 0.8);
                    return false;
                }
                
                // If cars are at same position (within threshold), deny later attempt (temporal order)
                if (Math.abs(wrappedSDiff) <= positionThreshold) {
                    this.carController.applyPenalty(car, 0.8);
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Update lane changes for all cars (called from RaceController.step)
     * 
     * @param currentGameTime - Current game time in seconds
     */
    updateLaneChanges(currentGameTime: number): void {
        const cars = this.gameState.getCars();
        const track = this.gameState.track;

        for (const car of cars) {
            // Compute current lateral state for every car and write to car.lateral
            const state = this.getLaneChangeState(car, track, currentGameTime);
            car.lateral = state.offset;

            if (car.laneChangeStartTime === null) continue;

            // Check if lane change is complete
            const elapsed = currentGameTime - car.laneChangeStartTime;
            if (elapsed >= car.laneChangeDuration) {
                car.laneIndex = car.targetLaneIndex!;
                car.pendingLaneChanges = 0;
                car.targetLaneIndex = null;
                car.laneChangeStartTime = null;
                car.laneChangeStartOffset = null;
                car.laneChangeStartVelocity = null;
                car.lateral = track.getLaneOffset(car.laneIndex);
            }
        }
    }

    /**
     * Get the effective lane indices a car is currently in
     * During lane change, car is in both source and target lanes
     * 
     * @param car - The car to check
     * @returns Array of lane indices the car is in
     */
    getEffectiveLanes(car: Car): number[] {
        if (!car.isChangingLanes()) {
            return [car.laneIndex];
        }
        const sourceLane = car.laneIndex;
        const targetLane = car.targetLaneIndex!;
        
        if (sourceLane === targetLane) {
            return [sourceLane];
        }
        const lanes: number[] = [];
        const start = Math.min(sourceLane, targetLane);
        const end = Math.max(sourceLane, targetLane);
        for (let i = start; i <= end; i++) {
            lanes.push(i);
        }
        return lanes;
    }

    /**
     * Get the current lane change state (position and velocity)
     * Internal method used for both position and velocity calculations
     * 
     * @param car - The car to get state for
     * @param track - The track
     * @param currentGameTime - Current game time in seconds
     * @returns Object with offset and velocity
     */
    private getLaneChangeState(car: Car, track: Track, currentGameTime: number): { offset: number; velocity: number; } {
        if (car.laneChangeStartTime === null || car.targetLaneIndex === null) {
            return {
                offset: track.getLaneOffset(car.laneIndex),
                velocity: 0
            };
        }
        const progress = car.getLaneChangeProgress(currentGameTime);
        const startOffset = car.laneChangeStartOffset !== null 
            ? car.laneChangeStartOffset 
            : track.getLaneOffset(car.laneIndex);
        const startVelocity = car.laneChangeStartVelocity !== null ? car.laneChangeStartVelocity : 0;
        const targetOffset = track.getLaneOffset(car.targetLaneIndex);
        return interpolateLaneChange({
            startOffset,
            targetOffset,
            startVelocity,
            progress,
            duration: car.laneChangeDuration
        });
    }

    /**
     * Get the lateral offset from centerline for rendering
     * Handles smooth reversals through current position
     * 
     * @param car - The car to get offset for
     * @param track - The track
     * @param currentGameTime - Current game time in seconds
     * @returns Lateral offset in world units
     */
    getLaneOffset(car: Car, track: Track, currentGameTime: number): number {
        return this.getLaneChangeState(car, track, currentGameTime).offset;
    }

    /**
     * Get the lateral velocity for lane change
     * 
     * @param car - The car to get velocity for
     * @param track - The track
     * @param currentGameTime - Current game time in seconds
     * @returns Lateral velocity in world units per second
     */
    getLaneChangeVelocity(car: Car, track: Track, currentGameTime: number): number {
        return this.getLaneChangeState(car, track, currentGameTime).velocity;
    }
}

