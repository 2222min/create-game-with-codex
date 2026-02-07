import { track, trackFunnelStep, trackRevenue } from "../adapters/analytics-adapter.js";
import {
  claimMissionReward,
  claimPassTierReward,
  getActiveSeason,
  recordMissionEvent,
} from "../adapters/liveops-adapter.js";
import { getProductCatalog, getEntitlements, startCheckout } from "../adapters/payment-adapter.js";
import {
  generateBragCardData,
  getLeaderboard,
  joinGuild,
  submitScore,
} from "../adapters/social-adapter.js";
import { credit, debit, getBalance } from "../adapters/wallet-adapter.js";
import {
  clamp,
  createEnemyForStage,
  createInitialGameState,
  getConvenienceSlotCost,
  getSwordEnhanceCost,
  getSwordEnhanceSuccessRate,
  getSwordTier,
} from "./state.js";

const MAX_CONVENIENCE_SLOTS = 3;

function cloneState(state) {
  return {
    ...state,
    hero: { ...state.hero },
    sword: { ...state.sword },
    progression: { ...state.progression },
    economy: {
      ...state.economy,
      chest: { ...state.economy.chest },
    },
    monetization: {
      ...state.monetization,
      ownedSkins: [...state.monetization.ownedSkins],
    },
    socialUi: { ...state.socialUi },
    ui: { ...state.ui },
    debug: { ...state.debug },
  };
}

function setNotice(state, message, ttlMs = 1800) {
  state.ui.notice = message;
  state.ui.noticeTtlMs = ttlMs;
}

function trackEvent(state, eventName, payload) {
  const tracked = track(state.analytics, eventName, payload, {
    player_id: state.playerId,
    session_id: state.sessionId,
  });
  state.analytics = tracked.analyticsState;
}

function trackFunnel(state, step, payload = {}) {
  const tracked = trackFunnelStep(
    state.analytics,
    {
      step,
      ...payload,
    },
    {
      player_id: state.playerId,
      session_id: state.sessionId,
    }
  );
  state.analytics = tracked.analyticsState;
}

function trackRevenueEvent(state, payload) {
  const tracked = trackRevenue(state.analytics, payload, {
    player_id: state.playerId,
    session_id: state.sessionId,
  });
  state.analytics = tracked.analyticsState;
}

function walletCredit(state, amount, currency, reason, referenceId = "") {
  const result = credit(state.wallet, state.playerId, amount, currency, reason, referenceId);
  if (result.ok) state.wallet = result.wallet;
  return result;
}

function walletDebit(state, amount, currency, reason, referenceId = "") {
  const result = debit(state.wallet, state.playerId, amount, currency, reason, referenceId);
  if (result.ok) state.wallet = result.wallet;
  return result;
}

function computePowerScore(state) {
  const stageScore = state.progression.stage * 120;
  const levelScore = state.hero.level * 70;
  const bossScore = state.progression.bossKills * 240;
  const swordScore = state.sword.level * 85;
  const monetizationScore = state.monetization.convenienceSlots * 28;
  return stageScore + levelScore + bossScore + swordScore + monetizationScore;
}

function applyLevelUps(state) {
  while (state.hero.xp >= state.hero.xpToNext) {
    state.hero.xp -= state.hero.xpToNext;
    state.hero.level += 1;
    state.hero.xpToNext = Math.floor(state.hero.xpToNext * 1.22);
    state.hero.attack += 3;
    state.hero.maxHp += 16;
    state.hero.hp = state.hero.maxHp;
    trackEvent(state, "upgrade_applied", {
      type: "level_up",
      level: state.hero.level,
      attack: state.hero.attack,
      max_hp: state.hero.maxHp,
    });
  }
}

function grantBattleRewards(state, enemy) {
  const goldResult = walletCredit(state, enemy.rewardGold, "soft", "battle_clear", `stage_${enemy.stage}`);
  if (!goldResult.ok) {
    setNotice(state, "보상 지급 오류", 1400);
  }

  state.hero.xp += enemy.rewardXp;
  state.progression.stage += 1;
  state.progression.kills += 1;
  if (enemy.boss) state.progression.bossKills += 1;
  state.progression.bestStage = Math.max(state.progression.bestStage, state.progression.stage);

  const missionUpdate = recordMissionEvent(state.liveOps, state.playerId, { killCount: 1 });
  state.liveOps = missionUpdate.liveOpsState;

  if (state.monetization.starterPackPurchased) {
    const claim = claimMissionReward(state.liveOps, state.playerId, state.season.missionId);
    state.liveOps = claim.liveOpsState;
    if (claim.claimStatus === "completed") {
      for (const reward of claim.rewards) {
        walletCredit(state, reward.amount, reward.currency, reward.reason, state.season.missionId);
      }
      const tierClaim = claimPassTierReward(state.liveOps, state.playerId, "tier-1");
      state.liveOps = tierClaim.liveOpsState;
      if (tierClaim.claimStatus === "completed") {
        for (const reward of tierClaim.rewards) {
          walletCredit(state, reward.amount, reward.currency, reward.reason, "tier-1");
        }
      }
      state.debug.missionRewardClaimed = true;
      setNotice(state, "시즌 미션 보상 수령 완료", 1500);
    }
  }

  trackEvent(state, "battle_result", {
    outcome: "victory",
    stage: enemy.stage,
    boss: enemy.boss,
    reward_gold: enemy.rewardGold,
    reward_xp: enemy.rewardXp,
  });

  applyLevelUps(state);
  state.enemy = createEnemyForStage(state.progression.stage);
}

function updateChest(state, dtMs) {
  const chest = state.economy.chest;
  chest.chargeMs += dtMs;
  const cap = chest.baseCap + state.monetization.convenienceSlots;
  while (chest.chargeMs >= chest.intervalMs) {
    chest.chargeMs -= chest.intervalMs;
    if (chest.claimable < cap) {
      chest.claimable += 1;
    }
  }
}

function applyChestClaim(state) {
  const chest = state.economy.chest;
  if (chest.claimable <= 0) {
    setNotice(state, "상자가 아직 준비되지 않았습니다.", 1200);
    return;
  }
  chest.claimable -= 1;

  const stageBonus = 1 + Math.min(2.4, state.progression.stage * 0.025);
  const gold = Math.floor(chest.goldBase * stageBonus);
  const xp = Math.floor(chest.xpBase * stageBonus);

  walletCredit(state, gold, "soft", "chest_claim", `stage_${state.progression.stage}`);
  state.hero.xp += xp;
  applyLevelUps(state);

  trackEvent(state, "battle_result", {
    outcome: "chest_claim",
    stage: state.progression.stage,
    gold,
    xp,
  });

  setNotice(state, `상자 수령 +${gold}G / +${xp}XP`, 1400);
}

function tryEnhanceSword(state, rng) {
  const currentLevel = state.sword.level;
  const cost = getSwordEnhanceCost(currentLevel);
  const successRate = getSwordEnhanceSuccessRate(currentLevel);

  const debited = walletDebit(state, cost, "soft", "sword_enhance", `sword_${currentLevel}`);
  if (!debited.ok) {
    setNotice(state, `골드 부족: 검 강화 비용 ${cost}G`, 1300);
    return;
  }

  state.sword.enhanceAttemptCount += 1;
  const roll = rng();
  state.sword.lastRoll = roll;

  if (roll <= successRate) {
    state.sword.level += 1;
    state.sword.tier = getSwordTier(state.sword.level);

    const attackGain = 3 + Math.floor(state.sword.level / 4);
    const currentAttackBonus = Number.isFinite(state.sword.attackBonus) ? state.sword.attackBonus : 0;
    state.sword.attackBonus = currentAttackBonus + attackGain;
    state.hero.attack += attackGain;

    state.sword.lastResult = "success";
    state.sword.effectTtlMs = 1300;

    setNotice(
      state,
      `강화 성공! +${state.sword.level} 검 / 공격 +${attackGain} (성공률 ${(successRate * 100).toFixed(0)}%)`,
      1500
    );

    trackEvent(state, "upgrade_applied", {
      type: "sword",
      level: state.sword.level,
      success: true,
      cost,
      success_rate: successRate,
    });
  } else {
    state.sword.lastResult = "fail";
    state.sword.effectTtlMs = 900;
    setNotice(state, `강화 실패... (성공률 ${(successRate * 100).toFixed(0)}%)`, 1300);

    trackEvent(state, "upgrade_applied", {
      type: "sword",
      level: state.sword.level,
      success: false,
      cost,
      success_rate: successRate,
    });
  }
}

function tryStarterPackCheckout(state) {
  const catalog = getProductCatalog();
  trackEvent(state, "payment_attempt", {
    product_id: "starter_pack",
    source: "keyboard_b",
    owned: state.monetization.starterPackPurchased,
  });

  if (state.monetization.starterPackPurchased) {
    const convenienceCost = getConvenienceSlotCost(state.monetization.convenienceSlots);
    if (state.monetization.convenienceSlots >= MAX_CONVENIENCE_SLOTS) {
      setNotice(state, "편의 슬롯은 최대치입니다.", 1200);
      return;
    }
    const debitResult = walletDebit(
      state,
      convenienceCost,
      "premium",
      "convenience_slot",
      `conv_${state.monetization.convenienceSlots}`
    );
    if (!debitResult.ok) {
      setNotice(state, `보석 부족: 편의 슬롯 ${convenienceCost}개`, 1200);
      return;
    }
    state.monetization.convenienceSlots += 1;
    setNotice(state, `편의 슬롯 +1 (최대 상자 ${1 + state.monetization.convenienceSlots})`, 1300);
    trackEvent(state, "upgrade_applied", {
      type: "convenience_slot",
      level: state.monetization.convenienceSlots,
      cost: convenienceCost,
    });
    return;
  }

  const checkout = startCheckout(state.payment, "starter_pack", {
    playerId: state.playerId,
    platform: "web",
    locale: "ko-KR",
  });
  state.payment = checkout.paymentState;
  state.monetization.lastCheckoutResult = checkout.checkoutResult;

  if (checkout.checkoutResult !== "completed") {
    setNotice(state, "결제가 취소되었거나 실패했습니다.", 1200);
    return;
  }

  const product = catalog.starter_pack;
  walletCredit(state, product.grantsPremiumCurrency, "premium", "purchase_grant", "starter_pack");
  state.monetization.starterPackPurchased = true;
  state.monetization.activeSkin = product.grantsSkin;
  if (!state.monetization.ownedSkins.includes(product.grantsSkin)) {
    state.monetization.ownedSkins.push(product.grantsSkin);
  }

  trackRevenueEvent(state, {
    product_id: "starter_pack",
    price_usd: product.priceUsd,
    premium_granted: product.grantsPremiumCurrency,
  });

  setNotice(state, "스타터 팩 구매 완료: +120 Gems, Royal Skin", 1700);
}

function trySubmitScore(state) {
  const score = computePowerScore(state);
  const submission = submitScore(state.social, state.playerId, state.season.id, {
    nickname: state.nickname,
    score,
  });
  state.social = submission.socialState;
  state.socialUi.lastRank = submission.rank;
  state.progression.lastScoreSubmitted = score;

  const leaderboard = getLeaderboard(state.social, "guild", state.season.id);
  state.socialUi.showLeaderboard = true;

  trackFunnel(state, "score_submit", {
    score,
    rank: submission.rank,
    leaderboard_size: leaderboard.leaderboard.length,
  });

  setNotice(state, `랭킹 제출 완료: ${score}점 / #${submission.rank}`, 1500);
}

function tryGenerateBragCard(state) {
  const submittedScore = state.progression.lastScoreSubmitted;
  if (submittedScore <= 0) {
    setNotice(state, "먼저 랭킹 제출을 하세요.", 1200);
    return;
  }

  const brag = generateBragCardData(state.social, state.playerId, state.season.id);
  state.social = brag.socialState;
  state.socialUi.lastBragCardText = brag.bragCard.shareLine;

  trackFunnel(state, "brag_card", {
    score: brag.bragCard.score,
    rank: brag.bragCard.rank,
    tier: brag.bragCard.tier,
  });

  setNotice(state, `자랑 카드 생성: ${brag.bragCard.tier} 티어`, 1600);
}

function updateCombat(state, dtMs, rng) {
  const dtSec = dtMs / 1000;
  const hero = state.hero;
  const enemy = state.enemy;

  hero.hp = clamp(hero.hp + hero.regenPerSecond * dtSec, 0, hero.maxHp);
  hero.attackCooldownMs -= dtMs;
  enemy.attackCooldownMs -= dtMs;

  while (hero.attackCooldownMs <= 0 && enemy.hp > 0) {
    hero.attackCooldownMs += hero.attackIntervalMs;
    const isCrit = rng() < hero.critChance;
    const damage = Math.floor(hero.attack * (isCrit ? hero.critMultiplier : 1));
    enemy.hp = Math.max(0, enemy.hp - damage);
    state.debug.lastHeroHit = damage;
    state.debug.lastHitWasCrit = isCrit;
  }

  if (enemy.hp <= 0) {
    grantBattleRewards(state, enemy);
    return;
  }

  while (enemy.attackCooldownMs <= 0 && hero.hp > 0) {
    enemy.attackCooldownMs += enemy.attackIntervalMs;
    hero.hp = Math.max(0, hero.hp - enemy.attack);
    state.debug.lastEnemyHit = enemy.attack;
  }

  if (hero.hp <= 0) {
    state.mode = "gameover";
    setNotice(state, "패배: ENTER로 재도전", 2400);
    trackEvent(state, "battle_result", {
      outcome: "defeat",
      stage: state.progression.stage,
      enemy: enemy.name,
    });
    trackEvent(state, "session_end", {
      stage: state.progression.stage,
      kills: state.progression.kills,
      score: computePowerScore(state),
    });
  }
}

function toPlayingState(state) {
  const next = cloneState(state);
  next.mode = "playing";
  next.ui.notice = "E 또는 [검 강화] 버튼으로 강화하세요";
  next.ui.noticeTtlMs = 2600;
  next.season = getActiveSeason(next.liveOps);

  const joined = joinGuild(next.social, next.playerId, next.social.guildId);
  next.social = joined.socialState;

  trackEvent(next, "session_start", {
    season: next.season.id,
    guild: next.social.guildId,
  });
  trackFunnel(next, "session_start", {
    season: next.season.id,
  });

  return next;
}

function resetRunState(previousState) {
  const fresh = createInitialGameState();
  fresh.social = previousState.social;
  fresh.socialUi.showLeaderboard = true;
  fresh.wallet = previousState.wallet;
  fresh.payment = previousState.payment;
  fresh.monetization = previousState.monetization;
  fresh.analytics = previousState.analytics;
  fresh.liveOps = previousState.liveOps;
  fresh.season = getActiveSeason(fresh.liveOps);

  fresh.sword = {
    ...previousState.sword,
    lastResult: "none",
    lastRoll: null,
    effectTtlMs: 0,
  };
  const swordAttackBonus = Number.isFinite(fresh.sword.attackBonus) ? fresh.sword.attackBonus : 0;
  fresh.hero.attack += swordAttackBonus;

  return toPlayingState(fresh);
}

export function updateGame(state, input, dtMs, rng = Math.random) {
  if (state.mode === "start") {
    if (input.start) {
      return toPlayingState(state);
    }
    return state;
  }

  if (state.mode === "gameover") {
    if (input.restart || input.start) {
      return resetRunState(state);
    }
    return state;
  }

  const next = cloneState(state);
  next.elapsedMs += dtMs;
  next.ui.pulseMs = (next.ui.pulseMs + dtMs) % 1000;
  next.ui.noticeTtlMs = Math.max(0, next.ui.noticeTtlMs - dtMs);
  if (next.ui.noticeTtlMs === 0) next.ui.notice = "";

  next.sword.effectTtlMs = Math.max(0, next.sword.effectTtlMs - dtMs);
  next.sword.sparklePhaseMs = (next.sword.sparklePhaseMs + dtMs) % 3600;

  if (input.enhanceSword) tryEnhanceSword(next, rng);
  if (input.checkoutOrConvenience) tryStarterPackCheckout(next);
  if (input.claimChest) applyChestClaim(next);
  if (input.submitScore) trySubmitScore(next);
  if (input.generateBragCard) tryGenerateBragCard(next);

  updateChest(next, dtMs);
  updateCombat(next, dtMs, rng);

  const entitlements = getEntitlements(next.payment);
  if (entitlements.starter_pack && !next.monetization.starterPackPurchased) {
    next.monetization.starterPackPurchased = true;
  }

  return next;
}

export function getUiSnapshot(state) {
  const balance = getBalance(state.wallet);
  const leaderboard = getLeaderboard(state.social, "guild", state.season.id).leaderboard;
  return {
    gold: balance.soft,
    gems: balance.premium,
    leaderboard,
    swordCost: getSwordEnhanceCost(state.sword.level),
    swordSuccessRate: getSwordEnhanceSuccessRate(state.sword.level),
  };
}
