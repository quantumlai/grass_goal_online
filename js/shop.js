// 商店列表與商品詳細頁
const shopScr = document.getElementById("shopscr"),
  sdetail = document.getElementById("sdetail"),
  $s = (id) => document.getElementById(id);
const SHOP = [
  {
    k: "hp",
    n: "血量變高",
    ic: "❤️",
    p: 100,
    col: "#ff5a6e",
    cat: 0,
    d: "提高你操控角色的血量上限,更耐打、更難被擊倒。",
    f: (l) => "+" + 10 * l + "% 血量",
    pv: (l, c) => Math.round(c.hp * (1 + 0.1 * l)) + " 血",
  },
  {
    k: "spd",
    n: "移動加速",
    ic: "👟",
    p: 120,
    col: "#4cc9f0",
    cat: 0,
    d: "提高移動速度,更容易追球、閃避與回防。",
    f: (l) => "+" + 5 * l + "% 移速",
    pv: (l, c) => Math.round(c.sp * (1 + 0.05 * l)) + " 速度",
  },
  {
    k: "resp",
    n: "重生加速",
    ic: "⏱️",
    p: 100,
    col: "#b5e48c",
    cat: 0,
    d: "被擊倒後更快回到場上。",
    f: (l) => "重生 " + (3 * Math.pow(0.85, l)).toFixed(1) + " 秒",
    pv: (l) => (3 * Math.pow(0.85, l)).toFixed(1) + " 秒",
  },
  {
    k: "rate",
    n: "射速變快",
    ic: "🔫",
    p: 200,
    col: "#ffa94d",
    cat: 1,
    d: "縮短普通攻擊的間隔,輸出更快。",
    f: (l) =>
      "射速 +" + Math.round((1 / Math.pow(0.92, l) - 1) * 100) + "%",
    pv: (l, c) => (c.cd * Math.pow(0.92, l)).toFixed(2) + " 秒/發",
  },
  {
    k: "atk",
    n: "攻擊力變強",
    ic: "💥",
    p: 300,
    col: "#ff7043",
    cat: 1,
    d: "提高你射出的子彈傷害。",
    f: (l) => "+" + 10 * l + "% 傷害",
  },
  {
    k: "chg",
    n: "大招充能",
    ic: "⚡",
    p: 250,
    col: "#ffe14a",
    cat: 1,
    d: "攻擊與命中時,大招充能得更快。",
    f: (l) => "+" + 15 * l + "% 充能速度",
  },
  {
    k: "cdr",
    n: "超能力冷卻",
    ic: "🔧",
    p: 200,
    col: "#c77dff",
    cat: 2,
    d: "縮短超能力的冷卻時間。",
    f: (l) => "冷卻 -" + Math.round((1 - Math.pow(0.94, l)) * 100) + "%",
    pv: (l, c) => (c.acd * Math.pow(0.94, l)).toFixed(1) + " 秒",
  },
  {
    k: "roll",
    n: "翻滾冷卻",
    ic: "💨",
    p: 150,
    col: "#8be9ff",
    cat: 2,
    d: "縮短翻滾的冷卻,閃避更頻繁。",
    f: (l) => "冷卻 -" + Math.round((1 - Math.pow(0.92, l)) * 100) + "%",
    pv: (l) => (3.5 * Math.pow(0.92, l)).toFixed(1) + " 秒",
  },
  {
    k: "kick",
    n: "射門力量",
    ic: "⚽",
    p: 180,
    col: "#5bb85d",
    cat: 3,
    d: "提高踢球的力道,射門更猛、傳球更遠。",
    f: (l) => "+" + 8 * l + "% 踢球力道",
    pv: (l) => Math.round(700 * (1 + 0.08 * l)) + " 球速",
  },
];
const CATN = ["🛡 基礎", "⚔️ 戰鬥", "🧠 技能", "⚽ 足球"],
  MAXL = 10;
let sIdx = 0;
function buildShopScr() {
  const g = $s("sgrid");
  g.innerHTML = "";
  $s("sMoney").textContent = "💰 $" + money;
  CATN.forEach((cn, ci) => {
    const h = document.createElement("h3");
    h.textContent = cn;
    g.appendChild(h);
    const row = document.createElement("div");
    row.className = "srow";
    SHOP.map((it, i) => i)
      .filter((i) => SHOP[i].cat === ci)
      .forEach((i) => {
        const it = SHOP[i],
          lv = up[it.k] || 0,
          mx = lv >= MAXL,
          b = document.createElement("button");
        b.className = "icard";
        b.style.background =
          "linear-gradient(160deg," + it.col + "66,#1d1f6e)";
        const ic = document.createElement("div");
        ic.className = "icon";
        ic.textContent = it.ic;
        b.appendChild(ic);
        const n = document.createElement("div");
        n.className = "cn";
        n.textContent = it.n;
        b.appendChild(n);
        const pp = document.createElement("div");
        pp.className = "pips";
        for (let j = 0; j < MAXL; j++) {
          const q = document.createElement("i");
          if (j < lv) q.className = "on";
          pp.appendChild(q);
        }
        b.appendChild(pp);
        const pr = document.createElement("div");
        pr.className =
          "price" + (mx ? " max" : money < it.p ? " no" : "");
        pr.textContent = mx ? "MAX" : "$" + it.p;
        b.appendChild(pr);
        b.onclick = () => openShopItem(i);
        row.appendChild(b);
      });
    g.appendChild(row);
  });
}
function showShop() {
  homeOn = true;
  home.style.display = "none";
  ui.style.display = "none";
  roster.style.display = "none";
  detail.style.display = "none";
  detailOn = false;
  sdetail.style.display = "none";
  shopScr.style.display = "block";
  buildShopScr();
  shopScr.scrollTop = 0;
}
function openShopItem(i) {
  sIdx = (i + SHOP.length) % SHOP.length;
  const it = SHOP[sIdx],
    lv = up[it.k] || 0,
    mx = lv >= MAXL,
    c = CH[pick];
  shopScr.style.display = "none";
  sdetail.style.display = "flex";
  sdetail.style.background =
    "linear-gradient(180deg," + it.col + "88,#1b1450 60%)";
  $s("sdTitle").innerHTML =
    it.n + "<small>Lv." + lv + " / " + MAXL + "</small>";
  $s("sdMoney").textContent = "💰 $" + money;
  $s("sdIcon").textContent = it.ic;
  $s("sdDesc").textContent = it.d;
  $s("sdLv").innerHTML = Array.from(
    { length: MAXL },
    (_, j) => '<i class="' + (j < lv ? "on" : "") + '"></i>',
  ).join("");
  $s("sdCmp").innerHTML =
    "<div><small>目前</small><b>" +
    it.f(lv) +
    "</b></div><span>➜</span><div><small>" +
    (mx ? "已滿級" : "下一級") +
    "</small><b>" +
    (mx ? "MAX" : it.f(lv + 1)) +
    "</b></div>";
  $s("sdPv").innerHTML = it.pv
    ? "<p>以 " +
      c.icon +
      c.name +
      " 為例:<b>" +
      it.pv(lv, c) +
      "</b>" +
      (mx ? "" : " ➜ <b>" + it.pv(lv + 1, c) + "</b>") +
      "</p>"
    : "";
  const bt = $s("sdBuy");
  bt.disabled = mx || money < it.p;
  bt.textContent = mx ? "已滿級" : "購買 $" + it.p;
  sdetail.scrollTop = 0;
}
$s("sdBuy").onclick = () => {
  const it = SHOP[sIdx];
  if (money >= it.p && (up[it.k] || 0) < MAXL) {
    money -= it.p;
    up[it.k] = (up[it.k] || 0) + 1;
    save();
    updHome();
    openShopItem(sIdx);
    const t = $s("sdIcon");
    if (t.classList) {
      t.classList.remove("pop");
      void t.offsetWidth;
      t.classList.add("pop");
    }
  }
};
$s("sBack").onclick = showHome;
$s("sdBack").onclick = () => {
  sdetail.style.display = "none";
  showShop();
};
$s("sdPrev").onclick = () => openShopItem(sIdx - 1);
$s("sdNext").onclick = () => openShopItem(sIdx + 1);
$s("uiShop").onclick = () => showShop();
