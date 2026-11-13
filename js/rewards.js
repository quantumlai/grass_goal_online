// 比賽結算(戰力能量、勝場里程碑、雙倍卡)、上線獎勵(星光代幣)與英雄養成(解鎖、升級、造型)
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
    P.daily = { date: today(), wins: 0, m5: false };
}
// 每日勝場進度條(5 勝有升級券)
function dailyHTML() {
  ensureDaily();
  const w = P.daily.wins;
  // title:滑鼠移過去時的說明(手機看不到沒關係)
  const tip = (i) =>
    i === 5 ? "今日第 5 勝:得到 1 張 🎫 升級券(任選一位英雄免費升一級)" : "今日第 " + i + " 勝";
  let h =
    '<div class="daily" title="今日勝場:每天重新計算,打贏 5 場有獎勵"><span>今日勝場</span><div class="dbar">';
  for (let i = 1; i <= DAILY_GOAL; i++)
    h +=
      '<i class="' +
      (i <= w ? "on" : "") +
      '" title="' +
      tip(i) +
      '">' +
      (i === 5 ? "🎫" : "") +
      "</i>";
  return h + "</div><b>" + Math.min(w, DAILY_GOAL) + "/" + DAILY_GOAL + "</b></div>";
}

// ── 上線獎勵(星光代幣):獎勵常回來玩的小朋友 ──
// 一輪 7 天,從這一輪第一次上線那天算起;7 天裡上線第 3、5、7 天各得 ⭐1、⭐1、⭐2,不必連續。
// 7 天過完後的下一次上線開始新的一輪。「上線」= 當天在刷題換通行卷答對至少 1 題。
// 用裝置日期判斷,不防改時間(對象是小朋友)。
const STREAK_DAYS = 7,
  STREAK_REWARD = { 3: 1, 5: 1, 7: 2 }; // 這一輪第幾個上線日 → 幾枚星光代幣
const dayNum = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return Math.round(new Date(y, m - 1, d).getTime() / 864e5);
};
// 目前這一輪:上線幾天、還剩幾天(這一輪已經過完就是新的一輪)
function streakNow() {
  const s = P.streak || { start: "", days: [] },
    gone = s.start ? dayNum(today()) - dayNum(s.start) : STREAK_DAYS;
  if (gone < 0 || gone >= STREAK_DAYS) return { n: 0, left: STREAK_DAYS, today: false };
  return { n: s.days.length, left: STREAK_DAYS - gone, today: s.days.includes(today()) };
}
// 刷題答對時呼叫:今天第一次就記一天上線,到達 3、5、7 天給代幣。回傳 { n, got } 或 null(今天已經算過)
function streakCheckIn() {
  const now = streakNow();
  if (now.today) return null;
  if (now.n === 0) P.streak = { start: today(), days: [] };
  P.streak.days.push(today());
  const n = P.streak.days.length,
    got = STREAK_REWARD[n] || 0;
  if (got) addTokens(got);
  save();
  return { n, got };
}
// 首頁的上線進度條:7 格,第 3、5、7 格標出獎勵
function streakHTML() {
  const s = streakNow();
  const tip = (i) =>
    STREAK_REWARD[i]
      ? "這一輪第 " + i + " 天上線:得到 " + STREAK_REWARD[i] + " 枚 ⭐ 星光代幣(解鎖英雄、造型)"
      : "這一輪第 " + i + " 天上線";
  let h =
    '<div class="daily" title="上線獎勵:7 天裡上線 3、5、7 天有星光代幣,不用連續。當天刷題答對 1 題就算上線' +
    (s.n ? ",這一輪還剩 " + s.left + " 天" : "") +
    '"><span>上線天數</span><div class="dbar">';
  for (let i = 1; i <= STREAK_DAYS; i++)
    h +=
      '<i class="' +
      (i <= s.n ? "on" : "") +
      '" title="' +
      tip(i) +
      '">' +
      (STREAK_REWARD[i] ? "⭐".repeat(STREAK_REWARD[i]) : "") +
      "</i>";
  return h + "</div><b>" + s.n + "/" + STREAK_DAYS + "</b></div>";
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
    addDbl();
    notes.push("🃏 <b>雙倍卡啟動!</b>下次刷題,每題金幣 ×2");
    if (P.daily.wins >= 5 && !P.daily.m5) {
      P.daily.m5 = true;
      addVouchers(1);
      notes.push("🎫 <b>今日 5 勝!</b>獲得升級券:任選一位英雄免費升一級");
    }
  }
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
    (P.passes < 1 ? '<p class="note">🎟️ <b>通行卷用完了!</b>刷數學題,連續答對 ' + PASS_STREAK + " 題,或 " + durText(MATH_SECS) + "內答對 " + PASS_TIMED + ' 題,就能換 1 張。</p>' : "");
  resultButtons();
  ui.style.display = "flex";
}
// 比賽結束的按鈕:有通行卷才有「再玩一場」;好友房間裡改成「回房間」(由房主開下一場)
function resultButtons() {
  const inRoom = typeof room !== "undefined" && room.active;
  mEl("rAgain").style.display = inRoom || P.passes < 1 ? "none" : "";
  mEl("rAgainSub").textContent = "用 1 張通行卷(剩 " + P.passes + " 張)";
  mEl("rHome").textContent = inRoom ? "回房間" : "回首頁";
}
mEl("rAgain").onclick = () => {
  ui.style.display = "none";
  startMatch();
};
mEl("rMath").onclick = () => startMath({ pass: true });
mEl("rHome").onclick = () => {
  ui.style.display = "none";
  if (typeof room !== "undefined" && room.active) showRoom();
  else showHome();
};

// ── 英雄養成 ──
function unlockHero(ci) {
  if (isUnlocked(ci) || !spendTokens(UNLOCK_TOKENS)) return false;
  P.unlocked.push(ci);
  save();
  return true;
}
function levelUpHero(ci, useVoucher) {
  const l = heroLv(ci);
  if (!isUnlocked(ci) || l >= HERO_MAXLV) return false;
  if (useVoucher) {
    if (!spendVoucher()) return false;
  } else {
    if (!spendEnergy(lvCost(l))) return false;
  }
  P.lv[ci] = l + 1;
  save();
  return true;
}
function unlockSkin(k) {
  if (P.skins.includes(k) || !spendTokens(UNLOCK_TOKENS)) return false;
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
