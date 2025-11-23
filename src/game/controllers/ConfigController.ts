import type { PhysicsConfig, RaceConfig } from '../config/types';

/**
 * Config controller for loading configuration files
 * Race configs fully specify their physics config by importing it directly
 */
export class ConfigController {
    /**
     * Load a physics config from a JSON file
     *
     * @param configFile - Path to the physics config file (e.g., "config1.json")
     * @returns Promise resolving to the loaded PhysicsConfig
     */
    static async loadPhysicsConfig(configFile: string): Promise<PhysicsConfig> {
        try {
            // configFile might be "config1.json" or "config1", handle both
            const fileName = configFile.endsWith('.json')
                ? configFile
                : `${configFile}.json`;
            const configModule = await import(
                /* @vite-ignore */ `../../assets/physics/${fileName}.ts`
            );
            const config = configModule.default as PhysicsConfig;
            this.validatePhysicsConfig(config);
            return config;
        } catch (error) {
            throw new Error(
                `Failed to load physics config: ${configFile} - ${error}`,
            );
        }
    }

    /**
     * Load a race config from a JSON file
     *
     * @param raceFile - Path to the race config file (e.g., "race1.json")
     * @returns Promise resolving to the loaded RaceConfig
     */
    static async loadRaceConfig(raceFile: string): Promise<RaceConfig> {
        try {
            const raceModule = await import(
                /* @vite-ignore */ `../../assets/races/${raceFile}.ts`
            );
            const raceConfig = raceModule.default as RaceConfig;
            this.validateRaceConfig(raceConfig);
            return raceConfig;
        } catch (error) {
            throw new Error(
                `Failed to load race config: ${raceFile} - ${error}`,
            );
        }
    }

    /**
     * Validate that a config has all required physics fields
     */
    private static validatePhysicsConfig(
        config: unknown,
    ): asserts config is PhysicsConfig {
        if (typeof config !== 'object' || config === null) {
            throw new Error('Invalid physics config: must be an object');
        }

        const requiredFields = [
            'vMin',
            'vMax',
            'aBase',
            'tauA',
            'beta',
            'vBonus',
            'kappaEps',
            'vKappaScale',
            'slipDecay',
            'slipWobbleAmp',
            'slipWobbleFreq',
            'baseMu',
            'slipVelocityDecay',
            'momentumTransfer',
            'kKappaBrake',
        ];

        const configObj = config as Record<string, unknown>;
        for (const field of requiredFields) {
            if (typeof configObj[field] !== 'number') {
                throw new Error(
                    `Invalid physics config: missing or invalid field '${field}'`,
                );
            }
        }
    }

    /**
     * Validate that a race config has all required fields
     */
    private static validateRaceConfig(
        config: unknown,
    ): asserts config is RaceConfig {
        if (typeof config !== 'object' || config === null) {
            throw new Error('Invalid race config: must be an object');
        }

        const configObj = config as Record<string, unknown>;
        if (typeof configObj.trackFile !== 'string') {
            throw new Error(
                "Invalid race config: missing or invalid field 'trackFile'",
            );
        }
        if (!configObj.physics || typeof configObj.physics !== 'object') {
            throw new Error(
                "Invalid race config: missing or invalid field 'physics'",
            );
        }
        this.validatePhysicsConfig(configObj.physics);
    }
}
