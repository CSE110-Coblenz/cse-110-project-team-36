import type { DuelConfig } from "./duel-model";

export const DEFAULT_DUEL_CONFIG: DuelConfig = {
  durationMs: 60_000,
  countdownMs: 3_000,
  baseDamage: 8,
  wrongSelfDamage: 6,
  streakStep: 3,
  maxMultiplier: 2.5,
};

export type BotDifficulty = "EASY" | "MEDIUM" | "HARD";

export const BOT_PRESETS: Record<
  BotDifficulty,
  { accuracy: number; minDelayMs: number; maxDelayMs: number }
> = {
  EASY:   { accuracy: 0.55, minDelayMs: 1300, maxDelayMs: 2200 },
  MEDIUM: { accuracy: 0.70, minDelayMs: 900,  maxDelayMs: 1700 },
  HARD:   { accuracy: 0.88, minDelayMs: 600,  maxDelayMs: 1300 },
};
