/**
 * Unit tests for RaceController
 */
import { Track } from '../../../src/game/models/track';
import {
    QuestionTopic,
    QuestionDifficulty,
} from '../../../src/game/models/question';
import {
    createSimpleTestTrack,
    createDefaultRaceConfig,
    createTestRaceController,
} from '../../utils/test-helpers';
import { RaceControllerFactory } from '../../../src/game/factories/RaceControllerFactory';

describe('RaceController', () => {
    let track: Track;
    const defaultQuestionConfig = {
        topic: QuestionTopic.MIXED,
        difficulty: QuestionDifficulty.MEDIUM,
    };

    beforeEach(() => {
        track = createSimpleTestTrack();
    });

    describe('Constructor', () => {
        it('should create GameState with camera and track', () => {
            // Arrange & Act
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();

            // Assert
            expect(gameState).toBeDefined();
            expect(gameState.track).toBe(track);
            expect(gameState.camera).toBeDefined();
            expect(gameState.camera.pos).toEqual({ x: 0, y: 0 });
            expect(gameState.camera.zoom).toBe(1);
        });

        it('should add 1 player car and 3 AI cars', () => {
            // Arrange & Act
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const cars = controller.getGameState().getCars();

            // Assert
            expect(cars).toHaveLength(4);
            expect(cars[0].color).toBe('#22c55e'); // Player car
            expect(cars[1].color).toBe('#ef4444'); // AI car 1
            expect(cars[2].color).toBe('#ef4444'); // AI car 2
            expect(cars[3].color).toBe('#ef4444'); // AI car 3
        });

        it('should initialize CarController', () => {
            // Arrange & Act
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            // Assert - cars should be initialized with velocities
            const cars = controller.getGameState().getCars();
            cars.forEach((car) => {
                expect(car.v).toBe(5);
            });
        });

        it('should call initializeCars', () => {
            // Arrange & Act
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            // Assert - all cars should have vMin velocities
            const cars = controller.getGameState().getCars();
            cars.forEach((car) => {
                expect(car.v).toBeGreaterThan(0);
            });
        });
    });

    describe('Static Factory', () => {
        it('should create controller from loaded state', () => {
            const originalController = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const originalGameState = originalController.getGameState();

            const playerCar = originalGameState.playerCar;
            playerCar.s = 100;
            playerCar.v = 20;

            const loadedController = RaceControllerFactory.createFromGameState(
                originalGameState,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const loadedGameState = loadedController.getGameState();

            expect(loadedGameState).toBeDefined();
            expect(loadedGameState.getCars()).toHaveLength(4);
            expect(loadedGameState.playerCar.s).toBe(100);
            expect(loadedGameState.playerCar.v).toBe(5);
        });

        it('should initialize CarController with provided GameState', () => {
            const originalController = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const originalGameState = originalController.getGameState();

            const loadedController = RaceControllerFactory.createFromGameState(
                originalGameState,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            const cars = loadedController.getGameState().getCars();
            cars.forEach((car) => {
                expect(car.v).toBeGreaterThanOrEqual(5);
            });
        });

        it('should preserve car states from loaded GameState', () => {
            const originalController = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const originalGameState = originalController.getGameState();

            const originalCars = originalGameState.getCars();
            originalCars[0].s = 50;
            originalCars[0].v = 15;
            originalCars[0].r = 10;

            const loadedController = RaceControllerFactory.createFromGameState(
                originalGameState,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            const loadedCars = loadedController.getGameState().getCars();
            expect(loadedCars[0].s).toBe(50);
            expect(loadedCars[0].v).toBe(5);
            expect(loadedCars[0].r).toBe(10);
        });
    });

    describe('Game Loop', () => {
        it('should call carController.step()', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();
            const cars = gameState.getCars();
            const initialPositions = cars.map((c) => c.s);

            controller.step(0.1);

            cars.forEach((car, i) => {
                expect(car.s).not.toBe(initialPositions[i]);
            });
        });

        it('should update camera to follow player car', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;

            controller.step(0.1);

            const expectedPos = gameState.track.posAt(playerCar.s);
            expect(gameState.camera.pos.x).toBeCloseTo(expectedPos.x, 0);
            expect(gameState.camera.pos.y).toBeCloseTo(expectedPos.y, 0);
        });

        it('should preserve camera zoom when updating position', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();
            const originalZoom = gameState.camera.zoom;

            controller.step(0.1);

            expect(gameState.camera.zoom).toBe(originalZoom);
            expect(gameState.camera.zoom).toBe(1);
        });

        it('should advance car positions over multiple steps', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();
            const initialPositions = gameState.getCars().map((c) => c.s);

            for (let i = 0; i < 10; i++) {
                controller.step(0.1);
            }

            const finalPositions = gameState.getCars().map((c) => c.s);
            finalPositions.forEach((finalPos, i) => {
                expect(finalPos).not.toBe(initialPositions[i]);
            });
        });
    });

    describe('Reward Delegation', () => {
        it('should delegate queueReward to CarController', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;
            const initialV = playerCar.v;

            controller.queueReward(playerCar, 50);
            controller.step(0.1);

            expect(playerCar.r).toBeGreaterThan(0);

            controller.step(0.1);
            expect(playerCar.v).toBeGreaterThan(initialV);
        });

        it('should delegate queueRewardByIndex to CarController', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();
            const car = gameState.getCars()[2];
            const initialV = car.v;

            controller.queueRewardByIndex(2, 50);
            controller.step(0.1);

            expect(car.r).toBeGreaterThan(0);

            controller.step(0.1);
            expect(car.v).toBeGreaterThan(initialV);
        });

        it('should handle reward by index correctly', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;
            const aiCar = gameState.aiCars[0];

            controller.queueRewardByIndex(0, 30);
            controller.queueRewardByIndex(1, 40);
            controller.step(0.1);

            expect(playerCar.r).toBeGreaterThan(0);
            expect(aiCar.r).toBeGreaterThan(0);

            controller.step(0.1);
            expect(playerCar.v).toBeGreaterThan(5);
            expect(aiCar.v).toBeGreaterThan(5);
        });
    });

    describe('Getter', () => {
        it('should return the GameState', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            const gameState = controller.getGameState();

            expect(gameState).toBeDefined();
            expect(gameState.track).toBe(track);
            expect(gameState.getCars()).toHaveLength(4);
        });

        it('should return the same GameState instance', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            const gameState1 = controller.getGameState();
            const gameState2 = controller.getGameState();

            expect(gameState1).toBe(gameState2);
        });
    });

    describe('Integration', () => {
        it('should simulate complete race scenario', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;
            const initialPlayerPosition = playerCar.s;

            for (let i = 0; i < 100; i++) {
                if (i % 20 === 0) {
                    controller.queueReward(playerCar, 50);
                }
                controller.step(0.1);
            }

            expect(playerCar.s).toBeGreaterThan(initialPlayerPosition);
            expect(playerCar.v).toBeGreaterThanOrEqual(0);

            const trackLength = gameState.track.length;
            gameState.getCars().forEach((car) => {
                if (car.lapCount > 0) {
                    expect(car.s).toBeGreaterThanOrEqual(0);
                }
                expect(car.s).toBeGreaterThanOrEqual(-300);
                expect(car.s).toBeLessThan(trackLength);
            });
        });
    });

    describe('Lifecycle Management', () => {
        let containerElement: HTMLElement;

        beforeEach(() => {
            containerElement = document.createElement('div');
            document.body.appendChild(containerElement);
        });

        afterEach(() => {
            document.body.removeChild(containerElement);
        });

        it('should throw error when calling start() twice', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);

            expect(() => {
                controller.start(containerElement, onResize, onFrame);
            }).toThrow('RaceController is already started');

            controller.stop();
        });

        it('should throw error when calling pause() before start()', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            expect(() => {
                controller.pause();
            }).toThrow('Cannot pause: RaceController is not started');
        });

        it('should throw error when calling resume() before start()', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            expect(() => {
                controller.resume();
            }).toThrow('Cannot resume: RaceController is not started');
        });

        it('should throw error when calling togglePause() before start()', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            expect(() => {
                controller.togglePause();
            }).toThrow('Cannot toggle pause: RaceController is not started');
        });

        it('should return false for isStarted() before start()', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            expect(controller.isStarted()).toBe(false);
        });

        it('should return true for isStarted() after start()', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);

            expect(controller.isStarted()).toBe(true);

            controller.stop();
        });

        it('should return false for isStarted() after stop()', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);
            controller.stop();

            expect(controller.isStarted()).toBe(false);
        });

        it('should allow stop() to be called multiple times safely', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);
            controller.stop();

            expect(() => {
                controller.stop();
            }).not.toThrow();

            expect(controller.isStarted()).toBe(false);
        });

        it('should destroy controller when not running', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            expect(() => {
                controller.destroy();
            }).not.toThrow();
        });

        it('should destroy controller and stop if running', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);
            expect(controller.isStarted()).toBe(true);

            controller.destroy();
            expect(controller.isStarted()).toBe(false);
        });

        it('should be safe to call destroy() multiple times', () => {
            const controller = createTestRaceController(
                track,
                defaultQuestionConfig,
                createDefaultRaceConfig(),
            );

            expect(() => {
                controller.destroy();
                controller.destroy();
            }).not.toThrow();
        });
    });
});
