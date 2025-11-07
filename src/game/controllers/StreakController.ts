import { events } from "../../shared/events";
import { AnswerStreak } from "../models/AnswerStreak";

export class StreakController {
  private streak: AnswerStreak;

  constructor() {
    this.streak = new AnswerStreak();

    events.on("AnsweredCorrectly", () => this.streak.onCorrectAnswer());
    events.on("AnsweredIncorrectly", () => this.streak.onWrongAnswer());
  }

  getState() {
    return this.streak.state;
  }
}
