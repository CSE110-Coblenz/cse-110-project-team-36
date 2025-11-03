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

/**
 * Car controller class
 * 
 * This class is responsible for updating the physical state of all cars in the game state.
 * It also handles rewards and pending rewards. See the specification for more details on the math.
 */
export class CarController {
    private gameState: GameState;
    private pendingRewards = new Map<Car, number>();

    private vMin: number = 5;               // v_min
    private vMax: number = 50;              // v_max
    private aBase: number = 0;              // a_base
    private tauA: number = 0.5;             // τ_a (reward smoothing time constant, seconds)
    private beta: number = 30;              // β in a_decay(v) = -β·1_{v>v_min}
    private kv: number = 5;                 // k_v in a_t = k_v (v_des - v_phys)
    private kp: number = 2;                 // k_p in v_des = clip(v_min + k_p e_s, ...)
    private vBonus: number = 10;            // v_bonus
    private deltaSMax: number = 1;          // Δs_max
    private mu: number = 0.8;               // μ (effective friction coefficient)
    private kappaEps: number = 1e-3;        // ε (curvature floor to avoid div by 0)
    private vKappaScale: number = 10;       // γ_κ (scale knob; spec addendum)
    private slipDecay: number = 0.5;        // slip decay rate per second (slower)
    private slipWobbleAmp: number = 25;     // wobble amplitude in degrees (stronger)
    private slipWobbleFreq: number = 2;     // wobble frequency in Hz (slower)
    private baseMu: number = 0.8;           // base friction coefficient
    private slipVelocityDecay: number = 8;  // how quickly slip forces vProg to vMin

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

        // Update skid marks after all car physics
        this.gameState.updateSkidMarks(dt);
    }

    /**
     * Update a single car's physics
     * @param car - The car to update
     * @param dt - The time step in seconds
     * @param track - The track to update the car on
     */
    private updateCar(car: Car, dt: number, track: Track): void {
        car.updateLaps();
        const rPrev = car.r; // r_{k-1}
        // a_decay(v) = -β for v > v_min; else 0
        const aDecay = car.vProg > this.vMin ? -this.beta : 0;
        // Apply slip deceleration to reduce vProg to vMin quickly
        const slipDecel = car.slipFactor > 0 ? -this.slipVelocityDecay * (car.vProg - this.vMin) : 0;
        // v_{k+1} = v_k + (a_base + r_{k-1} + a_decay(v_k) + slip_decel) * dt
        car.vProg += (this.aBase + rPrev + aDecay + slipDecel) * dt;
        // v_prog clipped to [v_min, v_max]
        const vProgClipped = Math.max(this.vMin, Math.min(this.vMax, car.vProg)); 
        // Δs = min(v_prog_clipped * dt, Δs_max)
        const deltaS = Math.min(vProgClipped * dt, this.deltaSMax); 
        // s_{k+1} = wrap(s_k + Δs)
        car.sProg = track.wrapS(car.sProg + deltaS); 
        // rho = exp(-dt / τ_a)
        const rho = Math.exp(-dt / this.tauA); 
        // r_{k+1} = rho * r_k
        car.r = rho * car.r;
        // A_k
        const Ak = this.pendingRewards.get(car) ?? 0; 
        if (Ak !== 0) {
            // r_{k+1} = r_k + A_k
            car.r += Ak; 
            this.pendingRewards.set(car, 0);
        }
    
        this.updatePhysicalState(car, dt, track);
        this.updateSlip(car, dt);
    }
    

    /**
     * Update physical rendering state to track progress state
     * 
     * @param car - The car to update
     * @param dt - The time step in seconds
     * @param track - The track to update the car on
     */
    private updatePhysicalState(car: Car, dt: number, track: Track): void {
        const kappa = this.estimateCurvature(car.sPhys, track);
        // Apply slip to friction: μ_effective = μ * (1 - slipFactor)
        const muEffective = this.baseMu * (1 - car.slipFactor * 0.6); // slip reduces friction by 60%
        // v_kappa_raw = sqrt(μ * g / (|κ| + ε))
        const vKappaRaw = Math.sqrt((muEffective * 9.81) / (Math.abs(kappa) + this.kappaEps));
        // v_kappa_max = γ_κ * v_kappa_raw
        const vKappaMax = this.vKappaScale * vKappaRaw;
        // L = track.length
        const L = track.length;
        // e_s = ((s_prog - s_phys + L / 2) % L + L) % L - L / 2
        const eS = ((car.sProg - car.sPhys + L / 2) % L + L) % L - L / 2;
        // v_des_unclipped = v_min + k_p * e_s
        const vDesUnclipped = this.vMin + this.kp * eS;
        // v_des = max(0, min(v_des_unclipped, v_kappa_max + v_bonus))
        const vDes = Math.max(0, Math.min(vDesUnclipped, vKappaMax + this.vBonus));
        // a_t = k_v * (v_des - v_phys)
        const aT = this.kv * (vDes - car.vPhys);
        // v_phys_{k+1} = v_phys_k + a_t * dt
        car.vPhys += aT * dt;
        // v_phys clipped to 0
        car.vPhys = Math.max(0, car.vPhys);
        // s_phys_{k+1} = wrap(s_phys_k + v_phys_k * dt)
        car.sPhys = track.wrapS(car.sPhys + car.vPhys * dt);
    }

    /**
     * Estimate curvature at position s using finite differences
     * 
     * @param s - The position to estimate the curvature at
     * @param track - The track to estimate the curvature on
     * @returns The curvature at position s
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
     * Queue a reward for a car
     * 
     * @param car - The car to queue the reward for
     * @param magnitude - The magnitude of the reward
     */
    queueReward(car: Car, magnitude: number): void {
        this.pendingRewards.set(car, (this.pendingRewards.get(car) ?? 0) + magnitude);
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
            mu: this.mu,
            kappaEps: this.kappaEps,
            vKappaScale: this.vKappaScale,
        };
    }

    /**
     * Set the parameters for the car controller
     * 
     * @param params - The parameters to set
     */
    setParams(params: Partial<ReturnType<typeof this.getParams>>): void {
        Object.assign(this, params);
    }

    /**
     * Update slip state - decay and wobble, and generate skid marks
     * 
     * @param car - The car to update
     * @param dt - The time step in seconds
     */
    private updateSlip(car: Car, dt: number): void {
        const track = this.gameState.track;
        
        // Decay slip over time
        car.slipFactor = Math.max(0, car.slipFactor - this.slipDecay * dt);
        
        // Update wobble based on slip factor
        if (car.slipFactor > 0) {
            // Oscillating wobble based on frequency
            const wobblePhase = this.slipWobbleFreq * car.sPhys * 0.1; // Use position for phase
            car.slipWobble = car.slipFactor * this.slipWobbleAmp * Math.sin(wobblePhase);
            
            // Generate double skid marks at back corners of car when slipping
            const skidMark = this.gameState.getSkidMarks(car);
            if (skidMark) {
                // Calculate car position and orientation
                const p = track.posAt(car.sPhys);
                const t = track.tangentAt(car.sPhys);
                const n = track.normalAt(car.sPhys);
                
                // Car center position with lateral offset
                const centerPos = {
                    x: p.x + n.x * car.lateral,
                    y: p.y + n.y * car.lateral
                };
                
                // Car angle
                const angle = Math.atan2(t.y, t.x);
                const cosAngle = Math.cos(angle);
                const sinAngle = Math.sin(angle);
                
                // Car dimensions in world units
                const halfLength = car.carLength / 2;
                const halfWidth = car.carWidth / 2;
                
                // Back corner positions (relative to car center)
                const backLeftRel = {
                    x: -halfLength * cosAngle - halfWidth * sinAngle,
                    y: -halfLength * sinAngle + halfWidth * cosAngle
                };
                const backRightRel = {
                    x: -halfLength * cosAngle + halfWidth * sinAngle,
                    y: -halfLength * sinAngle - halfWidth * cosAngle
                };
                
                // Convert to world coordinates
                const backLeft = {
                    x: centerPos.x + backLeftRel.x,
                    y: centerPos.y + backLeftRel.y
                };
                const backRight = {
                    x: centerPos.x + backRightRel.x,
                    y: centerPos.y + backRightRel.y
                };
                
                // Add double skid marks
                skidMark.addPoints(backLeft.x, backLeft.y, backRight.x, backRight.y);
            }
        } else {
            car.slipWobble = 0;
        }
    }

    /**
     * Apply penalty/slip to a car
     * 
     * @param car - The car to apply penalty to
     * @param magnitude - The penalty magnitude (0-1, affects slipFactor)
     */
    applyPenalty(car: Car, magnitude: number): void {
        car.slipFactor = Math.min(1, car.slipFactor + magnitude);
    }
}
