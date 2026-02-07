import { createAnalyticsState } from "../adapters/analytics-adapter.js";
import { createLiveOpsState, getActiveSeason } from "../adapters/liveops-adapter.js";
import { createPaymentState } from "../adapters/payment-adapter.js";
import { createSocialState } from "../adapters/social-adapter.js";
import { createWalletState } from "../adapters/wallet-adapter.js";

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeEnemyName(stage, isBoss) {
  if (isBoss) return `Void Warden ${stage / 10}`;
  const names = ["Moss Slime", "Iron Bat", "Ash Golem", "Rune Hound", "Frost Shade"];
  return names[(stage - 1) % names.length];
}

export function createEnemyForStage(stage) {
  const boss = stage % 10 === 0;
  const hp = Math.floor((boss ? 300 : 120) + stage * (boss ? 55 : 28));
  const attack = Math.floor((boss ? 16 : 7) + stage * (boss ? 1.8 : 0.9));
  const attackIntervalMs = boss ? 1350 : 1850;
  return {
    stage,
    name: makeEnemyName(stage, boss),
    boss,
    maxHp: hp,
    hp,
    attack,
    attackIntervalMs,
    attackCooldownMs: boss ? 900 : 650,
    rewardGold: Math.floor((boss ? 180 : 48) + stage * (boss ? 14 : 7)),
    rewardXp: Math.floor((boss ? 95 : 24) + stage * (boss ? 5 : 2.8)),
  };
}

export function getAttackUpgradeCost(level) {
  return Math.floor(60 * Math.pow(1.22, level));
}

export function getHealthUpgradeCost(level) {
  return Math.floor(75 * Math.pow(1.24, level));
}

export function getCritUpgradeCost(level) {
  return Math.floor(95 * Math.pow(1.28, level));
}

export function getConvenienceSlotCost(slotCount) {
  return 40 + slotCount * 24;
}

export function createInitialGameState() {
  const liveOps = createLiveOpsState();
  const season = getActiveSeason(liveOps);
  return {
    mode: "start",
    bounds: { width: GAME_WIDTH, height: GAME_HEIGHT },
    elapsedMs: 0,
    playerId: "player-you",
    nickname: "You",
    sessionId: "session-local-1",
    hero: {
      level: 1,
      xp: 0,
      xpToNext: 50,
      attack: 14,
      maxHp: 170,
      hp: 170,
      critChance: 0.08,
      critMultiplier: 1.75,
      attackIntervalMs: 780,
      attackCooldownMs: 500,
      regenPerSecond: 1.8,
    },
    progression: {
      stage: 1,
      kills: 0,
      bossKills: 0,
      bestStage: 1,
      lastScoreSubmitted: 0,
    },
    enemy: createEnemyForStage(1),
    economy: {
      attackUpgradeLevel: 0,
      healthUpgradeLevel: 0,
      critUpgradeLevel: 0,
      chest: {
        chargeMs: 0,
        intervalMs: 9000,
        claimable: 0,
        baseCap: 1,
        goldBase: 90,
        xpBase: 26,
      },
    },
    monetization: {
      starterPackPurchased: false,
      convenienceSlots: 0,
      activeSkin: "default",
      ownedSkins: ["default"],
      lastCheckoutResult: "none",
    },
    socialUi: {
      lastRank: null,
      showLeaderboard: true,
      lastBragCardText: "",
    },
    liveOps,
    wallet: createWalletState({ soft: 220, premium: 0 }),
    payment: createPaymentState(),
    analytics: createAnalyticsState(),
    social: createSocialState(),
    ui: {
      notice: "ENTER로 시작하고 자동 전투를 지켜보세요.",
      noticeTtlMs: 0,
      pulseMs: 0,
    },
    debug: {
      lastHeroHit: 0,
      lastEnemyHit: 0,
      lastHitWasCrit: false,
      missionRewardClaimed: false,
    },
    season,
  };
}
