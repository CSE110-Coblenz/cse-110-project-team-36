/**
 * View model for PostRaceStats component
 * Contains pre-computed statistics for display
 */
export interface PostRaceStatsViewModel {
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    time: number; // in seconds
    onExit: () => void;
}
