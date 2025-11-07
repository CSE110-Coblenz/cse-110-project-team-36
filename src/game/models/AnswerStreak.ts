type StreakState = "idle" | "building" | "active" | "cooldown";

export class AnswerStreak {
  state: StreakState = "idle"; // Current state of streak
  gauge: number = 0; // 0 → 100 fill level
  time: number = 10; // Remaining streak time (if active)
  decayRate: number = 5; // How fast gauge drains per second
  isStreakActivated: boolean = false;

  onCorrectAnswer() {
    if (this.gauge >= 10) {
      this.activateStreak();
    }
    this.gauge += 10;
    this.state = "building";
  }

  onWrongAnswer() {
    this.deactivateStreak();
  }

  activateStreak() {
    this.state = "active";
    this.time = 10;
    this.isStreakActivated = true;
  }

  deactivateStreak() {
    this.state = "idle";
    this.time = 0;
    this.gauge = 0;
    this.isStreakActivated = false;
  }

  decay() {
    this.gauge -= this.decayRate;
  }
}
