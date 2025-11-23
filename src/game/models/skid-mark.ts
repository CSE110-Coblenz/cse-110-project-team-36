/**
 * Single skid mark point
 */
export interface SkidMarkPoint {
    x: number;
    y: number;
    alpha: number; // 0 to 1, for fading out
    age: number; // time since creation in seconds
}

/**
 * Skid mark trail for a car
 * Tracks both left and right skid marks
 */
export class SkidMark {
    private leftPoints: SkidMarkPoint[] = [];
    private rightPoints: SkidMarkPoint[] = [];
    private maxPoints: number = 100;
    private fadeRate: number = 0.25; // alpha decay per second (3s lifetime)

    /**
     * Add double skid mark points (left and right tire)
     *
     * @param leftX - Left tire X position
     * @param leftY - Left tire Y position
     * @param rightX - Right tire X position
     * @param rightY - Right tire Y position
     */
    addPoints(
        leftX: number,
        leftY: number,
        rightX: number,
        rightY: number,
    ): void {
        this.leftPoints.push({
            x: leftX,
            y: leftY,
            alpha: 1.0,
            age: 0,
        });

        this.rightPoints.push({
            x: rightX,
            y: rightY,
            alpha: 1.0,
            age: 0,
        });

        // Limit points for performance
        if (this.leftPoints.length > this.maxPoints) {
            this.leftPoints.shift();
        }
        if (this.rightPoints.length > this.maxPoints) {
            this.rightPoints.shift();
        }
    }

    /**
     * Update skid mark aging and fading
     *
     * @param dt - Time step in seconds
     */
    update(dt: number): void {
        for (const point of this.leftPoints) {
            point.age += dt;
            point.alpha = Math.max(0, point.alpha - this.fadeRate * dt);
        }

        for (const point of this.rightPoints) {
            point.age += dt;
            point.alpha = Math.max(0, point.alpha - this.fadeRate * dt);
        }

        // Remove faded points
        this.leftPoints = this.leftPoints.filter((p) => p.alpha > 0.01);
        this.rightPoints = this.rightPoints.filter((p) => p.alpha > 0.01);
    }

    /**
     * Get all left points
     */
    getLeftPoints(): readonly SkidMarkPoint[] {
        return this.leftPoints;
    }

    /**
     * Get all right points
     */
    getRightPoints(): readonly SkidMarkPoint[] {
        return this.rightPoints;
    }

    /**
     * Clear all points
     */
    clear(): void {
        this.leftPoints = [];
        this.rightPoints = [];
    }

    /**
     * Check if skid mark has any visible points
     */
    isEmpty(): boolean {
        return this.leftPoints.length === 0 && this.rightPoints.length === 0;
    }
}
