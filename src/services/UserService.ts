import type { QuestionStats } from '../game/managers/QuestionStatsManager';
import type { StorageService } from './adapters/StorageService';

/**
 * User profile stored in storage
 */
export interface UserProfile {
    username: string;
    email: string;
    passwordHash: string;
    stats: QuestionStats[];
    preferences: {
        lastTopic?: string;
        lastDifficulty?: string;
        lastTrack?: string;
    };
    createdAt: number;
}

const USERS_KEY = 'formula_fun_users';
const CURRENT_USER_KEY = 'formula_fun_current_user';

/**
 * Service for managing user data and authentication
 * Uses StorageService abstraction for storage operations
 */
export class UserService {
    constructor(private storageService: StorageService) {}

    /**
     * Get all users from storage
     */
    getAllUsers(): UserProfile[] {
        const stored = this.storageService.getItem(USERS_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }

    /**
     * Get user profile by username
     */
    getUser(username: string): UserProfile | null {
        const users = this.getAllUsers();
        return users.find((u) => u.username === username) || null;
    }

    /**
     * Save user profile to storage
     */
    saveUser(profile: UserProfile): void {
        const users = this.getAllUsers();
        const existingIndex = users.findIndex(
            (u) => u.username === profile.username,
        );

        if (existingIndex >= 0) {
            users[existingIndex] = profile;
        } else {
            users.push(profile);
        }

        this.storageService.setItem(USERS_KEY, JSON.stringify(users));
    }

    /**
     * Check if username exists
     */
    userExists(username: string): boolean {
        return this.getUser(username) !== null;
    }

    /**
     * Save current logged-in user
     */
    saveCurrentUser(username: string): void {
        this.storageService.setItem(CURRENT_USER_KEY, username);
    }

    /**
     * Get current logged-in user
     */
    getCurrentUser(): string | null {
        return this.storageService.getItem(CURRENT_USER_KEY);
    }

    /**
     * Logout current user
     */
    logout(): void {
        this.storageService.removeItem(CURRENT_USER_KEY);
    }

    /**
     * Update user statistics
     */
    updateUserStats(username: string, newStats: QuestionStats[]): void {
        const user = this.getUser(username);
        if (!user) return;

        user.stats = newStats;
        this.saveUser(user);
    }

    /**
     * Update user preferences
     */
    updateUserPreferences(
        username: string,
        preferences: Partial<UserProfile['preferences']>,
    ): void {
        const user = this.getUser(username);
        if (!user) return;

        user.preferences = { ...user.preferences, ...preferences };
        this.saveUser(user);
    }
}
