/**
 * Unit tests for CarController
 */

import { CarController } from '../../../src/game/controllers/CarController';
import { Car } from '../../../src/game/models/car';
import { GameState } from '../../../src/game/models/game-state';
import { createSimpleTestTrack, createComplexTestTrack } from '../../utils/test-helpers';

describe('CarController', () => {
    let gameState: GameState;
    let controller: CarController;

    beforeEach(() => {
        const track = createSimpleTestTrack();
        const camera = { pos: { x: 0, y: 0 }, zoom: 1 };
        gameState = new GameState(camera, track);
        controller = new CarController(gameState);
    });

    describe('Initialization', () => {
        it('should accept GameState in constructor', () => {
            const newController = new CarController(gameState);
            expect(newController).toBeDefined();
            expect(newController.getParams()).toBeDefined();
        });

        it('should initialize all cars when initializeCars is called', () => {
            gameState.addPlayerCar(new Car(0, '#00ff00'));
            gameState.addCar(new Car(100, '#ff0000'));
            gameState.addCar(new Car(200, '#0000ff'));

            controller.initializeCars();
            const cars = gameState.getCars();
            expect(cars).toHaveLength(3);
            cars.forEach(car => {
                expect(car.vProg).toBe(5); // vMin default
                expect(car.vPhys).toBe(5);
            });
        });

        it('should return default physics parameters', () => {
            const params = controller.getParams();
            expect(params).toEqual({
                vMin: 5,
                vMax: 500,
                aBase: 0,
                tauA: 0.5,
                beta: 30,
                kv: 5,
                kp: 2,
                vBonus: 10,
                mu: 0.8,
                kappaEps: 0.001,
                vKappaScale: 10,
            });
        });

        it('should update parameters when setParams is called', () => {
            const newParams = {
                vMin: 10,
                vMax: 60,
                beta: 40,
                kv: 7,
            };

            controller.setParams(newParams);
            const params = controller.getParams();

            expect(params.vMin).toBe(10);
            expect(params.vMax).toBe(60);
            expect(params.beta).toBe(40);
            expect(params.kv).toBe(7);
            expect(params.tauA).toBe(0.5);
            expect(params.kp).toBe(2);
        });

        it('should handle partial parameter updates', () => {
            const partialParams = { vMin: 15 };
            controller.setParams(partialParams);

            const params = controller.getParams();
            expect(params.vMin).toBe(15);
            expect(params.vMax).toBe(500);
            expect(params.beta).toBe(30);
        });
    });

    describe('Reward Queue System', () => {
        it('should add reward to pendingRewards map', () => {
            const car = new Car();
            gameState.addCar(car);
            controller.queueReward(car, 100);
            expect(car.r).toBe(0);
        });

        it('should accumulate multiple rewards for same car', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();
            controller.queueReward(car, 50);
            controller.queueReward(car, 30);

            controller.step(0.1);
            expect(car.r).toBeCloseTo(80, 2);
        });

        it('should queue reward for correct car by index', () => {
            const car1 = new Car(0, '#00ff00');
            const car2 = new Car(100, '#ff0000');
            gameState.addPlayerCar(car1);
            gameState.addCar(car2);
            controller.initializeCars();

            controller.queueRewardByIndex(1, 100);
            controller.step(0.1);

            expect(car2.r).toBeGreaterThan(0);
            expect(car1.r).toBeLessThan(car2.r);
        });

        it('should handle invalid index gracefully', () => {
            const car = new Car();
            gameState.addPlayerCar(car);

            expect(() => controller.queueRewardByIndex(-1, 100)).not.toThrow();
            expect(() => controller.queueRewardByIndex(10, 100)).not.toThrow();
            expect(() => controller.queueRewardByIndex(1000, 100)).not.toThrow();
        });
    });

    describe('Physics Step - Progress State', () => {
        it('should update all cars in GameState', () => {
            const car1 = new Car();
            const car2 = new Car();
            gameState.addPlayerCar(car1);
            gameState.addCar(car2);
            controller.initializeCars();
            const initialS1 = car1.sProg;
            const initialS2 = car2.sProg;

            controller.step(0.1);
            expect(car1.sProg).not.toBe(initialS1);
            expect(car2.sProg).not.toBe(initialS2);
        });

        it('should increase progress velocity with positive reward', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();
            const initialV = car.vProg;

            controller.queueReward(car, 50);
            controller.step(0.1);

            expect(car.r).toBeGreaterThan(0);
            controller.step(0.1);
            expect(car.vProg).toBeGreaterThan(initialV);
        });

        it('should decrease progress velocity with decay when v > vMin', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            // Set vProg to be above vMin
            car.vProg = 20;
            const initialV = car.vProg;

            controller.step(0.1);

            const expectedDecay = initialV + (-30) * 0.1; // v += aDecay * dt
            expect(car.vProg).toBeCloseTo(expectedDecay, 2);
        });

        it('should not decay progress velocity when v <= vMin', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            car.vProg = 5;
            const initialV = car.vProg;

            controller.step(0.1);

            expect(car.vProg).toBeGreaterThanOrEqual(initialV);
        });

        it('should wrap progress position around track length', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            const trackLength = gameState.track.length;
            car.sProg = trackLength - 10;

            controller.step(0.1);

            expect(car.sProg).toBeGreaterThan(0);
            expect(car.sProg).toBeLessThan(trackLength);

            for (let i = 0; i < 20; i++) {
                controller.step(0.1);
            }

            expect(car.sProg).toBeGreaterThanOrEqual(0);
            expect(car.sProg).toBeLessThan(trackLength);
        });

        it('should decay reward state exponentially', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            car.r = 100;
            const initialR = car.r;

            controller.step(0.1);

            const rho = Math.exp(-0.1 / 0.5);
            const expectedR = initialR * rho;
            expect(car.r).toBeCloseTo(expectedR, 4);
        });

        it('should apply pending reward and clear it', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            controller.queueReward(car, 50);
            controller.step(0.1);

            const rAfterFirstStep = car.r;
            controller.step(0.1);

            expect(rAfterFirstStep).toBeGreaterThan(0);
            const expectedDecay = rAfterFirstStep * Math.exp(-0.1 / 0.5);
            expect(car.r).toBeCloseTo(expectedDecay, 4);
        });
    });

    describe('Physics Step - Physical State', () => {
        it('should update physical velocity to track progress velocity', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            car.vProg = 20;
            const initialVPhys = car.vPhys;

            controller.step(0.1);

            expect(car.vPhys).toBeGreaterThan(initialVPhys);
        });

        it('should never allow physical velocity to go negative', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            car.vPhys = 0.5;
            car.vProg = 0;

            controller.step(0.1);

            expect(car.vPhys).toBeGreaterThanOrEqual(0);
        });

        it('should wrap physical position around track', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            const trackLength = gameState.track.length;
            car.sPhys = trackLength - 5;

            controller.step(0.1);

            expect(car.sPhys).toBeGreaterThanOrEqual(0);
            expect(car.sPhys).toBeLessThan(trackLength);
        });

        it('should respect curvature limits on physical velocity', () => {
            const complexTrack = createComplexTestTrack();
            const complexCamera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const complexGameState = new GameState(complexCamera, complexTrack);
            const complexController = new CarController(complexGameState);

            const car = new Car();
            complexGameState.addPlayerCar(car);
            complexController.initializeCars();

            car.sPhys = complexTrack.length / 4;
            car.vProg = 100;

            complexController.step(0.1);

            expect(car.vPhys).toBeLessThan(car.vProg);
        });

        it('should drive physical velocity with position error', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            car.sProg = 100;
            car.sPhys = 50;
            const initialVPhys = car.vPhys;

            controller.step(0.1);

            expect(car.vPhys).toBeGreaterThan(initialVPhys);
        });
    });

    describe('Curvature Estimation', () => {
        it('should handle straight track sections with low curvature', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            car.sPhys = gameState.track.length / 2;

            expect(() => controller.step(0.1)).not.toThrow();
        });

        it('should handle curved track sections', () => {
            const complexTrack = createComplexTestTrack();
            const complexCamera = { pos: { x: 0, y: 0 }, zoom: 1 };
            const complexGameState = new GameState(complexCamera, complexTrack);
            const complexController = new CarController(complexGameState);

            const car = new Car();
            complexGameState.addPlayerCar(car);
            complexController.initializeCars();

            const testPoints = [
                complexTrack.length / 4,
                complexTrack.length / 2,
                (3 * complexTrack.length) / 4,
            ];

            testPoints.forEach(s => {
                car.sPhys = s;
                expect(() => complexController.step(0.1)).not.toThrow();
            });
        });
    });

    describe('Multiple Steps', () => {
        it('should handle continuous simulation over multiple steps', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            for (let i = 0; i < 100; i++) {
                controller.step(0.1);
            }

            expect(car.sProg).toBeGreaterThanOrEqual(0);
            expect(car.sProg).toBeLessThan(gameState.track.length);
            expect(car.sPhys).toBeGreaterThanOrEqual(0);
            expect(car.sPhys).toBeLessThan(gameState.track.length);
            expect(car.vPhys).toBeGreaterThanOrEqual(0);
        });

        it('should maintain physics consistency over time', () => {
            const car = new Car();
            gameState.addPlayerCar(car);
            controller.initializeCars();

            controller.queueReward(car, 50);
            const initialProg = car.sProg;
            const initialPhys = car.sPhys;

            for (let i = 0; i < 50; i++) {
                controller.step(0.1);
            }

            expect(car.sProg).toBeGreaterThan(initialProg);
            expect(car.sPhys).toBeGreaterThan(initialPhys);
        });
    });
});

