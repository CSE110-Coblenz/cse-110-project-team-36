import { QuestionManager } from '../managers/QuestionManager';
import { events } from '../../shared/events';

export type FeedbackState = 'none' | 'correct' | 'incorrect';

/**
 * Question controller class
 *
 * Manages question-related state and logic:
 * - Answer input state
 * - Feedback state and timing
 * - Question submission and validation
 */
export class QuestionController {
    private answer: string = '';
    private feedback: FeedbackState = 'none';
    private feedbackTimeoutId: number | null = null;
    private currentQuestion: string;

    constructor(private questionManager: QuestionManager) {
        this.currentQuestion = questionManager.getCurrentQuestion();
    }

    /**
     * Emit state change event
     */
    private emitStateChange(): void {
        events.emit('QuestionStateChanged', {});
    }

    /**
     * Add a character to the answer
     *
     * @param char - Character to add
     */
    addChar(char: string): void {
        this.answer += char;
        this.emitStateChange();
    }

    /**
     * Delete the last character from the answer
     */
    deleteChar(): void {
        this.answer = this.answer.slice(0, -1);
        this.emitStateChange();
    }

    /**
     * Submit the current answer
     */
    submitAnswer(): void {
        if (!this.questionManager) return;

        if (
            this.answer.trim() === '' ||
            this.answer === '-' ||
            this.answer === '.' ||
            this.answer === '-.'
        ) {
            return;
        }

        const numAnswer = Number(this.answer);
        const wasCorrect = this.questionManager.submitAnswer(numAnswer);

        this.feedback = wasCorrect ? 'correct' : 'incorrect';

        if (this.feedbackTimeoutId !== null) {
            clearTimeout(this.feedbackTimeoutId);
        }

        this.feedbackTimeoutId = window.setTimeout(() => {
            this.feedback = 'none';
            this.feedbackTimeoutId = null;
            this.emitStateChange();
        }, 900);

        this.currentQuestion = this.questionManager.getCurrentQuestion();
        this.answer = '';
        this.emitStateChange();
    }

    /**
     * Skip the current question
     */
    skipQuestion(): void {
        this.questionManager.skipQuestion();
        this.currentQuestion = this.questionManager.getCurrentQuestion();
        this.answer = '';
        this.feedback = 'none';

        if (this.feedbackTimeoutId !== null) {
            clearTimeout(this.feedbackTimeoutId);
            this.feedbackTimeoutId = null;
        }
        this.emitStateChange();
    }

    /**
     * Get the current answer string
     *
     * @returns Current answer
     */
    getAnswer(): string {
        return this.answer;
    }

    /**
     * Get the current feedback state
     *
     * @returns Current feedback state
     */
    getFeedback(): FeedbackState {
        return this.feedback;
    }

    /**
     * Get the current question text
     *
     * @returns Current question text
     */
    getCurrentQuestion(): string {
        return this.currentQuestion;
    }

    /**
     * Destroy the controller and clean up all resources
     *
     * This should be called when the controller is no longer needed (e.g., when exiting the game).
     */
    destroy(): void {
        if (this.feedbackTimeoutId !== null) {
            clearTimeout(this.feedbackTimeoutId);
            this.feedbackTimeoutId = null;
        }
    }
}
