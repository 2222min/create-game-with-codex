function drawBackground(ctx, width, height, elapsedMs) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#052139");
  grad.addColorStop(0.5, "#032033");
  grad.addColorStop(1, "#010f1b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const offset = (elapsedMs * 0.02) % 40;
  ctx.strokeStyle = "rgba(111, 212, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let x = -40 + offset; x <= width + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = -40 + offset; y <= height + 40; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = "rgba(4, 20, 35, 0.82)";
  ctx.fillRect(14, 12, 336, 96);
  ctx.strokeStyle = "rgba(105, 190, 235, 0.45)";
  ctx.strokeRect(14, 12, 336, 96);

  ctx.fillStyle = "#d9f3ff";
  ctx.font = "16px 'Trebuchet MS', sans-serif";
  ctx.fillText(`HP ${state.player.hp}/${state.player.maxHp}`, 24, 34);
  ctx.fillText(`Score ${Math.floor(state.score)}`, 24, 56);

  const meterWidth = 92;
  const progress =
    state.burst.cooldownMs <= 0
      ? 1
      : 1 - Math.min(1, state.burst.cooldownRemainingMs / state.burst.cooldownMs);
  ctx.fillStyle = "rgba(6, 33, 51, 0.95)";
  ctx.fillRect(150, 42, meterWidth, 14);
  ctx.fillStyle = progress >= 1 ? "#46fbff" : "#2ea8d8";
  ctx.fillRect(150, 42, meterWidth * progress, 14);
  ctx.strokeStyle = "#77d6f8";
  ctx.strokeRect(150, 42, meterWidth, 14);
  ctx.fillStyle = "#d9f3ff";
  ctx.font = "12px 'Trebuchet MS', sans-serif";
  ctx.fillText("Burst", 150, 38);

  const chainWindowProgress =
    state.chain.windowDurationMs <= 0
      ? 0
      : Math.min(1, state.chain.windowRemainingMs / state.chain.windowDurationMs);
  const chainLabel =
    state.chain.count > 0
      ? `Chain x${state.chain.count}  Mult x${state.chain.multiplier.toFixed(1)}`
      : "Chain idle";
  ctx.fillStyle = state.chain.count > 0 ? "#7ff8ff" : "#a5c8d8";
  ctx.font = "14px 'Trebuchet MS', sans-serif";
  ctx.fillText(chainLabel, 24, 84);
  ctx.fillStyle = "rgba(6, 33, 51, 0.95)";
  ctx.fillRect(150, 72, 180, 12);
  ctx.fillStyle = chainWindowProgress > 0 ? "#71ffe2" : "#2b5d71";
  ctx.fillRect(150, 72, 180 * chainWindowProgress, 12);
  ctx.strokeStyle = "#77d6f8";
  ctx.strokeRect(150, 72, 180, 12);
  ctx.fillStyle = "#d9f3ff";
  ctx.font = "11px 'Trebuchet MS', sans-serif";
  ctx.fillText("Chain Window", 150, 68);
}

function drawEntities(ctx, state) {
  if (state.burst.activeRemainingMs > 0) {
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.burst.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(73, 242, 255, 0.14)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(104, 251, 255, 0.9)";
    ctx.stroke();
  }

  for (const enemy of state.enemies) {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ff5f7d";
    ctx.fill();
    ctx.strokeStyle = "#ffd4db";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  for (const shard of state.shards) {
    ctx.beginPath();
    ctx.arc(shard.x, shard.y, shard.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffe76d";
    ctx.fill();
    ctx.strokeStyle = "#fff8ca";
    ctx.stroke();
  }

  const alpha = state.player.invulnerableMs > 0 ? 0.65 : 1;
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(67, 242, 255, ${alpha})`;
  ctx.fill();
  ctx.strokeStyle = "rgba(223, 255, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCenteredPanel(ctx, width, height, title, lines) {
  const panelW = 520;
  const panelH = 240;
  const x = (width - panelW) / 2;
  const y = (height - panelH) / 2;
  ctx.fillStyle = "rgba(3, 16, 27, 0.86)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.strokeStyle = "rgba(123, 214, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, panelW, panelH);

  ctx.textAlign = "center";
  ctx.fillStyle = "#56efff";
  ctx.font = "42px 'Trebuchet MS', sans-serif";
  ctx.fillText(title, width / 2, y + 68);

  ctx.fillStyle = "#d4ecfa";
  ctx.font = "20px 'Trebuchet MS', sans-serif";
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], width / 2, y + 112 + i * 32);
  }
  ctx.textAlign = "left";
}

export function renderGame(ctx, state) {
  const { width, height } = state.bounds;
  drawBackground(ctx, width, height, state.elapsedMs);
  drawEntities(ctx, state);
  drawHud(ctx, state);

  if (state.mode === "start") {
    drawCenteredPanel(ctx, width, height, "Pulse Drift", [
      "Press Enter or Space to Start",
      "WASD / Arrow: Move  |  Space: Pulse Burst",
      "Chain bursts for score multiplier",
    ]);
  }

  if (state.mode === "gameover") {
    drawCenteredPanel(ctx, width, height, "Game Over", [
      `Score ${Math.floor(state.score)}  |  Best ${Math.floor(state.bestScore)}`,
      "Press R or Enter to Restart",
    ]);
  }
}
