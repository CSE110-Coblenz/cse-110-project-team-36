export class Car {
    // Authoritative progress state (used for laps/ranking)
    public sProg: number = 0;           // along-track position [0, L)
    public vProg: number = 0;           // progress velocity
    public r: number = 0;               // smoothed reward state

    // Physical rendering state
    public sPhys: number = 0;           // physical along-track position
    public vPhys: number = 0;           // physical velocity
    public lateral: number = 0;         // lateral offset (world units)

    // Visual properties
    public color: string = '#22c55e';   // car color
    public carLength: number = 40;      // car size (world units)
    public carWidth: number = 22;

    // Lap tracking
    public lapCount: number = 0;
    private lastSProg: number = 0;
    private crossedFinish: boolean = false;

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
     */
    initialize(vMin: number) {
        this.vProg = vMin;
        this.vPhys = vMin;
    }

    /**
     * Check for lap completion based on crossing the finish line (s=0)
     */
    updateLaps(trackLength: number) {
        if (!this.crossedFinish && this.lastSProg > trackLength * 0.9 && this.sProg < trackLength * 0.1) {
            this.lapCount++;
            this.crossedFinish = true;
        }
        if (this.sProg > trackLength * 0.5) {
            this.crossedFinish = false;
        }
        this.lastSProg = this.sProg;
    }

    /**
     * Get total distance traveled
     */
    getTotalDistance(trackLength: number): number {
        return this.lapCount * trackLength + this.sProg;
    }
}
