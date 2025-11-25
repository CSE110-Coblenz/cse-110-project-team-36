import { Question, QuestionOutcome } from '../models/question';

/**
 * Statistics entry for a question
 */
export interface QuestionStats {
    questionText: string;
    correctAnswer: number;
    userAnswer?: number;
    topic: string;
    difficulty: string;
    outcome: string;
    timeToAnswer: number | null;
    generatedAt: number;
    answeredAt: number | null;
}

/**
 * Question statistics manager
 *
 * Tracks question results for analysis and export
 */
export class QuestionStatsManager {
    private stats: QuestionStats[] = [];

    /**
     * Record a completed question
     *
     * @param question - The question to record
     */
    recordQuestion(question: Question): void {
        this.stats.push(question.toStatsData());
    }

    /**
     * Get all recorded statistics
     *
     * @returns Array of question statistics
     */
    getStats(): readonly QuestionStats[] {
        return this.stats;
    }

    /**
     * Clear all statistics
     */
    clear(): void {
        this.stats = [];
    }

    /**
     * Export statistics to JSON
     *
     * @returns JSON string of statistics
     */
    exportToJSON(): string {
        return JSON.stringify(
            {
                version: 1,
                timestamp: Date.now(),
                totalQuestions: this.stats.length,
                stats: this.stats,
                summary: this.getSummary(),
            },
            null,
            2,
        );
    }

    /**
     * Get summary statistics
     *
     * @returns Summary object with totals and percentages
     */
    private getSummary() {
        const total = this.stats.length;
        if (total === 0) {
            return {
                totalQuestions: 0,
                correct: 0,
                incorrect: 0,
                skipped: 0,
                averageTime: null,
                correctnessRate: 0,
            };
        }

        const correct = this.stats.filter(
            (s) => s.outcome === QuestionOutcome.CORRECT,
        ).length;
        const incorrect = this.stats.filter(
            (s) => s.outcome === QuestionOutcome.INCORRECT,
        ).length;
        const skipped = this.stats.filter(
            (s) => s.outcome === QuestionOutcome.SKIPPED,
        ).length;

        const answeredTimes = this.stats
            .filter((s) => s.timeToAnswer !== null)
            .map((s) => s.timeToAnswer!);
        const averageTime =
            answeredTimes.length > 0
                ? answeredTimes.reduce((a, b) => a + b, 0) /
                  answeredTimes.length
                : null;

        const answeredCount = correct + incorrect;
        const correctnessRate = answeredCount > 0 ? correct / answeredCount : 0;

        return {
            totalQuestions: total,
            correct,
            incorrect,
            skipped,
            averageTime,
            correctnessRate: Math.round(correctnessRate * 1000) / 10, // percentage with 1 decimal
        };
    }

    /**
     * Get statistics by topic
     *
     * @returns Map of topic to statistics
     */
    getStatsByTopic(): Map<string, QuestionStats[]> {
        const byTopic = new Map<string, QuestionStats[]>();

        for (const stat of this.stats) {
            if (!byTopic.has(stat.topic)) {
                byTopic.set(stat.topic, []);
            }
            byTopic.get(stat.topic)!.push(stat);
        }

        return byTopic;
    }

    /**
     * Get statistics by difficulty
     *
     * @returns Map of difficulty to statistics
     */
    getStatsByDifficulty(): Map<string, QuestionStats[]> {
        const byDifficulty = new Map<string, QuestionStats[]>();

        for (const stat of this.stats) {
            if (!byDifficulty.has(stat.difficulty)) {
                byDifficulty.set(stat.difficulty, []);
            }
            byDifficulty.get(stat.difficulty)!.push(stat);
        }

        return byDifficulty;
    }
}
