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

  function setHold(direction, value) {
    if (!(direction in held)) return;
    held[direction] = value;
  }

  function press(action) {
    if (action === "burst") {
      oneShot.burst = true;
      oneShot.start = true;
      return;
    }
    if (action === "start") {
      oneShot.start = true;
      return;
    }
    if (action === "restart") {
      oneShot.restart = true;
      return;
    }
    if (action === "toggleFullscreen") {
      oneShot.toggleFullscreen = true;
    }
  }

  function onKeyDown(event) {
    const mapped = HOLD_KEYS[event.code];
    if (mapped) {
      setHold(mapped, true);
      event.preventDefault();
    }
    if (!event.repeat) {
      if (event.code === "Space") {
        press("burst");
        event.preventDefault();
      } else if (event.code === "Enter") {
        press("start");
        press("restart");
        event.preventDefault();
      } else if (event.code === "KeyR") {
        press("restart");
      } else if (event.code === "KeyF") {
        press("toggleFullscreen");
      }
    }
  }

  function onKeyUp(event) {
    const mapped = HOLD_KEYS[event.code];
    if (mapped) {
      setHold(mapped, false);
      event.preventDefault();
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return {
    setHold,
    press,
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
