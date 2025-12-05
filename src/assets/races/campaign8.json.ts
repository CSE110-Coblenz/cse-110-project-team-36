import { type RaceConfig, Difficulty } from '../../game/config/types';
import config1 from '../physics/config1.json';

const race: RaceConfig = {
    physics: config1,
    trackFile: 'campaigntrack8.json',
    botConfig: {
        answerSpeedBase: 2.0,
        answerSpeedStdDev: 0.5,
        accuracyBase: 0.7,
        accuracyStdDev: 0.15,
        safetyTimeBase: 3,
        safetyTimeStdDev: 0.3,
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
    raceDifficulty: Difficulty.MEDIUM,
};

export default race;
