# Contract: analytics-event-pipeline

## Responsibilities

- Validate event schema.
- Enrich events with session and build metadata.
- Dispatch events to configured sinks.

## Input

- `event_name`
- `event_payload`
- `player_id`
- `session_id`

## Output

- accepted/rejected status
- validation errors if rejected

## Public API

- `Analytics.track(name, payload, context)`
- `Analytics.trackRevenue(payload, context)`
- `Analytics.trackFunnelStep(payload, context)`

## Required Events

- `session_start`
- `session_end`
- `battle_result`
- `upgrade_applied`
- `payment_attempt`
- `payment_success`

## Data Ownership

- event schema map
- delivery/retry policy

## Non-Goals

- Product dashboards
