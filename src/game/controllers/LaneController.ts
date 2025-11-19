import type { GameState } from '../models/game-state';
import type { Car } from '../models/car';
import type { Track } from '../models/track';
import { CarController } from './CarController';

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
    return 12 * t * t; // derivative of 4t³
  } else {
    return 12 * t * t - 24 * t + 12; // derivative of 1 - (-2t + 2)³/2
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
  startOffset: number; // Starting lateral offset (world units)
  targetOffset: number; // Target lateral offset (world units)
  startVelocity: number; // Starting lateral velocity (world units/sec)
  progress: number; // Normalized progress [0, 1], precondition: 0 <= progress <= 1
  duration: number; // Total duration of lane change (seconds)
}): { offset: number; velocity: number } {
  const { startOffset, targetOffset, startVelocity, progress, duration } =
    params;
  const easedProgress = easeInOutCubic(progress);
  const offset = startOffset + (targetOffset - startOffset) * easedProgress;
  const easingVelocity =
    ((targetOffset - startOffset) * easeInOutCubicDerivative(progress)) /
    duration;
  const velocity = easingVelocity + startVelocity * (1 - easedProgress);
  return { offset, velocity };
}

/**
 * Lane controller for managing lane changes
 */
export class LaneController {
    constructor(
        private gameState: GameState,
        private carController: CarController
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

        const currentState = this.getLaneChangeState(car, track, currentGameTime);
        car.laneChangeStartOffset = currentState.offset;
        car.laneChangeStartVelocity = currentState.velocity;
        
        car.targetLaneIndex = targetLane;
        car.laneChangeStartTime = currentGameTime;
        return true;
    }

    /**
     * Cancel a lane change and boot car back to source lane
     * 
     * @param car - The car to cancel lane change for
     */
    cancelLaneChange(car: Car): void {
        const track = this.gameState.track;
        
        // Reset lane change state
        car.targetLaneIndex = null;
        car.laneChangeStartTime = null;
        car.pendingLaneChanges = 0;
        car.laneChangeStartOffset = null;
        car.laneChangeStartVelocity = null;
        
        // Boot back to source lane (current laneIndex is the source)
        car.lateral = track.getLaneOffset(car.laneIndex);
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
     * During lane change, car is only in the two lanes it's actively transitioning between
     * 
     * @param car - The car to check
     * @param currentGameTime - Current game time in seconds
     * @returns Array of lane indices the car is in
     */
    getEffectiveLanes(car: Car, currentGameTime: number): number[] {
        if (!car.isChangingLanes()) {
            return [car.laneIndex];
        }
        const sourceLane = car.laneIndex;
        const targetLane = car.targetLaneIndex!;
        
        if (sourceLane === targetLane) {
            return [sourceLane];
        }
        
        // Calculate which two-lane segment the car is currently in
        const progress = car.getLaneChangeProgress(currentGameTime);
        const numLanesToCross = Math.abs(targetLane - sourceLane);
        
        // If progress is 1.0, car has completed the change - only in target lane
        if (progress >= 1.0) {
            return [targetLane];
        }
        
        // Calculate which segment we're in (0 to numLanesToCross - 1)
        const segmentIndex = Math.floor(progress * numLanesToCross);
        
        // Determine the two lanes for this segment
        const direction = targetLane > sourceLane ? 1 : -1;
        const currentSegmentStartLane = sourceLane + segmentIndex * direction;
        const currentSegmentEndLane = currentSegmentStartLane + direction;
        
        return [currentSegmentStartLane, currentSegmentEndLane];
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
  private getLaneChangeState(
    car: Car,
    track: Track,
    currentGameTime: number
  ): { offset: number; velocity: number } {
    if (car.laneChangeStartTime === null || car.targetLaneIndex === null) {
      return {
        offset: track.getLaneOffset(car.laneIndex),
        velocity: 0,
      };
    }
    const progress = car.getLaneChangeProgress(currentGameTime);
    const startOffset =
      car.laneChangeStartOffset !== null
        ? car.laneChangeStartOffset
        : track.getLaneOffset(car.laneIndex);
    const startVelocity =
      car.laneChangeStartVelocity !== null ? car.laneChangeStartVelocity : 0;
    const targetOffset = track.getLaneOffset(car.targetLaneIndex);
    return interpolateLaneChange({
      startOffset,
      targetOffset,
      startVelocity,
      progress,
      duration: car.laneChangeDuration,
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
  getLaneChangeVelocity(
    car: Car,
    track: Track,
    currentGameTime: number
  ): number {
    return this.getLaneChangeState(car, track, currentGameTime).velocity;
  }
}
