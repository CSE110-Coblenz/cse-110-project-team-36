import { GameState } from "../models/game-state";
import { Track } from "../models/track";
import { Car } from "../models/car";
import { CarController } from "./CarController";

/**
 * Race controller class
 * 
 * This class is responsible for updating the game state and the car controller.
 */
export class RaceController {
    private gameState: GameState;
    private carController: CarController;

    /**
     * Constructor
     * 
     * @param track - The track to initialize the race controller on
     */
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

    /**
     * Step the race controller
     * 
     * @param dt - The time step in seconds
     */
    step(dt: number) {
        this.carController.step(dt);
        const pos = this.gameState.track.posAt(this.gameState.playerCar.sPhys);
        this.gameState.updateCamera({ pos, zoom: this.gameState.camera.zoom });
    }

    /**
     * Get the game state
     * 
     * @returns The game state
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * Queue a reward for a car
     * 
     * @param car - The car to queue the reward for
     * @param magnitude - The magnitude of the reward
     */
    queueReward(car: Car, magnitude: number) {
        this.carController.queueReward(car, magnitude);
    }

    /**
     * Queue a reward for a car by index
     * 
     * @param index - The index of the car to queue the reward for
     * @param magnitude - The magnitude of the reward
     */
    queueRewardByIndex(index: number, magnitude: number) {
        this.carController.queueRewardByIndex(index, magnitude);
    }
}
