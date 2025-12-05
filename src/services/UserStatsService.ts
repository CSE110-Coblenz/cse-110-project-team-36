import type { QuestionStats } from '../game/managers/QuestionStatsManager';
import type { UserService } from './UserService';

/**
 * Service for managing user statistics persistence
 * Abstracts user stats operations from controllers
 */
export class UserStatsService {
    constructor(private userService: UserService) {}

    /**
     * Update user statistics
     *
     * @param username - The username to update stats for
     * @param stats - Array of question statistics to save
     */
    saveStats(username: string, stats: QuestionStats[]): void {
        this.userService.updateUserStats(username, Array.from(stats));
    }
}
