// 功能慢慢解鎖:新玩家一開始只看到「出擊」和練習,打越多場正式比賽,首頁出現越多功能。
// 場數(P.played)在 rewards.js 的 onMatchEnd 累加;練習不算。
// 解鎖時按鈕上有「NEW」,首頁出現一句說明;按過一次就不再顯示(P.seen)。
const UNLOCKS = [
  {
    k: "shop",
    els: ["hShop", "hMoney"],
    need: () => P.played >= 1 && !P.mathPending, // 第 1 場打完、做完數學(拿到第一筆金幣)
    hint: "🛒 商店開放了!用金幣讓角色變強。",
    btn: "hShop",
  },
  {
    k: "chars",
    els: ["hChars", "hEnergy", "hTokens", "hDaily"],
    need: () => P.played >= 3,
    hint: "👤 角色頁開放了!可以用能量升級英雄、解鎖新英雄。",
    btn: "hChars",
  },
  {
    k: "room",
    els: ["hRoom"],
    need: () => P.played >= 5 || P.roomUsed, // 用過邀請連結進房間的也算
    hint: "👥 好友房間開放了!打開「☰ 選單」就能找朋友一起玩。",
    btn: "hRoom",
  },
  {
    k: "acct",
    els: ["hAcct"],
    need: () => P.played >= 5 || !!acct, // 已經登入的人一直顯示
    hint: "👤 「☰ 選單」裡可以建立帳號,把金幣和成績存起來。",
    btn: "hAcct",
  },
];
// 舊存檔(這個功能上線前就在玩的人):有任何進度就全部解鎖,也不顯示 NEW
if (typeof P.played !== "number") {
  const old =
    money > 0 ||
    P.energy > 0 ||
    P.tutDone ||
    Object.values(up).some((v) => v > 0) ||
    Object.keys(P.lv).length > 0 ||
    P.unlocked.length > START_HEROES.length;
  P.played = old ? 5 : 0;
  P.seen = old ? Object.fromEntries(UNLOCKS.map((u) => [u.k, true])) : {};
  save();
}
P.seen = P.seen || {};

// 依解鎖狀態顯示 / 隱藏首頁元素,加上 NEW 標記與說明(updHome 會呼叫)
function updUnlocks() {
  updAcctBtn(); // 首頁的頭像標籤:登入名稱 / 未登入 / 換頭像
  // 已經在用的功能不需要 NEW:登入過的帳號、用過的好友房間
  if (acct) P.seen.acct = true;
  if (P.roomUsed) P.seen.room = true;
  let hint = "";
  for (const u of UNLOCKS) {
    const open = u.need();
    for (const id of u.els) document.getElementById(id).classList.toggle("locked", !open);
    const fresh = open && !P.seen[u.k];
    document.getElementById(u.btn).classList.toggle("new", fresh);
    if (fresh && !hint) hint = u.hint;
  }
  // 選單裡有新功能:選單按鈕也顯示 NEW
  const inMenu = UNLOCKS.filter((u) => ["hRoom", "hAcct"].includes(u.btn));
  document.getElementById("hMenu").classList.toggle("new", inMenu.some((u) => u.need() && !P.seen[u.k]));
  const el = document.getElementById("hNew");
  el.textContent = hint;
  el.style.display = hint ? "" : "none";
}
// 按過新功能的按鈕,就不再顯示 NEW
for (const u of UNLOCKS)
  document.getElementById(u.btn).addEventListener("click", () => {
    if (P.seen[u.k]) return;
    P.seen[u.k] = true;
    save();
    updUnlocks();
  });
