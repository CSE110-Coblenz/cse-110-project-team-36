import { MiniGameModel, type MiniGameResult } from "../Model/MiniGameModel";
import type { QuestionManager } from "../../../game/managers/QuestionManager";
import type { Question } from "../../../game/models/question";



/**
 * MiniGameController
 *
 * This class coordinates the minigame session:
 *  - owns a MiniGameModel (timer + performance)
 *  - reuses the main game's QuestionManager to generate questions
 *  - keeps its own notion of "current question"
 *  - validates answers and updates the MiniGameModel
 *
 * It does NOT:
 *  - emit the main game "AnsweredCorrectly/Incorrectly" events
 *  - modify the main QuestionManager stats (we only use it as a generator)
 */
export class MiniGameController {
    /**
     * Underlying model that tracks time and scores.
     */
    private readonly model: MiniGameModel;

    /**
     * Shared QuestionManager from the main game.
     */
    private readonly questionManager: QuestionManager;

    /**
     * The current question used in the minigame.
     */
    private currentQuestion: Question | null;

    /**
     * Buffer storing the player's current answer input as text.
     */
    private currentAnswerText: string = "";

    /**
     * Create a new minigame controller.
     *
     * @param durationSeconds - How long the player has for the challenge.
     * @param questionManager - The existing QuestionManager to reuse.
     */
    constructor(durationSeconds: number, questionManager: QuestionManager) {
        this.model = new MiniGameModel(durationSeconds);
        this.questionManager = questionManager;
        this.currentQuestion = this.generateQuestion();
    }

    /**
     * Get the underlying MiniGameModel.
     */
    public getModel(): MiniGameModel {
        return this.model;
    }

    /**
     * Get the current question model.
     */
    public getCurrentQuestion(): Question | null {
        return this.currentQuestion;
    }

    /**
     * Get the player's current answer text.
     */
    public getCurrentAnswerText(): string {
        return this.currentAnswerText;
    }

    /**
     * Replace the player's answer text buffer.
     */
    public setCurrentAnswerText(text: string): void {
        this.currentAnswerText = text;
    }

    /**
     * Advance the minigame timer by dt seconds.
     */
    public tick(dt: number): void {
        this.model.tick(dt);
        if (!this.model.isActive) {
            this.currentQuestion = null;
        }
    }

    /**
     * @returns true if the minigame session is finished.
     */
    public isFinished(): boolean {
        return !this.model.isActive;
    }

    /**
     * Force-complete the minigame immediately and clear the current question.
     */
    public completeNow(): void {
        this.model.completeNow();
        this.currentQuestion = null;
    }

    /**
     * Compute the final performance tier.
     */
    public getResultTier(): MiniGameResult {
        return this.model.computeResultTier();
    }

    /**
     * Submit the player's current answer for the current question.
     *
     *  - Parses the current answer text as a number.
     *  - Checks correctness using the same tolerance as QuestionManager
     *    (±0.05 for division).
     *  - Updates the MiniGameModel (correct / attempted).
     *  - Generates a new question if time remains.
     */
    public submitAnswer(): void {
        if (!this.currentQuestion || !this.model.isActive) {
            return;
        }

        const trimmed = this.currentAnswerText.trim();
        if (trimmed === "") {
            // Empty submission counts as incorrect but attempted.
            this.model.recordAnswer(false);
            this.currentAnswerText = "";
            this.currentQuestion = this.model.isActive
                ? this.generateQuestion()
                : null;
            return;
        }

        const parsed = Number(trimmed);
        let correct = false;

        if (Number.isFinite(parsed)) {
            // Reuse the same tolerance logic as QuestionManager.submitAnswer
            correct = Math.abs(parsed - this.currentQuestion.correctAnswer) < 0.05;
        }

        this.model.recordAnswer(correct);
        this.currentAnswerText = "";

        if (this.model.isActive) {
            this.currentQuestion = this.generateQuestion();
        } else {
            this.currentQuestion = null;
        }
    }

    /**
     * Generate a new question using the existing QuestionManager.
     *
     * We call QuestionManager.generateQuestion() to advance its internal
     * `currentQuestion`, then read that via getCurrentQuestionModel().
     */
    private generateQuestion(): Question | null {
        // Use the manager's config (topic + difficulty) as-is.
        this.questionManager.generateQuestion();
        return this.questionManager.getCurrentQuestionModel();
    }

}
