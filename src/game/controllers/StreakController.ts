import { events } from "../../shared/events";
import { AnswerStreak } from "../models/AnswerStreak";

export class StreakController {
  private streak: AnswerStreak;
  private timer?: ReturnType<typeof setInterval>;
  constructor() {
    this.streak = new AnswerStreak();

    events.on("AnsweredCorrectly", () => this.handleCorrect());
    events.on("AnsweredIncorrectly", () => this.handleIncorrect());
  }

  private emitStreakActivated() {
    events.emit("StreakActivated", { value: this.streak.isStreakActivated }); // Event for score multiplier. Enabled/ Disabled
  }

  // listens for correct answer to build streak guage
  private handleCorrect() {
    this.streak.onCorrectAnswer();

    if (this.getState() === "active" && !this.timer) {
      this.startTimer();
    }
    this.emitStreakActivated();
  }

  // listens for incorrect answer to reset streak
  private handleIncorrect() {
    this.stopTimer();
    this.emitStreakActivated();
    this.streak.onWrongAnswer();
  }

  private startTimer() {
    if (this.timer) return; // avoid multiple timers

    this.timer = setInterval(() => {
      this.streak.decay(); // reduce gauge
      this.streak.time--; // reduce countdown

      this.emitStreakActivated(); // Deactivates Streak on cooldown

      if (this.streak.time <= 0 || this.streak.gauge <= 0) {
        this.stopTimer();
        this.streak.deactivateStreak(); // reset state & gauge
        this.emitStreakActivated(); // Deactivates streak on no time left / no progress
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  isActivated() {
    return this.streak.isStreakActivated;
  }

  getGauge() {
    return this.streak.gauge;
  }

  getState() {
    return this.streak.state;
  }
}
