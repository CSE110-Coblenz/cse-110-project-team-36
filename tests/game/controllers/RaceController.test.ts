/**
 * Unit tests for RaceController
 */

import { RaceController } from '../../../src/game/controllers/RaceController';
import { Track } from '../../../src/game/models/track';
import { QuestionTopic, QuestionDifficulty } from '../../../src/game/models/question';
import { createSimpleTestTrack } from '../../utils/test-helpers';

describe('RaceController', () => {
    let track: Track;
    const defaultQuestionConfig = {
        topic: QuestionTopic.MIXED,
        difficulty: QuestionDifficulty.MEDIUM
    };

    beforeEach(() => {
        track = createSimpleTestTrack();
    });

    describe('Constructor', () => {
        it('should create GameState with camera and track', () => {
            // Arrange & Act
            const controller = new RaceController(track, defaultQuestionConfig);
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
            const controller = new RaceController(track, defaultQuestionConfig);
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
            const controller = new RaceController(track, defaultQuestionConfig);

            // Assert - cars should be initialized with velocities
            const cars = controller.getGameState().getCars();
            cars.forEach(car => {
                expect(car.vProg).toBe(5); // vMin
                expect(car.vPhys).toBe(5);
            });
        });

        it('should call initializeCars', () => {
            // Arrange & Act
            const controller = new RaceController(track, defaultQuestionConfig);

            // Assert - all cars should have vMin velocities
            const cars = controller.getGameState().getCars();
            cars.forEach(car => {
                expect(car.vProg).toBeGreaterThan(0);
                expect(car.vPhys).toBeGreaterThan(0);
            });
        });
    });

    describe('Static Factory', () => {
        it('should create controller from loaded state', () => {
            // Arrange
            const originalController = new RaceController(track, defaultQuestionConfig);
            const originalGameState = originalController.getGameState();

            // Modify the game state
            const playerCar = originalGameState.playerCar;
            playerCar.sProg = 100;
            playerCar.vProg = 20;

            // Act
            const loadedController = RaceController.fromGameState(originalGameState, defaultQuestionConfig);
            const loadedGameState = loadedController.getGameState();

            // Assert
            expect(loadedGameState).toBeDefined();
            expect(loadedGameState.getCars()).toHaveLength(4);
            expect(loadedGameState.playerCar.sProg).toBe(100);
            // vProg gets reinitialized by initializeCars(), so it will be 5
            expect(loadedGameState.playerCar.vProg).toBe(5);
        });

        it('should initialize CarController with provided GameState', () => {
            // Arrange
            const originalController = new RaceController(track, defaultQuestionConfig);
            const originalGameState = originalController.getGameState();

            // Act
            const loadedController = RaceController.fromGameState(originalGameState, defaultQuestionConfig);

            // Assert - cars should be initialized
            const cars = loadedController.getGameState().getCars();
            cars.forEach(car => {
                expect(car.vProg).toBeGreaterThanOrEqual(5);
                expect(car.vPhys).toBeGreaterThanOrEqual(5);
            });
        });

        it('should preserve car states from loaded GameState', () => {
            // Arrange
            const originalController = new RaceController(track, defaultQuestionConfig);
            const originalGameState = originalController.getGameState();

            const originalCars = originalGameState.getCars();
            originalCars[0].sProg = 50;
            originalCars[0].vProg = 15;
            originalCars[0].r = 10;

            // Act
            const loadedController = RaceController.fromGameState(originalGameState, defaultQuestionConfig);

            // Assert
            const loadedCars = loadedController.getGameState().getCars();
            expect(loadedCars[0].sProg).toBe(50);
            // vProg gets reinitialized
            expect(loadedCars[0].vProg).toBe(5);
            // r is preserved, not reset by initialize
            expect(loadedCars[0].r).toBe(10);
        });
    });

    describe('Game Loop', () => {
        it('should call carController.step()', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const cars = gameState.getCars();
            const initialPositions = cars.map(c => c.sProg);

            // Act
            controller.step(0.1);

            // Assert - all cars should have moved
            cars.forEach((car, i) => {
                expect(car.sProg).not.toBe(initialPositions[i]);
            });
        });

        it('should update camera to follow player car', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;

            // Act - take a step
            controller.step(0.1);

            // Assert - camera should be at player car position after step
            const expectedPos = gameState.track.posAt(playerCar.sPhys);
            expect(gameState.camera.pos.x).toBeCloseTo(expectedPos.x, 0);
            expect(gameState.camera.pos.y).toBeCloseTo(expectedPos.y, 0);
        });

        it('should preserve camera zoom when updating position', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const originalZoom = gameState.camera.zoom;

            // Act
            controller.step(0.1);

            // Assert
            expect(gameState.camera.zoom).toBe(originalZoom);
            expect(gameState.camera.zoom).toBe(1);
        });

        it('should advance car positions over multiple steps', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const initialPositions = gameState.getCars().map(c => c.sProg);

            // Act
            for (let i = 0; i < 10; i++) {
                controller.step(0.1);
            }

            // Assert - all positions should have advanced
            const finalPositions = gameState.getCars().map(c => c.sProg);
            finalPositions.forEach((finalPos, i) => {
                expect(finalPos).not.toBe(initialPositions[i]);
            });
        });
    });

    describe('Reward Delegation', () => {
        it('should delegate queueReward to CarController', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;
            const initialV = playerCar.vProg;

            // Act
            controller.queueReward(playerCar, 50);
            controller.step(0.1);

            // Assert - reward applied to r after one step
            expect(playerCar.r).toBeGreaterThan(0);

            // Second step should use the reward
            controller.step(0.1);
            expect(playerCar.vProg).toBeGreaterThan(initialV);
        });

        it('should delegate queueRewardByIndex to CarController', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const car = gameState.getCars()[2];
            const initialV = car.vProg;

            // Act
            controller.queueRewardByIndex(2, 50);
            controller.step(0.1);

            // Assert - reward applied
            expect(car.r).toBeGreaterThan(0);

            // Second step
            controller.step(0.1);
            expect(car.vProg).toBeGreaterThan(initialV);
        });

        it('should handle reward by index correctly', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;
            const aiCar = gameState.aiCars[0];

            // Act
            controller.queueRewardByIndex(0, 30);
            controller.queueRewardByIndex(1, 40);
            controller.step(0.1);

            // Assert - rewards in r
            expect(playerCar.r).toBeGreaterThan(0);
            expect(aiCar.r).toBeGreaterThan(0);

            // Second step to affect velocity
            controller.step(0.1);
            expect(playerCar.vProg).toBeGreaterThan(5);
            expect(aiCar.vProg).toBeGreaterThan(5);
        });
    });

    describe('Getter', () => {
        it('should return the GameState', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);

            // Act
            const gameState = controller.getGameState();

            // Assert
            expect(gameState).toBeDefined();
            expect(gameState.track).toBe(track);
            expect(gameState.getCars()).toHaveLength(4);
        });

        it('should return the same GameState instance', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);

            // Act
            const gameState1 = controller.getGameState();
            const gameState2 = controller.getGameState();

            // Assert
            expect(gameState1).toBe(gameState2);
        });
    });

    describe('Integration', () => {
        it('should simulate complete race scenario', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;
            const initialPlayerPosition = playerCar.sProg;

            // Act - simulate race with rewards
            for (let i = 0; i < 100; i++) {
                if (i % 20 === 0) {
                    controller.queueReward(playerCar, 50);
                }
                controller.step(0.1);
            }

            // Assert - player car should have advanced significantly
            expect(playerCar.sProg).toBeGreaterThan(initialPlayerPosition);
            // With decay, vProg might be less than 5 after many steps without rewards
            expect(playerCar.vProg).toBeGreaterThanOrEqual(0);

            // All cars should be on track
            const trackLength = gameState.track.length;
            gameState.getCars().forEach(car => {
                if (car.lapCount > 0) {
                    expect(car.sPhys).toBeGreaterThanOrEqual(0);
                }
                expect(car.sProg).toBeGreaterThanOrEqual(-300); 
                expect(car.sProg).toBeLessThan(trackLength * 2);
                expect(car.sPhys).toBeLessThan(trackLength);
            });
        });

        it('should maintain camera following player car throughout simulation', () => {
            // Arrange
            const controller = new RaceController(track, defaultQuestionConfig);
            const gameState = controller.getGameState();
            const playerCar = gameState.playerCar;

            // Act - simulate many steps
            for (let i = 0; i < 200; i++) {
                controller.step(0.1);

                // Check camera follows player position
                if (i % 20 === 0) {
                    const expectedPos = gameState.track.posAt(playerCar.sPhys);
                    expect(gameState.camera.pos.x).toBeCloseTo(expectedPos.x, 0.5);
                    expect(gameState.camera.pos.y).toBeCloseTo(expectedPos.y, 0.5);
                    
                    // Check camera rotation tracks player car rotation (track tangent, excluding wobble)
                    const tangent = gameState.track.tangentAt(playerCar.sPhys);
                    const expectedRotation = Math.atan2(tangent.y, tangent.x);
                    expect(gameState.camera.rotation).toBeCloseTo(expectedRotation, 0.1);
                }
            }
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
            const controller = new RaceController(track, defaultQuestionConfig);
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);

            expect(() => {
                controller.start(containerElement, onResize, onFrame);
            }).toThrow('RaceController is already started');

            controller.stop();
        });

        it('should throw error when calling pause() before start()', () => {
            const controller = new RaceController(track, defaultQuestionConfig);

            expect(() => {
                controller.pause();
            }).toThrow('Cannot pause: RaceController is not started');
        });

        it('should throw error when calling resume() before start()', () => {
            const controller = new RaceController(track, defaultQuestionConfig);

            expect(() => {
                controller.resume();
            }).toThrow('Cannot resume: RaceController is not started');
        });

        it('should throw error when calling togglePause() before start()', () => {
            const controller = new RaceController(track, defaultQuestionConfig);

            expect(() => {
                controller.togglePause();
            }).toThrow('Cannot toggle pause: RaceController is not started');
        });

        it('should return false for isStarted() before start()', () => {
            const controller = new RaceController(track, defaultQuestionConfig);

            expect(controller.isStarted()).toBe(false);
        });

        it('should return true for isStarted() after start()', () => {
            const controller = new RaceController(track, defaultQuestionConfig);
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);

            expect(controller.isStarted()).toBe(true);

            controller.stop();
        });

        it('should return false for isStarted() after stop()', () => {
            const controller = new RaceController(track, defaultQuestionConfig);
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);
            controller.stop();

            expect(controller.isStarted()).toBe(false);
        });

        it('should allow stop() to be called multiple times safely', () => {
            const controller = new RaceController(track, defaultQuestionConfig);
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
            const controller = new RaceController(track, defaultQuestionConfig);

            expect(() => {
                controller.destroy();
            }).not.toThrow();
        });

        it('should destroy controller and stop if running', () => {
            const controller = new RaceController(track, defaultQuestionConfig);
            const onResize = jest.fn();
            const onFrame = jest.fn();

            controller.start(containerElement, onResize, onFrame);
            expect(controller.isStarted()).toBe(true);

            controller.destroy();
            expect(controller.isStarted()).toBe(false);
        });

        it('should be safe to call destroy() multiple times', () => {
            const controller = new RaceController(track, defaultQuestionConfig);

            expect(() => {
                controller.destroy();
                controller.destroy();
            }).not.toThrow();
        });

        it('should clean up question controller on destroy', () => {
            const controller = new RaceController(track, defaultQuestionConfig);
            const questionController = controller.getQuestionController();
            const destroySpy = jest.spyOn(questionController, 'destroy');

            controller.destroy();

            expect(destroySpy).toHaveBeenCalled();
        });
    });
});

