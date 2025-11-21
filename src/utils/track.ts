/**
 * Track utility functions for wrapped distance calculations
 */

/**
 * Get wrapped distance between two positions on a circular track
 * 
 * @param s1 - First position
 * @param s2 - Second position
 * @param trackLength - Total track length
 * @returns Wrapped distance (always positive)
 */
export function getWrappedDistance(s1: number, s2: number, trackLength: number): number {
    const d = Math.abs(s1 - s2);
    return Math.min(d, trackLength - d);
}

/**
 * Get wrapped signed difference between two positions on a circular track
 * Returns positive if s1 is ahead of s2. Normalized to [-trackLength/2, trackLength/2].
 * 
 * @param s1 - First position
 * @param s2 - Second position
 * @param trackLength - Total track length
 * @returns Signed difference accounting for wrapping
 */
export function getWrappedSDiff(s1: number, s2: number, trackLength: number): number {
    const diff = s1 - s2;
    if (diff > trackLength / 2) {
        return diff - trackLength;
    } else if (diff < -trackLength / 2) {
        return diff + trackLength;
    }
    return diff;
}

