function cloneLeaderboard(list) {
  return list.map((entry) => ({ ...entry }));
}

function toTier(score) {
  if (score >= 5200) return "Mythic";
  if (score >= 3400) return "Diamond";
  if (score >= 2200) return "Platinum";
  if (score >= 1200) return "Gold";
  return "Silver";
}

export function createSocialState() {
  return {
    guildId: "GUILD-ALPHA",
    leaderboard: [
      { playerId: "bot-sora", nickname: "Sora", score: 4100 },
      { playerId: "bot-nox", nickname: "Nox", score: 3550 },
      { playerId: "bot-lin", nickname: "Lin", score: 2850 },
    ],
    lastBragCard: null,
  };
}

export function joinGuild(socialState, playerId, guildCode) {
  return {
    socialState: {
      ...socialState,
      guildId: guildCode,
    },
    joined: true,
    playerId,
    guildCode,
  };
}

export function submitScore(socialState, playerId, seasonId, scorePayload) {
  const nextLeaderboard = cloneLeaderboard(socialState.leaderboard).filter((entry) => entry.playerId !== playerId);
  nextLeaderboard.push({
    playerId,
    nickname: scorePayload.nickname,
    score: Math.floor(scorePayload.score),
  });
  nextLeaderboard.sort((a, b) => b.score - a.score);

  const rank = nextLeaderboard.findIndex((entry) => entry.playerId === playerId) + 1;
  return {
    socialState: {
      ...socialState,
      leaderboard: nextLeaderboard,
    },
    rank,
    seasonId,
  };
}

export function getLeaderboard(socialState, scope, seasonId) {
  return {
    scope,
    seasonId,
    leaderboard: cloneLeaderboard(socialState.leaderboard),
  };
}

export function generateBragCardData(socialState, playerId, seasonId) {
  const rank = socialState.leaderboard.findIndex((entry) => entry.playerId === playerId) + 1;
  const playerRow = socialState.leaderboard[rank - 1] ?? {
    playerId,
    nickname: "Unknown",
    score: 0,
  };

  const bragCard = {
    seasonId,
    playerId,
    nickname: playerRow.nickname,
    rank,
    score: playerRow.score,
    tier: toTier(playerRow.score),
    shareLine: `${playerRow.nickname} reached #${rank} in ${seasonId} with ${playerRow.score} points.`,
  };

  return {
    socialState: {
      ...socialState,
      lastBragCard: bragCard,
    },
    bragCard,
  };
}
