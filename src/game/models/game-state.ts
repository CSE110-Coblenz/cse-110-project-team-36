import type { Track } from './track';
import type { Camera } from '../types';
import { Car } from './car';

/**
 * Game state class
 */
export class GameState {
    camera: Camera;
    track: Track;
    private cars: Car[] = [];
    private playerCarIndex: number = 0;

    constructor(camera: Camera, track: Track) {
        this.camera = camera;
        this.track = track;
    }

    addPlayerCar(car: Car) {
        this.playerCarIndex = this.cars.length;
        this.cars.push(car);
    }

    addCar(car: Car) {
        this.cars.push(car);
    }

    getCars(): readonly Car[] {
        return this.cars;
    }

    get playerCar(): Car {
        return this.cars[this.playerCarIndex];
    }

    get aiCars(): Car[] {
        return this.cars.filter((_, i) => i !== this.playerCarIndex);
    }

    updateCamera(camera: Camera) {
        this.camera = camera;
    }

    updateTrack(track: Track) {
        this.track = track;
    }
}
