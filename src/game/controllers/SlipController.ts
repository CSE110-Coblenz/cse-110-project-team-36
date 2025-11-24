import type { GameState } from '../models/game-state';
import type { Car } from '../models/car';
import type { PhysicsConfig } from '../config/types';

/**
 * Slip controller for handling visual slip effects and skid marks
 */
export class SlipController {
    constructor(
        private gameState: GameState,
        private physicsConfig: PhysicsConfig,
    ) {}

    /**
     * Update slip state - decay and wobble, and generate skid marks
     *
     * @param car - The car to update
     * @param dt - The time step in seconds
     */
    public updateSlip(car: Car, dt: number): void {
        const track = this.gameState.track;

        // Decay slip over time
        car.slipFactor = Math.max(
            0,
            car.slipFactor - this.physicsConfig.slipDecay * dt,
        );

        // Update wobble based on slip factor
        if (car.slipFactor > 0) {
            const wobblePhase = this.physicsConfig.slipWobbleFreq * car.s * 0.1;
            car.slipWobble =
                car.slipFactor *
                this.physicsConfig.slipWobbleAmp *
                Math.sin(wobblePhase);

            const skidMark = this.gameState.getSkidMarks(car);
            if (skidMark) {
                // TODO: clean this up into utils
                const p = track.posAt(car.s);
                const t = track.tangentAt(car.s);
                const n = track.normalAt(car.s);
                const laneOffset = car.lateral;
                const centerPos = {
                    x: p.x + n.x * laneOffset,
                    y: p.y + n.y * laneOffset,
                };
                const angle = Math.atan2(t.y, t.x);
                const cosAngle = Math.cos(angle);
                const sinAngle = Math.sin(angle);
                const halfLength = car.carLength / 2;
                const halfWidth = car.carWidth / 2;
                const backLeftRel = {
                    x: -halfLength * cosAngle - halfWidth * sinAngle,
                    y: -halfLength * sinAngle + halfWidth * cosAngle,
                };
                const backRightRel = {
                    x: -halfLength * cosAngle + halfWidth * sinAngle,
                    y: -halfLength * sinAngle - halfWidth * cosAngle,
                };
                const backLeft = {
                    x: centerPos.x + backLeftRel.x,
                    y: centerPos.y + backLeftRel.y,
                };
                const backRight = {
                    x: centerPos.x + backRightRel.x,
                    y: centerPos.y + backRightRel.y,
                };
                skidMark.addPoints(
                    backLeft.x,
                    backLeft.y,
                    backRight.x,
                    backRight.y,
                );
            }
        } else {
            car.slipWobble = 0;
        }
    }

    /**
     * Update slip for all cars
     *
     * @param cars - Array of cars to update
     * @param dt - The time step in seconds
     */
    public updateAllSlips(cars: Car[], dt: number): void {
        for (const car of cars) {
            this.updateSlip(car, dt);
        }
    }
}
