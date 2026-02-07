# Architecture Slice Cycle 01

## Architecture

- `game/update.js` (pure domain rules)
  - 전투, 성장, 상점, 미션, 리더보드 액션 처리
- `game/state.js` (state shape + invariants)
  - 초기 상태, 적 생성 규칙, 비용 규칙
- `game/render.js` (stateless view)
  - state를 기반으로 HUD/패널 렌더링
- `game/input.js` (input adapter)
  - 키 입력을 domain command로 변환
- `adapters/*.js` (platform module contracts)
  - payment/wallet/analytics/social/liveops 계약별 로직
- `main.js` (composition root)
  - loop + input + update + render 연결, text-state/test hooks 노출

Dependency direction:

`main -> {input, update, render}`
`update -> adapters + state`
`render -> state data only`

## Domain Model (Core)

- `mode`: `start | playing | gameover`
- `hero`: hp/attack/crit/xp/level
- `progression`: stage/kills/bossKills
- `enemy`: current target with hp/reward
- `wallet`: soft(gold)/premium(gem) + ledger
- `monetization`: starter-pack entitlement, skins, convenience slots
- `social`: guild, leaderboard, brag card
- `liveops`: active season + mission progress/reward claim
- `analytics`: accepted/rejected event tracking

## Invariants

- wallet balance는 음수가 될 수 없다
- 유료 구매는 hero.attack/hp/crit를 직접 증가시키지 않는다
- stage가 오를 때 enemy는 반드시 재생성된다
- rendering은 상태를 변경하지 않는다

## TDD Plan (Fail First)

1. 적 처치 시 보상 지급 + stage 진행
2. 골드 업그레이드가 능력치를 증가시키는지
3. 결제 성공 시 premium/entitlement 반영
4. 편의 구매는 가능하지만 전투 스탯은 그대로인지
5. 리더보드 제출 + 자랑 카드 생성
6. 사망 시 gameover 전환

## Implementation Guardrails

- update 함수 외부에서 전투 수치를 변경하지 않는다
- adapter를 우회한 잔액 변경 금지
- RNG 의존 로직은 `rng` 주입으로 테스트 가능하게 유지

## Handoff

- Implementer: `web/src` 및 `web/tests` 구현
- Reviewer: 페이투윈 여부, 음수 잔액, 이벤트 누락 우선 검토
- Designer: 무료 리소스 없이 명확한 UI 대비와 정보 구조 검증
