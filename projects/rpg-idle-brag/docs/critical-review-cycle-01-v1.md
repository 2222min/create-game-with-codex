# Critical Review Cycle 01 v1

## Intent

- 수익화(스타터팩), 성장(업그레이드), 자랑/경쟁(리더보드+브래그카드) 루프를 단일 세션에서 검증

## Findings

### Severity: High

- Location: `projects/rpg-idle-brag/web/src/adapters/payment-adapter.js`
- Issue: 결제 결과가 항상 성공으로 고정(mock)되어 결제 퍼널의 실패/취소 시나리오가 검증되지 않음
- Counterproposal: `context.simulateResult` 지원으로 `completed/cancelled/failed` 분기 테스트 추가
- Validation: 결제 실패 시 `payment_attempt`는 기록되고 `payment_success`는 누락되는지 확인

### Severity: Medium

- Location: `projects/rpg-idle-brag/web/src/adapters/social-adapter.js`
- Issue: 리더보드가 로컬 메모리에만 존재하여 세션 간 경쟁 경험이 약함
- Counterproposal: 다음 사이클에서 최소 서버 mock(API) 또는 localStorage 지속화 추가
- Validation: 새로고침 후에도 마지막 랭킹 제출 결과가 유지되는지 확인

### Severity: Medium

- Location: `projects/rpg-idle-brag/web/src/game/update.js`
- Issue: 적 공격/영웅 공격 타이밍이 단순 고정 간격이라 스테이지 후반 난이도 체감이 급격할 수 있음
- Counterproposal: stage 기반 가중치로 공격 간격/피해 완만 곡선 적용
- Validation: stage 1~20 TTK(time-to-kill) 분포가 급격히 튀지 않는지 시뮬레이션

### Severity: Low

- Location: `projects/rpg-idle-brag/web/src/game/render.js`
- Issue: 액션 키 안내가 데스크톱 중심이며 모바일 터치 입력 정보가 없음
- Counterproposal: 모바일 버튼 오버레이 추가 또는 키 안내 토글
- Validation: 모바일 스크린샷에서 조작 가이드 가시성 확인

## Approval Checks

1. 결제 성공/실패/취소 테스트 케이스 추가
2. 리더보드 데이터 최소 지속화 적용
3. 난이도 곡선 지표(TTK, 패배 stage 분포) 측정 로그 추가
