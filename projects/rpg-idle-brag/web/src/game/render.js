import {
  getAttackUpgradeCost,
  getConvenienceSlotCost,
  getCritUpgradeCost,
  getHealthUpgradeCost,
} from "./state.js";
import { getUiSnapshot } from "./update.js";

function drawBackdrop(ctx, width, height, pulseMs) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#142f25");
  grad.addColorStop(0.45, "#1d274a");
  grad.addColorStop(1, "#120f23");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const glow = 0.18 + Math.sin((pulseMs / 1000) * Math.PI * 2) * 0.05;
  ctx.fillStyle = `rgba(122, 247, 206, ${glow})`;
  ctx.beginPath();
  ctx.ellipse(width * 0.75, height * 0.2, 240, 120, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(226, 234, 255, 0.08)";
  for (let y = 54; y < height; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawStatBar(ctx, x, y, width, height, value, max, fillColor, bgColor) {
  const safeMax = Math.max(1, max);
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, width * ratio, height);
  ctx.strokeStyle = "rgba(245, 249, 255, 0.35)";
  ctx.strokeRect(x, y, width, height);
}

function drawHeroPanel(ctx, state, ui) {
  const x = 20;
  const y = 18;
  ctx.fillStyle = "rgba(8, 17, 31, 0.72)";
  ctx.fillRect(x, y, 332, 208);
  ctx.strokeStyle = "rgba(103, 239, 217, 0.55)";
  ctx.strokeRect(x, y, 332, 208);

  ctx.fillStyle = "#b9fce8";
  ctx.font = "700 24px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText("Guild Idle Chronicle", x + 14, y + 34);

  ctx.fillStyle = "#f2f6ff";
  ctx.font = "15px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText(`Lv.${state.hero.level}  Stage ${state.progression.stage}`, x + 14, y + 58);
  ctx.fillText(`Gold ${ui.gold}  Gems ${ui.gems}`, x + 14, y + 80);

  drawStatBar(ctx, x + 14, y + 92, 288, 12, state.hero.hp, state.hero.maxHp, "#53ffc5", "#213447");
  ctx.fillStyle = "#defff8";
  ctx.font = "12px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText(`HP ${Math.floor(state.hero.hp)} / ${state.hero.maxHp}`, x + 14, y + 118);

  drawStatBar(
    ctx,
    x + 14,
    y + 126,
    288,
    10,
    state.hero.xp,
    state.hero.xpToNext,
    "#e8c76d",
    "#2d2f3f"
  );
  ctx.fillStyle = "#ffe9a4";
  ctx.fillText(`XP ${Math.floor(state.hero.xp)} / ${state.hero.xpToNext}`, x + 14, y + 146);

  ctx.fillStyle = "#cae7ff";
  ctx.fillText(`ATK ${state.hero.attack}  CRIT ${(state.hero.critChance * 100).toFixed(0)}%`, x + 14, y + 166);
  ctx.fillText(`Kills ${state.progression.kills}  Boss ${state.progression.bossKills}`, x + 14, y + 184);
  ctx.fillText(`Skin ${state.monetization.activeSkin}`, x + 14, y + 202);
}

function drawEnemyPanel(ctx, state) {
  const panelX = 374;
  const panelY = 54;
  const panelW = 280;
  const panelH = 138;

  ctx.fillStyle = "rgba(20, 10, 27, 0.72)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = state.enemy.boss ? "rgba(255, 166, 166, 0.75)" : "rgba(159, 186, 255, 0.7)";
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = state.enemy.boss ? "#ffb9c3" : "#ccd9ff";
  ctx.font = "700 20px 'Trebuchet MS', 'Segoe UI', sans-serif";
  const prefix = state.enemy.boss ? "BOSS" : "Mob";
  ctx.fillText(`${prefix} | ${state.enemy.name}`, panelX + 14, panelY + 30);

  drawStatBar(
    ctx,
    panelX + 14,
    panelY + 46,
    panelW - 28,
    16,
    state.enemy.hp,
    state.enemy.maxHp,
    state.enemy.boss ? "#ff6e80" : "#9cb9ff",
    "#2c2a40"
  );

  ctx.fillStyle = "#f0f4ff";
  ctx.font = "13px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText(`HP ${Math.floor(state.enemy.hp)} / ${state.enemy.maxHp}`, panelX + 14, panelY + 82);
  ctx.fillText(`Enemy ATK ${state.enemy.attack}`, panelX + 14, panelY + 100);
  ctx.fillText(`Reward ${state.enemy.rewardGold}G / ${state.enemy.rewardXp}XP`, panelX + 14, panelY + 118);
}

function drawActionPanel(ctx, state) {
  const panelX = 20;
  const panelY = 244;
  const panelW = 634;
  const panelH = 132;
  const attackCost = getAttackUpgradeCost(state.economy.attackUpgradeLevel);
  const healthCost = getHealthUpgradeCost(state.economy.healthUpgradeLevel);
  const critCost = getCritUpgradeCost(state.economy.critUpgradeLevel);
  const slotCost = getConvenienceSlotCost(state.monetization.convenienceSlots);

  ctx.fillStyle = "rgba(14, 21, 16, 0.74)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(151, 255, 177, 0.45)";
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#c5ffd4";
  ctx.font = "700 16px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText("Quick Actions", panelX + 14, panelY + 24);

  ctx.font = "13px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillStyle = "#effff4";
  ctx.fillText(`LEFT: ATK 강화 (${attackCost}G)`, panelX + 14, panelY + 48);
  ctx.fillText(`RIGHT: HP 강화 (${healthCost}G)`, panelX + 14, panelY + 68);
  ctx.fillText(`A: CRIT 강화 (${critCost}G)`, panelX + 14, panelY + 88);
  ctx.fillText("SPACE: 오프라인 상자 수령", panelX + 14, panelY + 108);

  ctx.fillText("B: 스타터팩 구매 / 편의 슬롯", panelX + 320, panelY + 48);
  ctx.fillText(`   편의 슬롯 비용 ${slotCost} Gems`, panelX + 320, panelY + 68);
  ctx.fillText("UP: 리더보드 제출  DOWN: 자랑 카드", panelX + 320, panelY + 88);
  ctx.fillText(`상자 ${state.economy.chest.claimable}개 준비`, panelX + 320, panelY + 108);
}

function drawLeaderboard(ctx, state, ui) {
  if (!state.socialUi.showLeaderboard) return;

  const x = 674;
  const y = 18;
  const w = 330;
  const h = 358;
  ctx.fillStyle = "rgba(22, 15, 31, 0.8)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(244, 191, 255, 0.5)";
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#f5d6ff";
  ctx.font = "700 20px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText(`Season ${state.season.name}`, x + 12, y + 30);

  ctx.font = "13px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillStyle = "#f8eefe";
  const rows = ui.leaderboard.slice(0, 8);
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const label = `${i + 1}. ${row.nickname}`;
    const value = `${row.score} pts`;
    const rowY = y + 62 + i * 28;
    const mine = row.playerId === state.playerId;
    if (mine) {
      ctx.fillStyle = "rgba(203, 255, 232, 0.18)";
      ctx.fillRect(x + 8, rowY - 16, w - 16, 22);
      ctx.fillStyle = "#bfffe1";
    } else {
      ctx.fillStyle = "#f8eefe";
    }
    ctx.fillText(label, x + 14, rowY);
    ctx.fillText(value, x + 200, rowY);
  }

  if (state.social.lastBragCard) {
    const card = state.social.lastBragCard;
    ctx.fillStyle = "rgba(255, 230, 173, 0.16)";
    ctx.fillRect(x + 10, y + h - 96, w - 20, 80);
    ctx.strokeStyle = "rgba(255, 229, 157, 0.5)";
    ctx.strokeRect(x + 10, y + h - 96, w - 20, 80);
    ctx.fillStyle = "#fff3cf";
    ctx.font = "700 14px 'Trebuchet MS', 'Segoe UI', sans-serif";
    ctx.fillText(`Brag Card | ${card.tier}`, x + 20, y + h - 70);
    ctx.font = "12px 'Trebuchet MS', 'Segoe UI', sans-serif";
    ctx.fillText(`#${card.rank} / ${card.score} pts`, x + 20, y + h - 50);
    ctx.fillText(card.shareLine.slice(0, 38), x + 20, y + h - 30);
  }
}

function drawBottomNotice(ctx, state) {
  if (!state.ui.notice) return;
  const y = state.bounds.height - 48;
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(20, y - 20, state.bounds.width - 40, 34);
  ctx.strokeStyle = "rgba(162, 249, 236, 0.5)";
  ctx.strokeRect(20, y - 20, state.bounds.width - 40, 34);
  ctx.fillStyle = "#d8fff7";
  ctx.font = "14px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText(state.ui.notice, 32, y + 2);
}

function drawStartOverlay(ctx, state) {
  if (state.mode !== "start") return;
  const x = 190;
  const y = 148;
  const w = 644;
  const h = 260;
  ctx.fillStyle = "rgba(8, 11, 24, 0.87)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(138, 255, 216, 0.65)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#9fffe4";
  ctx.font = "700 42px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText("Guild Idle Chronicle", x + 74, y + 74);

  ctx.fillStyle = "#e2f8ff";
  ctx.font = "20px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText("ENTER to start your first 3-minute growth loop", x + 94, y + 122);
  ctx.fillText("B to buy Starter Pack (demo checkout)", x + 94, y + 160);
  ctx.fillText("UP/DOWN to compete and generate brag card", x + 94, y + 198);
  ctx.fillText("Goal: grow fast, flex rank, monetize ethically", x + 94, y + 236);
}

function drawGameOverOverlay(ctx, state) {
  if (state.mode !== "gameover") return;
  const x = 230;
  const y = 164;
  const w = 564;
  const h = 212;
  ctx.fillStyle = "rgba(26, 5, 11, 0.9)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255, 137, 153, 0.75)";
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#ffd6dd";
  ctx.font = "700 44px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText("Defeated", x + 180, y + 74);
  ctx.font = "20px 'Trebuchet MS', 'Segoe UI', sans-serif";
  ctx.fillText(`Reached Stage ${state.progression.stage}`, x + 176, y + 116);
  ctx.fillText(`Power Score ${state.progression.lastScoreSubmitted || 0}`, x + 176, y + 146);
  ctx.fillText("Press ENTER to restart", x + 176, y + 176);
}

export function renderGame(ctx, state) {
  const { width, height } = state.bounds;
  const ui = getUiSnapshot(state);

  drawBackdrop(ctx, width, height, state.ui.pulseMs);
  drawHeroPanel(ctx, state, ui);
  drawEnemyPanel(ctx, state);
  drawActionPanel(ctx, state);
  drawLeaderboard(ctx, state, ui);
  drawBottomNotice(ctx, state);
  drawStartOverlay(ctx, state);
  drawGameOverOverlay(ctx, state);
}
