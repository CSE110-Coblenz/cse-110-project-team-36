import type { PhysicsConfig, RaceConfig } from '../config/types';

/**
 * Config controller for loading and merging configuration files
 * Handles inheritance from physics configs to race configs
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
            const fileName = configFile.endsWith('.json') ? configFile : `${configFile}.json`;
            const configModule = await import(/* @vite-ignore */ `../../assets/physics/${fileName}.ts`);
            const config = configModule.default as PhysicsConfig;
            this.validatePhysicsConfig(config);
            return config;
        } catch (error) {
            throw new Error(`Failed to load physics config: ${configFile} - ${error}`);
        }
    }

    /**
     * Load a race config from a JSON file
     * Handles inheritance from physics configs
     * 
     * @param raceFile - Path to the race config file (e.g., "race1.json")
     * @returns Promise resolving to the loaded RaceConfig with merged physics config
     */
    static async loadRaceConfig(raceFile: string): Promise<RaceConfig> {
        try {
            const raceModule = await import(/* @vite-ignore */ `../../assets/races/${raceFile}.ts`);
            const raceConfig = raceModule.default as RaceConfig;
                
            // If extends is specified, load and merge the physics config
            if (raceConfig.extends) {
                const physicsConfig = await this.loadPhysicsConfig(raceConfig.extends);
                // Merge: race config overrides physics config
                const merged: RaceConfig = {
                    ...physicsConfig,
                    ...raceConfig,
                    // Ensure extends and trackFile are preserved
                    extends: raceConfig.extends,
                    trackFile: raceConfig.trackFile
                };
                this.validateRaceConfig(merged);
                return merged;
            }
            
            // If no extends, validate that all physics fields are present
            this.validateRaceConfig(raceConfig);
            return raceConfig;
        } catch (error) {
            throw new Error(`Failed to load race config: ${raceFile} - ${error}`);
        }
    }

    /**
     * Validate that a config has all required physics fields
     */
    private static validatePhysicsConfig(config: any): asserts config is PhysicsConfig {
        const requiredFields = [
            'vMin', 'vMax', 'aBase', 'tauA', 'beta', 'vBonus',
            'kappaEps', 'vKappaScale', 'slipDecay', 'slipWobbleAmp',
            'slipWobbleFreq', 'baseMu', 'slipVelocityDecay',
            'momentumTransfer', 'kKappaBrake'
        ];
        
        for (const field of requiredFields) {
            if (typeof config[field] !== 'number') {
                throw new Error(`Invalid physics config: missing or invalid field '${field}'`);
            }
        }
    }

    /**
     * Validate that a race config has all required fields
     */
    private static validateRaceConfig(config: any): asserts config is RaceConfig {
        if (typeof config.trackFile !== 'string') {
            throw new Error('Invalid race config: missing or invalid field \'trackFile\'');
        }
        this.validatePhysicsConfig(config);
    }
}

