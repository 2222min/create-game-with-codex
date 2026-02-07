import {
  ENEMY_RADIUS,
  GAME_HEIGHT,
  GAME_WIDTH,
  SHARD_RADIUS,
  createInitialGameState,
} from "./state.js";

const BOSS_TAG = "boss";
const PLAYER_CONTACT_DAMAGE = 20;
const BOSS_CONTACT_DAMAGE = 34;
const PLAYER_INVULNERABLE_MS = 420;
const ENEMY_KILL_SCORE = 30;
const BOSS_HIT_SCORE = 22;
const BOSS_DEFEAT_SCORE_BASE = 220;
const SHARD_SCORE = 12;
const SHARD_BURST_REFILL_MS = 260;
const PASSIVE_SCORE_PER_MS = 0.015;
const SHARD_DROP_CHANCE = 0.35;
const NORMAL_STAGE_DURATION_MS = 16000;
const STAGE_CLEAR_HEAL = 18;
const CHAIN_MULTIPLIER_STEP = 0.5;
const CHAIN_MULTIPLIER_CAP = 3;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function distanceSq(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function normalize(dx, dy) {
  const mag = Math.hypot(dx, dy);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: dx / mag, y: dy / mag };
}

function normalizeStage(stage) {
  return {
    number: stage?.number ?? 1,
    phase: stage?.phase ?? "normal",
    phaseElapsedMs: stage?.phaseElapsedMs ?? 0,
    normalDurationMs: stage?.normalDurationMs ?? NORMAL_STAGE_DURATION_MS,
    bossSpawned: stage?.bossSpawned ?? false,
  };
}

export function getSpawnIntervalForStage(stageNumber) {
  return Math.max(520, 1700 - (stageNumber - 1) * 130);
}

function getMaxEnemiesForStage(stageNumber) {
  return Math.min(18, 4 + stageNumber * 2);
}

function getEnemySpeedForStage(stageNumber, rng) {
  const baseSpeed = 42 + (stageNumber - 1) * 6;
  const variance = 20 + (stageNumber - 1) * 3;
  return baseSpeed + rng() * variance;
}

function getBossStatsForStage(stageNumber) {
  const maxHp = 5 + stageNumber * 2;
  return {
    maxHp,
    radius: 30 + Math.min(10, stageNumber),
    speed: 44 + stageNumber * 4,
    scoreValue: BOSS_DEFEAT_SCORE_BASE + stageNumber * 45,
  };
}

function spawnEnemy(spawner, bounds, stageNumber, rng) {
  const side = Math.floor(rng() * 4);
  let x = 0;
  let y = 0;
  if (side === 0) {
    x = rng() * bounds.width;
    y = -ENEMY_RADIUS;
  } else if (side === 1) {
    x = bounds.width + ENEMY_RADIUS;
    y = rng() * bounds.height;
  } else if (side === 2) {
    x = rng() * bounds.width;
    y = bounds.height + ENEMY_RADIUS;
  } else {
    x = -ENEMY_RADIUS;
    y = rng() * bounds.height;
  }

  return {
    enemy: {
      id: spawner.nextEnemyId,
      type: "normal",
      x,
      y,
      radius: ENEMY_RADIUS,
      speed: getEnemySpeedForStage(stageNumber, rng),
      hp: 1,
      maxHp: 1,
    },
    nextSpawner: {
      ...spawner,
      nextEnemyId: spawner.nextEnemyId + 1,
    },
  };
}

function spawnBoss(spawner, bounds, stageNumber) {
  const bossStats = getBossStatsForStage(stageNumber);
  return {
    enemy: {
      id: spawner.nextEnemyId,
      type: BOSS_TAG,
      x: bounds.width / 2,
      y: Math.max(72, bossStats.radius + 24),
      radius: bossStats.radius,
      speed: bossStats.speed,
      hp: bossStats.maxHp,
      maxHp: bossStats.maxHp,
      scoreValue: bossStats.scoreValue,
    },
    nextSpawner: {
      ...spawner,
      nextEnemyId: spawner.nextEnemyId + 1,
    },
  };
}

function createPlayingState(previousState) {
  const base = createInitialGameState();
  return {
    ...base,
    mode: "playing",
    bestScore: Math.max(previousState?.bestScore ?? 0, Math.floor(previousState?.score ?? 0)),
  };
}

export function updateGame(state, input, dtMs, rng = Math.random) {
  if (state.mode === "start") {
    if (input.start) return createPlayingState(state);
    return state;
  }

  if (state.mode === "gameover") {
    if (input.restart || input.start) return createPlayingState(state);
    return state;
  }

  const dt = dtMs / 1000;
  const currentStage = normalizeStage(state.stage);
  const movement = normalize(
    (input.right ? 1 : 0) - (input.left ? 1 : 0),
    (input.down ? 1 : 0) - (input.up ? 1 : 0)
  );
  const spawnEveryMs = getSpawnIntervalForStage(currentStage.number);

  const next = {
    ...state,
    elapsedMs: state.elapsedMs + dtMs,
    score: state.score + dtMs * PASSIVE_SCORE_PER_MS,
    player: {
      ...state.player,
      x: state.player.x + movement.x * state.player.speed * dt,
      y: state.player.y + movement.y * state.player.speed * dt,
      invulnerableMs: Math.max(0, state.player.invulnerableMs - dtMs),
    },
    burst: {
      ...state.burst,
      cooldownRemainingMs: Math.max(0, state.burst.cooldownRemainingMs - dtMs),
      activeRemainingMs: Math.max(0, state.burst.activeRemainingMs - dtMs),
    },
    chain: {
      ...state.chain,
      windowRemainingMs: Math.max(0, state.chain.windowRemainingMs - dtMs),
      lastBurstKills: 0,
    },
    stage: {
      ...currentStage,
      phaseElapsedMs: currentStage.phaseElapsedMs + dtMs,
      normalDurationMs: currentStage.normalDurationMs || NORMAL_STAGE_DURATION_MS,
    },
    spawner: {
      ...state.spawner,
      spawnEveryMs,
      timerMs: state.spawner.timerMs - dtMs,
    },
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    shards: state.shards.map((shard) => ({ ...shard })),
  };

  next.player.x = clamp(next.player.x, next.player.radius, GAME_WIDTH - next.player.radius);
  next.player.y = clamp(next.player.y, next.player.radius, GAME_HEIGHT - next.player.radius);

  if (state.chain.windowRemainingMs > 0 && next.chain.windowRemainingMs === 0) {
    next.chain.count = 0;
    next.chain.multiplier = 1;
  }

  let didTriggerBurst = false;
  if (input.burst && next.burst.cooldownRemainingMs <= 0) {
    next.burst.activeRemainingMs = next.burst.activeDurationMs;
    next.burst.cooldownRemainingMs = next.burst.cooldownMs;
    didTriggerBurst = true;
  }

  if (next.stage.phase === "normal" && next.stage.phaseElapsedMs >= next.stage.normalDurationMs) {
    next.stage.phase = "boss";
    next.stage.phaseElapsedMs = 0;
    next.stage.bossSpawned = false;
    next.enemies = next.enemies.filter((enemy) => enemy.type === BOSS_TAG);
    next.spawner.timerMs = next.spawner.spawnEveryMs;
  }

  if (next.stage.phase === "boss") {
    next.spawner.timerMs = next.spawner.spawnEveryMs;
    const bossAlive = next.enemies.some((enemy) => enemy.type === BOSS_TAG);
    if (!bossAlive && !next.stage.bossSpawned) {
      const spawnedBoss = spawnBoss(next.spawner, next.bounds, next.stage.number);
      next.spawner = spawnedBoss.nextSpawner;
      next.enemies.push(spawnedBoss.enemy);
      next.stage.bossSpawned = true;
    }
  } else {
    while (next.spawner.timerMs <= 0) {
      const normalEnemyCount = next.enemies.filter((enemy) => enemy.type !== BOSS_TAG).length;
      if (normalEnemyCount >= getMaxEnemiesForStage(next.stage.number)) {
        next.spawner.timerMs = 140;
        break;
      }
      const spawned = spawnEnemy(next.spawner, next.bounds, next.stage.number, rng);
      next.spawner = {
        ...spawned.nextSpawner,
        timerMs: next.spawner.timerMs + next.spawner.spawnEveryMs,
      };
      next.enemies.push(spawned.enemy);
    }
  }

  for (const enemy of next.enemies) {
    const dir = normalize(next.player.x - enemy.x, next.player.y - enemy.y);
    enemy.x += dir.x * enemy.speed * dt;
    enemy.y += dir.y * enemy.speed * dt;
  }

  if (next.burst.activeRemainingMs > 0) {
    const radiusSq = next.burst.radius * next.burst.radius;
    const survivors = [];
    const defeated = [];
    let burstScore = 0;
    let burstSuccessCount = 0;
    for (const enemy of next.enemies) {
      const nearPlayer =
        distanceSq(enemy.x, enemy.y, next.player.x, next.player.y) <=
        radiusSq + enemy.radius * enemy.radius;
      if (!nearPlayer) {
        survivors.push(enemy);
        continue;
      }

      if (enemy.type === BOSS_TAG) {
        enemy.hp -= 1;
        burstScore += BOSS_HIT_SCORE;
        burstSuccessCount += 1;
        if (enemy.hp <= 0) {
          defeated.push(enemy);
          burstScore += enemy.scoreValue ?? BOSS_DEFEAT_SCORE_BASE;
        } else {
          survivors.push(enemy);
        }
      } else {
        defeated.push(enemy);
        burstScore += ENEMY_KILL_SCORE;
        burstSuccessCount += 1;
      }
    }

    if (burstSuccessCount > 0) {
      const chainCount = next.chain.windowRemainingMs > 0 ? next.chain.count + 1 : 1;
      const chainMultiplier = Math.min(
        CHAIN_MULTIPLIER_CAP,
        1 + (chainCount - 1) * CHAIN_MULTIPLIER_STEP
      );
      next.chain.count = chainCount;
      next.chain.multiplier = chainMultiplier;
      next.chain.windowRemainingMs = next.chain.windowDurationMs;
      next.chain.bestCount = Math.max(next.chain.bestCount, chainCount);
      next.chain.lastBurstKills = burstSuccessCount;

      next.score += burstScore * chainMultiplier;
      for (const enemy of defeated) {
        if (enemy.type === BOSS_TAG) continue;
        if (rng() < SHARD_DROP_CHANCE) {
          next.shards.push({
            id: next.spawner.nextShardId,
            x: enemy.x,
            y: enemy.y,
            radius: SHARD_RADIUS,
          });
          next.spawner.nextShardId += 1;
        }
      }
    } else if (didTriggerBurst) {
      next.chain.count = 0;
      next.chain.multiplier = 1;
      next.chain.windowRemainingMs = 0;
    }

    next.enemies = survivors;
  }

  const remainingShards = [];
  let collectedShards = 0;
  for (const shard of next.shards) {
    const collectDist = next.player.radius + shard.radius;
    const collected =
      distanceSq(shard.x, shard.y, next.player.x, next.player.y) <= collectDist * collectDist;
    if (collected) {
      collectedShards += 1;
    } else {
      remainingShards.push(shard);
    }
  }
  if (collectedShards > 0) {
    next.score += collectedShards * SHARD_SCORE;
    next.burst.cooldownRemainingMs = Math.max(
      0,
      next.burst.cooldownRemainingMs - collectedShards * SHARD_BURST_REFILL_MS
    );
  }
  next.shards = remainingShards;

  const survivorsAfterContact = [];
  for (const enemy of next.enemies) {
    const hitDist = next.player.radius + enemy.radius;
    const touching =
      distanceSq(enemy.x, enemy.y, next.player.x, next.player.y) <= hitDist * hitDist;
    if (touching && next.player.invulnerableMs <= 0) {
      const damage = enemy.type === BOSS_TAG ? BOSS_CONTACT_DAMAGE : PLAYER_CONTACT_DAMAGE;
      next.player.hp -= damage;
      next.player.invulnerableMs = PLAYER_INVULNERABLE_MS;
      if (enemy.type === BOSS_TAG) {
        survivorsAfterContact.push(enemy);
      }
    } else {
      survivorsAfterContact.push(enemy);
    }
  }
  next.enemies = survivorsAfterContact;

  if (next.stage.phase === "boss" && next.stage.bossSpawned) {
    const bossAlive = next.enemies.some((enemy) => enemy.type === BOSS_TAG);
    if (!bossAlive) {
      next.stage.number += 1;
      next.stage.phase = "normal";
      next.stage.phaseElapsedMs = 0;
      next.stage.bossSpawned = false;
      next.stage.normalDurationMs = NORMAL_STAGE_DURATION_MS;
      next.spawner.spawnEveryMs = getSpawnIntervalForStage(next.stage.number);
      next.spawner.timerMs = Math.max(300, next.spawner.spawnEveryMs * 0.65);
      next.player.hp = Math.min(next.player.maxHp, next.player.hp + STAGE_CLEAR_HEAL + 8);
    }
  }

  if (next.player.hp <= 0) {
    next.mode = "gameover";
    next.player.hp = 0;
    next.bestScore = Math.max(next.bestScore, Math.floor(next.score));
  }

  return next;
}
