import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../src/game/state.js";
import { getSpawnIntervalForStage, updateGame } from "../src/game/update.js";

function toPlaying(baseState = createInitialGameState()) {
  return updateGame(
    baseState,
    {
      left: false,
      right: false,
      up: false,
      down: false,
      burst: false,
      start: true,
      restart: false,
      toggleFullscreen: false,
    },
    16
  );
}

function idleInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    burst: false,
    start: false,
    restart: false,
    toggleFullscreen: false,
  };
}

test("player movement stays inside bounds", () => {
  const state = toPlaying();
  state.player.x = state.player.radius + 2;
  state.player.y = state.player.radius + 2;
  const moved = updateGame(
    state,
    {
      ...idleInput(),
      left: true,
      up: true,
    },
    1000
  );

  assert.equal(moved.player.x, moved.player.radius);
  assert.equal(moved.player.y, moved.player.radius);
});

test("enemy chases player toward center", () => {
  const state = toPlaying();
  state.enemies = [
    {
      id: 1,
      x: 100,
      y: state.player.y,
      radius: 16,
      speed: 120,
    },
  ];
  state.spawner.timerMs = 99999;
  const next = updateGame(state, idleInput(), 1000);

  assert.ok(next.enemies[0].x > 100);
});

test("burst removes nearby enemy and starts cooldown", () => {
  const state = toPlaying();
  state.spawner.timerMs = 99999;
  state.burst.cooldownRemainingMs = 0;
  state.enemies = [
    {
      id: 1,
      x: state.player.x + 30,
      y: state.player.y,
      radius: 16,
      speed: 0,
    },
  ];

  const next = updateGame(
    state,
    {
      ...idleInput(),
      burst: true,
    },
    16,
    () => 0.99
  );

  assert.equal(next.enemies.length, 0);
  assert.ok(next.burst.cooldownRemainingMs > 0);
});

test("contact damage transitions to gameover at zero hp", () => {
  const state = toPlaying();
  state.spawner.timerMs = 99999;
  state.player.hp = 20;
  state.enemies = [
    {
      id: 1,
      x: state.player.x,
      y: state.player.y,
      radius: 16,
      speed: 0,
    },
  ];

  const next = updateGame(state, idleInput(), 16);

  assert.equal(next.player.hp, 0);
  assert.equal(next.mode, "gameover");
});

test("score increases over time", () => {
  const state = toPlaying();
  state.spawner.timerMs = 99999;
  const next = updateGame(state, idleInput(), 1000);

  assert.ok(next.score > state.score);
});

test("chain multiplier increases on consecutive successful bursts", () => {
  const state = toPlaying();
  state.spawner.timerMs = 99999;
  state.burst.cooldownRemainingMs = 0;
  state.enemies = [
    {
      id: 1,
      x: state.player.x + 20,
      y: state.player.y,
      radius: 16,
      speed: 0,
    },
  ];

  const afterFirst = updateGame(
    state,
    {
      ...idleInput(),
      burst: true,
    },
    16,
    () => 0.99
  );
  assert.equal(afterFirst.chain.count, 1);
  assert.equal(afterFirst.chain.multiplier, 1);

  const secondState = {
    ...afterFirst,
    burst: {
      ...afterFirst.burst,
      cooldownRemainingMs: 0,
    },
    spawner: {
      ...afterFirst.spawner,
      timerMs: 99999,
    },
    enemies: [
      {
        id: 2,
        x: afterFirst.player.x + 22,
        y: afterFirst.player.y,
        radius: 16,
        speed: 0,
      },
    ],
  };
  const afterSecond = updateGame(
    secondState,
    {
      ...idleInput(),
      burst: true,
    },
    16,
    () => 0.99
  );

  assert.equal(afterSecond.chain.count, 2);
  assert.equal(afterSecond.chain.multiplier, 1.5);
  assert.ok(afterSecond.score - afterFirst.score > afterFirst.score - state.score);
});

test("chain resets when burst misses all enemies", () => {
  const state = toPlaying();
  state.spawner.timerMs = 99999;
  state.burst.cooldownRemainingMs = 0;
  state.enemies = [
    {
      id: 1,
      x: state.player.x + 20,
      y: state.player.y,
      radius: 16,
      speed: 0,
    },
  ];
  const afterHit = updateGame(
    state,
    {
      ...idleInput(),
      burst: true,
    },
    16,
    () => 0.99
  );
  assert.equal(afterHit.chain.count, 1);

  const missState = {
    ...afterHit,
    burst: {
      ...afterHit.burst,
      cooldownRemainingMs: 0,
    },
    spawner: {
      ...afterHit.spawner,
      timerMs: 99999,
    },
    enemies: [],
  };
  const afterMiss = updateGame(
    missState,
    {
      ...idleInput(),
      burst: true,
    },
    16,
    () => 0.99
  );

  assert.equal(afterMiss.chain.count, 0);
  assert.equal(afterMiss.chain.multiplier, 1);
  assert.equal(afterMiss.chain.windowRemainingMs, 0);
});

test("normal wave transitions into boss stage", () => {
  const state = toPlaying();
  state.spawner.timerMs = 99999;
  state.stage.phase = "normal";
  state.stage.phaseElapsedMs = state.stage.normalDurationMs;

  const next = updateGame(state, idleInput(), 16, () => 0.42);

  assert.equal(next.stage.phase, "boss");
  assert.equal(next.stage.bossSpawned, true);
  assert.ok(next.enemies.some((enemy) => enemy.type === "boss"));
});

test("defeating boss advances to next stage", () => {
  const state = toPlaying();
  state.stage = {
    number: 2,
    phase: "boss",
    phaseElapsedMs: 1000,
    normalDurationMs: 22000,
    bossSpawned: true,
  };
  state.spawner.timerMs = 99999;
  state.burst.cooldownRemainingMs = 0;
  state.enemies = [
    {
      id: 200,
      type: "boss",
      x: state.player.x + 10,
      y: state.player.y,
      radius: 30,
      speed: 0,
      hp: 1,
      maxHp: 1,
      scoreValue: 260,
    },
  ];

  const next = updateGame(
    state,
    {
      ...idleInput(),
      burst: true,
    },
    16,
    () => 0.99
  );

  assert.equal(next.stage.phase, "normal");
  assert.equal(next.stage.number, 3);
  assert.ok(!next.enemies.some((enemy) => enemy.type === "boss"));
});

test("spawn interval gets shorter on higher stages", () => {
  assert.ok(getSpawnIntervalForStage(5) < getSpawnIntervalForStage(1));
});
