export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const RARITIES = [
  { id: "common", label: "Common", weight: 62, color: "#d5d7df", baseAttack: 12 },
  { id: "uncommon", label: "Uncommon", weight: 24, color: "#8ddc85", baseAttack: 17 },
  { id: "rare", label: "Rare", weight: 10, color: "#6ea8ff", baseAttack: 24 },
  { id: "epic", label: "Epic", weight: 3.2, color: "#b27cff", baseAttack: 34 },
  { id: "legendary", label: "Legendary", weight: 0.8, color: "#ffb45f", baseAttack: 48 },
];

export function createSword(id, rarityId, level = 1) {
  const rarity = RARITIES.find((item) => item.id === rarityId) ?? RARITIES[0];
  return {
    id,
    rarity: rarity.id,
    rarityLabel: rarity.label,
    color: rarity.color,
    level,
    baseAttack: rarity.baseAttack,
    name: `${rarity.label} Blade`,
  };
}

export function getSwordPower(sword) {
  return Math.floor(sword.baseAttack * (1 + (sword.level - 1) * 0.16));
}

export function getUpgradeCost(sword) {
  const rarityScale = {
    common: 1,
    uncommon: 1.2,
    rare: 1.5,
    epic: 1.9,
    legendary: 2.4,
  };
  const scale = rarityScale[sword.rarity] ?? 1;
  return Math.floor(75 * scale * Math.pow(1.18, sword.level));
}

export function getUpgradeSuccessRate(sword) {
  const rarityPenalty = {
    common: 0.0,
    uncommon: 0.03,
    rare: 0.07,
    epic: 0.12,
    legendary: 0.16,
  };
  const penalty = rarityPenalty[sword.rarity] ?? 0;
  return clamp(0.9 - sword.level * 0.042 - penalty, 0.18, 0.9);
}

export function getSummonCost(times) {
  return {
    summonStone: times === 10 ? 9 : 1,
    gold: times === 10 ? 900 : 130,
  };
}

export function createBossForStage(stage) {
  const namePool = [
    "Forest Crusher",
    "Iron Boar King",
    "Storm Minotaur",
  ];
  const name = namePool[(stage - 1) % namePool.length];
  const hp = Math.floor(520 + stage * 210);
  const attack = Math.floor(24 + stage * 4.4);
  return {
    stage,
    name,
    maxHp: hp,
    hp,
    attack,
    attackIntervalMs: Math.max(950, 2200 - stage * 45),
    rewardGold: 170 + stage * 50,
    rewardSummonStone: 1 + Math.floor(stage / 3),
    rewardGems: stage % 5 === 0 ? 8 : 0,
    patterns: ["slash", "slam", "charge"],
  };
}

export function createInitialGameState() {
  const starterSword = createSword(1, "common", 1);
  return {
    mode: "home",
    bounds: { width: GAME_WIDTH, height: GAME_HEIGHT },
    elapsedMs: 0,
    resources: {
      gold: 1500,
      gems: 60,
      summonStone: 14,
    },
    hero: {
      hp: 260,
      maxHp: 260,
      baseAttack: 20,
      guardWindowMs: 0,
      guardCooldownMs: 0,
      dodgeWindowMs: 0,
      dodgeCooldownMs: 0,
      attackCooldownMs: 0,
      comboCount: 0,
      lastAction: "idle",
      actionTtlMs: 0,
    },
    equipment: {
      nextSwordId: 2,
      swords: [starterSword],
      equippedSwordId: starterSword.id,
      lastSummonResults: [],
      lastUpgradeResult: "none",
    },
    progression: {
      currentStage: 1,
      selectedStage: 1,
      highestClearedStage: 0,
      totalBossKills: 0,
    },
    battle: {
      phase: "idle",
      boss: null,
      nextPatternIndex: 0,
      bossAttackTimerMs: 0,
      telegraphMs: 0,
      pendingPattern: null,
      lastOutcome: "none",
      floatingText: "",
      floatingTextTtlMs: 0,
      cameraShakeMs: 0,
    },
    ui: {
      notice: "홈에서 메뉴를 선택하세요: 스테이지맵 / 강화 / 소환",
      noticeTtlMs: 3000,
      selectedMenu: "home",
    },
  };
}
