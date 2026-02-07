export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const PLAYER_RADIUS = 18;
export const ENEMY_RADIUS = 16;
export const SHARD_RADIUS = 8;

export function createInitialGameState() {
  return {
    mode: "start",
    bounds: { width: GAME_WIDTH, height: GAME_HEIGHT },
    elapsedMs: 0,
    score: 0,
    bestScore: 0,
    player: {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      radius: PLAYER_RADIUS,
      speed: 255,
      hp: 100,
      maxHp: 100,
      invulnerableMs: 0,
    },
    burst: {
      radius: 130,
      cooldownMs: 1200,
      cooldownRemainingMs: 0,
      activeRemainingMs: 0,
      activeDurationMs: 180,
    },
    chain: {
      count: 0,
      multiplier: 1,
      windowDurationMs: 2200,
      windowRemainingMs: 0,
      bestCount: 0,
      lastBurstKills: 0,
    },
    stage: {
      number: 1,
      phase: "normal",
      phaseElapsedMs: 0,
      normalDurationMs: 16000,
      bossSpawned: false,
    },
    spawner: {
      spawnEveryMs: 1700,
      timerMs: 900,
      nextEnemyId: 1,
      nextShardId: 1,
    },
    enemies: [],
    shards: [],
  };
}
