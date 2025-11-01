/**
 * Unit tests for Car serialization methods
 */

import { Car } from '../../src/game/models/car';

describe('Car Serialization', () => {
    describe('toSerializedData', () => {
        it('should serialize all car properties correctly', () => {
            const car = new Car(100, '#ff0000', 50, 30);
            car.vProg = 75;
            car.r = 25;
            car.sPhys = 95;
            car.vPhys = 70;
            car.lateral = 5;
            car.lapCount = 2;

            car.updateLaps(1000);

            const serialized = car.toSerializedData();

            expect(serialized).toEqual({
                sProg: 100,
                vProg: 75,
                r: 25,
                sPhys: 95,
                vPhys: 70,
                lateral: 5,
                slipFactor: 0,
                slipWobble: 0,
                color: '#ff0000',
                carLength: 50,
                carWidth: 30,
                lapCount: 2,
                lastSProg: expect.any(Number),
                crossedFinish: expect.any(Boolean),
            });
        });

        it('should serialize default car correctly', () => {
            const car = new Car();

            const serialized = car.toSerializedData();

            expect(serialized).toEqual({
                sProg: 0,
                vProg: 0,
                r: 0,
                sPhys: 0,
                vPhys: 0,
                lateral: 0,
                slipFactor: 0,
                slipWobble: 0,
                color: '#22c55e',
                carLength: 40,
                carWidth: 22,
                lapCount: 0,
                lastSProg: 0,
                crossedFinish: false,
            });
        });
    });

    describe('fromSerializedData', () => {
        it('should deserialize car data correctly', () => {
            const serializedData = {
                sProg: 150,
                vProg: 80,
                r: 30,
                sPhys: 145,
                vPhys: 75,
                lateral: -2,
                color: '#00ff00',
                carLength: 45,
                carWidth: 25,
                lapCount: 3,
                lastSProg: 140,
                crossedFinish: true,
            };

            const car = Car.fromSerializedData(serializedData);

            expect(car.sProg).toBe(150);
            expect(car.vProg).toBe(80);
            expect(car.r).toBe(30);
            expect(car.sPhys).toBe(145);
            expect(car.vPhys).toBe(75);
            expect(car.lateral).toBe(-2);
            expect(car.color).toBe('#00ff00');
            expect(car.carLength).toBe(45);
            expect(car.carWidth).toBe(25);
            expect(car.lapCount).toBe(3);
        });

        it('should preserve private fields after deserialization', () => {
            const serializedData = {
                sProg: 50,
                vProg: 60,
                r: 10,
                sPhys: 48,
                vPhys: 55,
                lateral: 1,
                color: '#0000ff',
                carLength: 40,
                carWidth: 22,
                lapCount: 1,
                lastSProg: 45,
                crossedFinish: false,
            };

            const car = Car.fromSerializedData(serializedData);
            const reSerialized = car.toSerializedData();

            expect(reSerialized.lastSProg).toBe(45);
            expect(reSerialized.crossedFinish).toBe(false);
        });
    });

    describe('Serialization Round-trip', () => {
        it('should maintain data integrity through serialize/deserialize cycle', () => {
            const originalCar = new Car(200, '#ff00ff', 35, 20);
            originalCar.vProg = 90;
            originalCar.r = 15;
            originalCar.sPhys = 195;
            originalCar.vPhys = 85;
            originalCar.lateral = -3;
            originalCar.lapCount = 5;

            originalCar.updateLaps(1000);

            const serialized = originalCar.toSerializedData();
            const deserializedCar = Car.fromSerializedData(serialized);
            const reSerializedData = deserializedCar.toSerializedData();

            expect(reSerializedData).toEqual(serialized);
        });

        it('should handle edge cases correctly', () => {
            const extremeCar = new Car(-100, '#000000', 1, 1);
            extremeCar.vProg = -50;
            extremeCar.r = 1000;
            extremeCar.sPhys = 999999;
            extremeCar.vPhys = 0;
            extremeCar.lateral = -999;
            extremeCar.lapCount = 100;

            const serialized = extremeCar.toSerializedData();
            const deserialized = Car.fromSerializedData(serialized);

            expect(deserialized.sProg).toBe(-100);
            expect(deserialized.vProg).toBe(-50);
            expect(deserialized.r).toBe(1000);
            expect(deserialized.sPhys).toBe(999999);
            expect(deserialized.vPhys).toBe(0);
            expect(deserialized.lateral).toBe(-999);
            expect(deserialized.slipFactor).toBe(0);
            expect(deserialized.slipWobble).toBe(0);
            expect(deserialized.lapCount).toBe(100);
            expect(deserialized.color).toBe('#000000');
            expect(deserialized.carLength).toBe(1);
            expect(deserialized.carWidth).toBe(1);
        });
    });

    describe('Car Methods After Deserialization', () => {
        it('should maintain functionality after deserialization', () => {
            const originalCar = new Car(50, '#ffffff', 40, 22);
            originalCar.lapCount = 2;

            const serialized = originalCar.toSerializedData();
            const deserializedCar = Car.fromSerializedData(serialized);
            const totalDistance = deserializedCar.getTotalDistance(1000);

            deserializedCar.initialize(60);

            expect(totalDistance).toBe(2050); // 2 laps * 1000 + 50
            expect(deserializedCar.vProg).toBe(60);
            expect(deserializedCar.vPhys).toBe(60);
        });

        it('should handle lap tracking correctly after deserialization', () => {
            const serializedData = {
                sProg: 950,
                vProg: 60,
                r: 0,
                sPhys: 950,
                vPhys: 60,
                lateral: 0,
                color: '#test',
                carLength: 40,
                carWidth: 22,
                lapCount: 1,
                lastSProg: 950, // Must be > 900 (90% of 1000)
                crossedFinish: false,
            };

            const car = Car.fromSerializedData(serializedData);

            car.sProg = 10; // Crossed to beginning
            car.updateLaps(1000);

            expect(car.lapCount).toBe(2);
        });
    });
});
