# Shared Modules Platform

This directory is the reusable platform layer for shipping many monetizable games.

## Purpose

- Reuse critical modules (payment, economy, analytics, social, liveops).
- Reduce per-game implementation cost.
- Keep module contracts stable and versioned.
- Minimize AI context usage by loading only selected module contracts.

## Core Files

- `MODULE_REGISTRY.yaml`: global list of reusable modules and ownership boundaries.
- `contracts/*.md`: module contracts (input/output/events/data ownership).
- `../templates/game-platform-manifest.json`: per-game module selection template.

## Rule

Each game must declare which modules are used in:

- `projects/<game-id>/platform-manifest.json`

Do not copy module logic into game folders when a shared module exists.
