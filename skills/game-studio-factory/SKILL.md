---
name: game-studio-factory
description: Build monetizable games with a reusable shared-module platform. Use when starting a new game, choosing reusable modules (payment/economy/analytics/social/liveops), creating or updating per-game platform manifests, and minimizing context by loading only selected module contracts.
---

# Game Studio Factory

Use this skill to ship many games with shared platform modules and low context cost.

## Required Inputs

- game id
- target genre
- monetization model

## Workflow

1. Read `platform/shared-modules/MODULE_REGISTRY.yaml`.
2. Read the target game's `projects/<game-id>/platform-manifest.json` if it exists.
3. If no manifest exists, create one from `platform/templates/game-platform-manifest.json`.
4. Select modules from the registry and enable only required modules.
5. Load only the contracts for selected modules:
   - `platform/shared-modules/contracts/<module>.md`
6. Produce integration tasks split into:
   - platform module tasks
   - game adapter tasks
7. Define KPI and instrumentation requirements through `analytics-event-pipeline`.

## Context Budget Rules

- Never load all module contracts by default.
- Start from manifest, then load only enabled module contracts.
- Keep game-specific logic in adapters; keep shared logic in platform modules.

## Output Format

- `Selected Modules`: id + version + reason
- `Adapter Plan`: per-module adapter file path
- `Integration Risks`: blocking dependencies
- `Validation`: monetization, fairness, analytics checks

## Anti-Patterns

- Duplicating payment logic in each game project
- Mixing ledger/economy writes into UI code
- Tracking analytics without schema validation
