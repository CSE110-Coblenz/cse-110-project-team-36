export enum StreakState {
    None = 'no streak :(',
    Building = 'building streak',
    Active = 'active',
    Cooldown = 'cooldown',
}

export class AnswerStreak {
    state: StreakState = StreakState.None; // Current state of streak
    gauge: number = 0; // 0 → 100 fill level
    time: number = 20; // Remaining streak time (if active)
    decayRate: number = 2.5; // How fast gauge drains per second
    isStreakActivated: boolean = false; // Checks wether streak is active/inactive

    // streak activated
    activateStreak() {
        this.state = StreakState.Active;
        this.time = 20; // time left to answer another question correctly
        this.isStreakActivated = true;
        this.gauge = 100; // <-- clamp to full
    }

    // streak deactivated. Resets time, gauge, and state
    deactivateStreak() {
        this.state = StreakState.None;
        this.time = 0;
        this.gauge = 0;
        this.isStreakActivated = false;
    }

    // handles cooldown. (Gauge <50)
    cooldDown() {
        this.state = StreakState.Cooldown;
        this.isStreakActivated = false;
    }

    // decays 5 gauge per second. 0 minimum
    decay() {
        this.gauge = Math.max(0, this.gauge - this.decayRate);
    }
}
