# Architecture Overview

Play-2048 is intentionally small and modular. The main components:

- UI (HTML + CSS)
  - Renders the grid, tiles, score, and controls.
  - Handles input: arrow keys, swipe, and UI buttons (including Auto-play controls).

- Game logic (JavaScript)
  - Represents the game board (4x4 grid).
  - Implements move generation, merging rules, tile spawning, and game-over detection.
  - Exposes a small API used by both the UI and the auto-play agent.

- Auto-play agent(s) (JavaScript module)
  - Runs against the same game logic API used by manual play.
  - Can be implemented with different strategies (greedy, expectimax, Monte Carlo, heuristic).
  - Configurable to run continuous play, pause, and report stats.

- Persistence / Storage (optional)
  - LocalStorage for high scores and agent configuration (if implemented).

- Deployment
  - Static files served via GitHub Pages, Netlify, or any static host.
  - No server component required.

Design decisions &amp; rationale:
- Keep game logic separate from UI so experiments with auto-play strategies are straightforward.
- Use plain JS for portability and ease of static deployment.
- Agent should be able to run headlessly (no UI) for batch experiments.

Extensibility:
- Add new strategies under `src/agents/` (or similar).
- Add an experiment harness to run many games headless and collect metrics.
