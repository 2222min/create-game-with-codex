const ACTIVE_SEASON = {
  id: "S1-AETHER-RALLY",
  name: "Aether Rally",
  missionId: "defeat-25",
  missionTarget: 25,
};

export function createLiveOpsState() {
  return {
    activeSeason: { ...ACTIVE_SEASON },
    missionProgressByPlayer: {},
    missionClaimLedger: {},
    passTierClaimLedger: {},
  };
}

function getPlayerProgress(liveOpsState, playerId) {
  return (
    liveOpsState.missionProgressByPlayer[playerId] ?? {
      missionId: ACTIVE_SEASON.missionId,
      kills: 0,
      completed: false,
    }
  );
}

export function getActiveSeason(liveOpsState) {
  return { ...liveOpsState.activeSeason };
}

export function recordMissionEvent(liveOpsState, playerId, eventPayload) {
  const progress = getPlayerProgress(liveOpsState, playerId);
  const killDelta = Math.max(0, Math.floor(eventPayload?.killCount ?? 0));
  const nextKills = progress.kills + killDelta;
  const completed = nextKills >= liveOpsState.activeSeason.missionTarget;

  const nextProgress = {
    ...progress,
    kills: nextKills,
    completed,
  };

  return {
    liveOpsState: {
      ...liveOpsState,
      missionProgressByPlayer: {
        ...liveOpsState.missionProgressByPlayer,
        [playerId]: nextProgress,
      },
    },
    progress: nextProgress,
  };
}

export function claimMissionReward(liveOpsState, playerId, missionId) {
  const progress = getPlayerProgress(liveOpsState, playerId);
  const alreadyClaimed = Boolean(liveOpsState.missionClaimLedger[`${playerId}:${missionId}`]);
  if (!progress.completed || alreadyClaimed) {
    return {
      liveOpsState,
      claimStatus: "rejected",
      rewards: [],
    };
  }

  const key = `${playerId}:${missionId}`;
  return {
    liveOpsState: {
      ...liveOpsState,
      missionClaimLedger: {
        ...liveOpsState.missionClaimLedger,
        [key]: true,
      },
    },
    claimStatus: "completed",
    rewards: [{ currency: "premium", amount: 30, reason: "mission_reward" }],
  };
}

export function claimPassTierReward(liveOpsState, playerId, tierId) {
  const key = `${playerId}:${tierId}`;
  if (liveOpsState.passTierClaimLedger[key]) {
    return {
      liveOpsState,
      claimStatus: "rejected",
      rewards: [],
    };
  }

  return {
    liveOpsState: {
      ...liveOpsState,
      passTierClaimLedger: {
        ...liveOpsState.passTierClaimLedger,
        [key]: true,
      },
    },
    claimStatus: "completed",
    rewards: [{ currency: "premium", amount: 20, reason: "pass_tier_reward" }],
  };
}
