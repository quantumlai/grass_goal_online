// 獎勵說明頁:每種貨幣 / 獎勵怎麼拿、能做什麼、存在哪裡。
// 數字都讀遊戲裡的設定(門檻、價格),調整數值時這頁會自動跟著變。
const infoScr = document.getElementById("info");
let infoFrom = "home"; // 從哪裡進來的,按返回就回去那裡

function infoHTML() {
  const items = [
    {
      ic: "🎟️",
      n: "通行卷",
      get: `第一次打開送 ${PASS_GIFT} 張;刷題<b>連續答對 ${PASS_STREAK} 題</b>換 1 張(答錯或離開就從 0 開始),或<b>${durText(MATH_SECS)}內答對 ${PASS_TIMED} 題</b>換 1 張`,
      use: "<b>1 張玩 1 場足球比賽</b>(單機、好友房間都要用;練習不用)",
      where: "LootLocker 帳號(PSS)",
    },
    {
      ic: "💰",
      n: "金幣",
      get: "刷題每答對 1 題得 15~20(雙倍卡時 ×2)",
      use: `商店的<b>屬性升級</b>(血量、速度、攻擊力…,越升越貴)、<b>武裝配件</b>(每個 ${ACCS[0].p})`,
      where: "LootLocker 帳號(CIN)",
    },
    {
      ic: "⚡",
      n: "戰力能量",
      get: `每場比賽結束都有:贏 ${WIN_ENERGY[0]}~${WIN_ENERGY[1]}、平手 ${TIE_ENERGY[0]}~${TIE_ENERGY[1]}、輸 ${LOSE_ENERGY[0]}~${LOSE_ENERGY[1]}`,
      use: `在「角色」頁<b>幫英雄升級</b>(Lv.1→2 要 ${lvCost(1)},之後每級多 50,最高 Lv.${HERO_MAXLV});每升一級血量、傷害 +5%`,
      where: "LootLocker 帳號(PPT)",
    },
    {
      ic: "⭐",
      n: "星光代幣",
      get: `<b>常回來玩</b>:${STREAK_DAYS} 天裡上線第 3、5、7 天,各得 1、1、2 枚(不用連續)。當天刷題答對 1 題就算上線`,
      use: `<b>解鎖新英雄</b>(${UNLOCK_TOKENS} 枚)、<b>解鎖造型</b>(${UNLOCK_TOKENS} 枚)。不會讓角色變強,是讓你有更多選擇`,
      where: "LootLocker 帳號(SAR)",
    },
    {
      ic: "🎫",
      n: "升級券",
      get: "當天打贏 5 場得 1 張",
      use: "在「角色」頁任選一位英雄<b>免費升一級</b>(不用能量)",
      where: "這台裝置",
    },
    {
      ic: "🃏",
      n: "雙倍卡",
      get: "打贏一場比賽就啟動",
      use: "<b>下一次刷題</b>每題金幣 ×2,用一次就消失",
      where: "這台裝置",
    },
  ];
  return (
    '<p class="ahint">一句話:<b>金幣</b>讓角色變強,<b>星光代幣</b>解鎖新英雄和造型,<b>通行卷</b>用來踢足球。</p>' +
    items
      .map(
        (it) =>
          `<div class="icard2"><div class="ihead"><span>${it.ic}</span><b>${it.n}</b><small>存在:${it.where}</small></div>` +
          `<p><em>怎麼拿</em>${it.get}</p><p><em>用途</em>${it.use}</p></div>`,
      )
      .join("")
  );
}
function showInfo(from) {
  infoFrom = from;
  homeOn = true;
  [home, ui, shopScr, sdetail, roster, detail, acctScr, roomScr].forEach((el) => (el.style.display = "none"));
  closeMenu();
  document.getElementById("infoBody").innerHTML = infoHTML();
  infoScr.style.display = "flex";
  infoScr.scrollTop = 0;
}
document.getElementById("hInfo").onclick = () => showInfo("home");
document.getElementById("aMeInfo").onclick = () => showInfo("acct");
document.getElementById("infoBack").onclick = () => {
  infoScr.style.display = "none";
  if (infoFrom === "acct") showAcct();
  else showHome();
};
