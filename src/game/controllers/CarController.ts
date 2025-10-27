import type { Track } from '../models/track';
import { Car } from '../models/car';
import type { GameState } from '../models/game-state';

/**
 * Reward event interface
 */
export interface RewardEvent {
    magnitude: number;  // A_k acceleration weight (A_k > 0 for acceleration, A_k < 0 for deceleration)
    timestamp: number;  // t_k timestamp (seconds)
}

export class CarController {
    private gameState: GameState;
    
    private vMin: number = 5;              // minimum progress velocity
    private vMax: number = 10;             // maximum progress velocity
    private aBase: number = 0;              // baseline acceleration
    private tauA: number = 0.5;             // reward smoothing time constant (seconds)
    private beta: number = 30;              // velocity decay rate above vMin
    private kv: number = 5;                 // physical velocity control gain (Kv > 0)
    private kp: number = 2;                 // position control gain (Kp > 0)
    private vBonus: number = 10;            // extra headroom above curvature cap
    private deltaSMax: number = 1;          // max progress step per frame
    private rho: number;                    // exp(-dt/tauA) for discrete smoothing

    constructor(gameState: GameState) {
        this.gameState = gameState;
        const dt = 1 / 60; // assuming 60Hz fixed timestep
        this.rho = Math.exp(-dt / this.tauA);
    }

    /**
     * Initialize all cars (call this once after cars are added)
     */
    initializeCars(): void {
        const cars = this.gameState.getCars();
        for (const car of cars) {
            car.initialize(this.vMin);
        }
    }

    // Step physics for all cars in the game state
    step(dt: number): void {
        const cars = this.gameState.getCars();
        const track = this.gameState.track;
        
        for (const car of cars) {
            this.updateCar(car, dt, track);
        }
    }

    /**
     * Update a single car's physics
     * @param car - The car to update
     * @param dt - The time step in seconds
     * @param track - The track to update the car on
     */
    private updateCar(car: Car, dt: number, track: Track): void {
        // Update lap tracking
        car.updateLaps(track.length);

        // Reward smoothing (first-order filter)
        car.r = this.rho * car.r;  // Exponential decay

        // Velocity decay (negative acceleration modifier)
        const aDecay = car.vProg > this.vMin ? -this.beta : 0;

        // Update progress velocity with decay and clipping
        car.vProg += (this.aBase + car.r + aDecay) * dt;
        const vProgClipped = Math.max(this.vMin, Math.min(this.vMax, car.vProg));

        // Update progress position with max step cap
        const deltaS = Math.min(vProgClipped * dt, this.deltaSMax);
        car.sProg = track.wrapS(car.sProg + deltaS);

        // Update physical/rendered state tracking
        this.updatePhysicalState(car, dt, track);
    }

    /**
     * Update physical rendering state to track progress state
     */
    private updatePhysicalState(car: Car, dt: number, track: Track): void {
        const kappa = this.estimateCurvature(car.sPhys, track);
        const vKappaMax = Math.sqrt((0.8 * 9.81) / (Math.abs(kappa) + 0.01));
        
        // Cap desired velocity by curvature limit, but track vProg directly
        const vDes = Math.min(car.vProg, vKappaMax + this.vBonus);

        // Control acceleration to track desired velocity
        const aT = this.kv * (vDes - car.vPhys);
        car.vPhys += aT * dt;
        car.vPhys = Math.max(0, car.vPhys); // Don't go backward

        // Advance physical position
        car.sPhys = track.wrapS(car.sPhys + car.vPhys * dt);
    }

    /**
     * Estimate curvature at position s using finite differences
     */
    private estimateCurvature(s: number, track: Track): number {
        const eps = 1.0;
        const t1 = track.tangentAt(s - eps);
        const t2 = track.tangentAt(s + eps);
        const dTheta = Math.atan2(
            t1.x * t2.y - t1.y * t2.x,
            t1.x * t2.x + t1.y * t2.y
        );
        return dTheta / (2 * eps);
    }

    /**
     * Get parameters for tuning
     */
    getParams() {
        return {
            vMin: this.vMin,
            vMax: this.vMax,
            aBase: this.aBase,
            tauA: this.tauA,
            beta: this.beta,
            kv: this.kv,
            kp: this.kp,
            vBonus: this.vBonus,
            deltaSMax: this.deltaSMax,
        };
    }

    /**
     * Set parameters for tuning
     */
    setParams(params: Partial<ReturnType<typeof this.getParams>>): void {
        Object.assign(this, params);
        // Recompute rho if tauA changed
        if (params.tauA !== undefined) {
            const dt = 1 / 60;
            this.rho = Math.exp(-dt / params.tauA);
        }
    }
}
