import assert from "node:assert/strict";
import test from "node:test";

import { createInitialGameState } from "../src/game/state.js";
import { getUiSnapshot, updateGame } from "../src/game/update.js";

function emptyInput() {
  return {
    start: false,
    restart: false,
    buyAttack: false,
    buyHealth: false,
    buyCrit: false,
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
    () => 0.99
  );
}

test("start input transitions mode to playing", () => {
  const next = startGame();
  assert.equal(next.mode, "playing");
  assert.ok(next.analytics.acceptedEvents.some((event) => event.eventName === "session_start"));
});

test("defeating enemy grants rewards and advances stage", () => {
  const state = startGame();
  state.enemy.hp = 1;
  state.enemy.maxHp = 1;
  state.hero.attack = 999;
  state.hero.attackCooldownMs = 0;

  const before = getUiSnapshot(state);
  const next = updateGame(state, emptyInput(), 16, () => 0.99);
  const after = getUiSnapshot(next);

  assert.equal(next.progression.stage, 2);
  assert.equal(next.progression.kills, 1);
  assert.ok(after.gold > before.gold);
});

test("gold upgrades consume gold and improve stats", () => {
  const state = startGame();
  state.wallet.balances.soft = 10000;
  const before = getUiSnapshot(state);
  const next = updateGame(
    state,
    {
      ...emptyInput(),
      buyAttack: true,
      buyHealth: true,
      buyCrit: true,
    },
    16,
    () => 0.99
  );
  const after = getUiSnapshot(next);

  assert.ok(after.gold < before.gold);
  assert.ok(next.hero.attack > state.hero.attack);
  assert.ok(next.hero.maxHp > state.hero.maxHp);
  assert.ok(next.hero.critChance > state.hero.critChance);
});

test("starter pack checkout grants gems and entitlement", () => {
  const state = startGame();
  const before = getUiSnapshot(state);

  const next = updateGame(
    state,
    {
      ...emptyInput(),
      checkoutOrConvenience: true,
    },
    16,
    () => 0.99
  );
  const after = getUiSnapshot(next);

  assert.equal(next.monetization.starterPackPurchased, true);
  assert.equal(next.monetization.activeSkin, "royal-neon");
  assert.ok(after.gems > before.gems);
  assert.ok(next.analytics.acceptedEvents.some((event) => event.eventName === "payment_success"));
});

test("convenience purchase spends gems but does not raise combat stats", () => {
  const state = startGame();
  const purchased = updateGame(
    state,
    {
      ...emptyInput(),
      checkoutOrConvenience: true,
    },
    16,
    () => 0.99
  );

  const beforeAttack = purchased.hero.attack;
  const beforeHp = purchased.hero.maxHp;
  const beforeCrit = purchased.hero.critChance;
  const beforeBalance = getUiSnapshot(purchased);

  const upgraded = updateGame(
    purchased,
    {
      ...emptyInput(),
      checkoutOrConvenience: true,
    },
    16,
    () => 0.99
  );
  const afterBalance = getUiSnapshot(upgraded);

  assert.equal(upgraded.monetization.convenienceSlots, 1);
  assert.ok(afterBalance.gems < beforeBalance.gems);
  assert.equal(upgraded.hero.attack, beforeAttack);
  assert.equal(upgraded.hero.maxHp, beforeHp);
  assert.equal(upgraded.hero.critChance, beforeCrit);
});

test("leaderboard submit and brag-card generation work", () => {
  const state = startGame();
  state.progression.stage = 8;
  state.hero.level = 4;

  const submitted = updateGame(
    state,
    {
      ...emptyInput(),
      submitScore: true,
    },
    16,
    () => 0.99
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
    () => 0.99
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
    () => 0.99
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

  const next = updateGame(state, emptyInput(), 16, () => 0.99);
  assert.equal(next.mode, "gameover");
  assert.equal(Math.floor(next.hero.hp), 0);
});
