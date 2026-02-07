const KEY_TO_ACTION = {
  Enter: "start",
  KeyR: "restart",
  ArrowLeft: "enhanceSword",
  KeyE: "enhanceSword",
  Space: "claimChest",
  KeyB: "checkoutOrConvenience",
  ArrowUp: "submitScore",
  KeyU: "submitScore",
  ArrowDown: "generateBragCard",
  KeyJ: "generateBragCard",
};

export function createInputAdapter() {
  const oneShot = {
    start: false,
    restart: false,
    enhanceSword: false,
    checkoutOrConvenience: false,
    claimChest: false,
    submitScore: false,
    generateBragCard: false,
  };

  function activate(action) {
    if (!Object.hasOwn(oneShot, action)) return;
    oneShot[action] = true;
  }

  function onKeyDown(event) {
    const action = KEY_TO_ACTION[event.code];
    if (!action || event.repeat) return;
    activate(action);
    event.preventDefault();
  }

  window.addEventListener("keydown", onKeyDown);

  return {
    press(action) {
      activate(action);
    },
    poll() {
      const out = { ...oneShot };
      for (const key of Object.keys(oneShot)) {
        oneShot[key] = false;
      }
      return out;
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}
