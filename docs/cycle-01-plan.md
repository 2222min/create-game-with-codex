# Cycle 01 Plan

## Planner Output

- Milestone: playable 60-second survival prototype with scoring.
- Scope: start screen, gameplay, death/restart flow.
- Done when: movement, enemy chase, pulse burst, hp, score, restart all work.

## Market Skeptic Output

- Viability score: 6/10
- Primary risk: "arena survival" alone is not differentiated.
- Cheap validation: test whether users replay at least 3 rounds voluntarily.
- Decision: Go (prototype), then decide unique hook in Cycle 02.

## Architect Output

- Modules:
  - `engine/loop.js` fixed-step clock
  - `game/state.js` initial state + invariants
  - `game/update.js` pure gameplay transitions
  - `game/render.js` canvas rendering
  - `game/input.js` key state adapter
- TDD-first targets:
  - player movement bounds
  - enemy chase vector correctness
  - burst cooldown + radius effect
  - hp decrement and death transition
  - score/time accumulation

## Implementer Tasks

1. Bootstrap canvas app with start/gameover states.
2. Add deterministic update and input handling.
3. Implement player movement and enemy spawn/chase.
4. Implement burst skill, hp, score, restart.
5. Expose `render_game_to_text` and `advanceTime`.

## Reviewer Checks

- No gameplay logic in renderer.
- No hidden global mutable state for domain data.
- Tests cover core transitions and death/restart path.
- Game text state matches visual state.

## Designer Tasks

- Keep primitive placeholders for Cycle 01.
- Prepare asset spec list for Cycle 02 external resources.
