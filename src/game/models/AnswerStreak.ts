type StreakState = "no streak :(" | "building streak" | "active" | "cooldown";

export class AnswerStreak {
  state: StreakState = "no streak :("; // Current state of streak
  gauge: number = 0; // 0 → 100 fill level
  time: number = 20; // Remaining streak time (if active)
  decayRate: number = 5; // How fast gauge drains per second
  isStreakActivated: boolean = false;

  onCorrectAnswer() {
    this.gauge = Math.min(100, this.gauge + 10); // correct answer progresses gauge
    if (this.gauge >= 100) {
      this.activateStreak(); // max gauge activates streak
    }
    if (this.state != "active") {
      this.state = "building streak"; // "building" state when streak inactive
    }
  }

  onWrongAnswer() {
    this.deactivateStreak();
  }

  activateStreak() {
    this.state = "active";
    this.time = 30; // time left to answer another question correctly
    this.isStreakActivated = true;
  }

  deactivateStreak() {
    this.state = "no streak :(";
    this.time = 0;
    this.gauge = 0;
    this.isStreakActivated = false;
  }

  decay() {
    this.gauge = Math.max(0, this.gauge - this.decayRate);
    if (this.gauge < 50) {
      this.state = "cooldown";
      this.isStreakActivated = false;
    }
  }
}
