# RPG Idle Brag

돈이 되는 RPG 키우기 + 친구 자랑/경쟁 루프를 검증하는 별도 게임 프로젝트입니다.

## Directory Map

- `platform-manifest.json`: 공통 모듈 선택 선언
- `docs/`: 기획/리스크/아키텍처 문서
- `web/`: Cycle 01 플레이 가능한 MVP

## MVP Controls

- `Enter`: 시작/재시작
- `E` 또는 `Left`: 검 강화 시도 (Gold, 확률 강화)
- `Space`: 상자 보상 수령
- `B`: 스타터 팩 구매(1회) / 편의 슬롯 구매
- `U` 또는 `Up`: 리더보드 제출
- `J` 또는 `Down`: 자랑 카드 생성

강화 규칙:

- 강화 레벨이 높아질수록 성공 확률이 감소
- 실패 시 레벨은 유지, 골드만 소모
- 성공 시 공격력 상승 + 검 비주얼이 더 화려하게 갱신

## Run

루트 경로에서:

```bash
npm run serve
```

열기:

`http://127.0.0.1:4173/projects/rpg-idle-brag/web/`
