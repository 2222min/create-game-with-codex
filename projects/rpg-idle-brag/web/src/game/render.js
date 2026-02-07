import { getUiSnapshot } from "./update.js";

function loadImage(path) {
  const image = new Image();
  image.src = new URL(path, import.meta.url).href;
  return image;
}

const HERO_IMAGES = {
  idle: loadImage("../../assets/characters/hero_knight_idle_01.svg"),
  attack: loadImage("../../assets/characters/hero_knight_attack_01.svg"),
  guard: loadImage("../../assets/characters/hero_knight_guard_01.svg"),
  dodge: loadImage("../../assets/characters/hero_knight_dodge_01.svg"),
  hit: loadImage("../../assets/characters/hero_knight_hit_01.svg"),
};

const BOSS_IMAGES = {
  forest: {
    idle: loadImage("../../assets/bosses/boss_forest_crusher_idle_01.svg"),
    attack: loadImage("../../assets/bosses/boss_forest_crusher_attack_01.svg"),
    hit: loadImage("../../assets/bosses/boss_forest_crusher_hit_01.svg"),
  },
  iron: {
    idle: loadImage("../../assets/bosses/boss_iron_boar_king_idle_01.svg"),
    attack: loadImage("../../assets/bosses/boss_iron_boar_king_attack_01.svg"),
    hit: loadImage("../../assets/bosses/boss_iron_boar_king_hit_01.svg"),
  },
  storm: {
    idle: loadImage("../../assets/bosses/boss_storm_minotaur_idle_01.svg"),
    attack: loadImage("../../assets/bosses/boss_storm_minotaur_attack_01.svg"),
    hit: loadImage("../../assets/bosses/boss_storm_minotaur_hit_01.svg"),
  },
};

const SWORD_IMAGES = {
  common: loadImage("../../assets/weapons/weapon_sword_common_01.svg"),
  uncommon: loadImage("../../assets/weapons/weapon_sword_uncommon_01.svg"),
  rare: loadImage("../../assets/weapons/weapon_sword_rare_01.svg"),
  epic: loadImage("../../assets/weapons/weapon_sword_epic_01.svg"),
  legendary: loadImage("../../assets/weapons/weapon_sword_legendary_01.svg"),
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getHeroImage(state, ui) {
  const action = ui.heroAction ?? state.hero.lastAction ?? "idle";
  return HERO_IMAGES[action] ?? HERO_IMAGES.idle;
}

function getBossFamily(name) {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("iron")) return "iron";
  if (lower.includes("storm")) return "storm";
  return "forest";
}

function getBossImage(state) {
  const bossName = state.battle.boss?.name ?? "";
  const family = getBossFamily(bossName);
  const set = BOSS_IMAGES[family] ?? BOSS_IMAGES.forest;

  if (state.battle.pendingPattern) return set.attack;
  if (state.battle.floatingText.startsWith("-")) return set.hit;
  return set.idle;
}

function drawBackground(ctx, width, height, elapsedMs) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#100b06");
  grad.addColorStop(0.55, "#2a1b0f");
  grad.addColorStop(1, "#0b0806");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const shimmer = (elapsedMs * 0.00035) % 1;
  const x = width * shimmer;
  const light = ctx.createRadialGradient(x, 0, 20, x, 0, width * 0.7);
  light.addColorStop(0, "rgba(255, 206, 120, 0.14)");
  light.addColorStop(1, "rgba(255, 206, 120, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);
}

function drawFrame(ctx, x, y, w, h, tone = "gold") {
  const borderA = tone === "blue" ? "#70bee8" : "#98713a";
  const borderB = tone === "blue" ? "#2f5f80" : "#3d2b16";
  const panel = tone === "dark" ? "rgba(15, 12, 9, 0.9)" : "rgba(23, 16, 10, 0.84)";

  ctx.fillStyle = panel;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = borderA;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

  ctx.strokeStyle = borderB;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
}

function drawTopHud(ctx, state, ui) {
  const items = [
    { label: ui.gold.toLocaleString(), color: "#f0c14f" },
    { label: ui.summonStone.toLocaleString(), color: "#f2c75b" },
    { label: ui.gems.toLocaleString(), color: "#ae63dc" },
  ];

  let x = 14;
  for (const item of items) {
    drawFrame(ctx, x, 10, 152, 34, "dark");
    ctx.beginPath();
    ctx.arc(x + 18, 27, 8, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.fillStyle = "#f7e8c8";
    ctx.font = "700 22px 'Trebuchet MS', sans-serif";
    ctx.fillText(item.label, x + 34, 33);
    x += 160;
  }

  ctx.fillStyle = "#d7b784";
  ctx.font = "700 14px 'Trebuchet MS', sans-serif";
  ctx.fillText(`MODE: ${state.mode.toUpperCase()}  |  CLEARED ${ui.highestClearedStage}`, 514, 32);
}

function drawMenuHint(ctx) {
  ctx.fillStyle = "#d4b488";
  ctx.font = "700 12px 'Trebuchet MS', sans-serif";
  ctx.fillText("H 홈  M 맵  F 강화  G 소환  Enter/B 보스전  J/K/L 전투", 14, 56);
}

function drawHome(ctx, state, ui) {
  drawFrame(ctx, 14, 70, 996, 492, "gold");

  const titleGrad = ctx.createLinearGradient(40, 90, 420, 90);
  titleGrad.addColorStop(0, "#f4d08a");
  titleGrad.addColorStop(1, "#eeb657");
  ctx.fillStyle = titleGrad;
  ctx.font = "700 58px 'Trebuchet MS', sans-serif";
  ctx.fillText("Boss Forge Odyssey", 44, 136);

  ctx.fillStyle = "#ead8b3";
  ctx.font = "700 28px 'Trebuchet MS', sans-serif";
  ctx.fillText("홈에서 메뉴를 선택하고, 준비되면 보스 스테이지에 입장", 46, 178);

  const cards = [
    { title: "스테이지맵", body: `다음 보스: Stage ${ui.selectedStage}` },
    { title: "강화", body: `장착 무기: ${ui.equippedSword.name} +${ui.equippedSword.level}` },
    { title: "소환", body: `보유 장비: ${ui.inventoryCount}개` },
  ];

  for (let i = 0; i < cards.length; i += 1) {
    const x = 50 + i * 316;
    drawFrame(ctx, x, 220, 286, 180, "dark");
    ctx.fillStyle = "#f1ca79";
    ctx.font = "700 40px 'Trebuchet MS', sans-serif";
    ctx.fillText(cards[i].title, x + 64, 272);
    ctx.fillStyle = "#e6dbc2";
    ctx.font = "700 22px 'Trebuchet MS', sans-serif";
    ctx.fillText(cards[i].body, x + 20, 328);
  }

  drawFrame(ctx, 50, 420, 918, 112, "blue");
  ctx.fillStyle = "#d7f1ff";
  ctx.font = "700 24px 'Trebuchet MS', sans-serif";
  ctx.fillText("추천 루프: [소환 10회] -> [강화 2~3회] -> [맵 진입] -> [보스 패턴 회피/가드/공격]", 72, 468);
  ctx.fillText("클리어 시 다음 돌다리 스테이지가 열립니다.", 72, 504);
}

function getBridgeNodePosition(index) {
  const map = [
    [90, 210],
    [210, 180],
    [330, 230],
    [450, 190],
    [570, 236],
    [690, 188],
    [810, 236],
    [910, 182],
    [810, 332],
    [690, 378],
    [570, 332],
    [450, 382],
  ];
  const ref = map[index % map.length];
  return { x: ref[0], y: ref[1] };
}

function drawStageMap(ctx, state, ui) {
  drawFrame(ctx, 14, 70, 996, 492, "gold");
  ctx.fillStyle = "#f2c977";
  ctx.font = "700 52px 'Trebuchet MS', sans-serif";
  ctx.fillText("돌다리 스테이지", 56, 126);

  const maxVisible = Math.max(12, ui.currentStage + 3);
  for (let stage = 1; stage <= maxVisible; stage += 1) {
    const pos = getBridgeNodePosition(stage - 1);
    if (stage < maxVisible) {
      const nextPos = getBridgeNodePosition(stage);
      ctx.strokeStyle = stage <= ui.highestClearedStage ? "#88d87b" : "#6f5a40";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(nextPos.x, nextPos.y);
      ctx.stroke();
    }

    const cleared = stage <= ui.highestClearedStage;
    const selected = stage === ui.selectedStage;
    const current = stage === ui.currentStage;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, selected ? 24 : 18, 0, Math.PI * 2);
    ctx.fillStyle = cleared ? "#7dc86f" : current ? "#d9a953" : "#5d4a32";
    ctx.fill();
    ctx.strokeStyle = selected ? "#b8f3ff" : "#2f1f12";
    ctx.lineWidth = selected ? 4 : 2;
    ctx.stroke();

    ctx.fillStyle = "#f7eac9";
    ctx.font = "700 18px 'Trebuchet MS', sans-serif";
    ctx.fillText(`${stage}`, pos.x - 8, pos.y + 6);
  }

  drawFrame(ctx, 58, 424, 910, 114, "dark");
  ctx.fillStyle = "#ead7b2";
  ctx.font = "700 25px 'Trebuchet MS', sans-serif";
  ctx.fillText(`선택 Stage ${ui.selectedStage} | 최대 클리어 ${ui.highestClearedStage}`, 84, 462);
  ctx.fillText("LEFT/RIGHT: 스테이지 선택  |  Enter/B: 보스전 시작", 84, 498);
  ctx.fillText("스테이지 클리어 시 다음 돌다리 노드가 해금됩니다.", 84, 530);
}

function drawForge(ctx, state, ui) {
  drawFrame(ctx, 14, 70, 996, 492, "gold");

  const sword = ui.equippedSword;
  const swordImage = SWORD_IMAGES[sword.rarity.toLowerCase()] ?? SWORD_IMAGES.common;

  drawFrame(ctx, 48, 118, 300, 320, "dark");
  if (swordImage.complete) {
    ctx.drawImage(swordImage, 102, 170, 192, 192);
  }
  ctx.fillStyle = sword.color;
  ctx.font = "700 30px 'Trebuchet MS', sans-serif";
  ctx.fillText(sword.rarity, 92, 402);

  drawFrame(ctx, 368, 118, 594, 320, "dark");
  ctx.fillStyle = "#f2cb7d";
  ctx.font = "700 50px 'Trebuchet MS', sans-serif";
  ctx.fillText("강화소", 400, 186);

  ctx.fillStyle = "#efe0c3";
  ctx.font = "700 28px 'Trebuchet MS', sans-serif";
  ctx.fillText(`${sword.name} +${sword.level}`, 400, 238);
  ctx.fillText(`공격력 ${sword.power}`, 400, 278);
  ctx.fillText(`강화 비용 ${sword.upgradeCost} G`, 400, 318);
  ctx.fillText(`성공 확률 ${(sword.upgradeSuccessRate * 100).toFixed(1)}%`, 400, 358);
  ctx.fillText(`보유 골드 ${ui.gold}`, 400, 398);

  drawFrame(ctx, 48, 448, 914, 90, "blue");
  ctx.fillStyle = "#d4f0ff";
  ctx.font = "700 26px 'Trebuchet MS', sans-serif";
  ctx.fillText("U: 강화 시도  |  E: 다음 무기 장착  |  H: 홈", 82, 502);
}

function drawSummonResults(ctx, results, x, y, w, h) {
  drawFrame(ctx, x, y, w, h, "dark");
  ctx.fillStyle = "#f2cb7d";
  ctx.font = "700 28px 'Trebuchet MS', sans-serif";
  ctx.fillText("최근 소환 결과", x + 18, y + 40);

  const max = Math.min(results.length, 10);
  for (let i = 0; i < max; i += 1) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const bx = x + 20 + col * 114;
    const by = y + 56 + row * 46;
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(bx, by, 104, 36);
    ctx.strokeStyle = "rgba(233, 199, 123, 0.5)";
    ctx.strokeRect(bx, by, 104, 36);
    ctx.fillStyle = "#f0e4cf";
    ctx.font = "700 16px 'Trebuchet MS', sans-serif";
    ctx.fillText(results[i], bx + 10, by + 24);
  }
}

function drawSummon(ctx, state, ui) {
  drawFrame(ctx, 14, 70, 996, 492, "gold");

  drawFrame(ctx, 36, 112, 452, 184, "dark");
  ctx.fillStyle = "#f2cb7d";
  ctx.font = "700 48px 'Trebuchet MS', sans-serif";
  ctx.fillText("장비 소환", 70, 172);
  ctx.fillStyle = "#e9dcc3";
  ctx.font = "700 23px 'Trebuchet MS', sans-serif";
  ctx.fillText("1회: 1석 + 130G", 72, 218);
  ctx.fillText("10회: 9석 + 900G", 72, 250);

  drawFrame(ctx, 510, 112, 474, 184, "dark");
  ctx.fillStyle = "#f2cb7d";
  ctx.font = "700 32px 'Trebuchet MS', sans-serif";
  ctx.fillText("확률", 540, 160);
  ctx.fillStyle = "#eadfc9";
  ctx.font = "700 20px 'Trebuchet MS', sans-serif";
  ctx.fillText("Common 62%  |  Uncommon 24%", 540, 204);
  ctx.fillText("Rare 10%    |  Epic 3.2%", 540, 236);
  ctx.fillText("Legendary 0.8%", 540, 268);

  drawSummonResults(ctx, ui.lastSummonResults, 36, 314, 948, 166);

  drawFrame(ctx, 36, 488, 948, 50, "blue");
  ctx.fillStyle = "#d4f0ff";
  ctx.font = "700 24px 'Trebuchet MS', sans-serif";
  ctx.fillText("1: 1회 소환  |  0: 10회 소환  |  E: 다음 장비 장착", 64, 522);
}

function drawBattleControls(ctx, state) {
  const controls = [
    {
      label: "ATTACK",
      value: state.hero.attackCooldownMs,
      max: 360,
      x: 56,
      color: "#9b341e",
      readyColor: "#c04a2a",
    },
    {
      label: "GUARD",
      value: state.hero.guardCooldownMs,
      max: 1350,
      x: 248,
      color: "#19527a",
      readyColor: "#2f7fb8",
    },
    {
      label: "DODGE",
      value: state.hero.dodgeCooldownMs,
      max: 1650,
      x: 440,
      color: "#2c5f25",
      readyColor: "#4a9b3e",
    },
  ];

  for (const control of controls) {
    const ready = control.value <= 0;
    drawFrame(ctx, control.x, 486, 174, 62, "dark");
    ctx.fillStyle = ready ? control.readyColor : control.color;
    ctx.fillRect(control.x + 8, 494, 158, 46);
    if (!ready) {
      const ratio = clamp(control.value / control.max, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillRect(control.x + 8, 494, 158 * ratio, 46);
    }
    ctx.fillStyle = "#f3e9d2";
    ctx.font = "700 26px 'Trebuchet MS', sans-serif";
    ctx.fillText(control.label, control.x + 26, 526);
  }
}

function drawBattle(ctx, state, ui) {
  drawFrame(ctx, 14, 70, 996, 492, "gold");
  const arenaGrad = ctx.createLinearGradient(28, 90, 28, 438);
  arenaGrad.addColorStop(0, "#3f4d38");
  arenaGrad.addColorStop(1, "#2b2218");
  ctx.fillStyle = arenaGrad;
  ctx.fillRect(28, 90, 968, 348);

  ctx.fillStyle = "rgba(8, 12, 7, 0.4)";
  for (let x = 52; x < 970; x += 52) {
    ctx.fillRect(x, 92, 6, 344);
  }

  const shakeX = state.battle.cameraShakeMs > 0 ? Math.sin(state.elapsedMs * 0.05) * 4 : 0;

  const heroImage = getHeroImage(state, ui);
  const bossImage = getBossImage(state);

  if (heroImage.complete) {
    ctx.drawImage(heroImage, 110 + shakeX, 190, 190, 190);
  }
  if (bossImage.complete) {
    ctx.drawImage(bossImage, 700 - shakeX, 150, 240, 240);
  }

  ctx.fillStyle = "#f4edcf";
  ctx.font = "700 54px 'Trebuchet MS', sans-serif";
  ctx.fillText(`스테이지 ${ui.selectedStage}`, 106, 152);

  if (state.battle.boss) {
    const ratio = clamp(state.battle.boss.hp / state.battle.boss.maxHp, 0, 1);
    ctx.fillStyle = "#2a0f10";
    ctx.fillRect(562, 112, 380, 24);
    ctx.fillStyle = "#d5473a";
    ctx.fillRect(562, 112, 380 * ratio, 24);
    ctx.strokeStyle = "#f7d2c8";
    ctx.strokeRect(562, 112, 380, 24);
    ctx.fillStyle = "#f8ebd0";
    ctx.font = "700 30px 'Trebuchet MS', sans-serif";
    ctx.fillText(`${state.battle.boss.name}  ${Math.ceil(state.battle.boss.hp)} / ${state.battle.boss.maxHp}`, 562, 168);
  }

  ctx.fillStyle = "#ffd33f";
  ctx.font = "700 60px 'Trebuchet MS', sans-serif";
  if (state.battle.floatingTextTtlMs > 0) {
    ctx.fillText(state.battle.floatingText, 396, 276);
  }

  ctx.fillStyle = "rgba(8, 6, 4, 0.6)";
  ctx.fillRect(28, 388, 968, 50);
  ctx.fillStyle = "#f6e3b8";
  ctx.font = "700 36px 'Trebuchet MS', sans-serif";
  ctx.fillText(`공격력 ${ui.heroAttack}  |  콤보 x${state.hero.comboCount}`, 60, 424);

  drawBattleControls(ctx, state);

  if (state.battle.pendingPattern) {
    drawFrame(ctx, 640, 448, 356, 100, "blue");
    ctx.fillStyle = "#d9f3ff";
    ctx.font = "700 22px 'Trebuchet MS', sans-serif";
    ctx.fillText(`보스 패턴: ${state.battle.pendingPattern.toUpperCase()}`, 662, 482);
    ctx.fillText(`권장 대응: ${state.battle.pendingPattern === "slash" ? "GUARD" : "DODGE"}`, 662, 514);
    ctx.fillText(`발동까지 ${(state.battle.telegraphMs / 1000).toFixed(2)}s`, 662, 540);
  }

  if (state.battle.phase === "victory" || state.battle.phase === "defeat") {
    drawFrame(ctx, 206, 168, 612, 232, "blue");
    ctx.fillStyle = state.battle.phase === "victory" ? "#b8ffd8" : "#ffd6cc";
    ctx.font = "700 76px 'Trebuchet MS', sans-serif";
    ctx.fillText(state.battle.phase === "victory" ? "Victory" : "Defeated", 342, 260);
    ctx.font = "700 34px 'Trebuchet MS', sans-serif";
    ctx.fillText(state.battle.phase === "victory" ? "Enter: 다음 스테이지로" : "Enter: 홈으로 복귀", 334, 320);
  }
}

function drawBottomNotice(ctx, state) {
  if (!state.ui.notice) return;
  drawFrame(ctx, 160, 548, 704, 22, "dark");
  ctx.fillStyle = "#f4d7a3";
  ctx.font = "700 14px 'Trebuchet MS', sans-serif";
  ctx.fillText(state.ui.notice, 174, 564);
}

export function renderGame(ctx, state) {
  const { width, height } = state.bounds;
  const ui = getUiSnapshot(state);

  drawBackground(ctx, width, height, state.elapsedMs);
  drawTopHud(ctx, state, ui);
  drawMenuHint(ctx);

  if (state.mode === "home") {
    drawHome(ctx, state, ui);
  } else if (state.mode === "stageMap") {
    drawStageMap(ctx, state, ui);
  } else if (state.mode === "forge") {
    drawForge(ctx, state, ui);
  } else if (state.mode === "summon") {
    drawSummon(ctx, state, ui);
  } else if (state.mode === "battle") {
    drawBattle(ctx, state, ui);
  }

  drawBottomNotice(ctx, state);
}
