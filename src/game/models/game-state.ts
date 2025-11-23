import type { Track } from './track';
import type { Camera } from '../types';
import { Car } from './car';
import { UserCar } from './user-car';
import { BotCar } from './bot-car';
import { SkidMark } from './skid-mark';

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
    private skidMarks = new Map<Car, SkidMark>();
    paused: boolean = false;

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
     * @param car - The user car to add
     */
    addPlayerCar(car: UserCar) {
        this.playerCarIndex = this.cars.length;
        this.cars.push(car);
        this.skidMarks.set(car, new SkidMark());
    }

    /**
     * Add a car to the game state
     *
     * @param car - The bot car to add
     */
    addCar(car: BotCar) {
        this.cars.push(car);
        this.skidMarks.set(car, new SkidMark());
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
    get playerCar(): UserCar {
        return this.cars[this.playerCarIndex] as UserCar;
    }

    /**
     * Get all AI cars
     *
     * @returns The AI cars
     */
    get aiCars(): BotCar[] {
        return this.cars.filter(
            (_, i) => i !== this.playerCarIndex,
        ) as BotCar[];
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

    /**
     * Get skid marks for a car
     *
     * @param car - The car to get skid marks for
     * @returns The skid marks for the car
     */
    getSkidMarks(car: Car): SkidMark | undefined {
        return this.skidMarks.get(car);
    }

    /**
     * Update all skid marks
     *
     * @param dt - Time step in seconds
     */
    updateSkidMarks(dt: number): void {
        for (const skidMark of this.skidMarks.values()) {
            skidMark.update(dt);
        }
    }
}
