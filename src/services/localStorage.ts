import type { QuestionStats } from "../game/managers/QuestionStatsManager";

/**
 * User profile stored in localStorage
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

const USERS_KEY = "formula_fun_users";
const CURRENT_USER_KEY = "formula_fun_current_user";

/**
 * Hash password using base64 encoding (for demo purposes)
 */
export function hashPassword(password: string): string {
    return btoa(password);
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

/**
 * Save user profile to localStorage
 */
export function saveUser(profile: UserProfile): void {
    const users = getAllUsers();
    const existingIndex = users.findIndex(u => u.username === profile.username);
    
    if (existingIndex >= 0) {
        users[existingIndex] = profile;
    } else {
        users.push(profile);
    }
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Get user profile by username
 */
export function getUser(username: string): UserProfile | null {
    const users = getAllUsers();
    return users.find(u => u.username === username) || null;
}

/**
 * Get all users from localStorage
 */
export function getAllUsers(): UserProfile[] {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * Check if username exists
 */
export function userExists(username: string): boolean {
    return getUser(username) !== null;
}

/**
 * Save current logged-in user
 */
export function saveCurrentUser(username: string): void {
    localStorage.setItem(CURRENT_USER_KEY, username);
}

/**
 * Get current logged-in user
 */
export function getCurrentUser(): string | null {
    return localStorage.getItem(CURRENT_USER_KEY);
}

/**
 * Logout current user
 */
export function logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Update user statistics
 */
export function updateUserStats(username: string, newStats: QuestionStats[]): void {
    const user = getUser(username);
    if (!user) return;
    
    user.stats = newStats;
    saveUser(user);
}

/**
 * Update user preferences
 */
export function updateUserPreferences(username: string, preferences: Partial<UserProfile['preferences']>): void {
    const user = getUser(username);
    if (!user) return;
    
    user.preferences = { ...user.preferences, ...preferences };
    saveUser(user);
}

