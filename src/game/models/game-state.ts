import type { Track } from './track';
import type { Camera } from '../types';
import { Car } from './car';

export class GameState {
    camera: Camera;
    track: Track;
    private cars: Car[] = [];
    private playerCarIndex: number = 0;

    constructor(camera: Camera, track: Track) {
        this.camera = camera;
        this.track = track;
    }

    // Add a player car
    addPlayerCar(car: Car) {
        this.playerCarIndex = this.cars.length;
        this.cars.push(car);
        // Velocities will be initialized by CarController
    }

    // Add an AI car
    addCar(car: Car) {
        this.cars.push(car);
        // Velocities will be initialized by CarController
    }

    // Get all cars
    getCars(): readonly Car[] {
        return this.cars;
    }

    // Get the player car
    get playerCar(): Car {
        return this.cars[this.playerCarIndex];
    }

    // Get AI cars (all cars except player)
    get aiCars(): Car[] {
        return this.cars.filter((_, i) => i !== this.playerCarIndex);
    }

    // Apply a reward to a specific car
    applyReward(car: Car, magnitude: number) {
        car.r += magnitude;
    }

    // Apply a reward to a car by index
    applyRewardByIndex(index: number, magnitude: number) {
        if (index >= 0 && index < this.cars.length) {
            this.applyReward(this.cars[index], magnitude);
        }
    }

    // Update camera
    updateCamera(camera: Camera) {
        this.camera = camera;
    }

    // Update track (if needed for dynamic tracks)
    updateTrack(track: Track) {
        this.track = track;
    }
}
