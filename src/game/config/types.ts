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
 * Race configuration interface
 * Extends PhysicsConfig and adds race-specific settings
 */
export interface RaceConfig extends PhysicsConfig {
    extends?: string;           // Reference to physics config file (e.g., "config1.json")
    trackFile: string;          // Reference to track file (e.g., "track1.json")
}

