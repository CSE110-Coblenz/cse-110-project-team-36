/**
 * Unit tests for Car model
 */

import { Car } from '../../../src/game/models/car';

describe('Car Model', () => {
    describe('Constructor', () => {
        it('should create car with default values', () => {
            const car = new Car();

            expect(car.sProg).toBe(0);
            expect(car.vProg).toBe(0);
            expect(car.r).toBe(0);
            expect(car.sPhys).toBe(0);
            expect(car.vPhys).toBe(0);
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

            const car = new Car(initialS, color, carLength, carWidth);

            expect(car.sProg).toBe(initialS);
            expect(car.sPhys).toBe(initialS);
            expect(car.color).toBe(color);
            expect(car.carLength).toBe(carLength);
            expect(car.carWidth).toBe(carWidth);
            expect(car.vProg).toBe(0);
            expect(car.r).toBe(0);
            expect(car.vPhys).toBe(0);
            expect(car.lateral).toBe(0);
            expect(car.lapCount).toBe(0);
        });

        it('should initialize velocities to vMin', () => {
            const car = new Car(0, '#test', 40, 22);
            const vMin = 10;

            car.initialize(vMin);

            expect(car.vProg).toBe(vMin);
            expect(car.vPhys).toBe(vMin);
        });

        it('should set vProg and vPhys to same vMin value', () => {
            const car = new Car();
            const vMin = 25;

            car.initialize(vMin);

            expect(car.vProg).toBe(vMin);
            expect(car.vPhys).toBe(vMin);
            expect(car.vProg).toBe(car.vPhys);
        });
    });

    describe('Lap Tracking', () => {
        const trackLength = 1000;

    it('should increment lapCount when crossing finish line (from >90% to <10%)', () => {
      const car = Car.fromSerializedData({
        sProg: 950,
        vProg: 0,
        r: 0,
        sPhys: 0,
        vPhys: 0,
        lateral: 0,
        color: '#test',
        carLength: 40,
        carWidth: 22,
        lapCount: 0,
        lastSProg: 950,
        crossedFinish: false,
      });

      car.sProg = 50;
      car.updateLaps(trackLength);

      expect(car.lapCount).toBe(1);
    });

    it('should not increment lapCount when crossing finish line if already crossed', () => {
      const car = Car.fromSerializedData({
        sProg: 950,
        vProg: 0,
        r: 0,
        sPhys: 0,
        vPhys: 0,
        lateral: 0,
        color: '#test',
        carLength: 40,
        carWidth: 22,
        lapCount: 0,
        lastSProg: 950,
        crossedFinish: false,
      });

      car.sProg = 50;
      car.updateLaps(trackLength);

      car.sProg = 950;
      car.updateLaps(trackLength);

      expect(car.lapCount).toBe(1);
    });

    it('should reset crossedFinish flag after passing 50%', () => {
      const car = Car.fromSerializedData({
        sProg: 950,
        vProg: 0,
        r: 0,
        sPhys: 0,
        vPhys: 0,
        lateral: 0,
        color: '#test',
        carLength: 40,
        carWidth: 22,
        lapCount: 0,
        lastSProg: 950,
        crossedFinish: false,
      });

      car.sProg = 50;
      car.updateLaps(trackLength);
      expect(car.lapCount).toBe(1);
      
      car.sProg = 600;
      car.updateLaps(trackLength);

      car.sProg = 950;
      car.updateLaps(trackLength);

      car.sProg = 50;
      car.updateLaps(trackLength);

      expect(car.lapCount).toBe(2);
    });

        it('should update lastSProg correctly', () => {
            const car = new Car();
            car.sProg = 100;

            car.updateLaps(trackLength);

            expect(car.sProg).toBe(100);

            car.sProg = 150;
            car.updateLaps(trackLength);
            expect(car.sProg).toBe(150);
        });

        it('should not increment lap when not crossing finish line', () => {
            const car = new Car();
            car.sProg = 100;
            car.lapCount = 5;

            car.sProg = 200;
            car.updateLaps(trackLength);

            expect(car.lapCount).toBe(5);
        });

        it('should handle multiple lap crossings correctly', () => {
            const car = new Car();
            car.lapCount = 0;

            car.sProg = 950;
            car.updateLaps(trackLength);
            car.sProg = 50;
            car.updateLaps(trackLength);
            expect(car.lapCount).toBe(1);

            car.sProg = 600;
            car.updateLaps(trackLength);

            car.sProg = 950;
            car.updateLaps(trackLength);
            car.sProg = 50;
            car.updateLaps(trackLength);
            expect(car.lapCount).toBe(2);

            car.sProg = 600;
            car.updateLaps(trackLength);
            car.sProg = 950;
            car.updateLaps(trackLength);
            car.sProg = 50;
            car.updateLaps(trackLength);
            expect(car.lapCount).toBe(3);
        });
    });

    describe('Distance Calculation', () => {
        const trackLength = 1000;

        it('should calculate total distance with zero laps', () => {
            const car = new Car();
            car.sProg = 250;
            car.lapCount = 0;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(250);
        });

        it('should calculate total distance with multiple laps', () => {
            const car = new Car();
            car.sProg = 300;
            car.lapCount = 3;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(3300); // 3 * 1000 + 300
        });

        it('should calculate total distance with partial progress', () => {
            const car = new Car();
            car.sProg = 750;
            car.lapCount = 5;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(5750); // 5 * 1000 + 750
        });

        it('should handle zero progress correctly', () => {
            const car = new Car();
            car.sProg = 0;
            car.lapCount = 2;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(2000); // 2 * 1000 + 0
        });

        it('should handle large lap counts correctly', () => {
            const car = new Car();
            car.sProg = 123;
            car.lapCount = 100;

            const distance = car.getTotalDistance(trackLength);

            expect(distance).toBe(100123); // 100 * 1000 + 123
        });
    });
});

