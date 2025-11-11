/**
 * MiniGameResult
 *
 * This describes the performance tier the player reaches
 * in the pit-stop minigame. The rest of the race logic
 * (PitController, RaceController) can map these tiers to
 * specific fuel / tire rewards.
 *
 * You can tune the names, but using three tiers keeps the
 * mapping simple:
 *
 *  - "WIN_BIG"   : excellent performance
 *  - "WIN_CLOSE" : decent performance
 *  - "LOSE"      : poor performance
 * 
 *  
 */
export type MiniGameResult = "WIN_BIG" | "WIN_CLOSE" | "LOSE";

/**
 * MiniGameModel
 *
 * This class encapsulates the *pure state* of a timed pit-stop
 * challenge, without knowing anything about React, DOM, or
 * the rest of the game.
 *
 * The challenge is:
 *   - Start with a fixed amount of time (totalDuration).
 *   - While time remains, the player answers questions.
 *   - Every answer is recorded as correct/incorrect.
 *   - When time runs out (or we complete early), we compute
 *     a MiniGameResultTier based on the player's performance.
 */
export class MiniGameModel {
    /**
     * Total duration of this challenge in seconds.
     * Example: 20 or 25 seconds.
     */
    public readonly totalDuration: number;

    /**
     * Remaining time in seconds.
     * This starts equal to totalDuration and counts down to 0.
     */
    public remainingTime: number;

    /**
     * Number of questions the player answered correctly
     * during this challenge.
     */
    public correctCount: number = 0;

    /**
     * Total number of questions the player has attempted
     * (whether correct or incorrect).
     */
    public attemptedCount: number = 0;

    /**
     * Flag indicating whether the minigame is currently active.
     * Once time reaches 0 or we force-complete, this becomes false.
     */
    public isActive: boolean = true;

    /**
     * Create a new timed minigame model.
     *
     * @param durationSeconds - Number of seconds the player
     *                          has to answer questions.
     */
    constructor(durationSeconds: number) {
        this.totalDuration = durationSeconds;
        this.remainingTime = durationSeconds;
    }

    /**
     * Advance the internal timer by a small time step.
     *
     * This is typically called on each "tick" of a local UI
     * loop (e.g., using requestAnimationFrame or setInterval)
     * from the React view, not from the main race loop.
     *
     * @param dt - Time step in seconds since the last tick.
     */
    public tick(dt: number): void {
        if (!this.isActive) return;

        this.remainingTime = Math.max(0, this.remainingTime - dt);

        if (this.remainingTime === 0) {
            this.isActive = false;
        }
    }

    /**
     * Record the result of a single answered question.
     *
     * @param correct - true if the player's answer was correct.
     */
    public recordAnswer(correct: boolean): void {
        if (!this.isActive) return;

        this.attemptedCount += 1;
        if (correct) {
            this.correctCount += 1;
        }
    }

    /**
     * Force-complete the minigame immediately.
     * Useful if the player clicks "Finish pit stop" early.
     */
    public completeNow(): void {
        this.isActive = false;
        this.remainingTime = 0;
    }

    /**
     * Compute the performance tier based on the player's
     * performance (correctCount, attemptedCount, etc.).
     *
     * You can tune this logic however you like.
     *
     * Example logic:
     *  - WIN_BIG   : 7+ correct
     *  - WIN_CLOSE : 4–6 correct
     *  - LOSE      : 0–3 correct
     *
     * @returns A MiniGameResultTier representing how well
     *          the player did during this session.
     */
    public computeResultTier(): MiniGameResult {
        const c = this.correctCount;

        if (c >= 7) {
            return "WIN_BIG";
        } else if (c >= 4) {
            return "WIN_CLOSE";
        } else {
            return "LOSE";
        }
    }
}
