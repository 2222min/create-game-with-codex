# Game Spec v0

## Working Title

- Pulse Drift

## Platform

- Web game (HTML5 Canvas + JavaScript)
- Desktop keyboard first, mobile later

## Core Fantasy

- Fast 2D arena survival where the player dodges and manages short cooldown bursts.

## Core Loop (60-120 seconds)

1. Move and avoid enemies.
2. Trigger pulse burst to clear nearby threats.
3. Collect energy shards to refill burst meter.
4. Chain successful bursts within a short window to raise score multiplier.
5. Survive longer to increase total score.

## Controls (MVP)

- Move: `WASD` or Arrow keys
- Pulse Burst: `Space`
- Restart after death: `R`
- Fullscreen: `F`

## Differentiation Hook (Cycle 02)

- `Chain Pulse`: consecutive successful bursts increase score multiplier.
- Chain breaks when the player triggers a burst without kills or misses the chain time window.
- Goal: reward risk-taking and aggressive timing, not only passive survival.

## Win/Lose

- Lose: HP reaches 0.
- Session success metric: survival time and score.

## Technical Constraints

- Deterministic update loop with fixed time step.
- Pure-function state transitions for gameplay rules.
- Render layer reads from current state only.
- Mandatory `window.render_game_to_text` and `window.advanceTime(ms)` hooks.

## Visual Direction (MVP)

- Clean neon-flat style with high contrast.
- Placeholder primitives allowed until external assets arrive.

## External Asset Needs (Not blocked now)

- Optional: enemy/player sprite sheet, shard icon, background tile.
- If needed, request free assets and place in `assets/free-resources/inbox`.
