type StreakState = "idle" | "building" | "active" | "cooldown";

export class AnswerStreak {
  state: StreakState = "idle"; // Current state of streak
  gauge: number = 0; // 0 → 100 fill level
  time: number = 0; // Remaining streak time (if active)
  decayRate: number = 5; // How fast gauge drains per second

  onCorrectAnswer() {
    if (this.gauge === 100) {
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
    const timer = setInterval(() => {
      console.log(this.time);
      this.time--;
      this.gauge -= this.decayRate;

      if (this.time < 0) {
        clearInterval(timer); // stop the timer
        this.deactivateStreak();
        console.log("Time’s up!");
      }
    }, 1000); // runs every 1000 ms = 1 second
  }

  deactivateStreak() {
    this.state = "idle";
    this.time = 0;
    this.gauge = 0;
  }
}
