import type { GameState } from "../models/game-state";

export class RaceController {
    constructor(private gs: GameState) { }

    step(dt: number) {
        const speed = 120;
        const radius = 240;

        this.gs.carHeading += (speed / radius) * dt;
        this.gs.carPos.x = Math.cos(this.gs.carHeading) * radius;
        this.gs.carPos.y = Math.sin(this.gs.carHeading) * radius;

        // Player-centric camera
        this.gs.camera.pos.x = this.gs.carPos.x;
        this.gs.camera.pos.y = this.gs.carPos.y;
    }
}
