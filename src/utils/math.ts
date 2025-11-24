/**
 * Math utility functions
 */

/**
 * Generate a random number from a Gaussian (normal) distribution using Box-Muller transform
 *
 * @param mean - The mean of the distribution
 * @param stdDev - The standard deviation of the distribution
 * @returns A random number from the Gaussian distribution
 */
export function gaussian(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
}

/**
 * Clamp a value between a minimum and maximum
 *
 * @param value - The value to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
