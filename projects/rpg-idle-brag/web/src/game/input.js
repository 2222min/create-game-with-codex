const KEY_TO_ACTION = {
  Enter: "startBattle",
  Escape: "openHome",
  KeyH: "openHome",
  KeyM: "openStageMap",
  KeyF: "openForge",
  KeyG: "openSummon",
  KeyB: "startBattle",
  KeyJ: "attack",
  KeyK: "guard",
  KeyL: "dodge",
  KeyU: "upgradeSword",
  Digit1: "summonOne",
  Digit0: "summonTen",
  KeyE: "equipNext",
  ArrowLeft: "previousStage",
  ArrowRight: "nextStage",
};

export function createInputAdapter() {
  const oneShot = {
    openHome: false,
    openStageMap: false,
    openForge: false,
    openSummon: false,
    startBattle: false,
    attack: false,
    guard: false,
    dodge: false,
    upgradeSword: false,
    summonOne: false,
    summonTen: false,
    equipNext: false,
    previousStage: false,
    nextStage: false,
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
