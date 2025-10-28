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
    private pendingRewards = new Map<Car, number>();

    private vMin: number = 5;               // minimum progress velocity
    private vMax: number = 50;              // maximum progress velocity
    private aBase: number = 0;              // baseline acceleration
    private tauA: number = 0.5;             // reward smoothing time constant (seconds)
    private beta: number = 30;              // velocity decay rate above vMin
    private kv: number = 5;                 // physical velocity control gain (Kv > 0)
    private kp: number = 2;                 // position control gain (Kp > 0)
    private vBonus: number = 10;            // extra headroom above curvature cap
    private deltaSMax: number = 1;          // max progress step per frame
    private mu: number = 0.8;               // friction coeff used in v_kappa,max
    private kappaEps: number = 1e-3;        // small curvature floor (smaller than 0.01)
    private vKappaScale: number = 10;       // simple multiplicative scale on the cap

    constructor(gameState: GameState) {
        this.gameState = gameState;
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
        car.updateLaps(track.length);
        const rPrev = car.r;
        const aDecay = car.vProg > this.vMin ? -this.beta : 0;
        car.vProg += (this.aBase + rPrev + aDecay) * dt;
        const vProgClipped = Math.max(this.vMin, Math.min(this.vMax, car.vProg));
        const deltaS = Math.min(vProgClipped * dt, this.deltaSMax);
        car.sProg = track.wrapS(car.sProg + deltaS);
    
        const rho = Math.exp(-dt / this.tauA);
        car.r = rho * car.r;
        const Ak = this.pendingRewards.get(car) ?? 0;
        if (Ak !== 0) {
            car.r += Ak;
            this.pendingRewards.set(car, 0);
        }
    
        this.updatePhysicalState(car, dt, track);
    }
    

    /**
     * Update physical rendering state to track progress state
     */
    private updatePhysicalState(car: Car, dt: number, track: Track): void {
        // curvature at current physical position
        const kappa = this.estimateCurvature(car.sPhys, track);

        // curvature-based velocity cap, with a tunable scale
        const vKappaRaw = Math.sqrt((this.mu * 9.81) / (Math.abs(kappa) + this.kappaEps));
        const vKappaMax = this.vKappaScale * vKappaRaw;

        // wrapped progress->physical error e_s in (-L/2, L/2]
        const L = track.length;
        let eS = car.sProg - car.sPhys;
        eS = ((eS + L / 2) % L + L) % L - L / 2;

        // desired speed: v_min + k_p * e_s, clipped by curvature cap + bonus
        const vDesUnclipped = this.vMin + this.kp * eS;
        const vDes = Math.max(0, Math.min(vDesUnclipped, vKappaMax + this.vBonus));

        // simple velocity controller
        const aT = this.kv * (vDes - car.vPhys);
        car.vPhys += aT * dt;
        if (car.vPhys < 0) car.vPhys = 0;

        // advance physical position
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

    queueReward(car: Car, magnitude: number): void {
        this.pendingRewards.set(car, (this.pendingRewards.get(car) ?? 0) + magnitude);
    }

    queueRewardByIndex(index: number, magnitude: number): void {
        const cars = this.gameState.getCars();
        if (index >= 0 && index < cars.length) {
            this.queueReward(cars[index], magnitude);
        }
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
    }
}
