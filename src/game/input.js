const HOLD_KEYS = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
};

export function createInputAdapter() {
  const held = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  const oneShot = {
    burst: false,
    start: false,
    restart: false,
    toggleFullscreen: false,
  };

  function onKeyDown(event) {
    const mapped = HOLD_KEYS[event.code];
    if (mapped) {
      held[mapped] = true;
      event.preventDefault();
    }
    if (!event.repeat) {
      if (event.code === "Space") {
        oneShot.burst = true;
        oneShot.start = true;
        event.preventDefault();
      } else if (event.code === "Enter") {
        oneShot.start = true;
        oneShot.restart = true;
        event.preventDefault();
      } else if (event.code === "KeyR") {
        oneShot.restart = true;
      } else if (event.code === "KeyF") {
        oneShot.toggleFullscreen = true;
      }
    }
  }

  function onKeyUp(event) {
    const mapped = HOLD_KEYS[event.code];
    if (mapped) {
      held[mapped] = false;
      event.preventDefault();
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return {
    poll() {
      const out = {
        left: held.left,
        right: held.right,
        up: held.up,
        down: held.down,
        burst: oneShot.burst,
        start: oneShot.start,
        restart: oneShot.restart,
        toggleFullscreen: oneShot.toggleFullscreen,
      };
      oneShot.burst = false;
      oneShot.start = false;
      oneShot.restart = false;
      oneShot.toggleFullscreen = false;
      return out;
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
