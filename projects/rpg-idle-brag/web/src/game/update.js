import {
  clamp,
  createBossForStage,
  createInitialGameState,
  createSword,
  getSummonCost,
  getSwordPower,
  getUpgradeCost,
  getUpgradeSuccessRate,
  RARITIES,
} from "./state.js";

const ATTACK_COOLDOWN_MS = 360;
const GUARD_WINDOW_MS = 520;
const GUARD_COOLDOWN_MS = 1350;
const DODGE_WINDOW_MS = 280;
const DODGE_COOLDOWN_MS = 1650;
const PATTERN_TELEGRAPH_MS = 820;

function cloneState(state) {
  return {
    ...state,
    resources: { ...state.resources },
    hero: { ...state.hero },
    equipment: {
      ...state.equipment,
      swords: state.equipment.swords.map((sword) => ({ ...sword })),
      lastSummonResults: [...state.equipment.lastSummonResults],
    },
    progression: { ...state.progression },
    battle: {
      ...state.battle,
      boss: state.battle.boss ? { ...state.battle.boss, patterns: [...state.battle.boss.patterns] } : null,
    },
    ui: { ...state.ui },
  };
}

function setNotice(state, text, ttlMs = 1700) {
  state.ui.notice = text;
  state.ui.noticeTtlMs = ttlMs;
}

function getEquippedSword(state) {
  return state.equipment.swords.find((sword) => sword.id === state.equipment.equippedSwordId) ?? state.equipment.swords[0];
}

function getHeroAttackPower(state) {
  return state.hero.baseAttack + getSwordPower(getEquippedSword(state));
}

function chooseRarity(rng) {
  const totalWeight = RARITIES.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * totalWeight;
  for (const rarity of RARITIES) {
    roll -= rarity.weight;
    if (roll <= 0) return rarity;
  }
  return RARITIES[0];
}

function startBattle(state) {
  const stage = state.progression.selectedStage;
  state.mode = "battle";
  state.ui.selectedMenu = "battle";
  state.hero.hp = state.hero.maxHp;
  state.hero.comboCount = 0;
  state.hero.guardWindowMs = 0;
  state.hero.dodgeWindowMs = 0;
  state.hero.guardCooldownMs = 0;
  state.hero.dodgeCooldownMs = 0;
  state.hero.attackCooldownMs = 0;
  state.hero.lastAction = "idle";
  state.hero.actionTtlMs = 0;
  state.battle.phase = "fighting";
  state.battle.boss = createBossForStage(stage);
  state.battle.nextPatternIndex = 0;
  state.battle.bossAttackTimerMs = state.battle.boss.attackIntervalMs * 0.8;
  state.battle.telegraphMs = 0;
  state.battle.pendingPattern = null;
  state.battle.lastOutcome = "none";
  state.battle.floatingText = "BOSS BATTLE START";
  state.battle.floatingTextTtlMs = 900;
  setNotice(state, `Stage ${stage} 보스전 시작`, 1200);
}

function goToHome(state) {
  state.mode = "home";
  state.ui.selectedMenu = "home";
  setNotice(state, "홈: 맵/강화/소환 메뉴를 선택하세요", 1600);
}

function goToStageMap(state) {
  state.mode = "stageMap";
  state.ui.selectedMenu = "stageMap";
  setNotice(state, "돌다리 맵에서 다음 스테이지를 선택하세요", 1500);
}

function goToForge(state) {
  state.mode = "forge";
  state.ui.selectedMenu = "forge";
  const sword = getEquippedSword(state);
  const cost = getUpgradeCost(sword);
  setNotice(state, `${sword.name} 강화 준비 (비용 ${cost}G)`, 1500);
}

function goToSummon(state) {
  state.mode = "summon";
  state.ui.selectedMenu = "summon";
  setNotice(state, "장비 소환: 1회(1번), 10회(0번)", 1500);
}

function moveStageSelection(state, delta) {
  const maxReach = Math.max(1, state.progression.highestClearedStage + 1);
  state.progression.selectedStage = clamp(state.progression.selectedStage + delta, 1, maxReach);
  setNotice(state, `선택 스테이지: ${state.progression.selectedStage}`, 900);
}

function equipNextSword(state) {
  if (state.equipment.swords.length <= 1) return;
  const ids = state.equipment.swords.map((sword) => sword.id);
  const currentIndex = ids.indexOf(state.equipment.equippedSwordId);
  const nextIndex = (currentIndex + 1) % ids.length;
  state.equipment.equippedSwordId = ids[nextIndex];
  const sword = getEquippedSword(state);
  setNotice(state, `장착: ${sword.name} +${sword.level}`, 1200);
}

function tryUpgradeEquippedSword(state, rng) {
  const sword = getEquippedSword(state);
  const cost = getUpgradeCost(sword);
  if (state.resources.gold < cost) {
    setNotice(state, `골드 부족: ${cost}G 필요`, 1200);
    state.equipment.lastUpgradeResult = "insufficient";
    return;
  }
  state.resources.gold -= cost;
  const successRate = getUpgradeSuccessRate(sword);
  if (rng() <= successRate) {
    sword.level += 1;
    state.equipment.lastUpgradeResult = "success";
    setNotice(state, `강화 성공! ${sword.name} +${sword.level}`, 1300);
  } else {
    state.equipment.lastUpgradeResult = "fail";
    setNotice(state, "강화 실패... 재도전하세요", 1300);
  }
}

function runSummon(state, count, rng) {
  const cost = getSummonCost(count);
  if (state.resources.summonStone < cost.summonStone || state.resources.gold < cost.gold) {
    setNotice(state, `재화 부족: ${cost.summonStone}석 / ${cost.gold}G 필요`, 1200);
    return;
  }

  state.resources.summonStone -= cost.summonStone;
  state.resources.gold -= cost.gold;
  state.equipment.lastSummonResults = [];

  for (let i = 0; i < count; i += 1) {
    const rarity = chooseRarity(rng);
    const sword = createSword(state.equipment.nextSwordId, rarity.id, 1);
    state.equipment.nextSwordId += 1;
    state.equipment.swords.push(sword);
    state.equipment.lastSummonResults.push(sword.rarityLabel);
  }

  const bestSword = [...state.equipment.swords].sort((a, b) => getSwordPower(b) - getSwordPower(a))[0];
  state.equipment.equippedSwordId = bestSword.id;

  const summary = state.equipment.lastSummonResults.slice(0, 4).join(", ");
  setNotice(state, `${count}회 소환 완료 (${summary}${state.equipment.lastSummonResults.length > 4 ? "..." : ""})`, 1700);
}

function resolveBossPatternHit(state) {
  if (!state.battle.boss || !state.battle.pendingPattern) return;

  const pattern = state.battle.pendingPattern;
  let damage = state.battle.boss.attack;
  if (pattern === "slam") damage = Math.floor(damage * 1.2);
  if (pattern === "charge") damage = Math.floor(damage * 0.9);

  let outcome = "hit";
  if (state.hero.dodgeWindowMs > 0) {
    damage = 0;
    outcome = "dodge";
    state.hero.comboCount += 1;
    state.hero.lastAction = "dodge";
    state.hero.actionTtlMs = 260;
  } else if (state.hero.guardWindowMs > 0) {
    damage = Math.floor(damage * 0.28);
    outcome = "guard";
    state.hero.comboCount += 1;
    state.hero.lastAction = "guard";
    state.hero.actionTtlMs = 260;
  } else {
    state.hero.comboCount = 0;
    state.hero.lastAction = "hit";
    state.hero.actionTtlMs = 340;
  }

  state.hero.hp = Math.max(0, state.hero.hp - damage);
  state.battle.floatingText =
    outcome === "dodge" ? "DODGE" : outcome === "guard" ? `GUARD ${damage}` : `HIT ${damage}`;
  state.battle.floatingTextTtlMs = 540;
  state.battle.cameraShakeMs = outcome === "hit" ? 150 : 0;

  if (state.hero.hp <= 0) {
    state.battle.phase = "defeat";
    state.battle.lastOutcome = "defeat";
    setNotice(state, "보스에게 패배! 홈으로 돌아가 장비를 강화하세요", 1800);
  }
}

function clearStage(state) {
  if (!state.battle.boss) return;
  const stage = state.battle.boss.stage;
  const rewardGold = state.battle.boss.rewardGold;
  const rewardStone = state.battle.boss.rewardSummonStone;
  const rewardGems = state.battle.boss.rewardGems;

  state.resources.gold += rewardGold;
  state.resources.summonStone += rewardStone;
  state.resources.gems += rewardGems;
  state.progression.highestClearedStage = Math.max(state.progression.highestClearedStage, stage);
  state.progression.currentStage = state.progression.highestClearedStage + 1;
  state.progression.selectedStage = state.progression.currentStage;
  state.progression.totalBossKills += 1;

  state.battle.phase = "victory";
  state.battle.lastOutcome = "victory";
  state.battle.floatingText = "BOSS DOWN";
  state.battle.floatingTextTtlMs = 900;
  setNotice(state, `Stage ${stage} 클리어! +${rewardGold}G +${rewardStone}석`, 2000);
}

function updateBattle(state, input, dtMs) {
  if (!state.battle.boss || state.battle.phase !== "fighting") return;

  state.hero.attackCooldownMs = Math.max(0, state.hero.attackCooldownMs - dtMs);
  state.hero.guardWindowMs = Math.max(0, state.hero.guardWindowMs - dtMs);
  state.hero.guardCooldownMs = Math.max(0, state.hero.guardCooldownMs - dtMs);
  state.hero.dodgeWindowMs = Math.max(0, state.hero.dodgeWindowMs - dtMs);
  state.hero.dodgeCooldownMs = Math.max(0, state.hero.dodgeCooldownMs - dtMs);
  state.hero.actionTtlMs = Math.max(0, state.hero.actionTtlMs - dtMs);
  if (state.hero.actionTtlMs === 0 && state.hero.lastAction !== "idle") {
    state.hero.lastAction = "idle";
  }

  if (state.battle.floatingTextTtlMs > 0) {
    state.battle.floatingTextTtlMs = Math.max(0, state.battle.floatingTextTtlMs - dtMs);
  }
  state.battle.cameraShakeMs = Math.max(0, state.battle.cameraShakeMs - dtMs);

  if (input.guard && state.hero.guardCooldownMs <= 0) {
    state.hero.guardWindowMs = GUARD_WINDOW_MS;
    state.hero.guardCooldownMs = GUARD_COOLDOWN_MS;
    state.hero.lastAction = "guard";
    state.hero.actionTtlMs = 360;
    state.battle.floatingText = "GUARD READY";
    state.battle.floatingTextTtlMs = 300;
  }

  if (input.dodge && state.hero.dodgeCooldownMs <= 0) {
    state.hero.dodgeWindowMs = DODGE_WINDOW_MS;
    state.hero.dodgeCooldownMs = DODGE_COOLDOWN_MS;
    state.hero.lastAction = "dodge";
    state.hero.actionTtlMs = 320;
    state.battle.floatingText = "DODGE";
    state.battle.floatingTextTtlMs = 300;
  }

  if (input.attack && state.hero.attackCooldownMs <= 0) {
    const comboBonus = 1 + Math.min(0.45, state.hero.comboCount * 0.06);
    const damage = Math.floor(getHeroAttackPower(state) * comboBonus);
    state.battle.boss.hp = Math.max(0, state.battle.boss.hp - damage);
    state.hero.attackCooldownMs = ATTACK_COOLDOWN_MS;
    state.hero.lastAction = "attack";
    state.hero.actionTtlMs = 260;
    state.battle.floatingText = `-${damage}`;
    state.battle.floatingTextTtlMs = 360;

    if (state.battle.boss.hp <= 0) {
      clearStage(state);
      return;
    }
  }

  if (state.battle.telegraphMs > 0) {
    state.battle.telegraphMs = Math.max(0, state.battle.telegraphMs - dtMs);
    if (state.battle.telegraphMs === 0) {
      resolveBossPatternHit(state);
      if (state.battle.phase === "fighting") {
        state.battle.pendingPattern = null;
        state.battle.bossAttackTimerMs = state.battle.boss.attackIntervalMs;
      }
    }
    return;
  }

  state.battle.bossAttackTimerMs -= dtMs;
  if (state.battle.bossAttackTimerMs <= 0) {
    const pattern = state.battle.boss.patterns[state.battle.nextPatternIndex % state.battle.boss.patterns.length];
    state.battle.nextPatternIndex += 1;
    state.battle.pendingPattern = pattern;
    state.battle.telegraphMs = PATTERN_TELEGRAPH_MS;
    state.battle.floatingText = `${pattern.toUpperCase()}!`;
    state.battle.floatingTextTtlMs = 520;
  }
}

function updateNotice(state, dtMs) {
  state.ui.noticeTtlMs = Math.max(0, state.ui.noticeTtlMs - dtMs);
  if (state.ui.noticeTtlMs === 0) state.ui.notice = "";
}

function updateModeByInput(state, input) {
  const inCombat = state.mode === "battle" && state.battle.phase === "fighting";
  if (input.openHome && !inCombat) {
    goToHome(state);
  } else if (input.openStageMap && !inCombat) {
    goToStageMap(state);
  } else if (input.openForge && !inCombat) {
    goToForge(state);
  } else if (input.openSummon && !inCombat) {
    goToSummon(state);
  }
}

function handleScreenActions(state, input, rng) {
  if (state.mode === "stageMap") {
    if (input.previousStage) moveStageSelection(state, -1);
    if (input.nextStage) moveStageSelection(state, 1);
    if (input.startBattle) startBattle(state);
    return;
  }

  if (state.mode === "forge") {
    if (input.upgradeSword) tryUpgradeEquippedSword(state, rng);
    if (input.equipNext) equipNextSword(state);
    return;
  }

  if (state.mode === "summon") {
    if (input.summonOne) runSummon(state, 1, rng);
    if (input.summonTen) runSummon(state, 10, rng);
    if (input.equipNext) equipNextSword(state);
    return;
  }

  if (state.mode === "home") {
    if (input.startBattle) {
      goToStageMap(state);
    }
    if (input.equipNext) equipNextSword(state);
  }
}

export function updateGame(state, input, dtMs, rng = Math.random) {
  const next = cloneState(state);
  next.elapsedMs += dtMs;

  updateModeByInput(next, input);

  if (next.mode === "battle") {
    if (next.battle.phase === "victory" && (input.startBattle || input.openStageMap)) {
      goToStageMap(next);
    } else if (next.battle.phase === "defeat" && (input.startBattle || input.openHome)) {
      goToHome(next);
    } else {
      updateBattle(next, input, dtMs);
    }
  } else {
    handleScreenActions(next, input, rng);
  }

  updateNotice(next, dtMs);
  return next;
}

export function getUiSnapshot(state) {
  const equippedSword = getEquippedSword(state);
  return {
    mode: state.mode,
    currentStage: state.progression.currentStage,
    selectedStage: state.progression.selectedStage,
    highestClearedStage: state.progression.highestClearedStage,
    gold: state.resources.gold,
    gems: state.resources.gems,
    summonStone: state.resources.summonStone,
    totalBossKills: state.progression.totalBossKills,
    heroAttack: getHeroAttackPower(state),
    heroAction: state.hero.lastAction,
    equippedSword: {
      id: equippedSword.id,
      name: equippedSword.name,
      rarity: equippedSword.rarityLabel,
      level: equippedSword.level,
      power: getSwordPower(equippedSword),
      upgradeCost: getUpgradeCost(equippedSword),
      upgradeSuccessRate: getUpgradeSuccessRate(equippedSword),
    },
    inventoryCount: state.equipment.swords.length,
    lastSummonResults: [...state.equipment.lastSummonResults],
    boss: state.battle.boss
      ? {
          name: state.battle.boss.name,
          hp: state.battle.boss.hp,
          maxHp: state.battle.boss.maxHp,
          stage: state.battle.boss.stage,
          pendingPattern: state.battle.pendingPattern,
          telegraphMs: state.battle.telegraphMs,
        }
      : null,
  };
}

export function resetGameForTest() {
  return createInitialGameState();
}
