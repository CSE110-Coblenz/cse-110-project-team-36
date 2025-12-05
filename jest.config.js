/** @type {import('jest').Config} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    jsx: 'react-jsx',
                    esModuleInterop: true,
                },
            },
        ],
    },
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx)',
        '<rootDir>/tests/**/*.(test|spec).(ts|tsx)',
    ],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts',
        '!src/pages/**/*.tsx',
        '!src/rendering/**/*.tsx',
        '!src/App.tsx',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    moduleDirectories: ['node_modules', '<rootDir>/src'],
    roots: ['<rootDir>/src', '<rootDir>/tests'],
};
