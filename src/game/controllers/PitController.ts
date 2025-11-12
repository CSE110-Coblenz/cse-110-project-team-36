import { GameState } from "../models/game-state";
import { Car } from "../models/car";
import { events } from "../../shared/events";
import type { MiniGameResult } from "../../minigame/src/Model/MiniGameModel";
import {
    PIT_ENTRY_START_FRAC,
    PIT_ENTRY_END_FRAC,
    PIT_LANE_START_FRAC,
    PIT_LANE_END_FRAC,
    PIT_EXIT_END_FRAC,
    PIT_STOP_SPEED_THRESHOLD,
} from "../../const";

/**
 * Interface that describes what the PitController needs
 * from its "host" (typically RaceController).
 *
 * The host is responsible for global race-level control,
 * such as pausing/resuming the race loop.
 *
 * We use this interface instead of directly depending on
 * RaceController to keep PitController more modular and
 * easier to test or reuse.
 */
export interface PitControllerHost {
    /**
     * Pause the main race loop while the pit minigame runs.
     */
    pauseRace(): void;

    /**
     * Resume the main race loop after the pit minigame finishes.
     */
    resumeRace(): void;
}

/**
 * PitController is responsible for *all* pit-stop related logic:
 *
 * - Defining where the pit entry / lane / exit are along the track.
 * - Watching the player car's position each frame to determine
 *   when they have:
 *     * entered the pit lane,
 *     * reached the pit lane and stopped,
 *     * exited the pit lane.
 * - Emitting events to start the pit minigame UI.
 * - Applying the minigame result (fuel/tire refill) to the car.
 *
 * It does NOT:
 * - Handle physics or car motion directly.
 * - Talk to React components. That is done via the shared EventBus.
 * - Own the game loop. It is *stepped* from RaceController.
 */
export class PitController {
    /**
     * Snapshot of the overall game state.
     * We use this to access:
     *  - the track (for its length),
     *  - the player car (for sPhys, fuel, flags, etc.).
     */
    private gameState: GameState;

    /**
     * Reference back to the "host" race controller.
     * Only used to pause and resume the race loop when
     * the pit minigame runs.
     */
    private host: PitControllerHost;

    /**
     * Fractional positions along the track [0, 1) that define
     * the pit lane regions. These are multiplied by the track
     * length to get specific along-track distances.
     *
     * Tweak these values so they line up with the visual pit lane.
     */
    private readonly pitEntryStartFrac: number = PIT_ENTRY_START_FRAC;
    private readonly pitEntryEndFrac: number = PIT_ENTRY_END_FRAC;
    private readonly pitLaneStartFrac: number = PIT_LANE_START_FRAC;
    private readonly pitLaneEndFrac: number = PIT_LANE_END_FRAC;
    private readonly pitExitEndFrac: number = PIT_EXIT_END_FRAC;

    /**
     * Previous-frame flags for whether the player car was inside
     * each pit-related region. These are used to detect *edges*:
     *
     *  - not in entry -> in entry   => just entered pit lane
     *  - not in Lane   -> in Lane     => just reached pit Lane
     *  - in exit      -> not in exit => just left pit lane
     */
    private wasInPitEntryZone: boolean = false;
    private wasInPitLaneZone: boolean = false;
    private wasInPitExitZone: boolean = false;

    /**
     * Constructor.
     *
     * @param gameState - The shared game state object.
     * @param host      - The host controller that can pause/resume the race.
     */
    constructor(gameState: GameState, host: PitControllerHost) {
        this.gameState = gameState;
        this.host = host;
    }

    /**
     * Step the pit controller by one frame.
     *
     * This should be called once per game loop iteration,
     * *after* physics has updated car.sPhys, typically from
     * RaceController.step(dt).
     *
     * @param dt - Time step in seconds since the last frame.
     *             Currently unused, but kept for future logic
     *             e.g timed pit-stop windows.
     */
    step(_dt: number): void {
        this.updatePitZones();
    }

    /**
     * Main pit-zone update logic.
     *
     * 1. Convert fractional positions into actual along-track distances.
     * 2. Read playerCar.sPhys to determine which regions they are in.
     * 3. Compare current region membership with last frame's to detect
     *    transitions.
     * 4. Call:
     *      - onPitEntry()      when entering entry zone,
     *      - onPitLaneEntered() when entering Lane while in pit and slow,
     *      - onPitExit()       when leaving exit region.
     */
    private updatePitZones(): void {
        const track = this.gameState.track;
        const car = this.gameState.playerCar;

        const L = track.length;

        // Convert fractional pit positions into [0, L) distances.
        const pitEntryStart = this.pitEntryStartFrac * L;
        const pitEntryEnd = this.pitEntryEndFrac * L;
        const pitLaneStart = this.pitLaneStartFrac * L;
        const pitLaneEnd = this.pitLaneEndFrac * L;
        const pitExitEnd = this.pitExitEndFrac * L;

        const s = car.sPhys; // player car's along-track coordinate

        // --- Region membership this frame ---

        const inEntryZone = s >= pitEntryStart && s < pitEntryEnd;
        const inLaneZone = s >= pitLaneStart && s < pitLaneEnd;
        const inExitZone = s >= pitEntryStart && s < pitExitEnd;

        // Define what "nearly stopped" means for pit Lane service.
        const isNearlyStopped = car.vPhys <= PIT_STOP_SPEED_THRESHOLD;

        // --- Detect transitions and react ---

        // 1) Just entered the pit entry region.
        if (inEntryZone && !this.wasInPitEntryZone) {
            this.onPitEntry();
        }

        // 2) Just entered the pit Lane region while in pit lane and slow.
        if (inLaneZone && !this.wasInPitLaneZone && car.inPitLane && isNearlyStopped) {
            this.onPitLaneEntered();
        }

        // 3) Just left the pit exit region while flagged as in pit lane.
        if (!inExitZone && this.wasInPitExitZone && car.inPitLane) {
            this.onPitExit();
        }

        // Save flags for next frame.
        this.wasInPitEntryZone = inEntryZone;
        this.wasInPitLaneZone = inLaneZone;
        this.wasInPitExitZone = inExitZone;
    }

    /**
     * Handler for when the player first enters the pit entry region.
     *
     * Marks the car as being in the pit lane and enables the speed limiter.
     * Optionally, you can enforce that pits are only allowed when the
     * car has pitRequired = true.
     */
    private onPitEntry(): void {
        const car = this.gameState.playerCar;

        //  only let them enter if a pit is actually required.
        if (!car.pitRequired) {
            return;
        }

        this.snapCarIntoPitLane(car);
    }

    /**
     * Handler for when the player reaches the pit Lane region and is
     * effectively stopped.
     *
     * Responsibilities:
     * - Freeze the car's velocity
     * - Pause the race loop via the host
     * - Ask the UI (via EventBus) to show the pit minigame panel
     */
    private onPitLaneEntered(): void {
        const car = this.gameState.playerCar;
        if (!car.inPitLane) {
            return;
        }

        // Stop the car for the duration of the pit service.
        car.vPhys = 0;
        car.vProg = 0;

        // Pause the race logic while the minigame is active.
        this.host.pauseRace();

        // Let the UI layer know it should show the pit minigame UI.
        events.emit("MiniGameRequested", {});
    }

    /**
     * Handler for when the player leaves the pit exit region and
     * re-joins the main track.
     *
     * Responsibilities:
     * - Clear pit-related flags and speed limiter.
     */
    private onPitExit(): void {
        const car = this.gameState.playerCar;
        car.inPitLane = false;
        car.speedLimiter = false;
    }

    /**
     * Handle the result of the pit-stop minigame.
     *
     * This is called from RaceController when it receives the
     * PitMinigameCompleted event, and simply delegates here.
     *
     * @param tier - The performance tier from the minigame
     *               (e.g. "WIN_BIG", "WIN_CLOSE", "LOSE").
     */
    handleMiniGameCompleted(tier: MiniGameResult): void {
        const car = this.gameState.playerCar;

        switch (tier) {
            case "WIN_BIG":
                // Best outcome: full refuel and full tire refresh.
                car.fuel = 100;
                car.tireLife = 100;
                break;

            case "WIN_CLOSE":
                // Good outcome: strong refuel but not perfect.
                car.fuel = 85;
                car.tireLife = 90;
                break;

            case "LOSE":
            default:
                // Poor outcome: partial refuel, tires not fully refreshed.
                car.fuel = 60;
                car.tireLife = 70;
                break;
        }

        const boostTarget = this.getBoostVelocityForTier(tier);
        car.vProg = Math.max(car.vProg, boostTarget);
        car.vPhys = Math.max(car.vPhys, boostTarget * 0.75);
        car.r = Math.max(car.r, boostTarget * 0.02);
        car.speedLimiter = false;

        // After a pit service, the pit is no longer required.
        car.pitRequired = false;

        // Resume the race now that the minigame is over.
        this.host.resumeRace();
    }

    private getBoostVelocityForTier(tier: MiniGameResult): number {
        switch (tier) {
            case "WIN_BIG":
                return 260;
            case "WIN_CLOSE":
                return 210;
            case "LOSE":
            default:
                return 160;
        }
    }

    /**
     * Force the player car into the dedicated pit lane so the minigame
     * always becomes reachable even if other cars block manual lane changes.
     */
    private snapCarIntoPitLane(car: Car): void {
        const track = this.gameState.track;
        const pitLaneIndex = Math.max(0, track.numLanes - 1);

        car.laneIndex = pitLaneIndex;
        car.pendingLaneChanges = 0;
        car.targetLaneIndex = null;
        car.laneChangeStartTime = null;
        car.laneChangeStartOffset = null;
        car.laneChangeStartVelocity = null;
        car.lateral = track.getLaneOffset(pitLaneIndex);
        car.inPitLane = true;
        car.speedLimiter = true;
    }
}
