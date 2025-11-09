// CONTROLLER: manages DuelState, talks to BotAI + Question generator.

import {DEFAULT_DUEL_CONFIG, type BotDifficulty,} from "../Model/duel-config";
import type {
  DuelConfig,
  DuelState,
  ScoreState,
  DuelResultTier,
} from "../Model/duel-model";
import type { DuelQuestion } from "../Model/duel-question-service";
import { generateQuestion } from "../Model/duel-question-service";
import { BotAI } from "../Service/bot-ai";

function makeScore(): ScoreState {
  return {
    hp: 100,
    streak: 0,
    maxStreak: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
  };
}

export class DuelController {
  private cfg: DuelConfig;
  private bot: BotAI;
  //private difficulty: BotDifficulty; // htis is not used for now we can use it as required
  private state: DuelState;
  private currentQuestion: DuelQuestion | null = null;
  private currentDifficultyLevel = 1; // 1..3, question difficulty
  private activeQuestionId: number | null = null;
  private finishedCallback?: (tier: DuelResultTier) => void;

  constructor(
    difficulty: BotDifficulty = "MEDIUM",
    config?: Partial<DuelConfig>,
    onFinished?: (tier: DuelResultTier) => void
  ) {
    this.cfg = { ...DEFAULT_DUEL_CONFIG, ...(config ?? {}) };
    this.bot = new BotAI(difficulty);
    this.finishedCallback = onFinished ?? undefined;

    this.state = {
      phase: "COUNTDOWN",
      remainingMs: this.cfg.durationMs,
      countdownMs: this.cfg.countdownMs,
      player: makeScore(),
      bot: makeScore(),
      comboMultiplier: 1,
      lastEventText: null,
      winner: null,
      resultTier: null,
    };
  }

  // ----- MODEL ACCESSORS -----

  getState(): DuelState {
    return this.state;
  }

  getQuestion(): DuelQuestion | null {
    return this.currentQuestion;
  }

  // ----- LIFECYCLE -----

  /** Called regularly (dt in ms) by the view or outer engine. */
  tick(deltaMs: number): void {
    if (this.state.phase === "COUNTDOWN") {
      this.state.countdownMs -= deltaMs;
      if (this.state.countdownMs <= 0) {
        this.state.countdownMs = 0;
        this.state.phase = "PLAYING";
        this.spawnNextQuestion();
      }
    } else if (this.state.phase === "PLAYING") {
      this.state.remainingMs -= deltaMs;
      if (this.state.remainingMs <= 0) {
        this.state.remainingMs = 0;
        this.finish("time");
      }
    }
  }

  /** Player chose an answer. */
  submitPlayerAnswer(answer: number): void {
    if (this.state.phase !== "PLAYING" || !this.currentQuestion) return;

    const correct = answer === this.currentQuestion.correctAnswer;

    if (correct) {
      this.applyPlayerHit();
      this.state.lastEventText =
        this.state.comboMultiplier > 1
          ? `Critical hit! Combo x${this.state.comboMultiplier.toFixed(1)}`
          : "Nice hit!";
      this.levelDifficultyUp();
    } else {
      this.applySelfDamage();
      this.state.lastEventText = "Ouch! You opened the door for the bot!";
    }

    if (this.state.bot.hp <= 0 || this.state.player.hp <= 0) {
      this.finish("hp");
      return;
    }

    this.spawnNextQuestion();
  }

  /** Player gives up. */
  forfeit(): void {
    if (this.state.phase === "RESULTS") return;
    this.finish("forfeit");
  }

  // ----- INTERNAL RULES -----

  private spawnNextQuestion(): void {
    this.currentQuestion = generateQuestion(this.currentDifficultyLevel);
    this.activeQuestionId = this.currentQuestion.id;

    // Schedule bot's attempt for this question
    this.bot.answer(this.currentQuestion.id).then((res) => {
      if (
        this.state.phase !== "PLAYING" ||
        this.activeQuestionId !== res.questionId ||
        !this.currentQuestion
      ) {
        return; // stale / ignored
      }

      if (res.correct) {
        this.applyBotHit();
        this.state.lastEventText = "Bot hits you back!";
      } else if (!this.state.lastEventText) {
        this.state.lastEventText = "Bot fumbled an easy one.";
      }

      if (this.state.player.hp <= 0 || this.state.bot.hp <= 0) {
        this.finish("hp");
      }
    });
  }

  private applyPlayerHit(): void {
    const s = this.state.player;
    s.totalCorrect++;
    s.streak++;
    s.maxStreak = Math.max(s.maxStreak, s.streak);

    const mult = this.computeMultiplier(s.streak);
    this.state.comboMultiplier = mult;

    const dmg = Math.round(this.cfg.baseDamage * mult);
    this.state.bot.hp = Math.max(0, this.state.bot.hp - dmg);
  }

  private applySelfDamage(): void {
    const s = this.state.player;
    s.totalIncorrect++;
    s.streak = 0;
    this.state.comboMultiplier = 1;
    this.state.player.hp = Math.max(0, this.state.player.hp - this.cfg.wrongSelfDamage);
  }

  private applyBotHit(): void {
    const s = this.state.bot;
    s.totalCorrect++;
    s.streak++;
    s.maxStreak = Math.max(s.maxStreak, s.streak);

    const mult = this.computeMultiplier(s.streak);
    const dmg = Math.round(this.cfg.baseDamage * mult * 0.9); // bot slightly weaker
    this.state.player.hp = Math.max(0, this.state.player.hp - dmg);
  }

  private computeMultiplier(streak: number): number {
    if (streak < this.cfg.streakStep) return 1;
    const steps = Math.floor(streak / this.cfg.streakStep);
    const mult = 1 + 0.5 * steps; // x1, x1.5, x2, ...
    return Math.min(mult, this.cfg.maxMultiplier);
  }

  private levelDifficultyUp(): void {
    if (this.currentDifficultyLevel < 3 && this.state.player.streak % 4 === 0) {
      this.currentDifficultyLevel++;
    }
  }

  private finish(reason: "hp" | "time" | "forfeit"): void {
    this.state.phase = "RESULTS";

    const p = this.state.player.hp;
    const b = this.state.bot.hp;

    if (reason === "forfeit") {
      this.state.winner = "BOT";
      this.setResultTier("LOSE");
      return;
    }

    if (p <= 0 && b <= 0) {
      this.state.winner = "DRAW";
      this.setResultTier("LOSE");
    } else if (b <= 0 || p > b) {
      this.state.winner = "PLAYER";
      if (p >= 60 && b <= 0) this.setResultTier("WIN_BIG");
      else this.setResultTier("WIN_CLOSE");
    } else {
      this.state.winner = "BOT";
      this.setResultTier("LOSE");
    }
  }

  private setResultTier(tier: DuelResultTier): void {
    this.state.resultTier = tier;
    if (this.finishedCallback) this.finishedCallback(tier);
  }
}
