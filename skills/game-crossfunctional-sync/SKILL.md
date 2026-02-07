---
name: game-crossfunctional-sync
description: Drive continuous collaboration between product owner, developers, and designers for game projects. Use when a team needs structured idea discussion, decision logging, conflict resolution, and per-cycle handoff artifacts before and during implementation.
---

# Game Crossfunctional Sync

Run this when PO, engineering, and design must stay aligned while shipping game cycles.

## Workflow

1. Start each cycle by collecting one-page inputs from PO, engineer, and designer.
2. Force disagreement discovery: find at least one scope or quality conflict.
3. Convert discussion into one decided scope with explicit trade-offs.
4. Produce handoff artifacts for each role.
5. Run a short checkpoint after implementation and feed learning to the next cycle.

## Mandatory Artifacts Per Cycle

- `Cycle Brief`: goal, target player, success metric
- `Conflict Log`: unresolved tensions and owner
- `Decision Log`: selected option + rejection reason
- `Role Handoff`: PO tasks, engineering tasks, design tasks
- `Validation Plan`: what to measure in playtest/market test

Use templates from:

- `references/cycle-brief-template.md`
- `references/decision-log-template.md`
- `references/role-handoff-template.md`

## Meeting Cadence Rule

- Kickoff sync: before coding starts
- Mid-cycle sync: after first playable build
- Wrap sync: after test/review findings

Each sync must end with exactly one `Next Most Valuable Task`.

## Guardrails

- Do not allow implementation to start without a measurable success metric.
- Do not allow design work to proceed without technical feasibility notes.
- Do not allow PO scope additions mid-cycle without a de-scope replacement.
- Keep tasks small enough to ship a playable increment in one cycle.
