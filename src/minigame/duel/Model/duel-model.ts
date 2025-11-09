// MODEL: Duel state and core types 

export type DuelPhase = "COUNTDOWN" | "PLAYING" | "RESULTS";

export interface ScoreState {
  hp: number;              // 0–100
  streak: number;
  maxStreak: number;
  totalCorrect: number;
  totalIncorrect: number;
}

export interface DuelConfig {
  durationMs: number;      // total duel time
  countdownMs: number;     // pre-start countdown
  baseDamage: number;      // damage per correct hit at x1
  wrongSelfDamage: number; // damage you take on wrong answer
  streakStep: number;      // streak length to increase multiplier
  maxMultiplier: number;
}

export type DuelResultTier = "WIN_BIG" | "WIN_CLOSE" | "LOSE";

export interface DuelState {
  phase: DuelPhase;
  remainingMs: number;
  countdownMs: number;
  player: ScoreState;
  bot: ScoreState;
  comboMultiplier: number;
  lastEventText: string | null;
  winner: "PLAYER" | "BOT" | "DRAW" | null;
  resultTier: DuelResultTier | null;
}
