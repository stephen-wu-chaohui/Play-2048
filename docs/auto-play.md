# Auto-play (Agent) Guide

This document explains the auto-play system and how to extend or configure it.

Overview
- The auto-play agent interfaces with the game logic to decide moves each turn.
- Agents can be started, paused, and configured from the UI.

Common strategy patterns (examples you can implement)
- Greedy: evaluate immediate score after each move and choose the max.
- Heuristics: score board patterns (monotonicity, empty tiles, merge potential).
- Expectimax: search game tree considering random tile spawns (slower but stronger).
- Monte Carlo rollouts: simulate random playouts and pick the move with highest average reward.

Configuration &amp; tuning
- Search depth / rollout count
- Heuristic weights (monotonicity, smoothness, empties, merges)
- Delay between moves (for visual observation)

Adding a new agent
1. Create a new module file under `src/agents/` (e.g., `myAgent.js`).
2. Implement a function that accepts a game state and returns a move direction:
   ```js
   // pseudo
   function chooseMove(gameState, config) {
     // return one of 'up', 'down', 'left', 'right'
   }
   ```
3. Wire the agent into the UI controls so it can be selected and started.

Instrumentation &amp; metrics
- Track per-run: highest tile, score, moves, run duration.
- Run headless experiments (no UI) to collect many runs and aggregate results.

Notes
- If you want, I can convert existing agent code into a pluggable interface and add an experiment harness to run batch tests and produce CSV/JSON results.
