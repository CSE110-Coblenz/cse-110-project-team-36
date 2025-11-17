/**
 * Physics configuration interface
 * Contains all physics constants used by CarController and CollisionController
 */
export interface PhysicsConfig {
    vMin: number;               // v_min
    vMax: number;               // v_max
    aBase: number;              // a_base
    tauA: number;               // τ_a (reward smoothing time constant, seconds)
    beta: number;                // β in a_decay(v) = -β·1_{v>v_min}
    vBonus: number;             // v_bonus
    kappaEps: number;           // ε (curvature floor to avoid div by 0)
    vKappaScale: number;        // γ_κ (scale knob; spec addendum)
    slipDecay: number;          // slip decay rate per second
    slipWobbleAmp: number;      // wobble amplitude in degrees
    slipWobbleFreq: number;     // wobble frequency in Hz
    baseMu: number;             // base friction coefficient
    slipVelocityDecay: number;  // how quickly slip forces v down to vMin
    momentumTransfer: number;   // how much momentum is transferred to the front car in crash
    kKappaBrake: number;       // soft braking gain for curvature overspeed
}

/**
 * Bot configuration template interface
 * Defines base statistics and behavior parameters for bot cars
 * Individual bots are created by scaling these values with a difficulty scalar
 */
export interface BotConfig {
    answerSpeedBase: number;           // Base mean answer speed (seconds)
    answerSpeedStdDev: number;         // Standard deviation for answer speed
    accuracyBase: number;              // Base accuracy probability
    accuracyStdDev: number;            // Standard deviation for accuracy
    safetyTimeBase: number;            // Base safety time threshold (seconds)
    safetyTimeStdDev: number;          // Standard deviation for safety time
}

/**
 * Race configuration interface
 * Master config that contains other configs separately
 */
export interface RaceConfig {
    physics: PhysicsConfig;     // Physics configuration
    trackFile: string;          // Reference to track file (e.g., "track1.json")
    botConfig: BotConfig;      // Single bot configuration template (scaled by difficulty at runtime)
    botDifficultyRanges: [number, number][]; // Array of difficulty ranges for each bot [a, b]
    initialPositions: number[]; // Array of initial positions for each bot
    laneIndices: number[]; // Array of lane indices for each bot
    userCarLaneIndex: number; // Lane index for the user car
    userCarInitialPosition: number; // Initial position for the user car
}

