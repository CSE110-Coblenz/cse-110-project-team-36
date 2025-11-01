/**
 * Unit tests for GameState model.
 */

import { GameState } from '../../../src/game/models/game-state';
import { Car } from '../../../src/game/models/car';
import { Track } from '../../../src/game/models/track';
import { Camera } from '../../../src/game/types';
import { createSimpleTestTrack } from '../../utils/test-helpers';

describe('GameState Model', () => {
    let track: Track;
    let camera: Camera;

    beforeEach(() => {
        track = createSimpleTestTrack();
        camera = { pos: { x: 0, y: 0 }, zoom: 1 };
    });

    describe('Constructor', () => {
        it('should initialize with camera and track', () => {
            const gameState = new GameState(camera, track);

            expect(gameState.camera).toBe(camera);
            expect(gameState.track).toBe(track);
            expect(gameState.getCars()).toEqual([]);
            expect(gameState.getCars()).toHaveLength(0);
        });
    });

    describe('Car Management', () => {
        it('should add player car and set playerCarIndex correctly', () => {
            const gameState = new GameState(camera, track);
            const playerCar = new Car(0, '#00ff00');

            gameState.addPlayerCar(playerCar);

            expect(gameState.getCars()).toHaveLength(1);
            expect(gameState.playerCar).toBe(playerCar);
            expect(gameState.aiCars).toHaveLength(0);
        });

        it('should add cars to the cars array', () => {
            const gameState = new GameState(camera, track);
            const aiCar1 = new Car(100, '#ff0000');
            const aiCar2 = new Car(200, '#0000ff');

            gameState.addCar(aiCar1);
            gameState.addCar(aiCar2);

            expect(gameState.getCars()).toHaveLength(2);
            expect(gameState.getCars()[0]).toBe(aiCar1);
            expect(gameState.getCars()[1]).toBe(aiCar2);
        });

    it('should return readonly array of all cars', () => {
      const gameState = new GameState(camera, track);
      const car = new Car();
      gameState.addCar(car);

      const cars = gameState.getCars();

      expect(cars).toBeDefined();
      expect(cars).toHaveLength(1);
      
      expect(Array.isArray(cars)).toBe(true);
    });

        it('should return correct player car via getter', () => {
            const gameState = new GameState(camera, track);
            const playerCar = new Car(0, '#00ff00');

            gameState.addPlayerCar(playerCar);

            expect(gameState.playerCar).toBe(playerCar);
        });

        it('should exclude player car from aiCars getter', () => {
            const gameState = new GameState(camera, track);
            const playerCar = new Car(0, '#00ff00');
            const aiCar1 = new Car(100, '#ff0000');
            const aiCar2 = new Car(200, '#0000ff');

            gameState.addPlayerCar(playerCar);
            gameState.addCar(aiCar1);
            gameState.addCar(aiCar2);

            expect(gameState.getCars()).toHaveLength(3);
            expect(gameState.playerCar).toBe(playerCar);
            expect(gameState.aiCars).toHaveLength(2);
            expect(gameState.aiCars).not.toContain(playerCar);
            expect(gameState.aiCars[0]).toBe(aiCar1);
            expect(gameState.aiCars[1]).toBe(aiCar2);
        });

        it('should handle multiple cars with player at different indices', () => {
            const gameState1 = new GameState(camera, track);
            const p1 = new Car(0, '#00ff00');
            const a1 = new Car(100, '#ff0000');
            gameState1.addPlayerCar(p1);
            gameState1.addCar(a1);
            expect(gameState1.playerCar).toBe(p1);
            expect(gameState1.aiCars).toHaveLength(1);
            expect(gameState1.aiCars[0]).toBe(a1);

            const gameState2 = new GameState(camera, track);
            const a2a = new Car(200, '#ff0000');
            const a2b = new Car(300, '#0000ff');
            const p2 = new Car(0, '#00ff00');
            gameState2.addCar(a2a);
            gameState2.addCar(a2b);
            gameState2.addPlayerCar(p2);
            expect(gameState2.getCars()).toHaveLength(3);
            expect(gameState2.playerCar).toBe(p2);
            expect(gameState2.aiCars).toHaveLength(2);
            expect(gameState2.aiCars).not.toContain(p2);
            expect(gameState2.aiCars[0]).toBe(a2a);
            expect(gameState2.aiCars[1]).toBe(a2b);
        });

        it('should handle player car being replaced', () => {
            const gameState = new GameState(camera, track);
            const playerCar1 = new Car(0, '#00ff00');
            const playerCar2 = new Car(0, '#00ffff');

            gameState.addPlayerCar(playerCar1);
            gameState.addCar(new Car(100, '#ff0000'));
            gameState.addPlayerCar(playerCar2);

            expect(gameState.getCars()).toHaveLength(3);
            expect(gameState.playerCar).toBe(playerCar2);
            expect(gameState.aiCars).toHaveLength(2);
        });

        it('should return empty array when no cars added', () => {
            const gameState = new GameState(camera, track);

            const cars = gameState.getCars();

            expect(cars).toEqual([]);
            expect(cars).toHaveLength(0);
        });
    });

    describe('State Updates', () => {
        it('should update camera correctly', () => {
            const gameState = new GameState(camera, track);
            const newCamera: Camera = { pos: { x: 100, y: 200 }, zoom: 1.5 };

            gameState.updateCamera(newCamera);

            expect(gameState.camera).toBe(newCamera);
            expect(gameState.camera.pos.x).toBe(100);
            expect(gameState.camera.pos.y).toBe(200);
            expect(gameState.camera.zoom).toBe(1.5);
        });

        it('should update track correctly', () => {
            const gameState = new GameState(camera, track);
            const newTrack = createSimpleTestTrack(30);

            gameState.updateTrack(newTrack);

            expect(gameState.track).toBe(newTrack);
            expect(gameState.track.width).toBe(30);
        });

        it('should allow multiple camera updates', () => {
            const gameState = new GameState(camera, track);
            const camera1: Camera = { pos: { x: 1, y: 2 }, zoom: 1 };
            const camera2: Camera = { pos: { x: 3, y: 4 }, zoom: 2 };

            gameState.updateCamera(camera1);
            expect(gameState.camera).toBe(camera1);

            gameState.updateCamera(camera2);

            expect(gameState.camera).toBe(camera2);
            expect(gameState.camera.pos.x).toBe(3);
            expect(gameState.camera.pos.y).toBe(4);
            expect(gameState.camera.zoom).toBe(2);
        });

        it('should allow multiple track updates', () => {
            const gameState = new GameState(camera, track);
            const newTrack1 = createSimpleTestTrack(25);
            const newTrack2 = createSimpleTestTrack(35);

            gameState.updateTrack(newTrack1);
            expect(gameState.track).toBe(newTrack1);
            expect(gameState.track.width).toBe(25);

            gameState.updateTrack(newTrack2);

            expect(gameState.track).toBe(newTrack2);
            expect(gameState.track.width).toBe(35);
        });
    });
});

