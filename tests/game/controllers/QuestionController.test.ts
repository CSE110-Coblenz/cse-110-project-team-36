/**
 * Unit tests for QuestionController
 */

import { QuestionController } from '../../../src/game/controllers/QuestionController';
import { QuestionManager } from '../../../src/game/managers/QuestionManager';
import { QuestionTopic } from '../../../src/game/models/question';
import { Difficulty } from '../../../src/game/config/types';

describe('QuestionController', () => {
    let questionManager: QuestionManager;
    let controller: QuestionController;

    beforeEach(() => {
        questionManager = new QuestionManager({
            topic: QuestionTopic.ADDITION,
            difficulty: Difficulty.EASY,
        });
        controller = new QuestionController(questionManager);
    });

    afterEach(() => {
        controller.destroy();
    });

    describe('Initialization', () => {
        it('should create a QuestionController', () => {
            expect(controller).toBeDefined();
        });

        it('should initialize with empty answer', () => {
            expect(controller.getAnswer()).toBe('');
        });

        it('should initialize with no feedback', () => {
            expect(controller.getFeedback()).toBe('none');
        });

        it('should initialize with current question from manager', () => {
            const currentQuestion = questionManager.getCurrentQuestion();
            expect(controller.getCurrentQuestion()).toBe(currentQuestion);
        });
    });

    describe('Answer Input', () => {
        it('should add characters to answer', () => {
            controller.addChar('1');
            expect(controller.getAnswer()).toBe('1');

            controller.addChar('2');
            expect(controller.getAnswer()).toBe('12');

            controller.addChar('.');
            expect(controller.getAnswer()).toBe('12.');
        });

        it('should delete characters from answer', () => {
            controller.addChar('1');
            controller.addChar('2');
            controller.addChar('3');

            controller.deleteChar();
            expect(controller.getAnswer()).toBe('12');

            controller.deleteChar();
            expect(controller.getAnswer()).toBe('1');

            controller.deleteChar();
            expect(controller.getAnswer()).toBe('');
        });

        it('should handle deleting from empty answer', () => {
            controller.deleteChar();
            expect(controller.getAnswer()).toBe('');
        });
    });

    describe('Answer Submission', () => {
        it('should submit correct answer and show correct feedback', () => {
            const question = questionManager.getCurrentQuestion();
            const answer =
                questionManager.getCurrentQuestionModel()?.correctAnswer || 0;

            controller.addChar(answer.toString());
            controller.submitAnswer();

            expect(controller.getFeedback()).toBe('correct');
            expect(controller.getAnswer()).toBe('');
            expect(controller.getCurrentQuestion()).not.toBe(question);
        });

        it('should submit incorrect answer and show incorrect feedback', () => {
            const question = questionManager.getCurrentQuestion();
            const wrongAnswer = 999999;

            controller.addChar(wrongAnswer.toString());
            controller.submitAnswer();

            expect(controller.getFeedback()).toBe('incorrect');
            expect(controller.getAnswer()).toBe('');
            expect(controller.getCurrentQuestion()).not.toBe(question);
        });

        it('should not submit empty answer', () => {
            const question = controller.getCurrentQuestion();
            controller.submitAnswer();

            // Should not change question or feedback
            expect(controller.getCurrentQuestion()).toBe(question);
            expect(controller.getFeedback()).toBe('none');
        });

        it('should not submit answer with only "-"', () => {
            controller.addChar('-');
            controller.submitAnswer();

            expect(controller.getFeedback()).toBe('none');
        });

        it('should not submit answer with only "."', () => {
            controller.addChar('.');
            controller.submitAnswer();

            expect(controller.getFeedback()).toBe('none');
        });

        it('should not submit answer with only "-."', () => {
            controller.addChar('-');
            controller.addChar('.');
            controller.submitAnswer();

            expect(controller.getFeedback()).toBe('none');
        });

        it('should clear feedback after timeout', (done) => {
            const answer =
                questionManager.getCurrentQuestionModel()?.correctAnswer || 0;
            controller.addChar(answer.toString());
            controller.submitAnswer();

            expect(controller.getFeedback()).toBe('correct');

            setTimeout(() => {
                expect(controller.getFeedback()).toBe('none');
                done();
            }, 950);
        });

        it('should handle negative answers', () => {
            // Test that we can input negative signs
            controller.addChar('-');
            controller.addChar('5');

            const currentAnswer = controller.getAnswer();
            expect(currentAnswer).toBe('-5');

            controller.submitAnswer();
            // Should process the submission (feedback may vary)
            expect(controller.getAnswer()).toBe('');
        });
    });

    describe('Skip Question', () => {
        it('should skip question and update current question', () => {
            const initialQuestion = controller.getCurrentQuestion();

            controller.skipQuestion();

            expect(controller.getCurrentQuestion()).not.toBe(initialQuestion);
            expect(controller.getAnswer()).toBe('');
            expect(controller.getFeedback()).toBe('none');
        });

        it('should clear answer when skipping', () => {
            controller.addChar('1');
            controller.addChar('2');
            controller.addChar('3');

            controller.skipQuestion();

            expect(controller.getAnswer()).toBe('');
        });

        it('should clear feedback when skipping', () => {
            const answer =
                questionManager.getCurrentQuestionModel()?.correctAnswer || 0;
            controller.addChar(answer.toString());
            controller.submitAnswer();

            expect(controller.getFeedback()).toBe('correct');

            controller.skipQuestion();

            expect(controller.getFeedback()).toBe('none');
        });
    });

    describe('State Getters', () => {
        it('should get current answer', () => {
            controller.addChar('1');
            controller.addChar('2');
            expect(controller.getAnswer()).toBe('12');
        });

        it('should get current feedback', () => {
            const answer =
                questionManager.getCurrentQuestionModel()?.correctAnswer || 0;
            controller.addChar(answer.toString());
            controller.submitAnswer();
            expect(controller.getFeedback()).toBe('correct');
        });

        it('should get current question', () => {
            const question = questionManager.getCurrentQuestion();
            expect(controller.getCurrentQuestion()).toBe(question);
        });
    });

    describe('Cleanup', () => {
        it('should destroy and clear timeouts', (done) => {
            const answer =
                questionManager.getCurrentQuestionModel()?.correctAnswer || 0;
            controller.addChar(answer.toString());
            controller.submitAnswer();

            expect(controller.getFeedback()).toBe('correct');

            controller.destroy();

            // Feedback should remain as is after destruction (timeout cleared)
            setTimeout(() => {
                // Feedback should still be 'correct' since timeout was cleared
                expect(controller.getFeedback()).toBe('correct');
                done();
            }, 950);
        });

        it('should be safe to call destroy multiple times', () => {
            expect(() => {
                controller.destroy();
                controller.destroy();
            }).not.toThrow();
        });
    });
});
