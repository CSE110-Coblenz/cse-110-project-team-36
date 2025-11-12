# Formula Fun 
Formula Fun is an educational browser game designed to help grade school students improve their arithmetic fluency in a fun, interactive way.
Players race around a virtual track while solving math problems in a high-energy, time-pressured environment. When entering the pit stop, players complete short quizzes involving addition, subtraction, multiplication, and division. Correct answers boost their car’s progress (refueling, repairing tires, etc.), while incorrect or slow responses reduce their efficiency.
---

A local-only, browser-based racing game built with **TypeScript + React + Vite**.  


---

##  Highlights

-  Top-down racing with lanes, skid marks, HUD, and pause overlay  
-  **Quiz-driven minigame** (pit-lane challenge) with difficulty selection and stats tracking  
-  Clean separation of concerns (MVC) for the minigame: `Controller/Model/View`  
-  Jest + JSDOM unit testing (TS) with coverage reporting  
-  Strict TypeScript config and ESLint rules for consistent quality

---

##  Project Structure (key paths)

```
src/
├─ game/
│  ├─ listeners/
│  ├─ managers/
│  │  ├─ QuestionManager.ts
│  │  └─ QuestionStatsManager.ts
│  ├─ models/
│  │  ├─ car.ts
│  │  ├─ game-state.ts
│  │  ├─ question.ts
│  │  ├─ skid-mark.ts
│  │  └─ track.ts
│  ├─ services/
│  ├─ clock.ts
│  └─ types.ts
├─ minigame/src/
│  ├─ __tests__/
│  ├─ Controller/
│  │  └─ MiniGameController.ts
│  ├─ Model/
│  │  ├─ MiniGameConfig.ts
│  │  └─ MiniGameModel.ts
│  └─ View/
│     └─ MiniGameView.tsx
├─ pages/
│  ├─ DifficultySelectionScreen.tsx
│  ├─ LoginPage.tsx
│  ├─ MainMenuPage.tsx
│  └─ RacePage.tsx
├─ rendering/game/
│  ├─ CarLayer.tsx
│  ├─ GameStage.tsx
│  ├─ Hud.tsx
│  ├─ PauseOverlay.tsx
│  ├─ PitLaneHighlightLayer.tsx
│  ├─ SkidMarkLayer.tsx
│  └─ TrackLayer.tsx
├─ services/
│  ├─ localStorage.ts
│  └─ RaceService.ts
├─ shared/events.ts
├─ utils/
│  ├─ formatting.ts
│  ├─ questionUtils.ts
│  └─ trackList.ts
├─ App.tsx
└─ main.tsx
```

---

## Getting Started

### Prerequisites
- **Node.js 18+** (or 20+) and **npm**
- A modern browser (Chrome/Edge/Firefox/Safari)

### Install & Run (local only)
```bash
# 1) Clone
git clone https://github.com/CSE110-Coblenz/cse-110-project-team-36.git
cd cse-110-project-team-36

# 2) Install deps
npm install

# 3) Start dev server
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).


---

##  How to Play (quick tour)

- **Main Menu → Race** to start.  
- Use the on-screen HUD for speed/indicators and pause overlay.  
- Enter **Pit Lane** when highlighted; the **Minigame** opens:
  - Answer timed questions; each correct answer fills a progress bar (refuel/tires/etc.).
  - Complete bars before decay to get a **boost** back onto the track.

> See `pages/` for flows, `rendering/game/` for layers, and `minigame/src/` for quiz logic.

---

##  Scripts (common)

```bash
npm run dev        # Local dev (Vite)
npm run build      # Production build to /dist (local testing only)
npm run preview    # Preview the built app locally
npm test           # Run Jest unit tests
npm run coverage   # (if defined) Run tests with coverage output
npm run lint       # ESLint
npm run typecheck  # TypeScript checks
```

> Check `package.json` for the complete, authoritative list of scripts.

---

## Testing

- **Framework:** Jest (`jsdom`) with TypeScript support  
- **Test locations:**  
  - `src/**/__tests__/**/*.(test|spec).ts(x)`  
  - `tests/**/*.(test|spec).ts(x)`  
- **Coverage:** HTML/LCOV/Text reports saved to `coverage/`

Tip: Keep UI-free logic in plain TS modules (e.g., `Model/`, `utils/`, `services/`) to make testing straightforward.

---

##  Architecture Notes

- **Vite + React + TS** app shell
- **Minigame (MVC)**  
  - `Model`: `MiniGameModel`, `MiniGameConfig` (state/config, timers, scoring)  
  - `Controller`: `MiniGameController` (gameflow, events, transitions)  
  - `View`: `MiniGameView.tsx` (rendered UI)
- **Core Racing**  
  - Rendering layers in `rendering/game/` (`TrackLayer`, `CarLayer`, `Hud`, `PauseOverlay`, `PitLaneHighlightLayer`, etc.)  
  - Game entities & state in `game/models/`  
  - Questions & tracking in `game/managers/`  
  - Cross-cutting helpers in `utils/` and `shared/`

---

## Conventions & Quality

- **TypeScript:** strict mode enabled  
- **ESLint:** recommended + React Hooks rules; tests allow pragmatic `any`  
- **File layout:** “feature folders” (pages/rendering/minigame/game)  
- **Eventing:** shared event names in `shared/events.ts`  
- **Persistence:** simple `localStorage` helpers in `services/localStorage.ts`

---

##  For Graders & Teammates

- Run locally with `npm run dev` and navigate through the menu screens.  
- Use **Difficulty Selection** to preview different minigame pacing.  
- For deterministic demos, seed question sets in `QuestionManager` or stub via tests.

---


##  Troubleshooting

- Dev server doesn’t open? Manually visit `http://localhost:5173`.  
- Type errors? Run `npm run typecheck` and fix TS diagnostics.  
- ESLint issues? `npm run lint` to see problems; many can be autofixed with `--fix`.  
- Jest DOM failures on React components? Prefer testing logic in models/managers; keep React tests narrow.

---

##  License
