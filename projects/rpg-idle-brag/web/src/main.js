import { createFixedStepLoop } from "./engine/loop.js";
import { createInputAdapter } from "./game/input.js";
import { renderGame } from "./game/render.js";
import { createInitialGameState } from "./game/state.js";
import { getUiSnapshot, updateGame } from "./game/update.js";

const STEP_MS = 1000 / 60;

const canvas = document.getElementById("game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #game-canvas");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D context unavailable");
}

const input = createInputAdapter();
let state = createInitialGameState();
let manualStepping = false;

function bindQuickActions(inputAdapter) {
  const root = document.getElementById("quick-actions");
  if (!root) return () => {};

  const handlers = [];
  const buttons = root.querySelectorAll("[data-action]");
  for (const button of buttons) {
    if (!(button instanceof HTMLButtonElement)) continue;
    const action = button.dataset.action;
    if (!action) continue;

    const handler = (event) => {
      inputAdapter.press(action);
      event.preventDefault();
    };
    button.addEventListener("click", handler);
    handlers.push(() => button.removeEventListener("click", handler));
  }

  return () => {
    for (const clean of handlers) clean();
  };
}

function tick(dtMs) {
  const command = input.poll();
  state = updateGame(state, command, dtMs);
}

function render() {
  renderGame(ctx, state);
}

const loop = createFixedStepLoop({
  stepMs: STEP_MS,
  update(stepMs) {
    if (manualStepping) return;
    tick(stepMs);
  },
  render,
});

const unbindQuickActions = bindQuickActions(input);

window.render_game_to_text = () => {
  const ui = getUiSnapshot(state);
  const payload = {
    coordinateSystem: "origin=(0,0) top-left, +x right, +y down",
    mode: state.mode,
    elapsedMs: Math.round(state.elapsedMs),
    hero: {
      level: state.hero.level,
      hp: Number(state.hero.hp.toFixed(1)),
      maxHp: state.hero.maxHp,
      attack: state.hero.attack,
      critChance: Number(state.hero.critChance.toFixed(3)),
      xp: Number(state.hero.xp.toFixed(1)),
      xpToNext: state.hero.xpToNext,
    },
    sword: {
      level: state.sword.level,
      tier: state.sword.tier,
      attemptCount: state.sword.enhanceAttemptCount,
      lastResult: state.sword.lastResult,
      nextCostGold: ui.swordCost,
      nextSuccessRate: Number(ui.swordSuccessRate.toFixed(3)),
    },
    progression: {
      stage: state.progression.stage,
      kills: state.progression.kills,
      bossKills: state.progression.bossKills,
      lastScoreSubmitted: state.progression.lastScoreSubmitted,
    },
    enemy: {
      name: state.enemy.name,
      boss: state.enemy.boss,
      hp: Number(state.enemy.hp.toFixed(1)),
      maxHp: state.enemy.maxHp,
      attack: state.enemy.attack,
      rewardGold: state.enemy.rewardGold,
      rewardXp: state.enemy.rewardXp,
    },
    economy: {
      gold: ui.gold,
      gems: ui.gems,
      chest: {
        claimable: state.economy.chest.claimable,
        fillRatio: Number((state.economy.chest.chargeMs / state.economy.chest.intervalMs).toFixed(3)),
      },
      convenienceSlotCost: 40 + state.monetization.convenienceSlots * 24,
    },
    monetization: {
      starterPackPurchased: state.monetization.starterPackPurchased,
      convenienceSlots: state.monetization.convenienceSlots,
      activeSkin: state.monetization.activeSkin,
      lastCheckoutResult: state.monetization.lastCheckoutResult,
    },
    social: {
      guild: state.social.guildId,
      leaderboardTop3: ui.leaderboard.slice(0, 3),
      lastRank: state.socialUi.lastRank,
      lastBragCardText: state.socialUi.lastBragCardText,
    },
    analytics: {
      acceptedEventCount: state.analytics.acceptedEvents.length,
      rejectedEventCount: state.analytics.rejectedEvents.length,
      latestEventName: state.analytics.acceptedEvents.at(-1)?.eventName ?? null,
    },
  };
  return JSON.stringify(payload);
};

window.advanceTime = (ms) => {
  manualStepping = true;
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  for (let i = 0; i < steps; i += 1) {
    tick(STEP_MS);
  }
  render();
  manualStepping = false;
};

window.addEventListener("beforeunload", () => {
  unbindQuickActions();
  input.destroy();
  loop.stop();
});

render();
loop.start();
