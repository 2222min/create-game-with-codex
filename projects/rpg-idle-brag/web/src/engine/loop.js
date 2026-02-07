export function createFixedStepLoop({ stepMs = 1000 / 60, maxSubSteps = 8, update, render }) {
  let running = false;
  let rafId = 0;
  let lastTs = 0;
  let accumulatorMs = 0;

  function frame(ts) {
    if (!running) return;

    if (!lastTs) lastTs = ts;
    let deltaMs = ts - lastTs;
    lastTs = ts;
    if (deltaMs > 250) deltaMs = 250;
    accumulatorMs += deltaMs;

    let subSteps = 0;
    while (accumulatorMs >= stepMs && subSteps < maxSubSteps) {
      update(stepMs);
      accumulatorMs -= stepMs;
      subSteps += 1;
    }

    if (subSteps >= maxSubSteps) {
      accumulatorMs = 0;
    }

    render();
    rafId = window.requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTs = 0;
      accumulatorMs = 0;
      rafId = window.requestAnimationFrame(frame);
    },
    stop() {
      if (!running) return;
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    },
  };
}
