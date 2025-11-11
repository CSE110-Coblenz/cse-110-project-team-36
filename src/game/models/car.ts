import {
    FUEL_CONSUMP_PER_SEC,
    IDLE_FUEL_CONSUMP_PER_SEC,
    TIRE_WEAR_PER_LAP,
    FUEL_PIT_THRESHOLD,
    TIRE_PIT_THRESHOLD
} from "../../const";
import type { Track } from "./track";

/**
 * Car class
 * 
 * 
 * This class represents a car in the game.
 */
export class Car {
    public sProg: number = 0;           // along-track position [0, L)
    public vProg: number = 0;           // progress velocity
    public r: number = 0;               // smoothed reward state

    public sPhys: number = 0;           // physical along-track position
    public vPhys: number = 0;           // physical velocity
    public lateral: number = 0;         // lateral offset (world units)

    public slipFactor: number = 0;      // slip state [0, 1] for slip effect
    public slipWobble: number = 0;      // angular wobble for slip effect

    public color: string = '#22c55e';   // car color
    public carLength: number = 40;      // car size (world units)
    public carWidth: number = 22;

    public laneIndex: number = 0;       // current lane index (0 = leftmost)
    public targetLaneIndex: number | null = null;  // target lane during lane change
    public laneChangeStartTime: number | null = null;  // game time (seconds) when lane change started
    public laneChangeDuration: number = 1.0;  // duration of lane change in seconds
    public pendingLaneChanges: number = 0;  // net lane changes requested (direction-based queue)
    public laneChangeStartOffset: number | null = null;  // lateral offset (world units) where lane change started from (for smooth interruptions)
    public laneChangeStartVelocity: number | null = null;  // lateral velocity (world units/sec) when lane change started (for smooth interruptions)
    public crashedThisFrame: boolean = false;  // flag to indicate crash occurred this frame (skip physics smoothing)

    public lapCount: number = 0; // so this should be in racecontrol but for now leave it.
    private lastSProg: number = 0;
    private crossedFinish: boolean = false;

    public fuel: number; // 0..100 %
    public tireLife: number; //  0..100 %
    public pitRequired: boolean; // indicator for pit stop
    public inPitLane: boolean = false; // indicator that player is in pit stop
    public speedLimiter?: boolean; // limits the speed in pit lane
    



    /**
     * Constructor
     * 
     * @param initialS - The initial along-track position
     * @param color - The color of the car
     * @param carLength - The length of the car
     * @param carWidth - The width of the car
     * @param laneIndex - The initial lane index (defaults to center lane, will be set by track)
     */
    constructor(
        initialS: number = 0,
        color: string = '#22c55e',
        carLength: number = 40,
        carWidth: number = 22,
        laneIndex?: number,
        fuel: number = 100,

    ) {
        this.sProg = initialS;
        this.sPhys = initialS;
        this.lastSProg = initialS;
        this.color = color;
        this.carLength = carLength;
        this.carWidth = carWidth;
        if (laneIndex !== undefined) {
            this.laneIndex = laneIndex;
        }

        /**
         * pit stop related defaults
         */
        this.fuel = fuel; //start full tank
        this.tireLife = 100; //start perfect condition
        this.pitRequired = false; // no pit req
        this.inPitLane = false; // not in pit
        this.speedLimiter = false; // limiter off
    }

    /**
     * Initialize velocities (called once by the physics controller)
     * 
     * @param vMin - The minimum velocity
     */
    initialize(vMin: number) {
        this.vProg = vMin;
        this.vPhys = vMin;
    }

    /**
     * Check for lap completion based on crossing the finish line (s=0)
     */
    updateLaps() {
        if (!this.crossedFinish && this.lastSProg > this.sProg) {
            this.lapCount++;
            if (this.lapCount >= 3) {
                this.crossedFinish = true;
            }
        }
        this.lastSProg = this.sProg;
    }

    /**
     * Update car consumables (fuel and tire wear)
     * this is located here because we have other components
     * of the race coupled with car. Interface would be ideal
     * but for now its cool.
     * 
     * @param dt - time delta in seconds
     */
    updateConsumables(dt: number, lapCompleted: boolean = false): void {
        const isIdle = this.vPhys <= 6;
        if (isIdle) {
            this.fuel = Math.max(0, this.fuel - IDLE_FUEL_CONSUMP_PER_SEC * dt);
        }
        else {
            this.fuel = Math.max(0, this.fuel - FUEL_CONSUMP_PER_SEC * dt);
        }
        // Tire wear happens per lap (or tweak as you like)
        if (lapCompleted) {
            this.tireLife = Math.max(0, this.tireLife - TIRE_WEAR_PER_LAP);
        }

        // Later, we can add extra factors like slip or lane-change fatigue

        if (!this.pitRequired && (this.fuel <= FUEL_PIT_THRESHOLD ||
            this.tireLife <= TIRE_PIT_THRESHOLD
        )) {
            this.pitRequired = true;
        }
    }
    /**
     * Get total distance traveled
     * 
     * @param trackLength - The length of the track
     * @returns The total distance traveled
     */
    getTotalDistance(trackLength: number): number {
        return this.lapCount * trackLength + this.sProg;
    }

    /**
     * Check if the car is currently changing lanes
     * 
     * @returns True if the car is changing lanes
     */
    isChangingLanes(): boolean {
        return this.targetLaneIndex !== null;
    }

    /**
     * Get the progress of the current lane change (0 to 1)
     * 
     * @param currentGameTime - Current game time in seconds
     * @returns Progress ratio [0, 1], or 0 if not changing lanes
     */
    getLaneChangeProgress(currentGameTime: number): number {
        if (!this.isChangingLanes() || this.laneChangeStartTime === null) {
            return 0;
        }
        const elapsed = currentGameTime - this.laneChangeStartTime;
        const progress = elapsed / this.laneChangeDuration;
        return Math.max(0, Math.min(1, progress));
    }

    /**
     * Get the world position and rotation angle for this car
     * 
     * @param track - The track to compute position relative to
     * @param lateralOffset - The lateral offset from centerline (computed by LaneController)
     * @returns Object containing world position (x, y) and rotation angle in degrees
     */
    getWorldPosition(track: Track, lateralOffset: number): { x: number; y: number; angleDeg: number } {
        const p = track.posAt(this.sPhys);
        const t = track.tangentAt(this.sPhys);
        const n = track.normalAt(this.sPhys);
        const wp = { x: p.x + n.x * lateralOffset, y: p.y + n.y * lateralOffset };
        const ang = Math.atan2(t.y, t.x);
        const angleDeg = (ang * 180) / Math.PI;
        return { x: wp.x, y: wp.y, angleDeg };
    }

    // === SERIALIZATION METHODS ===

    /**
     * Export car data for serialization
     * 
     * @returns Serializable car data
     */
    toSerializedData() {
        return {
            sProg: this.sProg,
            vProg: this.vProg,
            r: this.r,
            sPhys: this.sPhys,
            vPhys: this.vPhys,
            lateral: this.lateral,
            slipFactor: this.slipFactor,
            slipWobble: this.slipWobble,
            color: this.color,
            carLength: this.carLength,
            carWidth: this.carWidth,
            laneIndex: this.laneIndex,
            targetLaneIndex: this.targetLaneIndex,
            laneChangeStartTime: this.laneChangeStartTime,
            pendingLaneChanges: this.pendingLaneChanges,
            laneChangeStartOffset: this.laneChangeStartOffset,
            laneChangeStartVelocity: this.laneChangeStartVelocity,
            lapCount: this.lapCount,
            lastSProg: this.lastSProg,
            crossedFinish: this.crossedFinish,
        };
    }

    /**
     * Create a car from serialized data (for loading saves)
     * 
     * @param data - The serialized car data
     * @returns A new Car instance
     */
    static fromSerializedData(data: {
        sProg: number;
        vProg: number;
        r: number;
        sPhys: number;
        vPhys: number;
        lateral: number;
        slipFactor?: number;
        slipWobble?: number;
        color: string;
        carLength: number;
        carWidth: number;
        laneIndex?: number;
        targetLaneIndex?: number | null;
        laneChangeStartTime?: number | null;
        pendingLaneChanges?: number;
        laneChangeStartOffset?: number | null;
        laneChangeStartVelocity?: number | null;
        lapCount: number;
        lastSProg: number;
        crossedFinish: boolean;
    }): Car {
        const car = new Car(data.sProg, data.color, data.carLength, data.carWidth, data.laneIndex);
        car.sProg = data.sProg;
        car.vProg = data.vProg;
        car.r = data.r;
        car.sPhys = data.sPhys;
        car.vPhys = data.vPhys;
        car.lateral = data.lateral;
        car.slipFactor = data.slipFactor ?? 0;
        car.slipWobble = data.slipWobble ?? 0;
        car.laneIndex = data.laneIndex ?? 0;
        car.targetLaneIndex = data.targetLaneIndex ?? null;
        car.laneChangeStartTime = data.laneChangeStartTime ?? null;
        car.pendingLaneChanges = data.pendingLaneChanges ?? 0;
        car.laneChangeStartOffset = data.laneChangeStartOffset ?? null;
        car.laneChangeStartVelocity = data.laneChangeStartVelocity ?? null;
        car.lapCount = data.lapCount;
        car.lastSProg = data.lastSProg;
        car.crossedFinish = data.crossedFinish;
        return car;
    }



}
