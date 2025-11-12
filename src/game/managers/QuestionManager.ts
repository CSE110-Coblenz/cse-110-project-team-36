import { events } from "../../shared/events";
import { Question, QuestionTopic, QuestionDifficulty } from "../models/question";

export interface QuestionConfig {
    topic: QuestionTopic;
    difficulty: QuestionDifficulty;
}

/**
 * Difficulty ranges for operands
 */
const DIFFICULTY_RANGES = {
    [QuestionDifficulty.EASY]: { min: 1, max: 5 },
    [QuestionDifficulty.MEDIUM]: { min: 1, max: 10 },
    [QuestionDifficulty.HARD]: { min: 1, max: 20 },
};

export class QuestionManager {
    private currentQuestion!: Question;
    private previousParams: { a: number; b: number; operation: string } | null = null;

    constructor(private config: QuestionConfig) {
        this.generateQuestion();
    }

    /**
     * Generate a new question
     * 
     * @param config - Override default config for this question
     * @returns The generated question text
     */
    generateQuestion(config?: QuestionConfig): string {
        const effectiveConfig: QuestionConfig = config ? { ...this.config, ...config } : this.config;
        const topic = effectiveConfig.topic;
        const difficulty = effectiveConfig.difficulty;

        // Generate question parameters, ensuring different (a, b) from previous
        const questionParams = this.generateQuestionParams(topic, difficulty, this.previousParams);

        // Store current params as previous for next generation
        this.previousParams = {
            a: questionParams.a,
            b: questionParams.b,
            operation: questionParams.operation
        };

        // Create the question object
        const questionText = `${questionParams.a} ${questionParams.operation} ${questionParams.b}`;
        this.currentQuestion = new Question(
            questionText,
            this.calculateAnswer(questionParams.a, questionParams.b, questionParams.operation),
            questionParams.topic,
            difficulty
        );

        return this.currentQuestion.questionText;
    }

    /**
     * Generate question parameters based on topic and difficulty
     * Ensures the generated (a, b) combination is different from previous
     */
    private generateQuestionParams(
        topic: QuestionTopic, 
        difficulty: QuestionDifficulty,
        previousParams: { a: number; b: number; operation: string } | null
    ) {
        const { min, max } = DIFFICULTY_RANGES[difficulty];
        const rangeSize = max - min + 1;
        
        let a = Math.floor(Math.random() * rangeSize) + min;
        let b = Math.floor(Math.random() * rangeSize) + min;

        // If we have previous params and the (a, b) combination matches, deterministically change it
        if (previousParams !== null && a === previousParams.a && b === previousParams.b) {
            // Change a to a different value, wrapping around if needed
            a = ((a - min + 1) % rangeSize) + min;
            // If that still matches and range is large enough, change b instead
            if (a === previousParams.a && b === previousParams.b && rangeSize > 1) {
                b = ((b - min + 1) % rangeSize) + min;
            }
        }

        let operation: string, actualTopic: QuestionTopic;

        if (topic === QuestionTopic.MIXED) {
            // Random operation for mixed mode
            const operations = ["+", "-", "*", "/"];
            operation = operations[Math.floor(Math.random() * operations.length)];
            actualTopic = this.getTopicFromOperation(operation);
        } else {
            operation = this.getOperationFromTopic(topic);
            actualTopic = topic;
        }

        return { a, b, operation, topic: actualTopic };
    }

    /**
     * Get topic from operation
     */
    private getTopicFromOperation(operation: string): QuestionTopic {
        switch (operation) {
            case "+": return QuestionTopic.ADDITION;
            case "-": return QuestionTopic.SUBTRACTION;
            case "*": return QuestionTopic.MULTIPLICATION;
            case "/": return QuestionTopic.DIVISION;
            default: return QuestionTopic.MIXED;
        }
    }

    /**
     * Get operation from topic
     */
    private getOperationFromTopic(topic: QuestionTopic): string {
        switch (topic) {
            case QuestionTopic.ADDITION: return "+";
            case QuestionTopic.SUBTRACTION: return "-";
            case QuestionTopic.MULTIPLICATION: return "*";
            case QuestionTopic.DIVISION: return "/";
            default: {
                const operations = ["+", "-", "*", "/"];
                return operations[Math.floor(Math.random() * operations.length)];
            }
        }
    }

    /**
     * Calculate answer for operation
     */
    private calculateAnswer(a: number, b: number, operation: string): number {
        switch (operation) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            case "/": return parseFloat((a / b).toFixed(2));
            default: return 0;
        }
    }



    /**
     * Submit an answer
     * 
     * @param answer - The user's answer
     * @returns True if correct, false otherwise
     */
    submitAnswer(answer: number): boolean {
        /**
         * ensures to accept answers that are 
         * close enough and correct. for example: 
         * 7/4 = 1.7 , 1.75, etc
         */
        const wasCorrect = Math.abs(answer - this.currentQuestion.correctAnswer) < 0.05;

        if (wasCorrect) {
            this.currentQuestion.markCorrect(answer);
            events.emit("AnsweredCorrectly", {
                question: this.currentQuestion.questionText,
                answer,
            });
        } else {
            this.currentQuestion.markIncorrect(answer);
            events.emit("AnsweredIncorrectly", {
                question: this.currentQuestion.questionText,
                answer,
            });
        }

        // Emit completed question for statistics
        events.emit("QuestionCompleted", {
            question: this.currentQuestion,
        });

        this.generateQuestion();
        return wasCorrect;
    }

    /**
     * Skip the current question
     */
    skipQuestion(): void {
        this.currentQuestion.markSkipped();
        events.emit("QuestionSkipped", {
            question: this.currentQuestion.questionText,
        });
        
        // Emit completed question for statistics
        events.emit("QuestionCompleted", {
            question: this.currentQuestion,
        });

        this.generateQuestion();
    }

    /**
     * Get the current question text
     */
    getCurrentQuestion(): string {
        return this.currentQuestion.questionText;
    }

    /**
     * Get the current question model for statistics
     */
    getCurrentQuestionModel(): Question {
        return this.currentQuestion;
    }

    /**
     * Expose the active difficulty so other systems (like the pit minigame)
     * can scale their challenge appropriately.
     */
    getDifficulty(): QuestionDifficulty {
        return this.config.difficulty;
    }

    getConfig(): QuestionConfig {
        return { ...this.config };
    }
}
