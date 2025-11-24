/**
 * Formatting utilities
 */

/**
 * Format elapsed milliseconds to MM:SS.mmm format
 *
 * @param elapsedMs - Elapsed time in milliseconds
 * @returns Formatted time string (e.g., "1:23.456")
 */
export function formatRaceTime(elapsedMs: number): string {
    const mm = Math.floor(elapsedMs / 60000);
    const ss = Math.floor((elapsedMs % 60000) / 1000);
    const ms = Math.floor(elapsedMs % 1000);
    return `${mm}:${ss.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
