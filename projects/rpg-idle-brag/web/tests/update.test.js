import assert from "node:assert/strict";
import test from "node:test";

import { createInitialGameState, getSwordEnhanceSuccessRate } from "../src/game/state.js";
import { getUiSnapshot, updateGame } from "../src/game/update.js";

function emptyInput() {
  return {
    start: false,
    restart: false,
    enhanceSword: false,
    checkoutOrConvenience: false,
    claimChest: false,
    submitScore: false,
    generateBragCard: false,
  };
}

function startGame() {
  return updateGame(
    createInitialGameState(),
    {
      ...emptyInput(),
      start: true,
    },
    16,
    () => 0.5
  );
}

test("start input transitions mode to playing", () => {
  const next = startGame();
  assert.equal(next.mode, "playing");
  assert.ok(next.analytics.acceptedEvents.some((event) => event.eventName === "session_start"));
});

test("sword enhancement success increases sword level and attack", () => {
  const state = startGame();
  state.wallet.balances.soft = 10000;

  const next = updateGame(
    state,
    {
      ...emptyInput(),
      enhanceSword: true,
    },
    16,
    () => 0.01
  );

  assert.equal(next.sword.level, 1);
  assert.equal(next.sword.lastResult, "success");
  assert.ok(next.hero.attack > state.hero.attack);
  assert.ok(next.sword.effectTtlMs > 0);
});

test("sword enhancement fail consumes gold but keeps level", () => {
  const state = startGame();
  state.wallet.balances.soft = 10000;
  state.sword.level = 20;
  state.sword.tier = "Legend";

  const before = getUiSnapshot(state);
  const next = updateGame(
    state,
    {
      ...emptyInput(),
      enhanceSword: true,
    },
    16,
    () => 0.99
  );
  const after = getUiSnapshot(next);

  assert.equal(next.sword.level, 20);
  assert.equal(next.sword.lastResult, "fail");
  assert.ok(after.gold < before.gold);
});

test("sword success rate decreases as level rises", () => {
  assert.ok(getSwordEnhanceSuccessRate(0) > getSwordEnhanceSuccessRate(10));
  assert.ok(getSwordEnhanceSuccessRate(10) > getSwordEnhanceSuccessRate(20));
});

test("defeating enemy grants rewards and advances stage", () => {
  const state = startGame();
  state.enemy.hp = 1;
  state.enemy.maxHp = 1;
  state.hero.attack = 999;
  state.hero.attackCooldownMs = 0;

  const before = getUiSnapshot(state);
  const next = updateGame(state, emptyInput(), 16, () => 0.5);
  const after = getUiSnapshot(next);

  assert.equal(next.progression.stage, 2);
  assert.equal(next.progression.kills, 1);
  assert.ok(after.gold > before.gold);
});

test("starter pack checkout grants gems without changing attack directly", () => {
  const state = startGame();
  const beforeAttack = state.hero.attack;
  const before = getUiSnapshot(state);

  const next = updateGame(
    state,
    {
      ...emptyInput(),
      checkoutOrConvenience: true,
    },
    16,
    () => 0.5
  );
  const after = getUiSnapshot(next);

  assert.equal(next.monetization.starterPackPurchased, true);
  assert.ok(after.gems > before.gems);
  assert.equal(next.hero.attack, beforeAttack);
  assert.ok(next.analytics.acceptedEvents.some((event) => event.eventName === "payment_success"));
});

test("convenience purchase spends gems but does not increase attack", () => {
  const state = startGame();
  const purchased = updateGame(
    state,
    {
      ...emptyInput(),
      checkoutOrConvenience: true,
    },
    16,
    () => 0.5
  );

  const beforeAttack = purchased.hero.attack;
  const before = getUiSnapshot(purchased);

  const upgraded = updateGame(
    purchased,
    {
      ...emptyInput(),
      checkoutOrConvenience: true,
    },
    16,
    () => 0.5
  );
  const after = getUiSnapshot(upgraded);

  assert.equal(upgraded.monetization.convenienceSlots, 1);
  assert.ok(after.gems < before.gems);
  assert.equal(upgraded.hero.attack, beforeAttack);
});

test("leaderboard submit and brag-card generation work", () => {
  const state = startGame();
  state.progression.stage = 8;
  state.hero.level = 4;
  state.sword.level = 6;

  const submitted = updateGame(
    state,
    {
      ...emptyInput(),
      submitScore: true,
    },
    16,
    () => 0.5
  );
  assert.ok(submitted.progression.lastScoreSubmitted > 0);
  assert.ok(submitted.socialUi.lastRank);

  const bragged = updateGame(
    submitted,
    {
      ...emptyInput(),
      generateBragCard: true,
    },
    16,
    () => 0.5
  );
  assert.ok(bragged.social.lastBragCard);
  assert.ok(bragged.socialUi.lastBragCardText.length > 0);
});

test("chest claim gives gold and xp when claimable", () => {
  const state = startGame();
  state.economy.chest.claimable = 1;

  const before = getUiSnapshot(state);
  const beforeXp = state.hero.xp;

  const next = updateGame(
    state,
    {
      ...emptyInput(),
      claimChest: true,
    },
    16,
    () => 0.5
  );
  const after = getUiSnapshot(next);

  assert.equal(next.economy.chest.claimable, 0);
  assert.ok(after.gold > before.gold);
  assert.ok(next.hero.xp > beforeXp);
});

test("hero death transitions to gameover", () => {
  const state = startGame();
  state.hero.hp = 5;
  state.enemy.attack = 999;
  state.enemy.attackCooldownMs = 0;

  const next = updateGame(state, emptyInput(), 16, () => 0.5);
  assert.equal(next.mode, "gameover");
  assert.equal(Math.floor(next.hero.hp), 0);
});

test("sword progression persists after restart", () => {
  const state = startGame();
  state.wallet.balances.soft = 10000;

  const enhanced = updateGame(
    state,
    {
      ...emptyInput(),
      enhanceSword: true,
    },
    16,
    () => 0.01
  );
  enhanced.mode = "gameover";

  const restarted = updateGame(
    enhanced,
    {
      ...emptyInput(),
      restart: true,
    },
    16,
    () => 0.5
  );

  assert.equal(restarted.mode, "playing");
  assert.equal(restarted.sword.level, enhanced.sword.level);
  assert.ok(restarted.hero.attack >= 14 + enhanced.sword.attackBonus);
});
