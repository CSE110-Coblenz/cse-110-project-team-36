/**
 * Unit tests for QuestionManager.
 */

import { QuestionManager } from '../../../src/game/managers/QuestionManager';
import { events } from '../../../src/shared/events';

describe('QuestionManager', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Question Generation', () => {
        it('should generate initial question in constructor', () => {
            const manager = new QuestionManager();

            const question = manager.getCurrentQuestion();
            expect(question).toBeDefined();
            expect(typeof question).toBe('string');
            expect(question.length).toBeGreaterThan(0);
        });

        it('should create valid math expression', () => {
            const manager = new QuestionManager();
            const question = manager.getCurrentQuestion();

            expect(question).toMatch(/^\d+\s[+\-*/]\s\d+$/);
        });

        it('should include all four operations', () => {
            const manager = new QuestionManager();
            const operations = new Set<string>();

            for (let i = 0; i < 100; i++) {
                manager.generateQuestion();
                const question = manager.getCurrentQuestion();
                const match = question.match(/^\d+\s([+\-*/])\s\d+$/);
                if (match) {
                    operations.add(match[1]);
                }
            }

            expect(operations.has('+')).toBe(true);
            expect(operations.has('-')).toBe(true);
            expect(operations.has('*')).toBe(true);
            expect(operations.has('/')).toBe(true);
        });

        it('should generate operands between 1-10', () => {
            const manager = new QuestionManager();

            for (let i = 0; i < 100; i++) {
                manager.generateQuestion();
                const question = manager.getCurrentQuestion();
                const match = question.match(/^(\d+)\s[+\-*/]\s(\d+)$/);

                if (match) {
                    const a = parseInt(match[1]);
                    const b = parseInt(match[2]);
                    expect(a).toBeGreaterThanOrEqual(1);
                    expect(a).toBeLessThanOrEqual(10);
                    expect(b).toBeGreaterThanOrEqual(1);
                    expect(b).toBeLessThanOrEqual(10);
                }
            }
        });

        it('should round division result to 2 decimals', () => {
            const manager = new QuestionManager();
            let divisionQuestion: string | null = null;

            for (let i = 0; i < 200; i++) {
                manager.generateQuestion();
                const question = manager.getCurrentQuestion();
                if (question.includes('/')) {
                    divisionQuestion = question;
                    break;
                }
            }

            expect(divisionQuestion).not.toBeNull();
            if (divisionQuestion) {
                const match = divisionQuestion.match(/^(\d+)\s\/\s(\d+)$/);
                if (match) {
                    const a = parseInt(match[1]);
                    const b = parseInt(match[2]);
                    const result = parseFloat((a / b).toFixed(2));

                    expect(result).toBeDefined();
                    expect(result).toBeCloseTo(a / b, 2);
                }
            }
        });

        it('should generate different questions on subsequent calls', () => {
            const manager = new QuestionManager();
            const questions = new Set<string>();

            for (let i = 0; i < 50; i++) {
                manager.generateQuestion();
                questions.add(manager.getCurrentQuestion());
            }

            expect(questions.size).toBeGreaterThan(5);
        });
    });

    describe('Answer Validation', () => {
        it('should return true for correct answer', () => {
            const manager = new QuestionManager();

            const question = '5 + 3';
            const correctAnswer = 8;

            let attempts = 0;
            while (manager.getCurrentQuestion() !== question && attempts < 1000) {
                manager.generateQuestion();
                attempts++;
            }

            if (attempts < 1000) {
                const result = manager.submitAnswer(correctAnswer);
                expect(result).toBe(true);
            }
        });

        it('should return false for incorrect answer', () => {
            const manager = new QuestionManager();
            const question = manager.getCurrentQuestion();

            const match = question.match(/^(\d+)\s[+\-*/]\s(\d+)$/);
            if (match) {
                const a = parseInt(match[1]);
                const b = parseInt(match[2]);
                const op = question.replace(/[\d\s]/g, '');

                let wrongAnswer: number;
                let correctAnswer: number;

                switch (op) {
                    case '+':
                        correctAnswer = a + b;
                        wrongAnswer = correctAnswer + 10;
                        break;
                    case '-':
                        correctAnswer = a - b;
                        wrongAnswer = correctAnswer - 10;
                        break;
                    case '*':
                        correctAnswer = a * b;
                        wrongAnswer = correctAnswer * 2;
                        break;
                    case '/':
                        correctAnswer = parseFloat((a / b).toFixed(2));
                        wrongAnswer = correctAnswer + 5;
                        break;
                    default:
                        throw new Error('Unknown operator');
                }

                const result = manager.submitAnswer(wrongAnswer);

                expect(result).toBe(false);
            }
        });

        it('should generate new question after submission', () => {
            const manager = new QuestionManager();
            const originalQuestion = manager.getCurrentQuestion();

            manager.submitAnswer(999);

            const newQuestion = manager.getCurrentQuestion();
            expect(newQuestion).not.toBe(originalQuestion);
        });

        it('should handle multiple consecutive submissions', () => {
            const manager = new QuestionManager();
            const questions = new Set<string>();

            for (let i = 0; i < 20; i++) {
                manager.submitAnswer(999);
                questions.add(manager.getCurrentQuestion());
            }

            expect(questions.size).toBeGreaterThan(1);
        });

        it('should work correctly with realistic math operations', () => {
            const operations = [
                { q: '2 + 3', a: 5 },
                { q: '10 - 4', a: 6 },
                { q: '5 * 6', a: 30 },
                { q: '9 / 3', a: 3 },
                { q: '7 / 2', a: 3.5 },
            ];

            operations.forEach(({ q, a }) => {
                const manager = new QuestionManager();

                let attempts = 0;
                while (manager.getCurrentQuestion() !== q && attempts < 10000) {
                    manager.generateQuestion();
                    attempts++;
                }

                if (attempts < 10000) {
                    const result = manager.submitAnswer(a);
                    expect(result).toBe(true);
                }
            });
        });
    });

    describe('Event Emission', () => {
        it('should emit AnsweredCorrectly event with correct answer', () => {
            const manager = new QuestionManager();
            const emitSpy = jest.spyOn(events, 'emit');

            const question = manager.getCurrentQuestion();
            const match = question.match(/^(\d+)\s[+\-*/]\s(\d+)$/);

            if (match) {
                const a = parseInt(match[1]);
                const b = parseInt(match[2]);
                const op = question.replace(/[\d\s]/g, '');

                let correctAnswer: number;
                switch (op) {
                    case '+':
                        correctAnswer = a + b;
                        break;
                    case '-':
                        correctAnswer = a - b;
                        break;
                    case '*':
                        correctAnswer = a * b;
                        break;
                    case '/':
                        correctAnswer = parseFloat((a / b).toFixed(2));
                        break;
                    default:
                        throw new Error('Unknown operator');
                }

                manager.submitAnswer(correctAnswer);

                expect(emitSpy).toHaveBeenCalledWith('AnsweredCorrectly', {
                    question,
                    answer: correctAnswer,
                });
            }

            emitSpy.mockRestore();
        });

        it('should emit AnsweredIncorrectly event with incorrect answer', () => {
            const manager = new QuestionManager();
            const emitSpy = jest.spyOn(events, 'emit');
            const wrongAnswer = 999;

            manager.submitAnswer(wrongAnswer);

            expect(emitSpy).toHaveBeenCalledWith('AnsweredIncorrectly', {
                question: expect.any(String),
                answer: wrongAnswer,
            });

            emitSpy.mockRestore();
        });

        it('should include question and answer in event payload', () => {
            const manager = new QuestionManager();
            const emitSpy = jest.spyOn(events, 'emit');
            const wrongAnswer = 123;

            manager.submitAnswer(wrongAnswer);

            const call = emitSpy.mock.calls.find(c => c[0] === 'AnsweredIncorrectly');
            expect(call).toBeDefined();
            if (call) {
                const payload = call[1] as { question: string; answer: number };
                expect(payload).toHaveProperty('question');
                expect(payload).toHaveProperty('answer');
                expect(payload.answer).toBe(wrongAnswer);
            }

            emitSpy.mockRestore();
        });
    });

    describe('Getter', () => {
        it('should return current question string', () => {
            const manager = new QuestionManager();

            const question = manager.getCurrentQuestion();

            expect(typeof question).toBe('string');
            expect(question).toMatch(/^\d+\s[+\-*/]\s\d+$/);
        });

        it('should return same question until submission or generation', () => {
            const manager = new QuestionManager();
            const question1 = manager.getCurrentQuestion();

            const question2 = manager.getCurrentQuestion();

            expect(question1).toBe(question2);
            expect(question2).toBe(manager.getCurrentQuestion());
        });

        it('should return updated question after generation', () => {
            const manager = new QuestionManager();
            const question1 = manager.getCurrentQuestion();

            manager.generateQuestion();
            const question2 = manager.getCurrentQuestion();

            expect(question2).not.toBe(question1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle decimal results correctly', () => {
            const manager = new QuestionManager();

            for (let i = 0; i < 500; i++) {
                manager.generateQuestion();
                const question = manager.getCurrentQuestion();

                if (question.includes('/')) {
                    const match = question.match(/^(\d+)\s\/\s(\d+)$/);
                    if (match) {
                        const a = parseInt(match[1]);
                        const b = parseInt(match[2]);

                        if (a % b !== 0) {
                            const result = parseFloat((a / b).toFixed(2));
                            const submissionResult = manager.submitAnswer(result);
                            expect(submissionResult).toBe(true);
                            break;
                        }
                    }
                }
            }
        });

        it('should generate questions with all valid operands', () => {
            const manager = new QuestionManager();
            const seenNumbers = new Set<number>();

            for (let i = 0; i < 500; i++) {
                manager.generateQuestion();
                const question = manager.getCurrentQuestion();
                const match = question.match(/^(\d+)\s[+\-*/]\s(\d+)$/);

                if (match) {
                    seenNumbers.add(parseInt(match[1]));
                    seenNumbers.add(parseInt(match[2]));
                }
            }

            expect(seenNumbers.size).toBeGreaterThan(8);
        });
    });
});

