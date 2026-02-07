import { createFixedStepLoop } from "./engine/loop.js";
import { createInputAdapter } from "./game/input.js";
import { renderGame } from "./game/render.js";
import { GAME_HEIGHT, GAME_WIDTH, createInitialGameState } from "./game/state.js";
import { updateGame } from "./game/update.js";

const STEP_MS = 1000 / 60;

const canvas = document.getElementById("game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #game-canvas");
}
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D context unavailable");

const input = createInputAdapter();
let state = createInitialGameState();
let manualStepping = false;

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function tick(dtMs) {
  const command = input.poll();
  if (command.toggleFullscreen) toggleFullscreen();
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

window.render_game_to_text = () => {
  const payload = {
    coordinateSystem: "origin=(0,0) top-left, +x right, +y down",
    mode: state.mode,
    elapsedMs: Math.round(state.elapsedMs),
    score: Math.floor(state.score),
    bestScore: Math.floor(state.bestScore),
    player: {
      x: Math.round(state.player.x),
      y: Math.round(state.player.y),
      radius: state.player.radius,
      hp: state.player.hp,
      invulnerableMs: Math.round(state.player.invulnerableMs),
    },
    burst: {
      radius: state.burst.radius,
      cooldownRemainingMs: Math.round(state.burst.cooldownRemainingMs),
      activeRemainingMs: Math.round(state.burst.activeRemainingMs),
    },
    chain: {
      count: state.chain.count,
      multiplier: Number(state.chain.multiplier.toFixed(2)),
      windowRemainingMs: Math.round(state.chain.windowRemainingMs),
      bestCount: state.chain.bestCount,
      lastBurstKills: state.chain.lastBurstKills,
    },
    enemies: state.enemies.map((enemy) => ({
      id: enemy.id,
      x: Math.round(enemy.x),
      y: Math.round(enemy.y),
      radius: enemy.radius,
    })),
    shards: state.shards.map((shard) => ({
      id: shard.id,
      x: Math.round(shard.x),
      y: Math.round(shard.y),
      radius: shard.radius,
    })),
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
  input.destroy();
  loop.stop();
});

render();
loop.start();
