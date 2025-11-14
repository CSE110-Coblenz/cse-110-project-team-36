import type { RaceConfig } from '../../game/config/types';

const race: Partial<RaceConfig> = {
    extends: "config1.json",
    trackFile: "track1.json"
};

export default race as RaceConfig;

