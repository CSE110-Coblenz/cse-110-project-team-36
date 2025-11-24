/**
 * Question topic/category enum
 */
export enum QuestionTopic {
    ADDITION = 'addition',
    SUBTRACTION = 'subtraction',
    MULTIPLICATION = 'multiplication',
    DIVISION = 'division',
    MIXED = 'mixed',
}

/**
 * Question difficulty level
 */
export enum QuestionDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

/**
 * Question outcome
 */
export enum QuestionOutcome {
    PENDING = 'pending',
    CORRECT = 'correct',
    INCORRECT = 'incorrect',
    SKIPPED = 'skipped',
}

/**
 * Question model
 *
 * Represents a math question with metadata for statistics
 */
export class Question {
    public readonly questionText: string;
    public readonly correctAnswer: number;
    public readonly topic: QuestionTopic;
    public readonly difficulty: QuestionDifficulty;
    public readonly generatedAt: number; // timestamp

    public userAnswer?: number;
    public outcome: QuestionOutcome = QuestionOutcome.PENDING;
    public answeredAt?: number; // timestamp when answered/skipped

    /**
     * Constructor
     *
     * @param questionText - The question text (e.g., "5 + 3")
     * @param correctAnswer - The correct answer
     * @param topic - The question topic
     * @param difficulty - The difficulty level
     */
    constructor(
        questionText: string,
        correctAnswer: number,
        topic: QuestionTopic,
        difficulty: QuestionDifficulty,
    ) {
        this.questionText = questionText;
        this.correctAnswer = correctAnswer;
        this.topic = topic;
        this.difficulty = difficulty;
        this.generatedAt = Date.now();
    }

    /**
     * Mark question as correct
     */
    markCorrect(userAnswer: number) {
        this.userAnswer = userAnswer;
        this.outcome = QuestionOutcome.CORRECT;
        this.answeredAt = Date.now();
    }

    /**
     * Mark question as incorrect
     */
    markIncorrect(userAnswer: number) {
        this.userAnswer = userAnswer;
        this.outcome = QuestionOutcome.INCORRECT;
        this.answeredAt = Date.now();
    }

    /**
     * Mark question as skipped
     */
    markSkipped() {
        this.outcome = QuestionOutcome.SKIPPED;
        this.answeredAt = Date.now();
    }

    /**
     * Get time to answer in milliseconds
     */
    getTimeToAnswer(): number | null {
        if (!this.answeredAt) return null;
        return this.answeredAt - this.generatedAt;
    }

    /**
     * Check if question is answered correctly
     */
    isCorrect(): boolean {
        return this.outcome === QuestionOutcome.CORRECT;
    }

    /**
     * Export question data for statistics
     */
    toStatsData() {
        return {
            questionText: this.questionText,
            correctAnswer: this.correctAnswer,
            userAnswer: this.userAnswer,
            topic: this.topic,
            difficulty: this.difficulty,
            outcome: this.outcome,
            timeToAnswer: this.getTimeToAnswer(),
            generatedAt: this.generatedAt,
            answeredAt: this.answeredAt ?? null,
        };
    }
}
