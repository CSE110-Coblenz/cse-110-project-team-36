import { events } from "../../shared/events";
import { AnswerStreak, StreakState } from "../models/AnswerStreak";

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
    this.streak.gauge = Math.min(100, this.streak.gauge + 10); // correct answer progresses gauge. Max of 100.
    if (this.streak.state != StreakState.Active) {
      this.streak.state = StreakState.Building; // "building" state when streak inactive
    } else {
      this.streak.time = 20; // resets timer for every correct answer
    }

    // activates streak on full gauge bar
    if (this.streak.gauge >= 100 && !this.timer) {
      this.streak.activateStreak();
      this.startTimer();
    }
    this.emitStreakActivated();
  }

  // listens for incorrect answer to reset streak
  private handleIncorrect() {
    this.stopTimer();
    this.streak.deactivateStreak();
    this.emitStreakActivated();
  }

  private startTimer() {
    if (this.timer) return; // avoid multiple timers

    const tickRate = 50; // run every 50ms (20 times/sec)
    const decayPerSecond = this.streak.decayRate; // e.g., 5 gauge per second
    const decayPerTick = decayPerSecond * (tickRate / 1000);

    this.timer = setInterval(() => {
      this.streak.gauge = Math.max(0, this.streak.gauge - decayPerTick);
      this.streak.time -= tickRate / 1000;

      // cooldown when streak decays to below 50 gauge progress
      if (this.streak.state === StreakState.Active && this.streak.gauge < 50) {
        this.streak.cooldDown();
      }

      this.emitStreakActivated(); // .Checks streak event every second. Event streak Deactivated on cooldown

      if (this.streak.time <= 0 || this.streak.gauge <= 0) {
        // checks if a new question was answered on time or if streak progress hits 0
        this.stopTimer();
        this.streak.deactivateStreak(); // reset state & gauge
        this.emitStreakActivated(); // Deactivates streak on no time left / no streak progress
      }
    }, tickRate);
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
