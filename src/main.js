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

function bindMobileControls(inputAdapter) {
  const root = document.getElementById("mobile-controls");
  if (!root) return () => {};

  const cleaners = [];
  const supportsPointer = typeof window !== "undefined" && "PointerEvent" in window;
  const touchCapable =
    typeof navigator !== "undefined" &&
    (navigator.maxTouchPoints > 0 || "ontouchstart" in window);
  const useTouchInputPath = touchCapable;

  if (touchCapable) {
    root.classList.add("force-visible");
  }

  function addListener(element, type, handler, options) {
    element.addEventListener(type, handler, options);
    cleaners.push(() => element.removeEventListener(type, handler, options));
  }

  function findTouchById(touchList, id) {
    for (let i = 0; i < touchList.length; i += 1) {
      if (touchList[i].identifier === id) return touchList[i];
    }
    return null;
  }

  const joystickBase = root.querySelector("#joystick-base");
  const joystickKnob = root.querySelector("#joystick-knob");
  if (joystickBase instanceof HTMLElement && joystickKnob instanceof HTMLElement) {
    let joystickPointerId = null;
    let joystickTouchId = null;
    let mouseDragging = false;

    const resetJoystick = () => {
      inputAdapter.setAxes(0, 0);
      joystickBase.classList.remove("active");
      joystickKnob.style.transform = "translate(-50%, -50%)";
    };

    const updateJoystick = (clientX, clientY) => {
      const rect = joystickBase.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = rect.width * 0.38;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const clampedDistance = Math.min(distance, maxRadius);
      const ratio = distance > 0 ? clampedDistance / distance : 0;
      const clampedDx = dx * ratio;
      const clampedDy = dy * ratio;
      const normalizedX = maxRadius > 0 ? clampedDx / maxRadius : 0;
      const normalizedY = maxRadius > 0 ? clampedDy / maxRadius : 0;
      inputAdapter.setAxes(normalizedX, normalizedY);
      joystickKnob.style.transform = `translate(calc(-50% + ${clampedDx}px), calc(-50% + ${clampedDy}px))`;
    };

    const startJoystick = (clientX, clientY) => {
      joystickBase.classList.add("active");
      updateJoystick(clientX, clientY);
    };

    if (supportsPointer && !useTouchInputPath) {
      const onJoystickDown = (event) => {
        joystickPointerId = event.pointerId;
        if (joystickBase.setPointerCapture) joystickBase.setPointerCapture(event.pointerId);
        startJoystick(event.clientX, event.clientY);
        event.preventDefault();
      };

      const onJoystickMove = (event) => {
        if (joystickPointerId === null || event.pointerId !== joystickPointerId) return;
        updateJoystick(event.clientX, event.clientY);
        event.preventDefault();
      };

      const onJoystickUp = (event) => {
        if (joystickPointerId === null || event.pointerId !== joystickPointerId) return;
        joystickPointerId = null;
        resetJoystick();
        event.preventDefault();
      };

      addListener(joystickBase, "pointerdown", onJoystickDown);
      addListener(joystickBase, "pointermove", onJoystickMove);
      addListener(joystickBase, "pointerup", onJoystickUp);
      addListener(joystickBase, "pointercancel", onJoystickUp);
      addListener(joystickBase, "lostpointercapture", onJoystickUp);
    } else {
      const onTouchStart = (event) => {
        const touch = event.changedTouches[0];
        if (!touch) return;
        joystickTouchId = touch.identifier;
        startJoystick(touch.clientX, touch.clientY);
        event.preventDefault();
      };

      const onTouchMove = (event) => {
        if (joystickTouchId === null) return;
        const touch =
          findTouchById(event.changedTouches, joystickTouchId) ||
          findTouchById(event.touches, joystickTouchId);
        if (!touch) return;
        updateJoystick(touch.clientX, touch.clientY);
        event.preventDefault();
      };

      const onTouchEnd = (event) => {
        if (joystickTouchId === null) return;
        const endedTouch = findTouchById(event.changedTouches, joystickTouchId);
        if (!endedTouch) return;
        joystickTouchId = null;
        resetJoystick();
        event.preventDefault();
      };

      const onMouseDown = (event) => {
        mouseDragging = true;
        startJoystick(event.clientX, event.clientY);
        event.preventDefault();
      };

      const onMouseMove = (event) => {
        if (!mouseDragging) return;
        updateJoystick(event.clientX, event.clientY);
        event.preventDefault();
      };

      const onMouseUp = (event) => {
        if (!mouseDragging) return;
        mouseDragging = false;
        resetJoystick();
        event.preventDefault();
      };

      addListener(joystickBase, "touchstart", onTouchStart, { passive: false });
      addListener(window, "touchmove", onTouchMove, { passive: false });
      addListener(window, "touchend", onTouchEnd, { passive: false });
      addListener(window, "touchcancel", onTouchEnd, { passive: false });
      addListener(joystickBase, "mousedown", onMouseDown);
      addListener(window, "mousemove", onMouseMove);
      addListener(window, "mouseup", onMouseUp);
    }
    addListener(joystickBase, "contextmenu", (event) => event.preventDefault());
    cleaners.push(resetJoystick);
  }

  const pressButtons = root.querySelectorAll("[data-press]");
  for (const button of pressButtons) {
    if (!(button instanceof HTMLButtonElement)) continue;
    const action = button.dataset.press;
    if (!action) continue;

    const activate = (event) => {
      button.classList.add("active");
      inputAdapter.press(action);
      event.preventDefault();
    };

    const deactivate = (event) => {
      button.classList.remove("active");
      event.preventDefault();
    };

    if (supportsPointer && !useTouchInputPath) {
      addListener(button, "pointerdown", activate);
      addListener(button, "pointerup", deactivate);
      addListener(button, "pointercancel", deactivate);
      addListener(button, "pointerleave", deactivate);
    } else {
      addListener(button, "touchstart", activate, { passive: false });
      addListener(button, "touchend", deactivate, { passive: false });
      addListener(button, "touchcancel", deactivate, { passive: false });
      addListener(button, "mousedown", activate);
      addListener(button, "mouseup", deactivate);
      addListener(button, "mouseleave", deactivate);
    }
    addListener(button, "click", (event) => event.preventDefault());
    addListener(button, "contextmenu", (event) => event.preventDefault());
  }

  return () => {
    for (const clean of cleaners) clean();
  };
}

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
const unbindMobileControls = bindMobileControls(input);

window.render_game_to_text = () => {
  const boss = state.enemies.find((enemy) => enemy.type === "boss");
  const payload = {
    coordinateSystem: "origin=(0,0) top-left, +x right, +y down",
    mode: state.mode,
    elapsedMs: Math.round(state.elapsedMs),
    score: Math.floor(state.score),
    bestScore: Math.floor(state.bestScore),
    stage: {
      number: state.stage?.number ?? 1,
      phase: state.stage?.phase ?? "normal",
      phaseElapsedMs: Math.round(state.stage?.phaseElapsedMs ?? 0),
      normalDurationMs: state.stage?.normalDurationMs ?? 22000,
    },
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
      type: enemy.type ?? "normal",
      x: Math.round(enemy.x),
      y: Math.round(enemy.y),
      radius: enemy.radius,
      hp: enemy.hp ?? 1,
      maxHp: enemy.maxHp ?? 1,
    })),
    shards: state.shards.map((shard) => ({
      id: shard.id,
      x: Math.round(shard.x),
      y: Math.round(shard.y),
      radius: shard.radius,
    })),
    boss: boss
      ? {
          id: boss.id,
          hp: boss.hp ?? 1,
          maxHp: boss.maxHp ?? 1,
        }
      : null,
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
  unbindMobileControls();
  input.destroy();
  loop.stop();
});

render();
loop.start();
