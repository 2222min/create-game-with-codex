import { getUiSnapshot } from "./update.js";

function drawBackdrop(ctx, width, height, elapsedMs) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#132726");
  grad.addColorStop(0.5, "#1d2142");
  grad.addColorStop(1, "#190f28");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const shift = (elapsedMs * 0.03) % 56;
  ctx.strokeStyle = "rgba(204, 231, 255, 0.09)";
  for (let y = -56 + shift; y <= height + 56; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawCard(ctx, x, y, w, h, borderColor = "rgba(193, 230, 255, 0.34)") {
  ctx.fillStyle = "rgba(6, 9, 21, 0.72)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawBar(ctx, x, y, w, h, ratio, fill, bg) {
  const r = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * r, h);
  ctx.strokeStyle = "rgba(240, 248, 255, 0.35)";
  ctx.strokeRect(x, y, w, h);
}

function drawLeftPanel(ctx, state, ui) {
  const x = 20;
  const y = 20;
  const w = 320;
  const h = 326;
  drawCard(ctx, x, y, w, h, "rgba(135, 250, 227, 0.5)");

  ctx.fillStyle = "#b6ffe9";
  ctx.font = "700 26px 'Trebuchet MS', sans-serif";
  ctx.fillText("검 키우기", x + 16, y + 36);

  ctx.fillStyle = "#ecf8ff";
  ctx.font = "700 18px 'Trebuchet MS', sans-serif";
  ctx.fillText(`검 +${state.sword.level} (${state.sword.tier})`, x + 16, y + 68);

  ctx.font = "15px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#ffe6a9";
  ctx.fillText(`강화비 ${ui.swordCost}G / 성공률 ${(ui.swordSuccessRate * 100).toFixed(0)}%`, x + 16, y + 92);

  const hpRatio = state.hero.hp / Math.max(1, state.hero.maxHp);
  drawBar(ctx, x + 16, y + 106, 286, 16, hpRatio, "#6effd5", "#263950");
  ctx.fillStyle = "#e4fff8";
  ctx.font = "14px 'Trebuchet MS', sans-serif";
  ctx.fillText(`HP ${Math.floor(state.hero.hp)} / ${state.hero.maxHp}`, x + 16, y + 126);

  const xpRatio = state.hero.xp / Math.max(1, state.hero.xpToNext);
  drawBar(ctx, x + 16, y + 136, 286, 12, xpRatio, "#ffd779", "#393341");
  ctx.fillStyle = "#fff0b9";
  ctx.fillText(`XP ${Math.floor(state.hero.xp)} / ${state.hero.xpToNext}`, x + 16, y + 156);

  ctx.fillStyle = "#d8e7ff";
  ctx.font = "15px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Lv.${state.hero.level}  Stage ${state.progression.stage}`, x + 16, y + 182);
  ctx.fillText(`공격력 ${state.hero.attack}  치명 ${(state.hero.critChance * 100).toFixed(0)}%`, x + 16, y + 206);
  ctx.fillText(`Gold ${ui.gold}  Gems ${ui.gems}`, x + 16, y + 230);
  ctx.fillText(`처치 ${state.progression.kills} / 보스 ${state.progression.bossKills}`, x + 16, y + 254);

  let resultText = "강화 대기";
  let resultColor = "#b9d2ff";
  if (state.sword.lastResult === "success") {
    resultText = "최근 강화: 성공";
    resultColor = "#95ffbb";
  } else if (state.sword.lastResult === "fail") {
    resultText = "최근 강화: 실패";
    resultColor = "#ffb3bf";
  }

  ctx.fillStyle = resultColor;
  ctx.font = "700 16px 'Trebuchet MS', sans-serif";
  ctx.fillText(resultText, x + 16, y + 286);
  ctx.fillStyle = "#c8dfff";
  ctx.font = "13px 'Trebuchet MS', sans-serif";
  ctx.fillText(`누적 강화 시도 ${state.sword.enhanceAttemptCount}회`, x + 16, y + 308);
}

function getSwordPalette(state) {
  if (state.sword.lastResult === "fail" && state.sword.effectTtlMs > 0) {
    return {
      blade: "#ff8ca3",
      core: "#ffd6de",
      aura: "rgba(255, 117, 142, 0.35)",
      gem: "#ff5f82",
    };
  }

  if (state.sword.tier === "Mythic") {
    return {
      blade: "#ffce61",
      core: "#fff4c8",
      aura: "rgba(255, 220, 107, 0.4)",
      gem: "#ffd15f",
    };
  }
  if (state.sword.tier === "Legend") {
    return {
      blade: "#ff8bd1",
      core: "#ffe5f7",
      aura: "rgba(255, 155, 220, 0.35)",
      gem: "#f68de0",
    };
  }
  if (state.sword.tier === "Epic") {
    return {
      blade: "#a18bff",
      core: "#e7e1ff",
      aura: "rgba(158, 133, 255, 0.33)",
      gem: "#ab93ff",
    };
  }
  if (state.sword.tier === "Rare") {
    return {
      blade: "#71f8ff",
      core: "#d9fbff",
      aura: "rgba(105, 247, 255, 0.29)",
      gem: "#6de9ff",
    };
  }

  return {
    blade: "#9ec8ff",
    core: "#e5f1ff",
    aura: "rgba(144, 188, 255, 0.25)",
    gem: "#8fb4f8",
  };
}

function drawSwordEffects(ctx, centerX, centerY, state, palette) {
  const auraBase = 56 + Math.min(84, state.sword.level * 3);
  const pulse = Math.sin((state.sword.sparklePhaseMs / 1000) * Math.PI * 2);
  const auraRadius = auraBase + pulse * 4;

  ctx.beginPath();
  ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
  ctx.fillStyle = palette.aura;
  ctx.fill();

  if (state.sword.effectTtlMs <= 0) return;

  if (state.sword.lastResult === "success") {
    ctx.strokeStyle = "rgba(170, 255, 205, 0.85)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10 + pulse * 0.4;
      const r0 = auraRadius + 4;
      const r1 = auraRadius + 18;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * r0, centerY + Math.sin(angle) * r0);
      ctx.lineTo(centerX + Math.cos(angle) * r1, centerY + Math.sin(angle) * r1);
      ctx.stroke();
    }
  } else if (state.sword.lastResult === "fail") {
    ctx.strokeStyle = "rgba(255, 143, 161, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 28, centerY - 28);
    ctx.lineTo(centerX + 28, centerY + 28);
    ctx.moveTo(centerX + 28, centerY - 28);
    ctx.lineTo(centerX - 28, centerY + 28);
    ctx.stroke();
  }
}

function drawSword(ctx, centerX, centerY, state, palette) {
  const bladeLength = 86 + Math.min(170, state.sword.level * 7);
  const bladeWidth = 16 + Math.min(18, Math.floor(state.sword.level / 2));

  drawSwordEffects(ctx, centerX, centerY, state, palette);

  ctx.fillStyle = palette.blade;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - bladeLength);
  ctx.lineTo(centerX + bladeWidth * 0.5, centerY - 10);
  ctx.lineTo(centerX - bladeWidth * 0.5, centerY - 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.core;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - bladeLength + 10);
  ctx.lineTo(centerX + bladeWidth * 0.18, centerY - 20);
  ctx.lineTo(centerX - bladeWidth * 0.18, centerY - 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d9c8a3";
  ctx.fillRect(centerX - 36, centerY - 10, 72, 10);
  ctx.fillStyle = palette.gem;
  ctx.beginPath();
  ctx.arc(centerX, centerY - 5, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8b6140";
  ctx.fillRect(centerX - 8, centerY, 16, 56);
  ctx.fillStyle = "#5a3b2b";
  ctx.fillRect(centerX - 10, centerY + 50, 20, 8);
}

function drawCenterPanel(ctx, state, ui) {
  const x = 360;
  const y = 20;
  const w = 360;
  const h = 326;
  drawCard(ctx, x, y, w, h, "rgba(164, 203, 255, 0.5)");

  ctx.fillStyle = "#d8e4ff";
  ctx.font = "700 24px 'Trebuchet MS', sans-serif";
  ctx.fillText("강화된 검", x + 16, y + 34);

  const enemyHpRatio = state.enemy.hp / Math.max(1, state.enemy.maxHp);
  drawBar(ctx, x + 16, y + 48, w - 32, 18, enemyHpRatio, state.enemy.boss ? "#ff8097" : "#98b7ff", "#352f4c");
  ctx.fillStyle = state.enemy.boss ? "#ffd6de" : "#ecf2ff";
  ctx.font = "15px 'Trebuchet MS', sans-serif";
  const enemyLabel = state.enemy.boss ? `BOSS ${state.enemy.name}` : `Enemy ${state.enemy.name}`;
  ctx.fillText(`${enemyLabel}  HP ${Math.floor(state.enemy.hp)} / ${state.enemy.maxHp}`, x + 16, y + 88);

  const centerX = x + w / 2;
  const centerY = y + 220;
  drawSword(ctx, centerX, centerY, state, getSwordPalette(state));

  ctx.fillStyle = "#e8fbff";
  ctx.font = "700 20px 'Trebuchet MS', sans-serif";
  ctx.fillText(`+${state.sword.level}`, x + 18, y + 122);
  ctx.fillStyle = "#b6d9ff";
  ctx.font = "14px 'Trebuchet MS', sans-serif";
  ctx.fillText(`다음 비용 ${ui.swordCost}G`, x + 16, y + 146);
  ctx.fillText(`현재 성공률 ${(ui.swordSuccessRate * 100).toFixed(0)}%`, x + 16, y + 166);

  if (state.sword.lastRoll !== null) {
    ctx.fillStyle = "#ffe7b4";
    ctx.fillText(`최근 판정 ${(state.sword.lastRoll * 100).toFixed(1)}%`, x + 16, y + 186);
  }
}

function drawRightPanel(ctx, state, ui) {
  const x = 740;
  const y = 20;
  const w = 264;
  const h = 326;
  drawCard(ctx, x, y, w, h, "rgba(243, 187, 255, 0.46)");

  ctx.fillStyle = "#ffe2ff";
  ctx.font = "700 22px 'Trebuchet MS', sans-serif";
  ctx.fillText("랭킹", x + 14, y + 32);

  ctx.fillStyle = "#f4ecff";
  ctx.font = "14px 'Trebuchet MS', sans-serif";
  const rows = ui.leaderboard.slice(0, 7);
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowY = y + 66 + i * 28;
    const mine = row.playerId === state.playerId;
    if (mine) {
      ctx.fillStyle = "rgba(186, 255, 219, 0.22)";
      ctx.fillRect(x + 8, rowY - 16, w - 16, 22);
      ctx.fillStyle = "#caffdf";
    } else {
      ctx.fillStyle = "#f4ecff";
    }
    ctx.fillText(`${i + 1}. ${row.nickname}`, x + 14, rowY);
    ctx.fillText(`${row.score}`, x + 182, rowY);
  }

  ctx.fillStyle = "#c9dcff";
  ctx.fillText(`내 제출 점수: ${state.progression.lastScoreSubmitted}`, x + 14, y + 268);
  if (state.socialUi.lastRank) {
    ctx.fillStyle = "#fff6cb";
    ctx.fillText(`내 랭킹: #${state.socialUi.lastRank}`, x + 14, y + 290);
  }
}

function drawGuidePanel(ctx, state) {
  const x = 20;
  const y = 360;
  const w = 984;
  const h = 196;
  drawCard(ctx, x, y, w, h, "rgba(166, 248, 221, 0.52)");

  ctx.fillStyle = "#b7ffe6";
  ctx.font = "700 24px 'Trebuchet MS', sans-serif";
  ctx.fillText("무엇을 하면 되나요?", x + 16, y + 34);

  ctx.fillStyle = "#effff8";
  ctx.font = "700 20px 'Trebuchet MS', sans-serif";
  ctx.fillText("1) 검 강화", x + 18, y + 72);
  ctx.fillText("2) 상자/결제로 성장", x + 330, y + 72);
  ctx.fillText("3) 점수 제출 후 자랑", x + 670, y + 72);

  ctx.font = "15px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#d4ecff";
  ctx.fillText("E 또는 [검 강화] 클릭: 비용 지불 후 확률 판정", x + 18, y + 100);
  ctx.fillText("SPACE: 상자 수령 / B: 스타터팩 또는 편의 슬롯", x + 330, y + 100);
  ctx.fillText("U: 랭킹 제출 / J: 자랑 카드 생성", x + 670, y + 100);

  if (state.socialUi.lastBragCardText) {
    ctx.fillStyle = "#fff5cd";
    ctx.font = "14px 'Trebuchet MS', sans-serif";
    ctx.fillText(`최근 자랑 문구: ${state.socialUi.lastBragCardText}`, x + 18, y + 132);
  }

  if (state.ui.notice) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(x + 14, y + 146, w - 28, 34);
    ctx.strokeStyle = "rgba(152, 252, 226, 0.45)";
    ctx.strokeRect(x + 14, y + 146, w - 28, 34);
    ctx.fillStyle = "#d7fff5";
    ctx.font = "700 16px 'Trebuchet MS', sans-serif";
    ctx.fillText(state.ui.notice, x + 26, y + 168);
  }
}

function drawStartOverlay(ctx, state) {
  if (state.mode !== "start") return;
  drawCard(ctx, 178, 148, 668, 280, "rgba(138, 255, 216, 0.75)");
  ctx.fillStyle = "#99ffe1";
  ctx.font = "700 46px 'Trebuchet MS', sans-serif";
  ctx.fillText("Guild Idle Chronicle", 250, 220);

  ctx.fillStyle = "#e9fcff";
  ctx.font = "700 26px 'Trebuchet MS', sans-serif";
  ctx.fillText("ENTER 또는 시작 버튼을 누르세요", 254, 270);
  ctx.font = "18px 'Trebuchet MS', sans-serif";
  ctx.fillText("검 강화 성공 시 검이 커지고 화려해집니다", 258, 314);
  ctx.fillText("단, 강화 레벨이 높아질수록 성공률은 내려갑니다", 258, 346);
}

function drawGameOverOverlay(ctx, state) {
  if (state.mode !== "gameover") return;
  drawCard(ctx, 230, 176, 560, 220, "rgba(255, 138, 158, 0.78)");
  ctx.fillStyle = "#ffd4df";
  ctx.font = "700 50px 'Trebuchet MS', sans-serif";
  ctx.fillText("Defeated", 394, 250);

  ctx.fillStyle = "#fff0f3";
  ctx.font = "700 24px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Stage ${state.progression.stage} / 검 +${state.sword.level}`, 340, 292);
  ctx.fillText("ENTER 또는 재시작 버튼", 346, 332);
}

export function renderGame(ctx, state) {
  const { width, height } = state.bounds;
  const ui = getUiSnapshot(state);

  drawBackdrop(ctx, width, height, state.elapsedMs);
  drawLeftPanel(ctx, state, ui);
  drawCenterPanel(ctx, state, ui);
  drawRightPanel(ctx, state, ui);
  drawGuidePanel(ctx, state);
  drawStartOverlay(ctx, state);
  drawGameOverOverlay(ctx, state);
}
