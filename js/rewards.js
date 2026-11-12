// 比賽結算(戰力能量、勝場里程碑、雙倍卡)與英雄養成(解鎖、升級、造型)
const WIN_ENERGY = [40, 60],
  TIE_ENERGY = [20, 25],
  LOSE_ENERGY = [10, 15],
  DAILY_GOAL = 5;
function today() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function ensureDaily() {
  if (P.daily.date !== today())
    P.daily = { date: today(), wins: 0, m3: false, m5: false };
}
// 每日勝場進度條(3 勝、5 勝有里程碑)
function dailyHTML() {
  ensureDaily();
  const w = P.daily.wins;
  let h = '<div class="daily"><span>今日勝場</span><div class="dbar">';
  for (let i = 1; i <= DAILY_GOAL; i++)
    h +=
      '<i class="' +
      (i <= w ? "on" : "") +
      '">' +
      (i === 3 ? "⭐" : i === 5 ? "🎫" : "") +
      "</i>";
  return h + "</div><b>" + Math.min(w, DAILY_GOAL) + "/" + DAILY_GOAL + "</b></div>";
}
function onMatchEnd(res) {
  ensureDaily();
  P.played = (P.played || 0) + 1; // 打完幾場正式比賽(功能解鎖用,見 onboarding.js)
  sfxPlay(res === "win" ? "win" : res === "tie" ? "tie" : "lose"); // 只在自己的裝置播,不送給房間
  const r = res === "win" ? WIN_ENERGY : res === "tie" ? TIE_ENERGY : LOSE_ENERGY,
    en = rnd(r[0], r[1]),
    notes = [];
  addEnergy(en);
  lbAdd(LB.wins, res === "win" ? 1 : 0, 1); // 勝場數 +1(只有贏才加)、出賽數 +1
  if (res === "win") {
    P.daily.wins++;
    P.dbl = true;
    notes.push("🃏 <b>雙倍卡啟動!</b>接下來的數學挑戰,每題金幣 ×2");
    if (P.daily.wins >= 3 && !P.daily.m3) {
      P.daily.m3 = true;
      P.tokens++;
      notes.push("⭐ <b>今日 3 勝!</b>獲得 1 枚星光代幣");
    }
    if (P.daily.wins >= 5 && !P.daily.m5) {
      P.daily.m5 = true;
      P.vouchers++;
      notes.push("🎫 <b>今日 5 勝!</b>獲得升級券:任選一位英雄免費升一級");
    }
  }
  P.mathPending = true;
  save();
  mEl("rTitle").textContent =
    res === "win" ? "🏆 你贏了!" : res === "tie" ? "🤝 平手" : "💪 下次再加油";
  mEl("msg").innerHTML =
    '<div class="score">藍隊 ' +
    G.score[0] +
    " : " +
    G.score[1] +
    " 紅隊</div>" +
    '<div class="gain">⚡ 戰力能量 +' +
    en +
    "</div>" +
    dailyHTML() +
    notes.map((n) => '<p class="note">' + n + "</p>").join("") +
    '<p class="hint">完成 ' + durText(MATH_SECS) + "數學挑戰,就能領金幣、繼續下一場!</p>";
  ui.style.display = "flex";
}
mEl("go").onclick = startMath;

// ── 英雄養成 ──
function unlockHero(ci) {
  if (isUnlocked(ci) || P.tokens < UNLOCK_TOKENS) return false;
  P.tokens -= UNLOCK_TOKENS;
  P.unlocked.push(ci);
  save();
  return true;
}
function levelUpHero(ci, useVoucher) {
  const l = heroLv(ci);
  if (!isUnlocked(ci) || l >= HERO_MAXLV) return false;
  if (useVoucher) {
    if (P.vouchers < 1) return false;
    P.vouchers--;
  } else {
    if (!spendEnergy(lvCost(l))) return false;
  }
  P.lv[ci] = l + 1;
  save();
  return true;
}
function unlockSkin(k) {
  if (P.skins.includes(k) || P.tokens < UNLOCK_TOKENS) return false;
  P.tokens -= UNLOCK_TOKENS;
  P.skins.push(k);
  save();
  return true;
}
function buyAcc(k) {
  const a = ACCS.find((a) => a.k === k);
  if (P.acc.includes(k) || !spendCoins(a.p)) return false;
  P.acc.push(k);
  P.accEq = k;
  save();
  return true;
}
