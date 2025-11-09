// SERVICE: Bot AI logic only no state of duel, no UI.

import { BOT_PRESETS, type BotDifficulty } from "../Model/duel-config";

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * BotAI answers a given question after a delay,
 * with accuracy depending on difficulty.
 */
export class BotAI {
  private accuracy: number;
  private minDelay: number;
  private maxDelay: number;

  constructor(difficulty: BotDifficulty = "MEDIUM") {
    const preset = BOT_PRESETS[difficulty];
    this.accuracy = preset.accuracy;
    this.minDelay = preset.minDelayMs;
    this.maxDelay = preset.maxDelayMs;
  }

  /**
   * Returns a promise that resolves with whether the bot answered correctly.
   */
  answer(questionId: number): Promise<{ questionId: number; correct: boolean }> {
    const delay = randInt(this.minDelay, this.maxDelay);
    const correct = Math.random() < this.accuracy;

    return new Promise((resolve) => {
      setTimeout(() => resolve({ questionId, correct }), delay);
    });
  }
}
