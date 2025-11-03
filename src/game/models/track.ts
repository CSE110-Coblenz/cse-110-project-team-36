export type Vec2 = { x: number; y: number };

export type TrackJSON = {
    version: 1;
    width?: number;                 // visual hint for road width
    points: Vec2[];                 // coarse polygon; loop auto-closed
    smoothIterations?: number;      // Chaikin rounds (default 3)
    sampleSpacing?: number;         // desired spacing along the arc (default 1.0)
};

/**
 * Close a loop of points
 * 
 * @param pts - The points to close
 * @returns The closed points
 */
function closeLoop(pts: Vec2[]): Vec2[] {
    if (pts.length === 0) return [];
    const first = pts[0], last = pts[pts.length - 1];
    const close = (Math.hypot(first.x - last.x, first.y - last.y) < 1e-6);
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
            const a = pts[i], b = pts[(i + 1) % n];
            const Q = { x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y };
            const R = { x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y };
            out.push(Q, R);
        }
        pts = closeLoop(out);
    }
    return pts;
}

function vSub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y }; }
function vLen(a: Vec2): number { return Math.hypot(a.x, a.y); }
function vNorm(a: Vec2): Vec2 { const L = vLen(a) || 1; return { x: a.x / L, y: a.y / L }; }
function vPerp(a: Vec2): Vec2 { return { x: -a.y, y: a.x }; }

/**
 * Track class
 * 
 * This class represents a track in the game.
 */
export class Track {
    readonly width: number;         // Suggested road width (world units)
    private samples: Vec2[] = [];   // Dense, closed centerline samples; last === first
    private sTable: number[] = [];  // Cumulative arc-length table (same length as samples)

    private totalLength = 0;        // Total length of the track

    /**
     * Constructor
     * 
     * @param width - The width of the track
     */
    private constructor(width: number) {
        this.width = width;
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
        const t = new Track(j.width ?? 16);

        // 1) Smooth the polygon (low-math corner cutting)
        const smoothed = chaikinClosed(j.points, j.smoothIterations ?? 3);

        // 2) Build uniform-arc samples
        t.buildUniformSamples(smoothed, j.sampleSpacing ?? 1.0);
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
            // locate segment
            let i = 1;
            while (i < cum.length && cum[i] < s) i++;
            const s0 = cum[i - 1], s1 = cum[i];
            const t = (s - s0) / Math.max(1e-6, s1 - s0);
            const p0 = loopPts[i - 1], p1 = loopPts[i];
            samples.push({ x: p0.x * (1 - t) + p1.x * t, y: p0.y * (1 - t) + p1.y * t });
            sTable.push(s);
        }
        // Close the loop exactly
        samples.push(samples[0]);
        sTable.push(L);

        this.samples = samples;
        this.sTable = sTable;
        this.totalLength = L;
    }

    /**
     * Get the total length of the track
     * 
     * @returns The total length of the track
     */
    get length(): number { return this.totalLength; }

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
        let lo = 0, hi = this.sTable.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (this.sTable[mid] < s) lo = mid + 1;
            else hi = mid - 1;
        }
        const i = Math.max(1, lo);
        const s0 = this.sTable[i - 1], s1 = this.sTable[i];
        const t = (s - s0) / Math.max(1e-6, s1 - s0);
        const p0 = this.samples[i - 1], p1 = this.samples[i];
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
    getSamples(): readonly Vec2[] { return this.samples; }

    // === SERIALIZATION METHODS ===

    /**
     * Export track data for serialization
     * 
     * @returns Serializable track data
     */
    toSerializedData() {
        return {
            width: this.width,
            samples: this.samples.map(s => ({ x: s.x, y: s.y })),
            sTable: [...this.sTable],
            totalLength: this.totalLength,
        };
    }

    /**
     * Create a track from serialized data (for loading saves)
     * 
     * @param data - The serialized track data
     * @returns A new Track instance
     */
    static fromSerializedData(data: { width: number; samples: Vec2[]; sTable: number[]; totalLength: number }): Track {
        const track = new Track(data.width);
        track.samples = [...data.samples];
        track.sTable = [...data.sTable];
        track.totalLength = data.totalLength;
        return track;
    }
}
