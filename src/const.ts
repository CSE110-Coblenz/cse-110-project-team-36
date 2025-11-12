export const ANIMATION_TICK = 60
export const PAGE_WIDTH = 800
export const PAGE_HEIGHT = 600

//const for minigame
// --- Pit / Wear / Fuel ---
export const FUEL_WARN = 0.25;
export const TIRE_WARN = 0.25;

export const FUEL_CONSUMP_PER_SEC = 5;     // tune
export const IDLE_FUEL_CONSUMP_PER_SEC = 0.15; // tune accordingly  
export const TIRE_WEAR_PER_LAP = 1.34;         // tune
export const PIT_SPEED_LIMIT = 40;             // your game units
export const PIT_SERVICE_BASE_MS = 7000;       // 7s base time
export const PIT_STOP_SPEED_THRESHOLD = PIT_SPEED_LIMIT; // must slow below this for service

export const FUEL_PIT_THRESHOLD = 30;   // %
export const TIRE_PIT_THRESHOLD = 20;   // %

export const PIT_BOX_ID = "pit-box-1";         // id used by trigger

// Shared pit-lane geometry (fractions of total lap length)
// Extended pit geometry so players have more runway to merge.
export const PIT_ENTRY_START_FRAC = 0.02;
export const PIT_ENTRY_END_FRAC = 0.18;
export const PIT_LANE_START_FRAC = 0.18;
export const PIT_LANE_END_FRAC = 0.26;
export const PIT_EXIT_END_FRAC = 0.34;
