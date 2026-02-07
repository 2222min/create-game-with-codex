# Boss Forge Odyssey - Asset Production Pipeline v1

## Milestone Goal

- 7일 안에 프로토타입 임시 SVG를 교체할 수 있는 실사용 아트 1세트를 확보한다.
- 대상: 캐릭터 1종, 보스 3종, 검 아이콘 5등급, UI 프레임/버튼 세트.

## Recommended Toolchain

1. 컨셉 시안(빠른 탐색)
- Leonardo AI: 캐릭터/보스 스타일 방향 잡기
- Adobe Firefly: 배경/이펙트 보조 시안

2. 수작업 보정/정리
- Photopea: 배경 제거, 색보정, 레이어 정리
- Krita: 최종 페인팅 보정

3. 게임용 최적화
- TexturePacker(또는 수동 스프라이트시트)
- TinyPNG/Squoosh로 PNG 최적화

## Backlog (7-Day)

1. Day 1: 스타일 가이드 고정
- 작업: 캐릭터/보스/무기 무드보드 1판
- 산출물: `style-guide-v1.png`

2. Day 2-3: 캐릭터/보스 시안
- 작업: 캐릭터 1종, 보스 3종 PNG 투명 배경
- 산출물: idle 기준 단일 프레임

3. Day 4: 무기 아이콘 5등급
- 작업: Common~Legendary 검 아이콘
- 산출물: 128x128 PNG 세트

4. Day 5: UI 스킨
- 작업: 패널/버튼/게이지 텍스처
- 산출물: 9-slice 가능 PNG

5. Day 6: 애니메이션 최소 세트
- 작업: 영웅(attack/guard/dodge/hit), 보스(idle/attack)
- 산출물: 스프라이트시트 JSON + PNG

6. Day 7: 통합 테스트
- 작업: 웹 런타임 교체 적용
- 산출물: 통합 스크린샷 + 라이선스 문서

## Asset Request Rule

### 1) Needed Asset
- Hero sprite set (idle/attack/guard/dodge/hit)
- Boss sprite set x3 (idle/attack/hit)
- Sword icons x5 rarity
- UI frame/button/bar textures

### 2) Recommended Source
- Free-first:
  - Kenney: https://www.kenney.nl/assets
  - itch.io free assets: https://itch.io/game-assets/free
  - OpenGameArt: https://opengameart.org/
- AI draft:
  - Leonardo AI: https://leonardo.ai/
  - Adobe Firefly: https://firefly.adobe.com/

### 3) License Type
- 우선순위: CC0 / 상업 이용 가능 / 출처 표기 조건 명확
- 금지: 상업 이용 불가, 재배포 금지, 라이선스 불명확 파일

### 4) Target Folder
- `/Users/finda0603/Desktop/create-game-with-codex/projects/rpg-idle-brag/web/assets/characters`
- `/Users/finda0603/Desktop/create-game-with-codex/projects/rpg-idle-brag/web/assets/bosses`
- `/Users/finda0603/Desktop/create-game-with-codex/projects/rpg-idle-brag/web/assets/weapons`
- `/Users/finda0603/Desktop/create-game-with-codex/projects/rpg-idle-brag/web/assets/ui`

### 5) File Naming Rule
- 캐릭터: `hero_knight_<action>_<frame>.png`
- 보스: `boss_<name>_<action>_<frame>.png`
- 무기: `weapon_sword_<rarity>_<index>.png`
- UI: `ui_<group>_<state>_<size>.png`

## Integration Spec

1. Dimensions / Format
- 캐릭터: 512x512 PNG (투명 배경)
- 보스: 768x768 PNG (투명 배경)
- 무기 아이콘: 128x128 PNG
- UI 프레임: 9-slice 대응 PNG (권장 256x256 이상)

2. Pivot / Scale
- 캐릭터 pivot: 발 중앙
- 보스 pivot: 하단 중앙
- 무기 pivot: 중앙
- 게임 내 기본 스케일: 1.0에서 시작 후 코드에서 조절

3. Animation Frame Data
- hero: idle 6f / attack 8f / guard 4f / dodge 6f / hit 4f
- boss: idle 8f / attack 10f / hit 4f
- JSON 규칙: `{"name":"...","fps":12,"frames":[...]}`

4. Compression Notes
- UI 텍스트가 있는 PNG는 과압축 금지
- 캐릭터/보스만 선택적으로 TinyPNG 적용

## Prompt Templates (AI Draft)

### Hero
"stylized fantasy knight, chibi proportions, clean silhouette, mobile RPG UI friendly, transparent background, front view, high readability, no text, no watermark"

### Boss
"forest ogre boss, intimidating but readable, strong silhouette, mobile action RPG, transparent background, front 3/4 view, no text, no watermark"

### Sword Icon
"fantasy sword icon, rarity-based color coding, centered composition, game UI icon style, transparent background"

## Acceptance Criteria

- 스테이지맵/전투/강화/소환 화면에서 임시 SVG 대신 신규 PNG가 노출된다.
- 보스전 가독성(공격/방어/회피 버튼 및 패턴 텍스트)이 유지된다.
- 라이선스 문서(`license-log-v1.md`)에 출처/조건이 기록된다.

## Risks and Mitigation

- Risk: 스타일 불일치
- Mitigation: Day1 스타일가이드 승인 후 제작 시작

- Risk: 라이선스 문제
- Mitigation: 다운로드 시점에 license 스크린샷/링크 같이 저장

- Risk: 용량 과다
- Mitigation: 도입 전 PNG 용량 제한(아이콘 200KB 이하, 캐릭터 600KB 이하)

## Decision Status

- Art Style: **세미리얼 (확정)**
- UI Tone: **골드-다크 유지 (확정)**
- Reference lock doc: `/Users/finda0603/Desktop/create-game-with-codex/projects/rpg-idle-brag/docs/asset-style-lock-v1.md`
- Prompt pack doc: `/Users/finda0603/Desktop/create-game-with-codex/projects/rpg-idle-brag/docs/asset-prompt-pack-semireal-v1.md`
