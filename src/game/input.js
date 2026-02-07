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

const DIRECTIONS = ["left", "right", "up", "down"];
const AXIS_THRESHOLD = 0.28;

export function createInputAdapter() {
  const keyboardHeld = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  const virtualHeld = {
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

  function setHold(direction, value, source = "virtual") {
    if (!DIRECTIONS.includes(direction)) return;
    if (source === "keyboard") {
      keyboardHeld[direction] = value;
      return;
    }
    virtualHeld[direction] = value;
  }

  function setAxes(x, y) {
    const nx = Math.max(-1, Math.min(1, Number.isFinite(x) ? x : 0));
    const ny = Math.max(-1, Math.min(1, Number.isFinite(y) ? y : 0));
    setHold("left", nx <= -AXIS_THRESHOLD, "virtual");
    setHold("right", nx >= AXIS_THRESHOLD, "virtual");
    setHold("up", ny <= -AXIS_THRESHOLD, "virtual");
    setHold("down", ny >= AXIS_THRESHOLD, "virtual");
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
      setHold(mapped, true, "keyboard");
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
      setHold(mapped, false, "keyboard");
      event.preventDefault();
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return {
    setHold,
    setAxes,
    press,
    poll() {
      const out = {
        left: keyboardHeld.left || virtualHeld.left,
        right: keyboardHeld.right || virtualHeld.right,
        up: keyboardHeld.up || virtualHeld.up,
        down: keyboardHeld.down || virtualHeld.down,
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
