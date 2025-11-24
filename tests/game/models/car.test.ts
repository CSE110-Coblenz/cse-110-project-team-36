/**
 * Unit tests for Car model
 */

import { UserCar } from '../../../src/game/models/user-car';

describe('Car Model', () => {
    describe('Constructor', () => {
        it('should create car with default values', () => {
            const car = new UserCar();

            expect(car.r).toBe(0);
            expect(car.s).toBe(0);
            expect(car.v).toBe(0);
            expect(car.lateral).toBe(0);
            expect(car.color).toBe('#22c55e');
            expect(car.carLength).toBe(40);
            expect(car.carWidth).toBe(22);
            expect(car.lapCount).toBe(0);
        });

        it('should create car with custom constructor parameters', () => {
            const initialS = 100;
            const color = '#ff0000';
            const carLength = 50;
            const carWidth = 30;

            const car = new UserCar(initialS, color, carLength, carWidth);

            expect(car.s).toBe(initialS);
            expect(car.color).toBe(color);
            expect(car.carLength).toBe(carLength);
            expect(car.carWidth).toBe(carWidth);
            expect(car.r).toBe(0);
            expect(car.v).toBe(0);
            expect(car.lateral).toBe(0);
            expect(car.lapCount).toBe(0);
        });

        it('should initialize velocities to vMin', () => {
            const car = new UserCar(0, '#test', 40, 22);
            const vMin = 10;

            car.initialize(vMin);

            expect(car.v).toBe(vMin);
        });
    });

    describe('Lap Tracking', () => {
        it('should increment lapCount when crossing finish line (from >90% to <10%)', () => {
            const car = UserCar.fromSerializedData({
                r: 0,
                s: 0,
                v: 0,
                lateral: 0,
                color: '#test',
                carLength: 40,
                carWidth: 22,
                lapCount: 0,
                lastS: 950,
                crossedFinish: false,
            });

            car.s = 50;
            car.updateLaps();

            expect(car.lapCount).toBe(1);
        });

        it('should not increment lapCount when crossing finish line if already crossed', () => {
            const car = UserCar.fromSerializedData({
                r: 0,
                s: 0,
                v: 0,
                lateral: 0,
                color: '#test',
                carLength: 40,
                carWidth: 22,
                lapCount: 0,
                lastS: 950,
                crossedFinish: false,
            });

            car.s = 50;
            car.updateLaps();

            car.s = 950;
            car.updateLaps();

            expect(car.lapCount).toBe(1);
        });

        it('should reset crossedFinish flag after passing 50%', () => {
            const car = UserCar.fromSerializedData({
                r: 0,
                s: 0,
                v: 0,
                lateral: 0,
                color: '#test',
                carLength: 40,
                carWidth: 22,
                lapCount: 0,
                lastS: 950,
                crossedFinish: false,
            });

            car.s = 50;
            car.updateLaps();
            expect(car.lapCount).toBe(1);

            car.s = 600;
            car.updateLaps();

            car.s = 950;
            car.updateLaps();

            car.s = 50;
            car.updateLaps();

            expect(car.lapCount).toBe(2);
        });

        it('should update lastS correctly', () => {
            const car = new UserCar();
            car.s = 100;

            car.updateLaps();

            expect(car.s).toBe(100);

            car.s = 150;
            car.updateLaps();
            expect(car.s).toBe(150);
        });

        it('should not increment lap when not crossing finish line', () => {
            const car = new UserCar();
            car.s = 100;
            car.lapCount = 5;

            car.s = 200;
            car.updateLaps();

            expect(car.lapCount).toBe(5);
        });

        it('should handle multiple lap crossings correctly', () => {
            const car = new UserCar();
            car.lapCount = 0;

            car.s = 950;
            car.updateLaps();
            car.s = 50;
            car.updateLaps();
            expect(car.lapCount).toBe(1);

            car.s = 600;
            car.updateLaps();

            car.s = 950;
            car.updateLaps();
            car.s = 50;
            car.updateLaps();
            expect(car.lapCount).toBe(2);

            car.s = 600;
            car.updateLaps();
            car.s = 950;
            car.updateLaps();
            car.s = 50;
            car.updateLaps();
            expect(car.lapCount).toBe(3);
        });
    });

    describe('Distance Calculation', () => {
        const trackLength = 1000;

        it('should calculate total distance with zero laps', () => {
            const car = new UserCar();
            car.s = 250;
            car.lapCount = 0;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(250);
        });

        it('should calculate total distance with multiple laps', () => {
            const car = new UserCar();
            car.s = 300;
            car.lapCount = 3;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(3300); // 3 * 1000 + 300
        });

        it('should calculate total distance with partial progress', () => {
            const car = new UserCar();
            car.s = 750;
            car.lapCount = 5;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(5750); // 5 * 1000 + 750
        });

        it('should handle zero progress correctly', () => {
            const car = new UserCar();
            car.s = 0;
            car.lapCount = 2;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(2000); // 2 * 1000 + 0
        });

        it('should handle large lap counts correctly', () => {
            const car = new UserCar();
            car.s = 123;
            car.lapCount = 100;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(100123); // 100 * 1000 + 123
        });
    });
});
