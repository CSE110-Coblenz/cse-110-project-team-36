import { Track } from "../game/models/track";
import { RaceController } from "../game/controllers/RaceController";
import { loadTrack } from "../utils/trackList";
import type { QuestionConfig } from "../game/managers/QuestionManager";

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
     * @param trackId - The ID of the track to load
     * @param questionConfig - Configuration for question generation
     * @returns A promise that resolves to a RaceController
     */
    static async initializeRace(
        trackId: string,
        questionConfig: QuestionConfig
    ): Promise<RaceController> {
        const trackData = await loadTrack(trackId);
        const track = Track.fromJSON(trackData);
        return new RaceController(track, questionConfig);
    }
}
