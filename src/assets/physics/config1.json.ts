import type { PhysicsConfig } from '../../game/config/types';

const config: PhysicsConfig = {
    vMin: 0,
    vMax: 500,
    aBase: 0,
    tauA: 0.5,
    beta: 30,
    vBonus: 10,
    kappaEps: 0.001,
    vKappaScale: 10,
    slipDecay: 0.5,
    slipWobbleAmp: 25,
    slipWobbleFreq: 2,
    baseMu: 0.8,
    slipVelocityDecay: 8,
    momentumTransfer: 0.3,
    kKappaBrake: 10,
};

export default config;
