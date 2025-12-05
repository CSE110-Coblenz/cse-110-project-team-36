/**
 * Password hashing utilities
 * Uses base64 encoding for demo purposes
 */

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
