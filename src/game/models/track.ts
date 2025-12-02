export type Vec2 = { x: number; y: number };

export type PitLaneSegment = {
    startS: number; // distance along track where pit starts
    endS: number; // distance along track where pit ends
    points: Vec2[]; // world-space coordinates along the pit lane
    offset: number; // lateral offset from centerline (so it aligns as a “lane”)
};

export type TrackJSON = {
    version: 1;
    numLanes: number; // number of lanes (required)
    laneWidth: number; // width of each lane (required)
    points: Vec2[]; // coarse polygon; loop auto-closed
    smoothIterations?: number; // Chaikin rounds (default 3)
    sampleSpacing?: number; // desired spacing along the arc (default 1.0)
};

/**
 * Close a loop of points
 *
 * @param pts - The points to close
 * @returns The closed points
 */
function closeLoop(pts: Vec2[]): Vec2[] {
    if (pts.length === 0) return [];
    const first = pts[0],
        last = pts[pts.length - 1];
    const close = Math.hypot(first.x - last.x, first.y - last.y) < 1e-6;
    return close ? pts.slice() : [...pts, { ...first }];
}

/**
 * Chaikin closed points
 *
 * @param points - The points to close
 * @param iterations - The number of iterations to close
 * @returns The closed points
 */
function chaikinClosed(points: Vec2[], iterations: number): Vec2[] {
    let pts = closeLoop(points);
    if (pts.length < 3 || iterations <= 0) return pts;
    for (let it = 0; it < iterations; it++) {
        const out: Vec2[] = [];
        const n = pts.length - 1; // last == first
        for (let i = 0; i < n; i++) {
            const a = pts[i],
                b = pts[(i + 1) % n];
            const Q = {
                x: 0.75 * a.x + 0.25 * b.x,
                y: 0.75 * a.y + 0.25 * b.y,
            };
            const R = {
                x: 0.25 * a.x + 0.75 * b.x,
                y: 0.25 * a.y + 0.75 * b.y,
            };
            out.push(Q, R);
        }
        pts = closeLoop(out);
    }
    return pts;
}

function vSub(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y };
}
function vLen(a: Vec2): number {
    return Math.hypot(a.x, a.y);
}
function vNorm(a: Vec2): Vec2 {
    const L = vLen(a) || 1;
    return { x: a.x / L, y: a.y / L };
}
function vPerp(a: Vec2): Vec2 {
    return { x: -a.y, y: a.x };
}

/**
 * Track class
 *
 * This class represents a track in the game.
 */
export class Track {
    private _laneWidth: number; // Width of each lane (world units)
    readonly numLanes: number; // Number of lanes
    private samples: Vec2[] = []; // Dense, closed centerline samples; last === first
    private sTable: number[] = []; // Cumulative arc-length table (same length as samples)
    private kappaTable: number[] = []; // curvature per sample (approximate)

    private totalLength = 0; // Total length of the track
    private pitStops: Vec2[] = []; // Pit stop positions
    private pitLaneSegments: PitLaneSegment[] = []; // Pit lane segments

    /**
     * Get total track width (computed from laneWidth * numLanes)
     */
    get width(): number {
        return this._laneWidth * this.numLanes;
    }

    /**
     * Get the width of each lane
     */
    get laneWidth(): number {
        return this._laneWidth;
    }

    /**
     * Constructor
     *
     * @param laneWidth - The width of each lane
     * @param numLanes - The number of lanes
     */
    private constructor(laneWidth: number, numLanes: number) {
        this._laneWidth = laneWidth;
        this.numLanes = numLanes;
    }

    /**
     * Create a track from a JSON object
     *
     * @param j - The JSON object
     * @returns The track
     */
    static fromJSON(j: TrackJSON): Track {
        if (!j.points || j.points.length < 3) {
            throw new Error('TrackJSON.points must have at least 3 points');
        }
        if (j.numLanes === undefined || j.numLanes < 1) {
            throw new Error(
                'TrackJSON.numLanes is required and must be at least 1',
            );
        }
        if (j.laneWidth === undefined || j.laneWidth <= 0) {
            throw new Error(
                'TrackJSON.laneWidth is required and must be positive',
            );
        }
        const t = new Track(j.laneWidth, j.numLanes);

        // 1) Smooth the polygon (low-math corner cutting)
        const smoothed = chaikinClosed(j.points, j.smoothIterations ?? 3);

        // 2) Build uniform-arc samples
        t.buildUniformSamples(smoothed, j.sampleSpacing ?? 1.0);
        t.generatePitStops();
        return t;
    }

    /**
     * Build uniform samples
     *
     * @param loopPts - The points to build samples from
     * @param spacing - The spacing of the samples
     */
    private buildUniformSamples(loopPts: Vec2[], spacing: number) {
        // First compute rough cumulative length on the (already smooth) polyline
        const cum: number[] = [0];
        for (let i = 1; i < loopPts.length; i++) {
            cum.push(cum[i - 1] + vLen(vSub(loopPts[i], loopPts[i - 1])));
        }
        const L = cum[cum.length - 1];
        // Uniform resampling every ~spacing along [0, L)
        const samples: Vec2[] = [];
        const sTable: number[] = [];
        const steps = Math.max(8, Math.round(L / Math.max(1e-6, spacing)));
        for (let k = 0; k < steps; k++) {
            const s = (k / steps) * L;
            let i = 1;
            while (i < cum.length && cum[i] < s) i++;
            const s0 = cum[i - 1],
                s1 = cum[i];
            const t = (s - s0) / Math.max(1e-6, s1 - s0);
            const p0 = loopPts[i - 1],
                p1 = loopPts[i];
            samples.push({
                x: p0.x * (1 - t) + p1.x * t,
                y: p0.y * (1 - t) + p1.y * t,
            });
            sTable.push(s);
        }
        samples.push(samples[0]);
        sTable.push(L);
        this.samples = samples;
        this.sTable = sTable;
        this.totalLength = L;
        this.kappaTable = Track.buildKappaTable(this);
    }

    private generatePitStops() {
        const pitLength = 10; // length of pit stop segment
        const sampleSpacing = 1.0; // 1 meter per loop iteration
        const offset = this.getLaneOffset(this.numLanes - 1) + this.laneWidth; // offset from centerline to first lane

        // pick a random sample index; pit stop can be located anywhere except start/finish line
        let randomSampleIndex =
            Math.floor(Math.random() * (this.samples.length - 2 + 1)) + 1;

        // convert index → actual track distance
        const startS = this.sTable[randomSampleIndex];
        const endS = Math.min(startS + pitLength, this.totalLength);

        const pitStopCoordinates: Vec2[] = [];

        // generate pit stop coordinates until desired pitStop length is reached or nearing the end of track
        for (let s = startS; s < endS; s += sampleSpacing) {
            const p0 = this.posAt(s);
            const normalp0 = this.normalAt(s);

            pitStopCoordinates.push({
                x: p0.x + normalp0.x * offset,
                y: p0.y + normalp0.y * offset,
            });

            randomSampleIndex++;
        }

        this.pitStops = pitStopCoordinates;

        this.pitLaneSegments.push({
            startS: startS,
            endS: endS,
            points: pitStopCoordinates,
            offset: offset,
        });
    }

    /**
     * Get the total length of the track
     *
     * @returns The total length of the track
     */
    get length(): number {
        return this.totalLength;
    }

    /**
     * Wrap the track position into the closed interval [0, L)
     *
     * @param s - The position to wrap
     * @returns The wrapped position
     */
    wrapS(s: number): number {
        return s % this.totalLength;
    }

    /**
     * Get the position at a given track position
     *
     * @param sRaw - The raw track position
     * @returns The position at the given track position
     */
    posAt(sRaw: number): Vec2 {
        let s = this.wrapS(sRaw);
        if (s < 0) {
            s += this.totalLength;
        }
        // binary search
        let lo = 0,
            hi = this.sTable.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (this.sTable[mid] < s) lo = mid + 1;
            else hi = mid - 1;
        }
        const i = Math.max(1, lo);
        const s0 = this.sTable[i - 1],
            s1 = this.sTable[i];
        const t = (s - s0) / Math.max(1e-6, s1 - s0);
        const p0 = this.samples[i - 1],
            p1 = this.samples[i];
        return { x: p0.x * (1 - t) + p1.x * t, y: p0.y * (1 - t) + p1.y * t };
    }

    /**
     * Get the tangent at a given track position
     *
     * @param sRaw - The raw track position
     * @returns The tangent at the given track position
     */
    tangentAt(sRaw: number): Vec2 {
        const eps = 0.25; // half-meter-ish lookahead for heading stability
        const a = this.posAt(sRaw);
        const b = this.posAt(sRaw + eps);
        return vNorm({ x: b.x - a.x, y: b.y - a.y });
    }

    /**
     * Get the normal at a given track position
     *
     * @param sRaw - The raw track position
     * @returns The normal at the given track position
     */
    normalAt(sRaw: number): Vec2 {
        const t = this.tangentAt(sRaw);
        return vNorm(vPerp(t));
    }

    /**
     * Get the samples of the track
     *
     * @returns The samples of the track
     */
    getSamples(): readonly Vec2[] {
        return this.samples;
    }

    getPitStops(): readonly Vec2[] {
        return this.pitStops;
    }

    get PitLaneSegments(): readonly PitLaneSegment[] {
        return this.pitLaneSegments;
    }

    /**
     * Get the lateral offset from centerline for a given lane index
     *
     * @param laneIndex - The lane index (0 = leftmost, numLanes-1 = rightmost)
     * @returns The lateral offset from centerline in world units
     */
    getLaneOffset(laneIndex: number): number {
        // Calculate from rightmost edge: rightEdge = width/2
        // Lane centers are spaced laneWidth apart, starting from rightmost edge
        // Rightmost lane (numLanes-1): width/2 - 0.5*laneWidth
        // Leftmost lane (0): width/2 - (numLanes - 0.5)*laneWidth
        const trackWidth = this.width; // numLanes * laneWidth
        return trackWidth / 2 - (laneIndex + 0.5) * this._laneWidth;
    }

    /**
     * Curvature lookup with linear interpolation.
     */
    curvatureAt(sRaw: number): number {
        let s = this.wrapS(sRaw);
        if (s < 0) {
            s += this.totalLength;
        }
        let lo = 0,
            hi = this.sTable.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (this.sTable[mid] < s) lo = mid + 1;
            else hi = mid - 1;
        }
        const i = Math.max(1, lo);
        const s0 = this.sTable[i - 1],
            s1 = this.sTable[i];
        const t = (s - s0) / Math.max(1e-6, s1 - s0);
        const k0 = this.kappaTable[i - 1];
        const k1 = this.kappaTable[i];
        return k0 * (1 - t) + k1 * t;
    }

    // === SERIALIZATION METHODS ===

    /**
     * Export track data for serialization
     *
     * @returns Serializable track data
     */
    toSerializedData() {
        return {
            laneWidth: this._laneWidth,
            numLanes: this.numLanes,
            samples: this.samples.map((s) => ({ x: s.x, y: s.y })),
            sTable: [...this.sTable],
            totalLength: this.totalLength,
            pitStops: [...this.pitStops],
        };
    }

    /**
     * Create a track from serialized data (for loading saves)
     *
     * @param data - The serialized track data
     * @returns A new Track instance
     */
    static fromSerializedData(data: {
        laneWidth: number;
        numLanes: number;
        samples: Vec2[];
        sTable: number[];
        totalLength: number;
        pitStops: Vec2[];
    }): Track {
        const track = new Track(data.laneWidth, data.numLanes);
        track.samples = [...data.samples];
        track.sTable = [...data.sTable];
        track.totalLength = data.totalLength;
        track.kappaTable = Track.buildKappaTable(track);
        track.pitStops = [...data.pitStops];
        return track;
    }

    private static buildKappaTable(track: Track) {
        const headings: number[] = [];
        for (let i = 0; i < track.samples.length - 1; i++) {
            const a = track.samples[i];
            const b = track.samples[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            headings.push(Math.atan2(dy, dx));
        }
        headings.push(headings[0]);
        const ds =
            track.sTable.length > 1 ? track.sTable[1] - track.sTable[0] : 1.0;
        const kappa: number[] = new Array(track.samples.length).fill(0);
        for (let i = 0; i < headings.length - 1; i++) {
            let dTheta = headings[i + 1] - headings[i];
            if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
            if (dTheta < -Math.PI) dTheta += 2 * Math.PI;
            kappa[i] = dTheta / Math.max(1e-6, ds);
        }
        kappa[kappa.length - 1] = kappa[0];
        return kappa;
    }
}
