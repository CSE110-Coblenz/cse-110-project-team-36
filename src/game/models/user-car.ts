import { Car } from './car';

/**
 * UserCar class
 *
 * Represents the player's car. Extends Car for type differentiation.
 */
export class UserCar extends Car {
    constructor(
        initialS: number = 0,
        color: string = '#22c55e',
        carLength: number = 40,
        carWidth: number = 22,
        laneIndex?: number,
    ) {
        super(initialS, color, carLength, carWidth, laneIndex);
    }

    /**
     * Create a UserCar from serialized data (for loading saves)
     *
     * @param data - The serialized car data
     * @returns A new UserCar instance
     */
    static fromSerializedData(data: {
        r: number;
        s: number;
        v: number;
        lateral: number;
        slipFactor?: number;
        slipWobble?: number;
        slowdownPenalty?: number;
        color: string;
        carLength: number;
        carWidth: number;
        laneIndex?: number;
        targetLaneIndex?: number | null;
        laneChangeStartTime?: number | null;
        pendingLaneChanges?: number;
        laneChangeStartOffset?: number | null;
        laneChangeStartVelocity?: number | null;
        lapCount: number;
        lastS: number;
        crossedFinish: boolean;
        
    }): UserCar {
        const car = new UserCar(
            data.s,
            data.color,
            data.carLength,
            data.carWidth,
            data.laneIndex,
        );
        car.r = data.r;
        car.s = data.s;
        car.v = data.v;
        car.lateral = data.lateral;
        car.slipFactor = data.slipFactor ?? 0;
        car.slipWobble = data.slipWobble ?? 0;
        car.slowdownPenalty = data.slowdownPenalty ?? 0;
        car.laneIndex = data.laneIndex ?? 0;
        car.targetLaneIndex = data.targetLaneIndex ?? null;
        car.laneChangeStartTime = data.laneChangeStartTime ?? null;
        car.pendingLaneChanges = data.pendingLaneChanges ?? 0;
        car.laneChangeStartOffset = data.laneChangeStartOffset ?? null;
        car.laneChangeStartVelocity = data.laneChangeStartVelocity ?? null;
        car.lapCount = data.lapCount;
        car.lastS = data.lastS;
        car.crossedFinish = data.crossedFinish;
        return car;
    }
}
