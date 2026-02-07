# Contract: liveops-season-pass

## Responsibilities

- Define active season and timeline.
- Track mission progress.
- Track pass tier progression.
- Grant season pass rewards.

## Input

- `player_id`
- `season_id`
- `mission_event`
- `tier_claim_request`

## Output

- mission progress state
- claim status
- granted reward list

## Public API

- `LiveOpsService.getActiveSeason()`
- `LiveOpsService.recordMissionEvent(playerId, eventPayload)`
- `LiveOpsService.claimMissionReward(playerId, missionId)`
- `LiveOpsService.claimPassTierReward(playerId, tierId)`

## Events

- `event.season.changed`
- `event.mission.completed`
- `event.pass.reward_claimed`

## Data Ownership

- season config
- player mission progress
- pass reward claim ledger

## Non-Goals

- Frontend season pass screen layout
