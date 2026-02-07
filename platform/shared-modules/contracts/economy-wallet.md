# Contract: economy-wallet

## Responsibilities

- Keep canonical balances for soft and premium currency.
- Record transaction ledger with reason codes.
- Enforce no-negative-balance rules.

## Input

- `player_id`
- `currency_type`
- `amount`
- `reason_code`
- `reference_id`

## Output

- updated balances
- transaction record id

## Public API

- `WalletService.credit(playerId, amount, currency, reason)`
- `WalletService.debit(playerId, amount, currency, reason)`
- `WalletService.getBalance(playerId)`

## Events

- `event.wallet.changed`

## Data Ownership

- wallet balances
- transaction ledger

## Non-Goals

- Game-specific reward amount calculation
