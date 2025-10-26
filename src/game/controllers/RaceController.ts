import type { GameState } from "../models/game-state";
import { events } from "../../shared/events";

export class RaceController {
  constructor(private gs: GameState) {
    events.on("AnsweredCorrectly", () => this.increaseSpeed());
    events.on("AnsweredIncorrectly", () => this.decreaseSpeed());
  }

  increaseSpeed() {
    this.gs.carSpeed = Math.min(this.gs.carSpeed + 30, 300);
  }

  decreaseSpeed() {
    this.gs.carSpeed = Math.max(this.gs.carSpeed - 20, 0);
  }

  step(dt: number) {
    const speed = this.gs.carSpeed;
    const radius = 240;

    this.gs.carHeading += (speed / radius) * dt;
    this.gs.carPos.x = Math.cos(this.gs.carHeading) * radius;
    this.gs.carPos.y = Math.sin(this.gs.carHeading) * radius;

    // Player-centric camera
    this.gs.camera.pos.x = this.gs.carPos.x;
    this.gs.camera.pos.y = this.gs.carPos.y;
  }
}
