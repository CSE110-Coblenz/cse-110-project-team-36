import type { Track } from "./track";

/**
 * Car class
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

    public lapCount: number = 0;
    private lastSProg: number = 0;
    private crossedFinish: boolean = false;

    /**
     * Constructor
     * 
     * @param initialS - The initial along-track position
     * @param color - The color of the car
     * @param carLength - The length of the car
     * @param carWidth - The width of the car
     */
    constructor(
        initialS: number = 0,
        color: string = '#22c55e',
        carLength: number = 40,
        carWidth: number = 22
    ) {
        this.sProg = initialS;
        this.sPhys = initialS;
        this.lastSProg = initialS;
        this.color = color;
        this.carLength = carLength;
        this.carWidth = carWidth;
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
     * Get total distance traveled
     * 
     * @param trackLength - The length of the track
     * @returns The total distance traveled
     */
    getTotalDistance(trackLength: number): number {
        return this.lapCount * trackLength + this.sProg;
    }

    /**
     * Get the world position and rotation angle for this car
     * 
     * @param track - The track to compute position relative to
     * @returns Object containing world position (x, y) and rotation angle in degrees
     */
    getWorldPosition(track: Track): { x: number; y: number; angleDeg: number } {
        const p = track.posAt(this.sPhys);
        const t = track.tangentAt(this.sPhys);
        const n = track.normalAt(this.sPhys);
        const wp = { x: p.x + n.x * this.lateral, y: p.y + n.y * this.lateral };
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
        lapCount: number;
        lastSProg: number;
        crossedFinish: boolean;
    }): Car {
        const car = new Car(data.sProg, data.color, data.carLength, data.carWidth);
        car.sProg = data.sProg;
        car.vProg = data.vProg;
        car.r = data.r;
        car.sPhys = data.sPhys;
        car.vPhys = data.vPhys;
        car.lateral = data.lateral;
        car.slipFactor = data.slipFactor ?? 0;
        car.slipWobble = data.slipWobble ?? 0;
        car.lapCount = data.lapCount;
        car.lastSProg = data.lastSProg;
        car.crossedFinish = data.crossedFinish;
        return car;
    }
}
