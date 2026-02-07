# Planner Kickoff v1

## Project Goal

- 친구들끼리 자랑하고 비교할 수 있는 소셜 요소를 갖춘 RPG 키우기 게임 제작
- 무료 유입 -> 잔존 -> 저마찰 결제로 이어지는 구조 설계

## Product Working Title

- Guild Idle Chronicle

## Target User

- 15~35세, 가볍게 키우기 게임을 즐기고 친구와 성과 비교를 좋아하는 유저
- 하드코어 컨트롤보다 성장/조합/자랑 동기를 선호하는 유저

## Core Value Proposition

- 오프라인 보상으로 부담 없이 성장
- 친구 길드 랭킹과 시즌 배지로 자랑 포인트 제공
- 짧은 접속(3~8분)에서도 성취를 느낄 수 있는 루프

## Core Loop (Session 3~8 min)

1. 접속 후 오프라인 보상 수령
2. 영웅/장비/스킬 강화
3. 자동 전투 및 보스 도전
4. 친구 길드 랭킹/배지 확인 및 공유
5. 다음 접속 동기(업그레이드 목표) 설정

## Social Brag Loop

1. 주간 랭킹 점수 산출
2. 상위권/특정 조건 달성 시 배지 획득
3. 배지 카드 자동 생성 (닉네임 + 시즌 성과)
4. 친구 채팅/메신저 공유

## Monetization Strategy (v1)

- Cosmetic Shop:
  - 영웅 스킨, UI 테마, 길드 배너
- Season Pass:
  - 시즌 미션 보상 강화 + 한정 코스메틱
- Convenience (Non-P2W):
  - 자동 수령 슬롯 확장, 인벤토리 정리 편의
- Rewarded Ads:
  - 일일 3회 보너스 드롭, 강제 광고 없음

## MVP Feature Scope (Cycle 01~03)

- Cycle 01 (Playable Core):
  - 자동 전투, 성장 스탯, 오프라인 보상, 보스 1종
- Cycle 02 (Social):
  - 친구 코드, 주간 랭킹 보드, 배지 카드 생성
- Cycle 03 (Monetization):
  - 코스메틱 상점, 시즌 패스 기본 구조

## Tech Direction (MVP)

- Frontend: Web (Canvas or lightweight DOM UI)
- Backend: 간단한 API + 저장소(초기엔 mock/local 가능)
- Analytics: 이벤트 로깅 최소 세트 (D1 Retention, Session Length, Conversion Funnel)

## KPI Draft

- D1 잔존율: 30%+
- D7 잔존율: 10%+
- 첫 주 공유율(배지 카드): 20%+
- 결제 전환율(초기): 1.5%+

## Open Decisions

1. 타깃 플랫폼 우선순위: 모바일 웹 vs PC 웹
2. 그래픽 스타일: 픽셀풍 vs 일러스트풍
3. 세계관 톤: 가벼운 판타지 vs 다크 판타지
