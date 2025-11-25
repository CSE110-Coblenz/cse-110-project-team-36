import type { TrackJSON } from '../game/models/track';

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
        id: 'track1',
        name: 'Circuit Alpha',
        description: 'Basic loop track',
        file: 'track1.json',
    },
    {
        id: 'campaigntrack1',
        name: 'Campaign Track 1',
        description: 'Beginner campaign track',
        file: 'campaign1.json',
    },
    {
        id: 'campaigntrack2',
        name: 'Campaign Track 2',
        description: 'Beginner campaign track',
        file: 'campaign2.json',
    },
    {
        id: 'campaigntrack3',
        name: 'Campaign Track 3',
        description: 'Beginner campaign track',
        file: 'campaign3.json',
    },
    {
        id: 'campaigntrack4',
        name: 'Campaign Track 4',
        description: 'Beginner campaign track',
        file: 'campaign4.json',
    },
    {
        id: 'campaigntrack5',
        name: 'Campaign Track 5',
        description: 'Beginner campaign track',
        file: 'campaign5.json',
    },
    {
        id: 'campaigntrack6',
        name: 'Campaign Track 6',
        description: 'Beginner campaign track',
        file: 'campaign6.json',
    },
    {
        id: 'campaigntrack7',
        name: 'Campaign Track 7',
        description: 'Beginner campaign track',
        file: 'campaign7.json',
    },
    {
        id: 'campaigntrack8',
        name: 'Campaign Track 8',
        description: 'Beginner campaign track',
        file: 'campaign8.json',
    },
    {
        id: 'campaigntrack9',
        name: 'Campaign Track 9',
        description: 'Beginner campaign track',
        file: 'campaign9.json',
    },
    {
        id: 'campaigntrack10',
        name: 'Campaign Track 10',
        description: 'Beginner campaign track',
        file: 'campaign10.json',
    },
];

/**
 * Load track data by ID
 */
export async function loadTrack(trackId: string): Promise<TrackJSON> {
    const track = AVAILABLE_TRACKS.find((t) => t.id === trackId);
    if (!track) {
        throw new Error(`Track not found: ${trackId}`);
    }

    const trackModule = await import(
        /* @vite-ignore */ `../assets/tracks/${track.file}`
    );
    return trackModule.default as TrackJSON;
}
