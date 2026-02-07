# Factory Integration v1

## Selected Modules

- `payment-core@^1.0.0`: starter pack checkout and entitlement grant
- `economy-wallet@^1.0.0`: gold/gem balance and ledger transactions
- `analytics-event-pipeline@^1.0.0`: funnel, revenue, and gameplay event validation
- `social-guild-and-leaderboard@^1.0.0`: score board and brag-card metadata
- `liveops-season-pass@^1.0.0`: season mission progress and reward claim

## Adapter Plan

- `projects/rpg-idle-brag/web/src/adapters/payment-adapter.js`
- `projects/rpg-idle-brag/web/src/adapters/wallet-adapter.js`
- `projects/rpg-idle-brag/web/src/adapters/analytics-adapter.js`
- `projects/rpg-idle-brag/web/src/adapters/social-adapter.js`
- `projects/rpg-idle-brag/web/src/adapters/liveops-adapter.js`

## Integration Risks

- 결제 모듈이 mock 상태라 실제 결제 SDK 전환 시 entitlement 중복 처리 필요
- 로컬 리더보드는 실서비스 랭킹 API와 정합성 검증 필요
- 시즌 보상 지급 로직이 단일 기기 메모리 상태이므로 서버 권위화 필요

## Validation

- Monetization: `payment_attempt -> payment_success -> entitlement_changed` 이벤트 체인 확인
- Fairness: 유료 구매가 전투 DPS를 직접 증가시키지 않는지 테스트
- Analytics: required event (`session_start`, `battle_result`, `upgrade_applied`, `payment_attempt`, `payment_success`) 수집 확인
