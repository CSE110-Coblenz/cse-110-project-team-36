import type { Track } from './track';
import type { Camera } from '../types';
import { Car } from './car';

/**
 * Game state class
 * 
 * This class represents the game state.
 */
export class GameState {
    camera: Camera;
    track: Track;
    private cars: Car[] = [];
    private playerCarIndex: number = 0;

    /**
     * Constructor
     * 
     * @param camera - The camera
     * @param track - The track
     */
    constructor(camera: Camera, track: Track) {
        this.camera = camera;
        this.track = track;
    }

    /**
     * Add a player car to the game state
     * 
     * @param car - The car to add
     */
    addPlayerCar(car: Car) {
        this.playerCarIndex = this.cars.length;
        this.cars.push(car);
    }

    /**
     * Add a car to the game state
     * 
     * @param car - The car to add
     */
    addCar(car: Car) {
        this.cars.push(car);
    }

    /**
     * Get all cars in the game state
     * 
     * @returns The cars
     */
    getCars(): readonly Car[] {
        return this.cars;
    }

    /**
     * Get the player car
     * 
     * @returns The player car
     */
    get playerCar(): Car {
        return this.cars[this.playerCarIndex];
    }

    /**
     * Get all AI cars
     * 
     * @returns The AI cars
     */
    get aiCars(): Car[] {
        return this.cars.filter((_, i) => i !== this.playerCarIndex);
    }

    /**
     * Update the camera
     * 
     * @param camera - The camera to update
     */
    updateCamera(camera: Camera) {
        this.camera = camera;
    }

    /**
     * Update the track
     * 
     * @param track - The track to update
     */
    updateTrack(track: Track) {
        this.track = track;
    }

}
