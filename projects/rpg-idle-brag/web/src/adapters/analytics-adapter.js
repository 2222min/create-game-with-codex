const REQUIRED_EVENTS = new Set([
  "session_start",
  "session_end",
  "battle_result",
  "upgrade_applied",
  "payment_attempt",
  "payment_success",
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function createAnalyticsState() {
  return {
    acceptedEvents: [],
    rejectedEvents: [],
  };
}

function ingest(analyticsState, eventName, payload, context) {
  if (typeof eventName !== "string" || !eventName.length || !isObject(payload)) {
    const rejection = {
      eventName,
      payload,
      context,
      error: "invalid_schema",
    };
    return {
      accepted: false,
      analyticsState: {
        ...analyticsState,
        rejectedEvents: [...analyticsState.rejectedEvents, rejection],
      },
      error: rejection.error,
    };
  }

  const acceptedEvent = {
    eventName,
    payload,
    context,
    requiredEvent: REQUIRED_EVENTS.has(eventName),
  };

  return {
    accepted: true,
    analyticsState: {
      ...analyticsState,
      acceptedEvents: [...analyticsState.acceptedEvents, acceptedEvent],
    },
    error: null,
  };
}

export function track(analyticsState, eventName, payload, context) {
  return ingest(analyticsState, eventName, payload, context);
}

export function trackRevenue(analyticsState, payload, context) {
  return ingest(analyticsState, "payment_success", payload, context);
}

export function trackFunnelStep(analyticsState, payload, context) {
  const step = typeof payload?.step === "string" && payload.step.length > 0 ? payload.step : "unknown";
  return ingest(
    analyticsState,
    `funnel_${step}`,
    payload,
    context
  );
}
