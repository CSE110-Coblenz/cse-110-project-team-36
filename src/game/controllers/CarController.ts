import type { Track } from '../models/track';
import { Car } from '../models/car';
import type { GameState } from '../models/game-state';
import type { PhysicsConfig } from '../config/types';
import { clamp } from '../../utils/math';

/**
 * Reward event interface
 */
export interface RewardEvent {
    magnitude: number; // A_k acceleration weight (A_k > 0 for acceleration, A_k < 0 for deceleration)
    timestamp: number; // t_k timestamp (seconds)
}

/**
 * Car controller class
 *
 * This class is responsible for updating the physical state of all cars in the game state.
 * It also handles rewards and pending rewards. See the specification for more details on the math.
 */
export class CarController {
    private gameState: GameState;
    private pendingRewards = new Map<Car, number>();
    private config: PhysicsConfig;

    constructor(gameState: GameState, physicsConfig: PhysicsConfig) {
        this.gameState = gameState;
        this.config = physicsConfig;
    }

    /**
     * Get the physics configuration
     *
     * @returns The physics configuration
     */
    public getConfig(): PhysicsConfig {
        return this.config;
    }

    /**
     * Initialize all cars (call this once after cars are added)
     */
    initializeCars(): void {
        const cars = this.gameState.getCars();
        for (const car of cars) {
            car.initialize(this.config.vMin);
        }
    }

    /**
     * Step physics for all cars in the game state
     *
     * @param dt - Time step in seconds
     */
    step(dt: number): void {
        const cars = this.gameState.getCars();
        const track = this.gameState.track;
        for (const car of cars) {
            this.updateCar(car, dt, track);
        }
    }

    /**
     * Update a single car: laps + unified physics.
     * @param car - The car to update
     * @param dt - The time step in seconds
     * @param track - The track to update the car on
     */
    private updateCar(car: Car, dt: number, track: Track): void {
        car.updateLaps();
        this.updateCarPosition(car, dt, track);
    }

    /**
     * Car position updating
     *
     * @param car - The car to update
     * @param dt - The time step in seconds
     * @param track - The track to update the car on
     */
    private updateCarPosition(car: Car, dt: number, track: Track): void {
        if ( car.inPitStop ) {
            car.v = 0;
            car.r = 0

            this.pendingRewards.set(car, 0);
            return;
        } else {
            const v = car.v;
            const s = car.s;

            // 1. Reward smoothing: r_{k+1} = ρ r_k + Σ A_k
            const rho = Math.exp(-dt / this.config.tauA);
            car.r = rho * car.r;

            // 2. Consume pending reward impulse(s): add A_k into r
            const Ak = this.pendingRewards.get(car) ?? 0;
            if (Ak !== 0) {
                car.r += Ak;
                this.pendingRewards.set(car, 0);
            }

            // 3. Base + reward + decay + slowdown penalty accelerations (unconstrained)
            // Decay: a_decay(v) = -β 1_{v > vMin}
            const aDecay = v > this.config.vMin ? -this.config.beta : 0;

            // Slowdown penalty deceleration toward vMin
            const slowdownDecel =
                car.slowdownPenalty > 0
                    ? -this.config.slipVelocityDecay * (v - this.config.vMin)
                    : 0;

            // Unconstrained acceleration
            const aUn =
                this.config.aBase + // baseline
                car.r + // smoothed reward
                aDecay + // decay toward vMin
                slowdownDecel; // slowdown penalties

            // 4. Curvature-based speed cap with effective friction depending on slowdown penalty
            const kappa = track.curvatureAt(s);
            const muEffective = this.config.baseMu * (1 - car.slowdownPenalty * 0.6);

            // Decay slowdown penalty over time
            car.slowdownPenalty = Math.max(
                0,
                car.slowdownPenalty - this.config.slipDecay * dt,
            );
            const vKappaRaw = Math.sqrt(
                (muEffective * 9.81) / (Math.abs(kappa) + this.config.kappaEps),
            );
            const vKappaMax = this.config.vKappaScale * vKappaRaw;
            const vCap = vKappaMax + this.config.vBonus;

            // 5. Soft braking:
            //    vTemp = v + aUn * dt
            //    a_brake = -kKappaBrake * max(0, vTemp - vCap)
            //    vNext = clamp(vTemp + a_brake * dt, 0, vMax)
            const vTemp = v + aUn * dt;

            const overspeed = Math.max(0, vTemp - vCap);
            const aBrake = -this.config.kKappaBrake * overspeed;
            let vNext = vTemp + aBrake * dt;

            // Global clamps
            vNext = Math.max(this.config.vMin, clamp(vNext, 0, this.config.vMax));

            // 6. Optionally enforce a floor for motion; vUsed is what we integrate s with
            const vUsed = Math.max(this.config.vMin, vNext);

            // 7. Commit back to car (authoritative state)
            car.v = vNext;
            car.s = track.wrapS(s + vUsed * dt);
        }
    }

    /**
     * Queue a reward for a car
     *
     * @param car - The car to queue the reward for
     * @param magnitude - The magnitude of the reward
     */
    queueReward(car: Car, magnitude: number): void {
        this.pendingRewards.set(
            car,
            (this.pendingRewards.get(car) ?? 0) + magnitude,
        );
    }

    /**
     * Queue a reward for a car by index
     *
     * @param index - The index of the car to queue the reward for
     * @param magnitude - The magnitude of the reward
     */
    queueRewardByIndex(index: number, magnitude: number): void {
        const cars = this.gameState.getCars();
        if (index >= 0 && index < cars.length) {
            this.queueReward(cars[index], magnitude);
        }
    }

    /**
     * Get the parameters for the car controller
     *
     * @returns The parameters for the car controller
     */
    getParams(): PhysicsConfig {
        return { ...this.config };
    }

    /**
     * Set the parameters for the car controller
     *
     * @param params - The parameters to set
     */
    setParams(params: Partial<PhysicsConfig>): void {
        this.config = { ...this.config, ...params };
    }

    /**
     * Apply visual slip effect to a car 
     *
     * @param car - The car to apply slip to
     * @param magnitude - The slip magnitude (0-1, affects slipFactor for visual effects)
     */
    applySlipFactor(car: Car, magnitude: number): void {
        car.slipFactor = Math.min(1, car.slipFactor + magnitude);
    }

    /**
     * Apply slowdown penalty to a car (for speed reduction only)
     *
     * @param car - The car to apply slowdown penalty to
     * @param magnitude - The penalty magnitude (0-1, affects slowdownPenalty for speed reduction)
     */
    applySlowdownPenalty(car: Car, magnitude: number): void {
        car.slowdownPenalty = Math.min(1, car.slowdownPenalty + magnitude);
    }

    /**
     * Reset pending rewards for a car
     *
     * @param car - The car to reset pending rewards for
     */
    public resetPendingRewards(car: Car): void {
        this.pendingRewards.set(car, 0);
    }
}
