/**
 * Unit tests for Car serialization methods
 */

import { UserCar } from '../../src/game/models/user-car';

describe('Car Serialization', () => {
    describe('toSerializedData', () => {
        it('should serialize all car properties correctly', () => {
            const car = new UserCar(100, '#ff0000', 50, 30);
            car.r = 25;
            car.s = 95;
            car.v = 70;
            car.lateral = 5;
            car.lapCount = 2;

            const serialized = car.toSerializedData();

            expect(serialized).toEqual({
                r: 25,
                s: 95,
                v: 70,
                lateral: 5,
                slipFactor: 0,
                slipWobble: 0,
                color: '#ff0000',
                carLength: 50,
                carWidth: 30,
                laneIndex: 0,
                targetLaneIndex: null,
                laneChangeStartTime: null,
                pendingLaneChanges: 0,
                laneChangeStartOffset: null,
                laneChangeStartVelocity: null,
                lapCount: 2,
                lastS: expect.any(Number),
                crossedFinish: expect.any(Boolean),
            });
        });

        it('should serialize default car correctly', () => {
            const car = new UserCar();

            const serialized = car.toSerializedData();

            expect(serialized).toEqual({
                r: 0,
                s: 0,
                v: 0,
                lateral: 0,
                slipFactor: 0,
                slipWobble: 0,
                color: '#22c55e',
                carLength: 40,
                carWidth: 22,
                laneIndex: 0,
                targetLaneIndex: null,
                laneChangeStartTime: null,
                pendingLaneChanges: 0,
                laneChangeStartOffset: null,
                laneChangeStartVelocity: null,
                lapCount: 0,
                lastS: 0,
                crossedFinish: false,
            });
        });
    });

    describe('fromSerializedData', () => {
        it('should deserialize car data correctly', () => {
            const serializedData = {
                r: 30,
                s: 145,
                v: 75,
                lateral: -2,
                slipFactor: 0,
                slipWobble: 0,
                color: '#00ff00',
                carLength: 45,
                carWidth: 25,
                laneIndex: 0,
                targetLaneIndex: null,
                laneChangeStartTime: null,
                pendingLaneChanges: 0,
                laneChangeStartOffset: null,
                laneChangeStartVelocity: null,
                lapCount: 3,
                lastS: 140,
                crossedFinish: true,
            };

            const car = UserCar.fromSerializedData(serializedData);

            expect(car.r).toBe(30);
            expect(car.s).toBe(145);
            expect(car.v).toBe(75);
            expect(car.lateral).toBe(-2);
            expect(car.color).toBe('#00ff00');
            expect(car.carLength).toBe(45);
            expect(car.carWidth).toBe(25);
            expect(car.lapCount).toBe(3);
        });

        it('should preserve private fields after deserialization', () => {
            const serializedData = {
                r: 10,
                s: 48,
                v: 55,
                lateral: 1,
                slipFactor: 0,
                slipWobble: 0,
                color: '#0000ff',
                carLength: 40,
                carWidth: 22,
                laneIndex: 0,
                targetLaneIndex: null,
                laneChangeStartTime: null,
                pendingLaneChanges: 0,
                laneChangeStartOffset: null,
                laneChangeStartVelocity: null,
                lapCount: 1,
                lastS: 45,
                crossedFinish: false,
            };

            const car = UserCar.fromSerializedData(serializedData);
            const reSerialized = car.toSerializedData();

            expect(reSerialized.lastS).toBe(45);
            expect(reSerialized.crossedFinish).toBe(false);
        });
    });

    describe('Serialization Round-trip', () => {
        it('should maintain data integrity through serialize/deserialize cycle', () => {
            const originalCar = new UserCar(200, '#ff00ff', 35, 20);
            originalCar.r = 15;
            originalCar.s = 195;
            originalCar.v = 85;
            originalCar.lateral = -3;
            originalCar.lapCount = 5;

            originalCar.updateLaps();

            const serialized = originalCar.toSerializedData();
            const deserializedCar = UserCar.fromSerializedData(serialized);
            const reSerializedData = deserializedCar.toSerializedData();

            expect(reSerializedData).toEqual(serialized);
        });

        it('should handle edge cases correctly', () => {
            const extremeCar = new UserCar(-100, '#000000', 1, 1);
            extremeCar.r = 1000;
            extremeCar.s = 999999;
            extremeCar.v = 0;
            extremeCar.lateral = -999;
            extremeCar.lapCount = 100;

            const serialized = extremeCar.toSerializedData();
            const deserialized = UserCar.fromSerializedData(serialized);

            expect(deserialized.r).toBe(1000);
            expect(deserialized.s).toBe(999999);
            expect(deserialized.v).toBe(0);
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
            const originalCar = new UserCar(50, '#ffffff', 40, 22);
            originalCar.lapCount = 2;

            const serialized = originalCar.toSerializedData();
            const deserializedCar = UserCar.fromSerializedData(serialized);
            const totalDistance = deserializedCar.getTotalDistance(1000);

            deserializedCar.initialize(60);

            expect(totalDistance).toBe(2050); // 2 laps * 1000 + 50
            expect(deserializedCar.v).toBe(60);
        });

        it('should handle lap tracking correctly after deserialization', () => {
            const serializedData = {
                r: 0,
                s: 950,
                v: 60,
                lateral: 0,
                slipFactor: 0,
                slipWobble: 0,
                color: '#test',
                carLength: 40,
                carWidth: 22,
                laneIndex: 0,
                targetLaneIndex: null,
                laneChangeStartTime: null,
                pendingLaneChanges: 0,
                laneChangeStartOffset: null,
                laneChangeStartVelocity: null,
                lapCount: 1,
                lastS: 950, // Must be > 900 (90% of 1000)
                crossedFinish: false,
            };

            const car = UserCar.fromSerializedData(serializedData);

            car.s = 10; // Crossed to beginning
            car.updateLaps();

            expect(car.lapCount).toBe(2);
        });
    });
});
