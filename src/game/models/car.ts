import type { Track } from './track';
import { clamp } from '../../utils/math';
import { events } from "../../shared/events";

/**
 * Car class
 *
 * This class represents a car in the game.
 */
export class Car {
    public r: number = 0; // smoothed reward state

    public s: number = 0; // physical along-track position
    public v: number = 0; // physical velocity
    public lateral: number = 0; // lateral offset (world units)

    public slipFactor: number = 0; // slip state [0, 1] for visual slip effect
    public slipWobble: number = 0; // angular wobble for slip effect
    public slowdownPenalty: number = 0; // slowdown penalty [0, 1] for speed reduction (separate from visual slip)

    public color: string = '#22c55e'; // car color
    public carLength: number = 40; // car size (world units)
    public carWidth: number = 22;

    public laneIndex: number = 0; // current lane index (0 = leftmost)
    public targetLaneIndex: number | null = null; // target lane during lane change
    public laneChangeStartTime: number | null = null; // game time (seconds) when lane change started
    public laneChangeDuration: number = 1.0; // duration of lane change in seconds
    public pendingLaneChanges: number = 0; // net lane changes requested (direction-based queue)
    public laneChangeStartOffset: number | null = null; // lateral offset (world units) where lane change started from (for smooth interruptions)
    public laneChangeStartVelocity: number | null = null; // lateral velocity (world units/sec) when lane change started (for smooth interruptions)
    public effectiveLanes: number[] = [0]; // cached effective lane indices (computed once per frame in updateLaneChanges)
    public crashedThisFrame: boolean = false; // flag to indicate crash occurred this frame (skip physics smoothing)

    public lapCount: number = 0;
    protected lastS: number = 0;
    protected crossedFinish: boolean = false;

    public inPitStop: boolean = false;
    protected completedPitStop: boolean = false;

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
    ) {
        this.s = initialS;
        this.lastS = initialS;
        this.color = color;
        this.carLength = carLength;
        this.carWidth = carWidth;
        if (laneIndex !== undefined) {
            this.laneIndex = laneIndex;
        }
        this.effectiveLanes = [this.laneIndex];
    }

    /**
     * Initialize velocities (called once by the physics controller)
     *
     * @param vMin - The minimum velocity
     */
    initialize(vMin: number) {
        this.v = vMin;
    }

    /**
     * Check for lap completion based on crossing the finish line (s=0)
     */
    updateLaps() {
        if (!this.crossedFinish && this.lastS > this.s) {
            this.lapCount++;
            if (this.lapCount >= 3) {
                this.crossedFinish = true;
            }
        }
        this.lastS = this.s;
    }

    hasFinished(): boolean {
        return this.crossedFinish;
    }

    /**
     * Get total distance traveled
     *
     * @param trackLength - The length of the track
     * @returns The total distance traveled
     */
    getTotalDistance(trackLength: number): number {
        return this.lapCount * trackLength + this.s;
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
        return clamp(progress, 0, 1);
    }

    /**
     * Get the world position and rotation angle for this car
     *
     * @param track - The track to compute position relative to
     * @param lateralOffset - The lateral offset from centerline (computed by LaneController)
     * @returns Object containing world position (x, y) and rotation angle in degrees
     */
    getWorldPosition(
        track: Track,
        lateralOffset: number,
    ): { x: number; y: number; angleDeg: number } {
        const p = track.posAt(this.s);
        const t = track.tangentAt(this.s);
        const n = track.normalAt(this.s);
        const wp = {
            x: p.x + n.x * lateralOffset,
            y: p.y + n.y * lateralOffset,
        };
        const ang = Math.atan2(t.y, t.x);
        const angleDeg = (ang * 180) / Math.PI;
        return { x: wp.x, y: wp.y, angleDeg };
    }

    emitStateChanged(inPitStop: boolean) {
        events.emit('PitStop', { value: inPitStop} );
    }

    // === SERIALIZATION METHODS ===

    /**
     * Export car data for serialization
     *
     * @returns Serializable car data
     */
    toSerializedData() {
        return {
            r: this.r,
            s: this.s,
            v: this.v,
            lateral: this.lateral,
            slipFactor: this.slipFactor,
            slipWobble: this.slipWobble,
            slowdownPenalty: this.slowdownPenalty,
            color: this.color,
            carLength: this.carLength,
            carWidth: this.carWidth,
            laneIndex: this.laneIndex,
            targetLaneIndex: this.targetLaneIndex,
            laneChangeStartTime: this.laneChangeStartTime,
            pendingLaneChanges: this.pendingLaneChanges,
            laneChangeStartOffset: this.laneChangeStartOffset,
            laneChangeStartVelocity: this.laneChangeStartVelocity,
            effectiveLanes: this.effectiveLanes,
            lapCount: this.lapCount,
            lastS: this.lastS,
            crossedFinish: this.crossedFinish,
            inPitStop: this.inPitStop,
            completedPitStop: this.completedPitStop,
        };
    }

    /**
     * Create a car from serialized data (for loading saves)
     *
     * @param data - The serialized car data
     * @returns A new Car instance
     */
    static fromSerializedData(data: {
        r: number;
        s: number;
        v: number;
        lateral: number;
        slipFactor?: number;
        slipWobble?: number;
        slowdownPenalty?: number;
        color: string;
        carLength: number;
        carWidth: number;
        laneIndex?: number;
        targetLaneIndex?: number | null;
        laneChangeStartTime?: number | null;
        pendingLaneChanges?: number;
        laneChangeStartOffset?: number | null;
        laneChangeStartVelocity?: number | null;
        effectiveLanes?: number[];
        lapCount: number;
        lastS: number;
        crossedFinish: boolean;
        inPitStop: boolean;
        completedPitStop: boolean;
    }): Car {
        const car = new Car(
            data.s,
            data.color,
            data.carLength,
            data.carWidth,
            data.laneIndex,
        );
        car.r = data.r;
        car.s = data.s;
        car.v = data.v;
        car.lateral = data.lateral;
        car.slipFactor = data.slipFactor ?? 0;
        car.slipWobble = data.slipWobble ?? 0;
        car.slowdownPenalty = data.slowdownPenalty ?? 0;
        car.laneIndex = data.laneIndex ?? 0;
        car.targetLaneIndex = data.targetLaneIndex ?? null;
        car.laneChangeStartTime = data.laneChangeStartTime ?? null;
        car.pendingLaneChanges = data.pendingLaneChanges ?? 0;
        car.laneChangeStartOffset = data.laneChangeStartOffset ?? null;
        car.laneChangeStartVelocity = data.laneChangeStartVelocity ?? null;
        car.effectiveLanes = data.effectiveLanes ?? [car.laneIndex];
        car.lapCount = data.lapCount;
        car.lastS = data.lastS;
        car.crossedFinish = data.crossedFinish;
        car.inPitStop = data.inPitStop;
        car.completedPitStop = data.completedPitStop;
        return car;
    }
}
