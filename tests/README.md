# Test Suite

This directory contains the comprehensive test suite for FormulaFun, organized in a modular structure for easy extension and maintenance.

## Structure

```
tests/
├── setup.ts                 # Global test configuration and mocks
├── utils/
│   └── test-helpers.ts      # Shared test utilities and helpers
├── serialization/           # Serialization module tests
│   ├── car.test.ts         # Car serialization tests
│   ├── track.test.ts       # Track serialization tests
│   └── gamestate.test.ts   # GameState serialization tests
└── README.md               # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Serialization Tests Only
```bash
npm run test:serialization
```

### CI Mode (for GitHub Actions)
```bash
npm run test:ci
```

## Test Categories

### Serialization Tests (`tests/serialization/`)

Comprehensive tests for the game's save/load system:

- **Car Serialization** (`car.test.ts`)
  - Tests `toSerializedData()` and `fromSerializedData()` methods
  - Validates round-trip data integrity
  - Tests edge cases and extreme values
  - Ensures functionality preservation after deserialization

- **Track Serialization** (`track.test.ts`)
  - Tests track data serialization/deserialization
  - Validates geometric data preservation
  - Tests different track configurations
  - Ensures track methods work after deserialization

- **GameState Serialization** (`gamestate.test.ts`)
  - Tests complete game state serialization
  - Tests localStorage integration
  - Validates player/AI car preservation
  - Tests error handling and edge cases

## Test Utilities

### `test-helpers.ts`

Provides shared utilities for creating test data:

- `createSimpleTestTrack()` - Creates a basic rectangular track
- `createComplexTestTrack()` - Creates a curved track with multiple turns
- `createTestCar()` - Creates a car with specified properties
- `createTestGameState()` - Creates a complete game state with cars
- `expectVec2ToBeCloseTo()` - Asserts Vec2 objects are approximately equal
- `validateSerializedCar()` - Validates serialized car structure
- `validateSerializedTrack()` - Validates serialized track structure
- `validateSerializedGameState()` - Validates complete serialized game state

### `setup.ts`

Global test configuration:

- Mocks `localStorage` for browser API testing
- Sets up global test utilities
- Configures test environment

## Adding New Tests

### For New Modules

1. Create a new directory under `tests/` matching your module structure
2. Add test files with `.test.ts` extension
3. Import shared utilities from `tests/utils/test-helpers.ts`
4. Follow the existing naming conventions

### For Existing Modules

1. Add new test cases to existing test files
2. Use descriptive `describe` and `it` blocks
3. Follow the Arrange-Act-Assert pattern
4. Add edge cases and error scenarios

## Best Practices

1. **Descriptive Names**: Use clear, descriptive names for test suites and cases
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and validation
3. **Edge Cases**: Test boundary conditions and error scenarios
4. **Isolation**: Each test should be independent and not rely on others
5. **Mocking**: Use mocks for external dependencies (localStorage, etc.)
6. **Coverage**: Aim for high code coverage but focus on meaningful tests

## CI Integration

Tests run automatically on:
- Push to `main`, `develop`, or `feature/*` branches
- Pull requests to `main` or `develop`
- Multiple Node.js versions (18.x, 20.x)

The CI pipeline includes:
- Linting
- Type checking
- Unit tests
- Coverage reporting
- Build verification
- Security auditing

## Coverage Goals

- **Serialization Module**: 100% coverage (critical for save/load functionality)
- **Game Logic**: 90%+ coverage
- **UI Components**: 80%+ coverage
- **Overall Project**: 85%+ coverage
