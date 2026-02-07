import {
  ENEMY_RADIUS,
  GAME_HEIGHT,
  GAME_WIDTH,
  SHARD_RADIUS,
  createInitialGameState,
} from "./state.js";

const PLAYER_CONTACT_DAMAGE = 20;
const PLAYER_INVULNERABLE_MS = 420;
const ENEMY_KILL_SCORE = 30;
const SHARD_SCORE = 12;
const SHARD_BURST_REFILL_MS = 260;
const PASSIVE_SCORE_PER_MS = 0.015;
const SHARD_DROP_CHANCE = 0.35;
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

function spawnEnemy(spawner, bounds, rng) {
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
      x,
      y,
      radius: ENEMY_RADIUS,
      speed: 70 + rng() * 56,
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
  const movement = normalize(
    (input.right ? 1 : 0) - (input.left ? 1 : 0),
    (input.down ? 1 : 0) - (input.up ? 1 : 0)
  );

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
    spawner: {
      ...state.spawner,
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

  while (next.spawner.timerMs <= 0) {
    const spawned = spawnEnemy(next.spawner, next.bounds, rng);
    next.spawner = {
      ...spawned.nextSpawner,
      timerMs: next.spawner.timerMs + next.spawner.spawnEveryMs,
    };
    next.enemies.push(spawned.enemy);
  }

  for (const enemy of next.enemies) {
    const dir = normalize(next.player.x - enemy.x, next.player.y - enemy.y);
    enemy.x += dir.x * enemy.speed * dt;
    enemy.y += dir.y * enemy.speed * dt;
  }

  if (next.burst.activeRemainingMs > 0) {
    const radiusSq = next.burst.radius * next.burst.radius;
    const survivors = [];
    const killed = [];
    for (const enemy of next.enemies) {
      const nearPlayer =
        distanceSq(enemy.x, enemy.y, next.player.x, next.player.y) <=
        radiusSq + enemy.radius * enemy.radius;
      if (nearPlayer) {
        killed.push(enemy);
      } else {
        survivors.push(enemy);
      }
    }
    if (killed.length > 0) {
      const chainCount = next.chain.windowRemainingMs > 0 ? next.chain.count + 1 : 1;
      const chainMultiplier = Math.min(
        CHAIN_MULTIPLIER_CAP,
        1 + (chainCount - 1) * CHAIN_MULTIPLIER_STEP
      );
      next.chain.count = chainCount;
      next.chain.multiplier = chainMultiplier;
      next.chain.windowRemainingMs = next.chain.windowDurationMs;
      next.chain.bestCount = Math.max(next.chain.bestCount, chainCount);
      next.chain.lastBurstKills = killed.length;

      next.score += killed.length * ENEMY_KILL_SCORE * chainMultiplier;
      for (const enemy of killed) {
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
      next.player.hp -= PLAYER_CONTACT_DAMAGE;
      next.player.invulnerableMs = PLAYER_INVULNERABLE_MS;
    } else {
      survivorsAfterContact.push(enemy);
    }
  }
  next.enemies = survivorsAfterContact;

  if (next.player.hp <= 0) {
    next.mode = "gameover";
    next.player.hp = 0;
    next.bestScore = Math.max(next.bestScore, Math.floor(next.score));
  }

  return next;
}
