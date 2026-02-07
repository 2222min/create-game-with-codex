import { getUiSnapshot } from "./update.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getWeaponLevel(state) {
  return state.economy.attackUpgradeLevel + state.economy.healthUpgradeLevel + state.economy.critUpgradeLevel + 1;
}

function drawBackground(ctx, width, height, elapsedMs) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#0e0a05");
  grad.addColorStop(0.45, "#24170b");
  grad.addColorStop(1, "#090706");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const sweep = (elapsedMs * 0.00032) % 1;
  const lightX = width * sweep;
  const radial = ctx.createRadialGradient(lightX, 0, 20, lightX, 0, width * 0.8);
  radial.addColorStop(0, "rgba(255, 216, 132, 0.12)");
  radial.addColorStop(1, "rgba(255, 216, 132, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);
}

function drawFrame(ctx, x, y, w, h, tone = "gold") {
  const fill = tone === "dark" ? "#17120f" : "#1d150f";
  const inner = tone === "dark" ? "rgba(10, 8, 7, 0.74)" : "rgba(26, 18, 10, 0.72)";
  const borderA = tone === "blue" ? "#7ebee7" : "#9f7a43";
  const borderB = tone === "blue" ? "#395d7c" : "#3a2a16";

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = borderA;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

  ctx.strokeStyle = borderB;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);

  ctx.fillStyle = inner;
  ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
}

function drawTopCurrencies(ctx, state, ui) {
  const tokens = [
    { label: `${ui.gold.toLocaleString()}`, color: "#f5c04f" },
    { label: `${Math.floor(state.progression.stage * 12 + state.progression.kills)}`, color: "#e9b85a" },
    { label: `${ui.gems.toLocaleString()}`, color: "#b25bdf" },
  ];

  let x = 16;
  for (const token of tokens) {
    const w = 150;
    const h = 34;
    drawFrame(ctx, x, 12, w, h, "dark");
    ctx.beginPath();
    ctx.arc(x + 18, 29, 8, 0, Math.PI * 2);
    ctx.fillStyle = token.color;
    ctx.fill();
    ctx.fillStyle = "#f8e9c6";
    ctx.font = "700 22px 'Trebuchet MS', sans-serif";
    ctx.fillText(token.label, x + 34, 34);
    x += w + 8;
  }
}

function drawEnemy(ctx, x, y, radius, angry = false) {
  ctx.fillStyle = angry ? "#6ca843" : "#5d9e3f";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d8f19b";
  ctx.beginPath();
  ctx.arc(x - radius * 0.3, y - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.2, y - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2d3f1c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.2, y + radius * 0.25);
  ctx.lineTo(x + radius * 0.34, y + radius * 0.2);
  ctx.stroke();
}

function drawHero(ctx, x, y) {
  ctx.fillStyle = "#9f7f52";
  ctx.beginPath();
  ctx.arc(x, y - 22, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6f4f31";
  ctx.fillRect(x - 12, y - 10, 24, 42);

  ctx.strokeStyle = "#dde5f5";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 2);
  ctx.lineTo(x + 58, y - 34);
  ctx.stroke();

  ctx.strokeStyle = "#8aa7d4";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 58, y - 34);
  ctx.lineTo(x + 68, y - 34);
  ctx.stroke();
}

function drawBattlePanel(ctx, panel, state, ui) {
  drawFrame(ctx, panel.x, panel.y, panel.w, panel.h, "gold");

  const insetX = panel.x + 12;
  const insetY = panel.y + 12;
  const insetW = panel.w - 24;
  const insetH = panel.h - 24;

  const sceneGrad = ctx.createLinearGradient(insetX, insetY, insetX, insetY + insetH);
  sceneGrad.addColorStop(0, "#3b4735");
  sceneGrad.addColorStop(0.6, "#556348");
  sceneGrad.addColorStop(1, "#2d2318");
  ctx.fillStyle = sceneGrad;
  ctx.fillRect(insetX, insetY, insetW, insetH);

  ctx.fillStyle = "rgba(17, 30, 11, 0.35)";
  for (let i = 0; i < 9; i += 1) {
    const tx = insetX + 24 + i * 52;
    ctx.fillRect(tx, insetY + 4, 6, insetH - 8);
  }

  ctx.fillStyle = "#f6f0d6";
  ctx.font = "700 54px 'Trebuchet MS', sans-serif";
  ctx.fillText(`스테이지 ${state.progression.stage}`, insetX + 88, insetY + 60);

  ctx.font = "700 28px 'Trebuchet MS', sans-serif";
  ctx.fillText(`처치 카운트: ${state.progression.kills}`, insetX + 116, insetY + 96);

  const hpRatio = clamp(state.enemy.hp / Math.max(1, state.enemy.maxHp), 0, 1);
  ctx.fillStyle = "#180a09";
  ctx.fillRect(insetX + insetW - 192, insetY + 72, 168, 18);
  ctx.fillStyle = "#d24735";
  ctx.fillRect(insetX + insetW - 192, insetY + 72, 168 * hpRatio, 18);
  ctx.strokeStyle = "#f2c7b9";
  ctx.strokeRect(insetX + insetW - 192, insetY + 72, 168, 18);

  ctx.fillStyle = "#f9f2da";
  ctx.font = "700 32px 'Trebuchet MS', sans-serif";
  ctx.fillText(`/ ${state.enemy.maxHp}`, insetX + insetW - 72, insetY + 90);

  const heroX = insetX + 104;
  const heroY = insetY + insetH - 70;
  const enemyX = insetX + insetW - 120;
  const enemyY = insetY + insetH - 80;
  drawHero(ctx, heroX, heroY);
  drawEnemy(ctx, enemyX, enemyY, state.enemy.boss ? 58 : 50, state.enemy.boss);

  if (state.debug.lastHitWasCrit || state.ui.pulseMs > 520) {
    ctx.fillStyle = "#ffd521";
    ctx.font = "700 58px 'Trebuchet MS', sans-serif";
    const critDamage = Math.max(state.debug.lastHeroHit || state.hero.attack, 1);
    ctx.fillText("CRITICAL", insetX + 26, insetY + 150);
    ctx.fillText(`${critDamage}!`, insetX + 56, insetY + 208);
  }

  const dps = Math.floor(state.hero.attack * (1000 / Math.max(1, state.hero.attackIntervalMs)) * 10);
  ctx.fillStyle = "rgba(5, 3, 1, 0.64)";
  ctx.fillRect(insetX, insetY + insetH - 62, insetW, 28);
  ctx.fillStyle = "#f5e6c4";
  ctx.font = "700 46px 'Trebuchet MS', sans-serif";
  ctx.fillText(`DPS: ${dps.toLocaleString()}`, insetX + 110, insetY + insetH - 37);

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(insetX + 2, insetY + insetH - 28, insetW - 4, 18);
  ctx.fillStyle = "#eec869";
  const weaponLevel = getWeaponLevel(state);
  const barRatio = clamp(weaponLevel / 30, 0.06, 1);
  ctx.fillRect(insetX + 2, insetY + insetH - 28, (insetW - 4) * barRatio, 18);
  ctx.strokeStyle = "#6f5530";
  ctx.strokeRect(insetX + 2, insetY + insetH - 28, insetW - 4, 18);

  ctx.fillStyle = "#2e1f0f";
  ctx.font = "700 22px 'Trebuchet MS', sans-serif";
  ctx.fillText(`긴작량 | 펀털: +${state.hero.attack}`, insetX + 16, insetY + insetH - 13);
  ctx.fillStyle = "#f5e7ca";
  ctx.fillText(
    `${Math.floor((state.progression.stage + weaponLevel) * 180).toLocaleString()}`,
    insetX + insetW - 116,
    insetY + insetH - 13
  );
}

function drawSwordIcon(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 4);
  ctx.lineTo(x + 28, y + 42);
  ctx.lineTo(x + 10, y + 42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f0d6a1";
  ctx.fillRect(x + 5, y + 42, 26, 5);
  ctx.fillStyle = "#80582f";
  ctx.fillRect(x + 15, y + 47, 6, 14);
}

function drawForgePanel(ctx, panel, state) {
  drawFrame(ctx, panel.x, panel.y, panel.w, panel.h, "gold");
  const x = panel.x + 12;
  const y = panel.y + 12;
  const w = panel.w - 24;
  const h = panel.h - 24;

  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, "#2e2415");
  grad.addColorStop(1, "#0e0d12");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#f2d790";
  ctx.font = "700 54px 'Trebuchet MS', sans-serif";
  ctx.fillText("강검 인벤토리", x + 110, y + 54);

  const tabs = ["딸깍", "LV5", "LVE", "LV졸", "먼-"];
  for (let i = 0; i < tabs.length; i += 1) {
    const tx = x + 16 + i * 88;
    const selected = i === 1;
    ctx.fillStyle = selected ? "#70542d" : "#252428";
    ctx.fillRect(tx, y + 70, 78, 30);
    ctx.strokeStyle = selected ? "#e8c27f" : "#635e53";
    ctx.strokeRect(tx, y + 70, 78, 30);
    ctx.fillStyle = selected ? "#ffde9d" : "#d2d0c4";
    ctx.font = "700 24px 'Trebuchet MS', sans-serif";
    ctx.fillText(tabs[i], tx + 18, y + 93);
  }

  const weaponLevel = getWeaponLevel(state);
  const slotStartX = x + 12;
  const slotStartY = y + 114;
  let slotIndex = 0;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const sx = slotStartX + col * 92;
      const sy = slotStartY + row * 64;
      const active = slotIndex === weaponLevel % 9;
      ctx.fillStyle = active ? "#2f4b28" : "#1e1f24";
      ctx.fillRect(sx, sy, 84, 56);
      ctx.strokeStyle = active ? "#8be760" : "#6f6c63";
      ctx.strokeRect(sx, sy, 84, 56);
      drawSwordIcon(ctx, sx + 24, sy + 4, active ? "#cbf7ff" : "#d4dbe9");
      ctx.fillStyle = "#ffcf75";
      ctx.font = "700 18px 'Trebuchet MS', sans-serif";
      ctx.fillText("S", sx + 8, sy + 20);
      ctx.fillText(`${5 + ((slotIndex + weaponLevel) % 5)}`, sx + 58, sy + 50);
      slotIndex += 1;
    }
  }

  const infoX = x + w - 166;
  ctx.fillStyle = "#2a251b";
  ctx.fillRect(infoX, y + 114, 154, 190);
  ctx.strokeStyle = "#85724f";
  ctx.strokeRect(infoX, y + 114, 154, 190);
  ctx.fillStyle = "#f3e4b7";
  ctx.font = "700 38px 'Trebuchet MS', sans-serif";
  ctx.fillText(`LV ${Math.max(1, Math.floor(weaponLevel / 3) + 1)}`, infoX + 20, y + 150);

  ctx.fillStyle = "#d9ab46";
  ctx.fillRect(infoX + 40, y + 166, 72, 54);
  ctx.strokeStyle = "#f7deaa";
  ctx.strokeRect(infoX + 40, y + 166, 72, 54);
  ctx.fillStyle = "#3d2a14";
  ctx.fillRect(infoX + 54, y + 186, 44, 24);

  ctx.fillStyle = "#f2dfbd";
  ctx.font = "700 26px 'Trebuchet MS', sans-serif";
  ctx.fillText(`권닛섟: ${Math.floor(state.progression.stage * 12 + weaponLevel * 3)}`, infoX + 10, y + 250);
  ctx.fillText(`밀쪼 워턱: ${state.monetization.convenienceSlots + 3}`, infoX + 10, y + 282);

  const buttonY = y + h - 46;
  ctx.fillStyle = "#514433";
  ctx.fillRect(x + 10, buttonY, 222, 34);
  ctx.strokeStyle = "#bd9c66";
  ctx.strokeRect(x + 10, buttonY, 222, 34);
  ctx.fillStyle = "#f2debe";
  ctx.font = "700 34px 'Trebuchet MS', sans-serif";
  ctx.fillText("가성광 뽑기", x + 42, buttonY + 27);

  ctx.fillStyle = "#2d5f88";
  ctx.fillRect(x + w - 246, buttonY, 236, 34);
  ctx.strokeStyle = "#79c4ff";
  ctx.strokeRect(x + w - 246, buttonY, 236, 34);
  ctx.fillStyle = "#d9f1ff";
  ctx.fillText("강계량 뽑기", x + w - 218, buttonY + 27);
}

function drawSummonPanel(ctx, panel, state) {
  drawFrame(ctx, panel.x, panel.y, panel.w, panel.h, "gold");
  const x = panel.x + 12;
  const y = panel.y + 12;
  const w = panel.w - 24;
  const h = panel.h - 24;

  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#1a171f");
  grad.addColorStop(1, "#2b1e13");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#f0c173";
  ctx.font = "700 42px 'Trebuchet MS', sans-serif";
  ctx.fillText("두기 뽑기", x + 178, y + 46);

  ctx.fillStyle = "#2f3e77";
  ctx.fillRect(x + 52, y + 56, w - 104, 32);
  ctx.strokeStyle = "#f1db85";
  ctx.strokeRect(x + 52, y + 56, w - 104, 32);
  ctx.fillStyle = "#fff4bd";
  ctx.font = "700 32px 'Trebuchet MS', sans-serif";
  ctx.fillText("10련 뽑기!", x + 172, y + 82);
  ctx.fillStyle = "#ffd881";
  ctx.font = "700 26px 'Trebuchet MS', sans-serif";
  ctx.fillText(`두스텝: ${Math.max(3000, state.progression.stage * 220)}`, x + 154, y + 108);

  const centerX = x + w / 2;
  const centerY = y + 162;
  for (let i = 0; i < 28; i += 1) {
    const angle = (Math.PI * 2 * i) / 28 + state.elapsedMs * 0.0012;
    const radius = 22 + (i % 5) * 14;
    ctx.fillStyle = `hsla(${(i * 34 + state.elapsedMs * 0.04) % 360}, 90%, 68%, 0.78)`;
    ctx.beginPath();
    ctx.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#e8f2ff";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 62);
  ctx.lineTo(centerX + 22, centerY + 34);
  ctx.lineTo(centerX - 22, centerY + 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c4a45f";
  ctx.fillRect(centerX - 32, centerY + 34, 64, 8);
  ctx.fillStyle = "#8a6237";
  ctx.fillRect(centerX - 8, centerY + 42, 16, 28);

  ctx.fillStyle = "rgba(20, 18, 15, 0.58)";
  ctx.fillRect(centerX - 126, y + h - 82, 252, 34);
  ctx.fillStyle = "#f2e5c5";
  ctx.font = "700 24px 'Trebuchet MS', sans-serif";
  const weaponLevel = getWeaponLevel(state);
  ctx.fillText(`1도기 런  |  캠기지 +${100 + weaponLevel * 4}`, centerX - 112, y + h - 58);

  ctx.fillStyle = "#b57924";
  ctx.fillRect(x + 82, y + h - 40, w - 164, 28);
  ctx.strokeStyle = "#ffe8af";
  ctx.strokeRect(x + 82, y + h - 40, w - 164, 28);
  ctx.fillStyle = "#fff4cd";
  ctx.font = "700 30px 'Trebuchet MS', sans-serif";
  ctx.fillText("강성 뽑기!", x + 182, y + h - 18);
}

function drawRebirthPanel(ctx, panel, state) {
  drawFrame(ctx, panel.x, panel.y, panel.w, panel.h, "gold");
  const x = panel.x + 12;
  const y = panel.y + 12;
  const w = panel.w - 24;
  const h = panel.h - 24;

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "#2f2414");
  grad.addColorStop(1, "#21160b");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#f1bf6a";
  ctx.font = "700 50px 'Trebuchet MS', sans-serif";
  ctx.fillText("광성 룬비", x + 160, y + 52);

  ctx.fillStyle = "#e6d1a3";
  ctx.fillRect(x + 20, y + 72, w - 40, 144);
  ctx.strokeStyle = "#8a6a38";
  ctx.strokeRect(x + 20, y + 72, w - 40, 144);

  ctx.fillStyle = "#3d2b12";
  ctx.font = "700 22px 'Trebuchet MS', sans-serif";
  const gemGain = 1200 + state.progression.stage * 42;
  ctx.fillText(`폰성 시 영드닐 획독: +${gemGain}`, x + 42, y + 103);

  ctx.fillStyle = "#6e5230";
  ctx.fillRect(x + 150, y + 114, w - 300, 2);
  ctx.fillStyle = "#3b2d1f";
  ctx.font = "700 24px 'Trebuchet MS', sans-serif";
  ctx.fillText("- 영도 히시노 -", x + 194, y + 142);

  ctx.font = "700 22px 'Trebuchet MS', sans-serif";
  ctx.fillText(`✓ 광직량 ${20 + Math.min(45, state.hero.level)}% 증가`, x + 54, y + 168);
  const weaponLevel = getWeaponLevel(state);
  ctx.fillText(`✓ 월도 최전항 ${15 + Math.min(35, weaponLevel)}% 증가`, x + 54, y + 194);

  ctx.fillStyle = "#9f3118";
  ctx.fillRect(x + 36, y + h - 44, w - 72, 32);
  ctx.strokeStyle = "#f99c72";
  ctx.strokeRect(x + 36, y + h - 44, w - 72, 32);
  ctx.fillStyle = "#ffe1bf";
  ctx.font = "700 36px 'Trebuchet MS', sans-serif";
  ctx.fillText("광성하기", x + w / 2 - 82, y + h - 17);
}

function drawStatusNotice(ctx, state, width) {
  if (!state.ui.notice) return;
  ctx.fillStyle = "rgba(5, 3, 2, 0.72)";
  ctx.fillRect(160, 550, width - 320, 20);
  ctx.strokeStyle = "rgba(244, 201, 128, 0.5)";
  ctx.strokeRect(160, 550, width - 320, 20);
  ctx.fillStyle = "#ffe1b2";
  ctx.font = "700 17px 'Trebuchet MS', sans-serif";
  ctx.fillText(state.ui.notice, 172, 566);
}

function drawStartOverlay(ctx, state, width, height) {
  if (state.mode !== "start") return;
  drawFrame(ctx, width * 0.16, height * 0.26, width * 0.68, height * 0.48, "blue");
  ctx.fillStyle = "#d9f2ff";
  ctx.font = "700 56px 'Trebuchet MS', sans-serif";
  ctx.fillText("Guild Idle Chronicle", width * 0.24, height * 0.42);
  ctx.font = "700 34px 'Trebuchet MS', sans-serif";
  ctx.fillText("Enter 또는 시작 버튼", width * 0.32, height * 0.5);
  ctx.font = "700 28px 'Trebuchet MS', sans-serif";
  ctx.fillText("강화 -> 성장 -> 랭킹 제출", width * 0.31, height * 0.57);
}

function drawGameOverOverlay(ctx, state, width, height) {
  if (state.mode !== "gameover") return;
  drawFrame(ctx, width * 0.2, height * 0.28, width * 0.6, height * 0.42, "blue");
  ctx.fillStyle = "#ffd2c2";
  ctx.font = "700 70px 'Trebuchet MS', sans-serif";
  ctx.fillText("Defeated", width * 0.39, height * 0.46);
  ctx.font = "700 34px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Stage ${state.progression.stage} | 강화 ${getWeaponLevel(state)}`, width * 0.31, height * 0.56);
  ctx.fillText("Enter 로 재시작", width * 0.39, height * 0.64);
}

export function renderGame(ctx, state) {
  const { width, height } = state.bounds;
  const ui = getUiSnapshot(state);

  const battle = { x: 16, y: 56, w: 490, h: 252 };
  const forge = { x: 518, y: 56, w: 490, h: 252 };
  const summon = { x: 16, y: 316, w: 490, h: 244 };
  const rebirth = { x: 518, y: 316, w: 490, h: 244 };

  drawBackground(ctx, width, height, state.elapsedMs);
  drawTopCurrencies(ctx, state, ui);
  drawBattlePanel(ctx, battle, state, ui);
  drawForgePanel(ctx, forge, state);
  drawSummonPanel(ctx, summon, state);
  drawRebirthPanel(ctx, rebirth, state);
  drawStatusNotice(ctx, state, width);
  drawStartOverlay(ctx, state, width, height);
  drawGameOverOverlay(ctx, state, width, height);
}
