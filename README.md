# Formula Fun

Formula Fun is a local-only, browser-based racing game that blends high-energy driving with arithmetic drills for grade-school students. While racing around a top-down track, players dive into timed pit-stop quizzes covering addition, subtraction, multiplication, and division; strong performance sends them back on track with a speed boost.

---

## Overview

- **Goal:** Improve arithmetic fluency through short, repeatable practice loops inside a playful racing wrapper.
- **Stack:** TypeScript, React, Vite, Konva for canvas rendering, and Jest + ts-jest for tests.
- **Status:** Single-page app meant to be run locally (no backend).

---

## Core Features

- Reactive HUD with lap speed, pause overlay, and pit-lane prompts.
- Quiz-driven minigame with configurable difficulty and decay timers.
- Game entities modeled with MVC-style separation (`Controller/Model/View`) to keep logic testable.
- Strict TypeScript config, ESLint, and Jest coverage gates to protect quality.

---

## source Layout

```
repo root
├─ src/
│  ├─ App.tsx / main.tsx            # React/Vite entry + root component
│  ├─ const.ts                      # Global configuration + constants
│  ├─ assets/
│  │  └─ tracks/track1.json         # Sample racing line + checkpoints
│  ├─ game/
│  │  ├─ controllers/               # Race orchestration (RaceController, CarController, etc.)
│  │  ├─ managers/                  # QuestionManager + QuestionStatsManager
│  │  ├─ models/                    # Core entities (car, track, questions, skid marks, game state)
│  │  ├─ listeners/                 # Keyboard/resize/visibility hooks for the canvas
│  │  ├─ services/                  # CollisionService + future physics helpers
│  │  └─ clock.ts / types.ts        # Timing utilities + shared type aliases
│  ├─ rendering/
│  │  └─ game/                      # Konva layers (TrackLayer, CarLayer, Hud, PauseOverlay, etc.)
│  ├─ pages/                        # Top-level screens (Login, MainMenu, DifficultySelection, Race)
│  ├─ serialization/game.ts         # Helpers for saving/loading race snapshots
│  ├─ services/                     # RaceService + localStorage helpers
│  ├─ shared/events.ts              # Centralized DOM/custom event names
│  └─ utils/                        # Formatting + question/track helpers
├─ tests/
│  ├─ setup.ts                      # Jest test environment bootstrap
│  ├─ game/                         # Unit tests for clock, controllers, managers, models
│  ├─ rendering/                    # Rendering-layer sanity tests
│  ├─ serialization/                # Snapshot + save/load coverage
│  └─ utils/                        # Pure helper tests
├─ scripts/ci-local.sh              # Full lint/type/test/build/audit pipeline
├─ .github/workflows/ci.yml         # GitHub Actions workflow definition
├─ meetings/                        # Sprint planning / retro notes
├─ package.json / package-lock.json # npm scripts + pinned deps
├─ tsconfig*.json / vite.config.ts  # Build + tooling configuration
└─ README.md                        # You are here
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (20+ recommended) and npm
- A modern browser (Chrome, Edge, Firefox, or Safari)

### Install & Run

```bash
git clone https://github.com/CSE110-Coblenz/cse-110-project-team-36.git
cd cse-110-project-team-36
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`) to play.

### Production Build / Preview

```bash
npm run build     # Emits assets to dist/
npm run preview   # Serves the built bundle locally
```

---

## Common Scripts

```bash
npm run dev             # Vite dev server
npm run build           # Type check + production build
npm run preview         # Preview dist/ output
npm run lint            # ESLint (see eslint.config.js)
npm run typecheck       # Standalone TS diagnostics (tsc --noEmit)
npm test                # Jest test suite (single run)
npm run test:watch      # Jest in watch mode
npm run test:coverage   # Jest with coverage report (coverage/)
npm run test:game       # Focused suite: tests/game/
npm run test:rendering  # Focused suite: tests/rendering/
npm run test:serialization # Focused suite: tests/serialization/
npm run test:ci         # CI-friendly Jest (`--ci --coverage --watchAll=false`)
```

---

## Testing

- **Framework:** Jest + ts-jest using the `jsdom` environment so TS modules and React trees can run in Node.
- **Test locations:** `tests/**/*.(test|spec).ts(x)`.
- **Running Tests** bash scripts/ci-local.sh

---

## Continuous Integration / Quality Gates

`scripts/ci-local.sh` mirrors the pipeline a teammate will see in CI:

1. `npm ci`
2. `npm run lint`
3. `npx tsc --noEmit`
4. `npm test`
5. `npm run test:coverage`
6. `npm run build`
7. `npm audit --audit-level=moderate`

Run it locally before opening a PR if you want the exact order of checks.

---

## Gameplay Quickstart

1. Launch the dev server and open the browser tab.
2. From the main menu, pick **Race** and adjust difficulty if desired.
3. Follow lane prompts; when the pit-lane highlight appears, move into it.
4. The minigame pops up—answer timed arithmetic questions to fill progress bars (refuel, tires, etc.).
5. Finish bars quickly to leave the pit with a boost and continue lapping.

Related code:

- Screens/routes live in `src/pages/`.
- Konva rendering layers live in `src/rendering/game/`.
- Minigame MVC lives in `src/minigame/src/`.

---

## Troubleshooting

- **Blank page / dev server won’t open:** Make sure port 5173 is free or manually visit the logged URL.
- **TypeErrors at build time:** Run `npm run typecheck` to surface diagnostics outside of Vite.
- **Lint failures:** `npm run lint -- --fix` can auto-resolve many formatting issues.
- **Jest DOM errors:** Prefer testing pure logic (models, managers) instead of broad React trees; mock Konva layers when possible.
- **Dependency drift:** Use `npm ci` before running `scripts/ci-local.sh` for reproducible installs.

---

## Contributing

1. Create a feature branch.
2. Keep components small and colocated with their feature folder.
3. Add or update tests for logic changes.
4. Run `scripts/ci-local.sh` to ensure lint, type-checks, tests, and build all pass.

---

## License
