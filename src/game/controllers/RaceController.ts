import { GameState } from "../models/game-state";
import { Track } from "../models/track";
import type { TrackJSON } from "../models/track";
import sampleTrack from "../../assets/tracks/track1.json";
import { Car } from "../models/car";
import { CarController } from "./CarController";


export class RaceController {
    private gameState: GameState;
    private carController: CarController;

    constructor() {
        const track = Track.fromJSON(sampleTrack as TrackJSON);
        const camera = { pos: { x: 0, y: 0 }, zoom: 1 };
        
        // Create GameState as source of truth
        this.gameState = new GameState(camera, track);
        
        // Add player car
        const playerCar = new Car(0, '#22c55e');
        this.gameState.addPlayerCar(playerCar);
        
        // Add AI cars
        this.gameState.addCar(new Car(-100, '#ef4444'));
        this.gameState.addCar(new Car(-200, '#ef4444'));
        this.gameState.addCar(new Car(-300, '#ef4444'));
        
        // Create CarController to handle physics
        this.carController = new CarController(this.gameState);
        
        // Initialize all cars with proper velocities
        this.carController.initializeCars();
    }

    step(dt: number) {
        // CarController operates on GameState's cars
        this.carController.step(dt);
        
        // Update camera to follow player car
        const pos = this.gameState.track.posAt(this.gameState.playerCar.sPhys);
        this.gameState.updateCamera({ pos, zoom: this.gameState.camera.zoom });
    }

    getGameState() {
        return this.gameState;
    }
}
