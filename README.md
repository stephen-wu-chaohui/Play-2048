# Play-2048

One-line summary
A server-less implementation of the 2048 game with a built-in auto-play algorithm you can use to observe or tune AI strategies.

Badges: build / coverage / license / docs (add actual badges as available)

---

## Table of contents

- <a>About</a>
- <a>Features</a>
- <a>Quick start</a>
- <a>Usage</a>
- <a>Auto-play agent</a>
- <a>Development</a>
- <a>Contributing</a>
- <a>License</a>

## About

Play-2048 is a lightweight, browser-based (static) implementation of the classic 2048 game. It runs entirely client-side (no server required) and includes an auto-play algorithm for experiments, benchmarking, and demonstration.

Repository: `stephen-wu-chaohui/Play-2048`

## Features

- Pure client-side 2048 game (HTML/CSS/JS)
- Toggle between manual play and auto-play
- Configurable auto-play strategies and parameters
- Lightweight, suitable for static hosting (GitHub Pages, Netlify)

## Quick start

Option A — open locally (no install)
1. Clone repository
   ```bash
   git clone https://github.com/stephen-wu-chaohui/Play-2048.git
   cd Play-2048
   ```
2. Open the game in your browser:
   - Double-click `index.html` or open it from the browser (works for many browsers).
   - If your browser blocks local file scripts, use a local static server (below).

Option B — run a simple local static server
```bash
# Python 3
python -m http.server 8000
# or with Node (if you have http-server installed)
npx http-server -p 8000
```
Then open http://localhost:8000 in your browser.

## Usage

- Use arrow keys or swipe (mobile) to play manually.
- Use the UI control (Auto-play / Start) to switch on the auto-play algorithm.
- Use configuration controls (if present) to select the strategy and parameters.

## Auto-play agent

See docs/auto-play.md for details on the currently implemented strategy, how to configure it, and how to add new strategies for testing.

## Development

- The app is intentionally minimal: static HTML/CSS/JS.
- If a package.json or build tool exists, follow the project's commands:
  - Install dependencies: `npm install` (if present)
  - Run dev server: `npm run dev` or `npm start` (if present)
  - Build: `npm run build` (if present)

Testing &amp; linting:
- Add or run test suites if present (e.g., `npm test`).

Branching model:
- Work on feature branches named `feat/<short-desc>` or `fix/<short-desc>`.
- Open a pull request against `main`.

## Contributing

See CONTRIBUTING.md for details on how to contribute, run tests, and propose changes.

## License

This project is available under the MIT License. See LICENSE file.