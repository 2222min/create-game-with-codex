# Boss Forge Odyssey - Production Roadmap v2

## Product Direction (요약)

- Genre: Boss-centric hack-and-slash RPG with equipment summoning and forging.
- Core loop:
  1. Home -> Stage Map (stepping-stone progression)
  2. Enter boss battle
  3. Control actions (Attack/Guard/Dodge)
  4. Earn resources
  5. Summon equipment
  6. Upgrade forged weapon
  7. Retry higher stage

## Why this design

- Request-aligned structure:
  - Stage bridge progression visually clear
  - Boss-focused progression
  - Forge and summon are separate menus from Home
  - Player agency in battle through explicit combat controls

## Difficulty Design Recommendations (Requirement #7)

### 1) Boss tuning by equipment readiness

- Readiness score = equipped sword power + total forged levels + recent clear rate.
- Adjust stage boss HP/attack within a safe range (e.g., +/- 12%) to avoid hard wall frustration.

### 2) Pattern readability first

- Maintain minimum telegraph window (>= 650ms early stages).
- Increase complexity by pattern combinations, not by unreadable speed spikes.

### 3) Anti-stall systems

- If player fails same stage 3 times:
  - grant temporary guard strength buff OR
  - discounted forge cost for one attempt.

### 4) Summon economy pacing

- Guarantee meaningful progression every session:
  - pity counter for Rare+ rarity
  - daily summon stone inflow target tied to average session length.

### 5) Combat depth ladder

- Stage tiers:
  - 1-10: single patterns
  - 11-25: pattern chains
  - 26+: phase transitions + enrage mechanics

## Live Service / Monetization Guardrails

- Avoid paywalling core clears.
- Monetize convenience and acceleration, not mandatory power gates.
- Keep F2P path viable with predictable weekly growth.

## Store Release Plan (Requirement #5)

### Shared code strategy

- Preferred stack: Web-first gameplay core + cross-platform wrapper.
- Option A (recommended): Phaser/Canvas core + React Native wrapper (WebView or shared rendering approach)
- Option B: Unity project for full native parity (higher upfront cost)

### Android (Google Play)

- Build wrapper app (React Native/Capacitor/Flutter WebView strategy).
- Integrate:
  - Google Play Billing
  - Google Play Games Services (optional)
  - Firebase Analytics + Crashlytics
- Prepare policy checklist:
  - lootbox probability disclosure
  - data safety form
  - age rating

### iOS (App Store)

- Build iOS wrapper with same gameplay core.
- Integrate:
  - StoreKit 2
  - App Tracking transparency flow if ad SDK used
  - Apple Sign-In optional
- Prepare App Store review docs:
  - IAP product metadata
  - account deletion policy if account system added

### Release milestones

1. Closed alpha (TestFlight + Internal testing)
2. Soft launch (1-2 regions)
3. KPI gate check (D1, D7, ARPDAU, clear funnel)
4. Global rollout

## Art / Image Production Plan (Requirement #8)

- Current assets are temporary SVG placeholders.
- Replace in phases:
  1. Character set (idle, hit, attack, guard, dodge)
  2. Boss set (each boss silhouette + pattern VFX telegraph)
  3. Weapon icons by rarity and class
  4. UI skin atlas (buttons, frames, bars)

### Free/low-cost pipeline recommendation

- Concept: manually directed prompt generation + paintover
- Final game-ready:
  - normalize style guide
  - export sprite sheets with naming convention
  - compress with texture atlas tooling

