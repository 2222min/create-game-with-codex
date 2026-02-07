## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file.

### Available skills
- game-architect-lead: 10년차 수석 개발자 역할. TDD, 함수형 스타일, SOLID 기반으로 아키텍처를 설계한다. (file: /Users/finda0603/Desktop/create-game-with-codex/skills/game-architect-lead/SKILL.md)
- game-implementer-elite: 5년차 엘리트 개발자 역할. 설계된 아키텍처를 고정밀로 구현한다. (file: /Users/finda0603/Desktop/create-game-with-codex/skills/game-implementer-elite/SKILL.md)
- game-critical-reviewer: 반박/피드백 전담 개발자 역할. 설계와 코드를 비판적으로 리뷰한다. (file: /Users/finda0603/Desktop/create-game-with-codex/skills/game-critical-reviewer/SKILL.md)
- game-asset-designer: 게임 이미지/비주얼 자산 담당 디자이너 역할. 무료 리소스 우선 전략을 사용한다. (file: /Users/finda0603/Desktop/create-game-with-codex/skills/game-asset-designer/SKILL.md)
- game-product-planner: 개발/디자인 협업 계획과 일정, 스코프 관리를 담당한다. (file: /Users/finda0603/Desktop/create-game-with-codex/skills/game-product-planner/SKILL.md)
- game-market-skeptic: 상품성/시장성 관점에서 지속적으로 의심하고 검증 실험을 제안한다. (file: /Users/finda0603/Desktop/create-game-with-codex/skills/game-market-skeptic/SKILL.md)
- game-studio-factory: 수익화 가능한 게임을 다작하기 위한 공통 모듈(결제/경제/소셜/분석/라이브옵스) 재사용 체계를 적용한다. (file: /Users/finda0603/Desktop/create-game-with-codex/skills/game-studio-factory/SKILL.md)
- develop-web-game: 웹 게임 구현/검증 루프(Playwright 기반) 수행. (file: /Users/finda0603/.codex/skills/develop-web-game/SKILL.md)

### How to use skills
- Trigger rules: 사용자가 스킬명을 언급하거나 요청이 역할 설명과 명확히 일치하면 해당 스킬을 사용한다.
- Multi-skill sequencing: 신작 시작 시 기본 순서는 `game-studio-factory -> game-product-planner -> game-market-skeptic -> game-architect-lead -> game-implementer-elite -> game-critical-reviewer -> game-asset-designer` 이다.
- Testing loop: 실제 게임 코드 변경이 있을 때는 `develop-web-game` 테스트 루프를 반드시 수행한다.
- Resource policy: 외부 무료 리소스가 필요하면 사용자에게 요청하고 `assets/free-resources/inbox` 경로를 지정한다.
