import { GameState } from "../models/game-state";
import { Track } from "../models/track";
import { Car } from "../models/car";
import { CarController } from "./CarController";

export class RaceController {
    private gameState: GameState;
    private carController: CarController;

    constructor(track: Track) {
        const camera = { pos: { x: 0, y: 0 }, zoom: 1 };
        this.gameState = new GameState(camera, track);
        this.gameState.addPlayerCar(new Car(0, '#22c55e'));
        this.gameState.addCar(new Car(-100, '#ef4444'));
        this.gameState.addCar(new Car(-200, '#ef4444'));
        this.gameState.addCar(new Car(-300, '#ef4444'));
        this.carController = new CarController(this.gameState);
        this.carController.initializeCars();
    }

    step(dt: number) {
        this.carController.step(dt);
        const pos = this.gameState.track.posAt(this.gameState.playerCar.sPhys);
        this.gameState.updateCamera({ pos, zoom: this.gameState.camera.zoom });
    }

    getGameState() {
        return this.gameState;
    }

    queueReward(car: Car, magnitude: number) {
        this.carController.queueReward(car, magnitude);
    }

    queueRewardByIndex(index: number, magnitude: number) {
        this.carController.queueRewardByIndex(index, magnitude);
    }
}
