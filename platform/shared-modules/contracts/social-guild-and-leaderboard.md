# Contract: social-guild-and-leaderboard

## Responsibilities

- Manage friend-code based social graph.
- Manage guild membership.
- Accept and rank season scores.
- Provide brag-card metadata for share surfaces.

## Input

- `player_id`
- `guild_id`
- `season_id`
- `score_payload`

## Output

- rank and tier result
- leaderboard list
- brag-card data object

## Public API

- `SocialService.joinGuild(playerId, guildCode)`
- `SocialService.submitScore(playerId, seasonId, scorePayload)`
- `SocialService.getLeaderboard(scope, seasonId)`
- `SocialService.generateBragCardData(playerId, seasonId)`

## Events

- `event.leaderboard.updated`
- `event.guild.member_joined`
- `event.brag_card.ready`

## Data Ownership

- guild roster
- season ranking table
- social share metadata

## Non-Goals

- Full chat system implementation
