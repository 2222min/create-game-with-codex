# Pulse Drift

Playable web game prototype (HTML5 Canvas).

## 1) Share to anyone with one URL (GitHub Pages)

After one-time setup, testers only open a web link.

### One-time setup

1. Push this repo to GitHub.
2. In GitHub: `Settings -> Pages -> Source`, choose `GitHub Actions`.
3. Push to `main` branch.

This repository already includes auto deploy workflow:

- `/Users/finda0603/Desktop/create-game-with-codex/.github/workflows/deploy-pages.yml`

### Share URL format

`https://<your-github-id>.github.io/<repo-name>/`

## 2) Tester controls

- Start: `Enter` or `Space`
- Move: `WASD` or Arrow keys
- Burst: `Space`
- Restart: `R` or `Enter` (after game over)
- Fullscreen: `F`

Mobile:
- On-screen touch controls are shown automatically.
- Left joystick drag: move
- `START`: game start
- `BURST`: pulse burst
- `RESTART`: restart after game over

Compatibility:
- Mobile input supports `pointer`, `touch`, and `mouse` fallback paths for in-app webviews (including Kakao in-app browser).

Check point:
- `Chain xN / Mult xM` should rise after consecutive successful bursts.

## 3) Local run (developer/tester)

```bash
npm run serve
```

Open: `http://127.0.0.1:4173`

## 4) Test commands

Unit tests:

```bash
npm test
```

Playwright validation:

1. Start server:

```bash
npm run serve
```

2. In another terminal:

```bash
npm run playtest
```

Artifacts:
- `/Users/finda0603/Desktop/create-game-with-codex/output/web-game`
