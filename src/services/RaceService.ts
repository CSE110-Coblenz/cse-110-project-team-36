import { Track } from "../game/models/track";
import { RaceController } from "../game/controllers/RaceController";
import { loadTrack } from "../utils/trackList";
import type { QuestionConfig } from "../game/managers/QuestionManager";
import { ConfigController } from "../game/controllers/ConfigController";

/**
 * Race service for initializing race controllers
 * 
 * This service handles the asynchronous loading of tracks and initialization
 * of race controllers, keeping this logic out of the view layer.
 */
export class RaceService {
    /**
     * Initialize a race controller asynchronously
     * 
     * @param raceFile - The race config file to load (e.g., "race1.json")
     * @param questionConfig - Configuration for question generation
     * @returns A promise that resolves to a RaceController
     */
    static async initializeRace(
        raceFile: string,
        questionConfig: QuestionConfig
    ): Promise<RaceController> {
        // Load race config (includes physics config via inheritance)
        const raceConfig = await ConfigController.loadRaceConfig(raceFile);
        
        // Load track from trackFile reference
        const trackData = await loadTrack(raceConfig.trackFile.replace('.json', ''));
        const track = Track.fromJSON(trackData);
        
        return new RaceController(track, questionConfig, raceConfig);
    }
}
