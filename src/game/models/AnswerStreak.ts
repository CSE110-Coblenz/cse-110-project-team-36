type StreakState = "idle" | "building" | "active" | "cooldown";

export class AnswerStreak {
  state: StreakState = "idle"; // Current state of streak
  gauge: number = 0; // 0 → 100 fill level
  timer: number = 0; // Remaining streak time (if active)
  decayRate: number = 0.5; // How fast gauge drains per second
  fillPerCorrect: number = 25; // How much gauge increases per correct answer

  constructor() {}

  update(deltaTime: number) {}

  onCorrectAnswer() {
    if (this.gauge === 100) {
      this.activateStreak();
    }
    this.gauge += 10;
    this.state = "building";
  }

  onWrongAnswer() {
    this.gauge == 0;
    this.state = "cooldown";
  }

  activateStreak() {
    this.state = "active";
  }

  deactivateStreak() {
    this.state = "idle";
  }
}
