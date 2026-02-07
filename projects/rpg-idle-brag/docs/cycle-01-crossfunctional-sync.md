# Cycle 01 Crossfunctional Sync

## Cycle Brief

- Goal: 3~8분 세션에서 성장 체감 + 자랑/경쟁 + 수익화 진입점을 동시에 검증
- Target Player: 친구 비교를 좋아하는 캐주얼 키우기 유저
- 3-minute Hook: 자동 전투로 스테이지가 오르고, 즉시 업그레이드/보상/랭킹 제출 가능
- Monetization Hypothesis: 저마찰 스타터 팩(보석+스킨)과 비전투 편의 구매 전환이 발생한다
- Social Hypothesis: 리더보드 제출과 자랑 카드 생성이 반복 접속 동기를 만든다
- Success Metrics:
  - 스타터 팩 시도율 >= 25%
  - 리더보드 제출율 >= 35%
  - 자랑 카드 생성율 >= 20%
  - 1세션 내 업그레이드 3회 이상 수행율 >= 60%

## Conflict Log

- PO: 시즌 패스와 상점을 초기부터 깊게 넣고 싶음
- Engineering: 초기 사이클에서 기능 과다로 안정성 저하 우려
- Design: 아트 리소스 없어서 표현력이 떨어질 수 있음

## Decision Log

- Chosen Option: Cycle 01은 `핵심 성장 + 스타터 팩 1종 + 로컬 리더보드/자랑 카드`만 구현
- Rejected Option: 시즌 패스 전체 UI/다중 상품 상점
- Why Rejected: 검증 전에 구현비용이 너무 큼
- Risk Introduced: 수익화 폭이 좁아질 수 있음
- Mitigation Owner: PO가 테스트군 설문으로 상품 선호 데이터 수집

## Role Handoff

- PO:
  - KPI 이벤트 정의 고정
  - Cycle 01 범위 잠금
- Engineering:
  - deterministic update 루프로 전투/경제/사회 기능 구현
  - adapter 경계 유지
  - 단위 테스트 + Playwright 회귀
- Design:
  - 스타일 토큰(색/폰트/패널 구조) 정의
  - 무료 리소스 없이도 읽기 좋은 HUD 레이아웃 설계

## Next Most Valuable Task

- 플레이 가능한 `web/` MVP 빌드를 만들고, 실제 키 입력으로 성장/결제/자랑 루프를 한 번에 검증한다.
