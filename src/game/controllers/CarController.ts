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
    private vMax: number = 500;             // v_max
    private aBase: number = 0;              // a_base
    private tauA: number = 0.5;             // τ_a (reward smoothing time constant, seconds)
    private beta: number = 30;              // β in a_decay(v) = -β·1_{v>v_min}
    private vBonus: number = 10;            // v_bonus
    private kappaEps: number = 1e-3;        // ε (curvature floor to avoid div by 0)
    private vKappaScale: number = 10;       // γ_κ (scale knob; spec addendum)
    private slipDecay: number = 0.5;        // slip decay rate per second (slower)
    private slipWobbleAmp: number = 25;     // wobble amplitude in degrees (stronger)
    private slipWobbleFreq: number = 2;     // wobble frequency in Hz (slower)
    private baseMu: number = 0.8;           // base friction coefficient
    private slipVelocityDecay: number = 8;  // how quickly slip forces v down to vMin
    private momentumTransfer: number = 0.3; // how much momentum is transferred to the front car in crash

    // Soft braking gain for curvature overspeed: a_brake = -kKappaBrake * max(0, vTemp - vCap)
    private kKappaBrake: number = 10;

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
        this.gameState.updateSkidMarks(dt);
    }

    /**
     * Update a single car: laps + unified physics + slip/skid visuals.
     * @param car - The car to update
     * @param dt - The time step in seconds
     * @param track - The track to update the car on
     */
    private updateCar(car: Car, dt: number, track: Track): void {
        car.updateLaps();
        this.updateCarPosition(car, dt, track);
        this.updateSlip(car, dt);
    }

    /**
     * Car position updating
     * 
     * @param car - The car to update
     * @param dt - The time step in seconds
     * @param track - The track to update the car on
     */
    private updateCarPosition(car: Car, dt: number, track: Track): void {
        const v = car.v;
        const s = car.s;

        // 1. Reward smoothing: r_{k+1} = ρ r_k + Σ A_k
        const rho = Math.exp(-dt / this.tauA);
        car.r = rho * car.r;

        // 2. Consume pending reward impulse(s): add A_k into r
        const Ak = this.pendingRewards.get(car) ?? 0;
        if (Ak !== 0) {
            car.r += Ak;
            this.pendingRewards.set(car, 0);
        }

        // 3. Base + reward + decay + slip accelerations (unconstrained)
        // Decay: a_decay(v) = -β 1_{v > vMin}
        const aDecay = v > this.vMin ? -this.beta : 0;

        // Slip extra deceleration toward vMin
        const slipDecel = car.slipFactor > 0 ? -this.slipVelocityDecay * (v - this.vMin) : 0;

        // Unconstrained acceleration
        const aUn =
            this.aBase +       // baseline
            car.r +            // smoothed reward
            aDecay +           // decay toward vMin
            slipDecel;         // slip penalties

        // 4. Curvature-based speed cap with effective friction depending on slip
        const kappa = track.curvatureAt(s);
        const muEffective = this.baseMu * (1 - car.slipFactor * 0.6);
        const vKappaRaw = Math.sqrt(
            (muEffective * 9.81) / (Math.abs(kappa) + this.kappaEps)
        );
        const vKappaMax = this.vKappaScale * vKappaRaw;
        const vCap = vKappaMax + this.vBonus;

        // 5. Soft braking:
        //    vTemp = v + aUn * dt
        //    a_brake = -kKappaBrake * max(0, vTemp - vCap)
        //    vNext = clamp(vTemp + a_brake * dt, 0, vMax)
        const vTemp = v + aUn * dt;

        const overspeed = Math.max(0, vTemp - vCap);
        const aBrake = -this.kKappaBrake * overspeed;
        let vNext = vTemp + aBrake * dt;

        // Global clamps
        vNext = Math.max(0, Math.min(vNext, this.vMax));

        // 6. Optionally enforce a floor for motion; vUsed is what we integrate s with
        const vUsed = Math.max(this.vMin, vNext);

        // 7. Commit back to car (authoritative state)
        car.v = vNext;
        car.s = track.wrapS(s + vUsed * dt);
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
            vBonus: this.vBonus,
            kappaEps: this.kappaEps,
            vKappaScale: this.vKappaScale,
            slipDecay: this.slipDecay,
            slipWobbleAmp: this.slipWobbleAmp,
            slipWobbleFreq: this.slipWobbleFreq,
            baseMu: this.baseMu,
            slipVelocityDecay: this.slipVelocityDecay,
            momentumTransfer: this.momentumTransfer,
            kKappaBrake: this.kKappaBrake,
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
            const wobblePhase = this.slipWobbleFreq * car.s * 0.1;
            car.slipWobble = car.slipFactor * this.slipWobbleAmp * Math.sin(wobblePhase);
            
            const skidMark = this.gameState.getSkidMarks(car);
            if (skidMark) {
                // TODO: clean this up into utils
                const p = track.posAt(car.s);
                const t = track.tangentAt(car.s);
                const n = track.normalAt(car.s);
                const laneOffset = car.lateral;
                const centerPos = {
                    x: p.x + n.x * laneOffset,
                    y: p.y + n.y * laneOffset
                };
                const angle = Math.atan2(t.y, t.x);
                const cosAngle = Math.cos(angle);
                const sinAngle = Math.sin(angle);
                const halfLength = car.carLength / 2;
                const halfWidth = car.carWidth / 2;
                const backLeftRel = {
                    x: -halfLength * cosAngle - halfWidth * sinAngle,
                    y: -halfLength * sinAngle + halfWidth * cosAngle
                };
                const backRightRel = {
                    x: -halfLength * cosAngle + halfWidth * sinAngle,
                    y: -halfLength * sinAngle - halfWidth * cosAngle
                };
                const backLeft = {
                    x: centerPos.x + backLeftRel.x,
                    y: centerPos.y + backLeftRel.y
                };
                const backRight = {
                    x: centerPos.x + backRightRel.x,
                    y: centerPos.y + backRightRel.y
                };
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

    /**
     * Reset pending rewards for a car
     * 
     * @param car - The car to reset pending rewards for
     */
    public resetPendingRewards(car: Car): void {
        this.pendingRewards.set(car, 0);
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
        rear.v = this.vMin;
        rear.r = 0;
        this.resetPendingRewards(rear);
        rear.slipFactor = Math.min(1, rear.slipFactor + 0.8);

        const momentum = originalRearV * rear.carLength;
        const speedBump = (momentum * this.momentumTransfer) / front.carLength;
        front.v = Math.min(front.v + speedBump, this.vMax * 1.5);
        front.r = 0;
        this.resetPendingRewards(front);
        front.slipFactor = Math.min(1, front.slipFactor + 0.8);
    }
}
