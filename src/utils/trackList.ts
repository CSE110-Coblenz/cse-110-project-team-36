import type { TrackJSON } from "../game/models/track";

/**
 * Track metadata
 */
export interface TrackMetadata {
    id: string;
    name: string;
    description: string;
    file: string;
}

/**
 * Available tracks in the game
 */
export const AVAILABLE_TRACKS: TrackMetadata[] = [
    {
        id: "track1",
        name: "Circuit Alpha",
        description: "Basic loop track",
        file: "track1.json"
    }
];

/**
 * Load track data by ID
 */
export async function loadTrack(trackId: string): Promise<TrackJSON> {
    const track = AVAILABLE_TRACKS.find(t => t.id === trackId);
    if (!track) {
        throw new Error(`Track not found: ${trackId}`);
    }
    
    const trackModule = await import(/* @vite-ignore */ `../assets/tracks/${track.file}`);
    return trackModule.default as TrackJSON;
}

