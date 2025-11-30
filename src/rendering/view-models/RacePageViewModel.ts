import type { GameState } from '../../game/models/game-state';
import type { QuestionAnswerViewModel } from './QuestionAnswerViewModel';
import type { StreakBarViewModel } from './StreakBarViewModel';
import type { PostRaceStatsViewModel } from './PostRaceStatsViewModel';

/**
 * View model for RacePage component
 * Contains all data and callbacks needed to render the race page UI
 */
export interface RacePageViewModel {
    gameState: GameState;
    elapsedMs: number;
    accuracy: number;
    correctCount: number;
    incorrectCount: number;
    paused: boolean;
    onTogglePause: () => void;
    onResume: () => void;
    onExit: () => void;
    questionAnswerViewModel: QuestionAnswerViewModel;
    streakBarViewModel: StreakBarViewModel;
    postRaceStatsViewModel: PostRaceStatsViewModel;
}

