# Contract: payment-core

## Responsibilities

- Resolve product catalog and price display metadata.
- Start checkout intent.
- Validate purchase receipt/token.
- Grant or revoke entitlements.

## Input

- `product_id`
- `platform` (`web`, `ios`, `android`)
- `player_id`
- `locale`

## Output

- `checkout_result` (`completed`, `cancelled`, `failed`)
- `entitlement_change` events

## Public API

- `PaymentService.startCheckout(productId, context)`
- `PaymentService.restorePurchases(playerId, context)`
- `PaymentService.getEntitlements(playerId)`

## Events

- `event.payment.completed`
- `event.payment.failed`
- `event.entitlement.changed`

## Data Ownership

- Product catalog mapping
- Purchase token history
- Entitlement state

## Non-Goals

- UI skinning for shop screens
- Game-specific bundle balancing logic
