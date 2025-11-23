import type { RaceConfig } from '../../game/config/types';
import config1 from '../physics/config1.json';

const race: RaceConfig = {
    physics: config1,
    trackFile: 'track1.json',
    botConfig: {
        answerSpeedBase: 2.0, // Base mean answer speed (seconds)
        answerSpeedStdDev: 0.5, // Standard deviation for answer speed
        accuracyBase: 0.7, // Base accuracy probability
        accuracyStdDev: 0.15, // Standard deviation for accuracy
        safetyTimeBase: 3, // Base safety time threshold (seconds)
        safetyTimeStdDev: 0.3, // Standard deviation for safety time
    },
    botDifficultyRanges: [
        [0.7, 1.2],
        [0.8, 1.3],
        [0.9, 1.4],
        [1.0, 1.5],
        [1.1, 1.6],
        [1.2, 1.7],
        [1.3, 1.8],
    ],
    initialPositions: [0, -100, -200, -300, -400, -500, -600],
    laneIndices: [0, 1, 2, 3, 0, 1, 2],
    userCarLaneIndex: 3,
    userCarInitialPosition: -700,
};

export default race;
