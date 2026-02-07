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
    stage: {
      current: state.progression.currentStage,
      selected: state.progression.selectedStage,
      highestCleared: state.progression.highestClearedStage,
      totalBossKills: state.progression.totalBossKills,
    },
    resources: {
      gold: state.resources.gold,
      gems: state.resources.gems,
      summonStone: state.resources.summonStone,
    },
    hero: {
      hp: Math.round(state.hero.hp),
      maxHp: state.hero.maxHp,
      attack: ui.heroAttack,
      combo: state.hero.comboCount,
      action: state.hero.lastAction,
      cooldowns: {
        attackMs: Math.round(state.hero.attackCooldownMs),
        guardMs: Math.round(state.hero.guardCooldownMs),
        dodgeMs: Math.round(state.hero.dodgeCooldownMs),
      },
      windows: {
        guardMs: Math.round(state.hero.guardWindowMs),
        dodgeMs: Math.round(state.hero.dodgeWindowMs),
      },
    },
    equippedSword: ui.equippedSword,
    inventoryCount: ui.inventoryCount,
    summonResults: ui.lastSummonResults,
    battle: {
      phase: state.battle.phase,
      pendingPattern: state.battle.pendingPattern,
      telegraphMs: Math.round(state.battle.telegraphMs),
      floatingText: state.battle.floatingText,
      boss: ui.boss,
    },
    notice: state.ui.notice,
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
