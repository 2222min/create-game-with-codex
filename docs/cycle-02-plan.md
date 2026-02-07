# Cycle 02 Plan

## Planner Output

- Milestone: add one differentiating feature without breaking Cycle 01 stability.
- Scope: chain-based scoring loop tied to burst timing.
- Done when: player can build chain stacks, chain window is visible, and missed burst resets chain.

## Market Skeptic Output

- Viability score (pre-check): 7/10
- Primary risk: chain mechanic may be unclear to first-time players.
- Cheap validation: measure if users intentionally attempt back-to-back bursts in first 3 runs.
- Decision: Go, but expose chain status clearly in HUD.

## Architect Output

- Keep chain as explicit domain state:
  - `chain.count`
  - `chain.multiplier`
  - `chain.windowRemainingMs`
  - `chain.bestCount`
- Apply multiplier only to burst-kill score, not passive score.
- Reset chain on failed burst or expired chain window.

## Implementer Tasks

1. Extend state model with chain fields.
2. Add chain update rules in pure gameplay transitions.
3. Expose chain state in `render_game_to_text`.
4. Add HUD panel for chain status and window bar.
5. Add tests for chain increment and reset behavior.

## Reviewer Checks

- Chain logic is fully in `update.js` and not coupled to renderer.
- Multiplier is deterministic and capped.
- Existing Cycle 01 interactions are unaffected.
- Tests cover consecutive success and miss-reset paths.
