import type { GameState } from '../models/game-state';
import type { Car } from '../models/car';
import type { Track } from '../models/track';
import { MAX_CAMERA_ROTATION_RATE, CAMERA_ALIGNMENT_THRESHOLD } from '../../const';
import { clamp } from '../../utils/math';

/**
 * Calculate ease-in-out speed factor for camera rotation based on current angular distance
 * Provides a speed profile that eases in (moderate speed when just above threshold) and eases out (slow when near zero)
 * Speed is higher for larger distances and lower for smaller distances, providing smooth acceleration and deceleration
 * 
 * This works with a moving target by using the current distance directly, not a fixed starting distance.
 * The speed factor adapts dynamically as the target rotation changes.
 * 
 * @param absAngularDelta - Current absolute angular distance in radians
 * @param threshold - Alignment threshold (dead zone boundary) in radians
 * @returns Speed factor [minSpeed, 1.0] for rotation, where 1.0 is maximum speed
 */
function calculateEasedSpeedFactor(absAngularDelta: number, threshold: number): number {
    // Use π (180°) as the maximum expected distance for normalization
    // This provides a reasonable scale for the easing curve
    const maxDistance = Math.PI;
    
    // Normalize the current distance to [0, 1] range
    // 0 = at threshold (just started correcting), 1 = at maximum distance (π)
    // Clamp to ensure we don't exceed the expected range
    const distanceFromThreshold = Math.max(0, absAngularDelta - threshold);
    const normalizedDistance = Math.min(1, distanceFromThreshold / (maxDistance - threshold));
    
    // Apply ease-in-out curve using a smooth S-curve (sigmoid-like)
    // This provides: slow start (ease-in), fast middle, slow end (ease-out)
    // Use a cubic ease-in-out function for smooth acceleration/deceleration
    // Formula: t^2 * (3 - 2t) gives a smooth S-curve
    const easedProgress = normalizedDistance * normalizedDistance * (3 - 2 * normalizedDistance);
    
    // Map eased progress to speed factor: [0.4, 1.0]
    // Minimum speed of 0.4 ensures we always make progress (prevents stalling)
    // Maximum speed of 1.0 at large distances provides responsive correction
    const speedFactor = 0.4 + 0.6 * easedProgress;
    
    // Apply additional ease-out when very close to zero (within 2x threshold)
    // This provides smooth deceleration as we approach alignment
    if (absAngularDelta < threshold * 2) {
        // Linear ease-out factor: 1.0 at 2x threshold, 0.3 at threshold (near zero)
        const easeOutRange = threshold * 2;
        const easeOutFactor = 0.3 + 0.7 * (absAngularDelta / easeOutRange);
        return Math.max(0.25, speedFactor * easeOutFactor);
    }
    
    return speedFactor;
}

/**
 * Camera controller class
 * 
 * This class is responsible for updating the camera to follow the player car
 * with smooth rotation that uses distance-based ease-in-out interpolation for natural movement.
 * 
 * Uses a dead zone approach to prevent twitching on low curvature paths:
 * - Camera rotation is allowed to drift from car rotation up to CAMERA_ALIGNMENT_THRESHOLD
 * - When the angular difference is within the threshold (≤ π/32) and not correcting,
 *   no rotation correction is applied (allows drift)
 * - When the angular difference exceeds the threshold (> π/32), correction starts and
 *   the camera smoothly rotates back toward alignment using distance-based ease-in-out
 * - Rotation speed is calculated from the current angular distance, allowing it to work
 *   correctly even when the desired rotation changes (moving target)
 * - Speed eases in when just above threshold and eases out when approaching zero
 * - Once correction starts, it continues until alignment reaches zero (or overshoots),
 *   preventing the camera from getting stuck at the threshold boundary
 * - Camera position always updates smoothly to follow the car
 */
export class CameraController {
    private gameState: GameState;
    private desiredRotation: number = 0;
    private isCorrecting: boolean = false;
    private lastAngularDeltaSign: number = 0;

    /**
     * Constructor
     * 
     * @param gameState - The game state containing the camera
     */
    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.desiredRotation = gameState.camera.rotation;
    }

    /**
     * Normalize an angle to the range [0, 2π)
     * 
     * @param angle - The angle in radians
     * @returns The normalized angle
     */
    private normalizeAngle(angle: number): number {
        let normalized = angle % (2 * Math.PI);
        if (normalized < 0) {
            normalized += 2 * Math.PI;
        }
        return normalized;
    }

    /**
     * Calculate the shortest angular distance between two angles
     * Returns the signed difference in [-π, π] range
     * 
     * @param from - The starting angle in radians
     * @param to - The target angle in radians
     * @returns The shortest angular distance (signed)
     */
    private shortestAngularDistance(from: number, to: number): number {
        const normalizedFrom = this.normalizeAngle(from);
        const normalizedTo = this.normalizeAngle(to);
        let diff = normalizedTo - normalizedFrom;
        
        // Normalize to [-π, π]
        if (diff > Math.PI) {
            diff -= 2 * Math.PI;
        } else if (diff < -Math.PI) {
            diff += 2 * Math.PI;
        }
        
        return diff;
    }

    /**
     * Update the camera to follow the player car with smooth rotation
     * 
     * Implements a dead zone to prevent twitching on low curvature paths:
     * - If angular difference ≤ CAMERA_ALIGNMENT_THRESHOLD and not correcting: no rotation correction (allow drift)
     * - If angular difference > CAMERA_ALIGNMENT_THRESHOLD: start smooth rotation correction with ease-in-out
     * - Rotation speed is calculated from current angular distance, adapting to moving target (desired rotation changes)
     * - Once correcting, continue until alignment reaches zero (or overshoots), preventing stuck at threshold
     * - Camera position always updates smoothly
     * 
     * @param dt - The time step in seconds
     * @param playerCar - The player car to follow
     * @param track - The track to get position and tangent from
     */
    update(dt: number, playerCar: Car, track: Track): void {
        const pos = track.posAt(playerCar.s);
        
        // Calculate desired rotation from track tangent (in radians)
        const tangent = track.tangentAt(playerCar.s);
        this.desiredRotation = Math.atan2(tangent.y, tangent.x);
        
        // Get current camera rotation
        const currentRotation = this.gameState.camera.rotation;
        
        // Calculate the angular difference (shortest path, handles wrapping)
        const angularDelta = this.shortestAngularDistance(currentRotation, this.desiredRotation);
        const absAngularDelta = Math.abs(angularDelta);
        const angularDeltaSign = Math.sign(angularDelta);
        
        // Determine if we should correct rotation
        let shouldCorrect: boolean;
        
        if (this.isCorrecting) {
            // Currently correcting: continue until we reach zero alignment or overshoot
            // Check if we've crossed zero (sign changed) or reached zero (very small difference)
            // Note: lastAngularDeltaSign tracks the sign from the previous frame
            const hasCrossedZero = this.lastAngularDeltaSign !== 0 && angularDeltaSign !== 0 && 
                                   this.lastAngularDeltaSign !== angularDeltaSign;
            const isAtZero = absAngularDelta < 1e-6; // Very small threshold for "at zero"
            
            if (hasCrossedZero || isAtZero) {
                // We've reached zero or overshot, stop correcting and enter dead zone
                this.isCorrecting = false;
                shouldCorrect = false;
                this.lastAngularDeltaSign = 0;
            } else {
                shouldCorrect = true;
            }
        } else {
            // Not currently correcting: check if we need to start
            if (absAngularDelta > CAMERA_ALIGNMENT_THRESHOLD) {
                this.isCorrecting = true;
                shouldCorrect = true;
            } else {
                shouldCorrect = false;
            }
        }
        
        // Update rotation based on correction state
        let newRotation: number;
        if (shouldCorrect) {
            const speedFactor = calculateEasedSpeedFactor(absAngularDelta, CAMERA_ALIGNMENT_THRESHOLD);
            const maxRotationStep = MAX_CAMERA_ROTATION_RATE * dt;
            const easedRotationStep = maxRotationStep * speedFactor;
            const rotationStep = clamp(angularDelta, -easedRotationStep, easedRotationStep);
            newRotation = this.normalizeAngle(currentRotation + rotationStep);
        } else {
            newRotation = currentRotation;
        }
        
        if (this.isCorrecting) {
            if (angularDeltaSign !== 0) {
                this.lastAngularDeltaSign = angularDeltaSign;
            }
        } else {
            this.lastAngularDeltaSign = 0;
        }

        this.gameState.updateCamera({ 
            pos, 
            zoom: this.gameState.camera.zoom, 
            rotation: newRotation 
        });
    }
}
