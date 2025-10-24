/**
 * GameClock implements a fixed-timestep game loop with interpolation.
 * 
 * The `step` callback is called at a fixed rate (stepsPerSecond) with a fixed
 * delta time in seconds. The `render` callback is called every frame with an
 * alpha value in [0, 1] representing how far we are between the last and next
 * physics step; this can be used for interpolation.
 */
export class GameClock {
    private last = performance.now();   // timestamp of last frame
    private acc = 0;                    // accumulated time in ms
    private readonly dtMs: number;      // fixed timestep in ms

    constructor(stepsPerSecond = 60) {
        this.dtMs = 1000 / stepsPerSecond;
    }

    /** Start the game loop. 
     * @param step Called at fixed intervals with dt in seconds
     * @param render Called every frame with alpha in [0, 1]
    */
    start(step: (dtSec: number) => void, render: (alpha: number) => void) {
        const loop = () => {
            const now = performance.now();
            let frame = now - this.last;
            if (frame > 250) frame = 250;
            this.last = now;
            this.acc += frame;

            while (this.acc >= this.dtMs) {
                step(this.dtMs / 1000);
                this.acc -= this.dtMs;
            }
            render(this.acc / this.dtMs);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}
