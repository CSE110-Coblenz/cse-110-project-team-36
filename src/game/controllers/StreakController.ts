import { events } from "../../shared/events";
import { AnswerStreak } from "../models/AnswerStreak";

export class StreakController {
  private streak: AnswerStreak;
  private timer?: number;
  constructor() {
    this.streak = new AnswerStreak();

    events.on("AnsweredCorrectly", () => this.handleCorrect());
    events.on("AnsweredIncorrectly", () => this.handleIncorrect());
  }

  private emitStreakActivated() {
    events.emit("StreakActivated", {}); // Event for score multiplier.
  }

  private handleCorrect() {
    this.streak.onCorrectAnswer();

    if (this.streak.state === "active" && !this.timer) {
      this.startTimer();
    }
    this.emitStreakActivated();
  }

  private handleIncorrect() {
    this.stopTimer();
    this.streak.onWrongAnswer();
  }

  private startTimer() {
    if (this.timer) return; // avoid multiple timers

    this.timer = setInterval(() => {
      this.streak.decay(); // reduce gauge
      this.streak.time--; // reduce countdown

      if (this.streak.time <= 0) {
        this.stopTimer();
        this.streak.deactivateStreak(); // reset state & gauge
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  getStreakActivated() {
    return this.streak.isStreakActivated;
  }

  getGauge() {
    return this.streak.gauge;
  }

  getState() {
    return this.streak.state;
  }
}
