type StreakState = "no streak :(" | "building streak" | "active" | "cooldown";

export class AnswerStreak {
  state: StreakState = "no streak :("; // Current state of streak
  gauge: number = 0; // 0 → 100 fill level
  time: number = 20; // Remaining streak time (if active)
  decayRate: number = 5; // How fast gauge drains per second
  isStreakActivated: boolean = false;

  onCorrectAnswer() {
    this.gauge = Math.min(100, this.gauge + 10);
    if (this.gauge >= 100) {
      this.activateStreak();
    }
    if (this.state != "active") {
      this.state = "building streak";
    }
  }

  onWrongAnswer() {
    this.deactivateStreak();
  }

  activateStreak() {
    this.state = "active";
    this.time = 30;
    this.isStreakActivated = true;
  }

  deactivateStreak() {
    this.state = "no streak :(";
    this.time = 0;
    this.gauge = 0;
    this.isStreakActivated = false;
  }

  decay() {
    if (this.gauge > 0) {
      this.gauge -= this.decayRate;
    }
    if (this.gauge < 50) {
      this.state = "cooldown";
      this.isStreakActivated = false;
    }
  }
}
