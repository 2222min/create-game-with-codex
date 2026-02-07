import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../src/game/state.js";
import { updateGame } from "../src/game/update.js";

function idleInput() {
  return {
    openHome: false,
    openStageMap: false,
    openForge: false,
    openSummon: false,
    startBattle: false,
    attack: false,
    guard: false,
    dodge: false,
    upgradeSword: false,
    summonOne: false,
    summonTen: false,
    equipNext: false,
    previousStage: false,
    nextStage: false,
  };
}

test("home to stage map navigation", () => {
  const start = createInitialGameState();
  const next = updateGame(
    start,
    {
      ...idleInput(),
      openStageMap: true,
    },
    16
  );

  assert.equal(next.mode, "stageMap");
});

test("stage map can start boss battle", () => {
  const start = createInitialGameState();
  const map = updateGame(
    start,
    {
      ...idleInput(),
      openStageMap: true,
    },
    16
  );

  const battle = updateGame(
    map,
    {
      ...idleInput(),
      startBattle: true,
    },
    16
  );

  assert.equal(battle.mode, "battle");
  assert.equal(battle.battle.phase, "fighting");
  assert.ok(battle.battle.boss);
  assert.equal(battle.battle.boss?.stage, 1);
});

test("victory clears stage and unlocks next stepping stone", () => {
  const start = createInitialGameState();
  let state = updateGame(start, { ...idleInput(), openStageMap: true }, 16);
  state = updateGame(state, { ...idleInput(), startBattle: true }, 16);

  state.hero.baseAttack = 99999;
  const won = updateGame(
    state,
    {
      ...idleInput(),
      attack: true,
    },
    16
  );

  assert.equal(won.battle.phase, "victory");
  assert.equal(won.progression.highestClearedStage, 1);
  assert.equal(won.progression.currentStage, 2);
  assert.equal(won.progression.selectedStage, 2);

  const backToMap = updateGame(
    won,
    {
      ...idleInput(),
      startBattle: true,
    },
    16
  );
  assert.equal(backToMap.mode, "stageMap");
});

test("guard reduces incoming boss damage", () => {
  const start = createInitialGameState();
  let base = updateGame(start, { ...idleInput(), openStageMap: true }, 16);
  base = updateGame(base, { ...idleInput(), startBattle: true }, 16);

  const noGuard = structuredClone(base);
  noGuard.battle.telegraphMs = 1;
  noGuard.battle.pendingPattern = "slash";
  const hit = updateGame(noGuard, idleInput(), 16);

  const withGuard = structuredClone(base);
  withGuard.battle.telegraphMs = 1;
  withGuard.battle.pendingPattern = "slash";
  const blocked = updateGame(
    withGuard,
    {
      ...idleInput(),
      guard: true,
    },
    16
  );

  const damageWithoutGuard = noGuard.hero.maxHp - hit.hero.hp;
  const damageWithGuard = withGuard.hero.maxHp - blocked.hero.hp;

  assert.ok(damageWithGuard < damageWithoutGuard);
});

test("forge upgrade increases equipped sword level on success", () => {
  const start = createInitialGameState();
  const forge = updateGame(
    start,
    {
      ...idleInput(),
      openForge: true,
    },
    16
  );

  const beforeLevel = forge.equipment.swords[0].level;
  const after = updateGame(
    forge,
    {
      ...idleInput(),
      upgradeSword: true,
    },
    16,
    () => 0.01
  );

  assert.equal(after.equipment.swords[0].level, beforeLevel + 1);
  assert.equal(after.equipment.lastUpgradeResult, "success");
});

test("summon adds sword inventory and spends resources", () => {
  const start = createInitialGameState();
  const summon = updateGame(
    start,
    {
      ...idleInput(),
      openSummon: true,
    },
    16
  );

  const beforeCount = summon.equipment.swords.length;
  const beforeGold = summon.resources.gold;
  const beforeStone = summon.resources.summonStone;

  const after = updateGame(
    summon,
    {
      ...idleInput(),
      summonOne: true,
    },
    16,
    () => 0.99
  );

  assert.equal(after.equipment.swords.length, beforeCount + 1);
  assert.ok(after.resources.gold < beforeGold);
  assert.ok(after.resources.summonStone < beforeStone);
  assert.ok(after.equipment.lastSummonResults.length >= 1);
});

test("cannot leave battle to forge while actively fighting", () => {
  const start = createInitialGameState();
  let state = updateGame(start, { ...idleInput(), openStageMap: true }, 16);
  state = updateGame(state, { ...idleInput(), startBattle: true }, 16);

  const next = updateGame(
    state,
    {
      ...idleInput(),
      openForge: true,
    },
    16
  );

  assert.equal(next.mode, "battle");
  assert.equal(next.battle.phase, "fighting");
});
