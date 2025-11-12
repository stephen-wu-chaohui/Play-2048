# Getting Started

This guide helps you run Play-2048 locally and use the auto-play features.

1. Clone the repo:
   ```bash
   git clone https://github.com/stephen-wu-chaohui/Play-2048.git
   cd Play-2048
   ```

2. Open locally:
   - Option 1: Open `index.html` in your browser.
   - Option 2: Start a local static server:
     ```bash
     python -m http.server 8000
     # or
     npx http-server -p 8000
     ```
   - Navigate to http://localhost:8000

3. Play:
   - Use arrow keys (desktop) or swipe (mobile).
   - Use the control panel to enable auto-play.

4. Troubleshooting:
   - If scripts are blocked by the browser when opening the file directly, use a static server.
   - If the auto-play doesn't start, check browser console for errors.

5. Developing:
   - If a build system exists (package.json), run `npm install` then `npm run dev`.
   - Use your browser dev tools to step through the game logic (game loop, moves, and the auto-play agent).

6. Testing and metrics:
   - If the project exposes logging, use the console to view auto-play run statistics (e.g., max tile reached, score, moves).
