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
// 武裝配件(金幣購買)與造型(星光代幣解鎖)也放進商店
ACCS.forEach((a) =>
  SHOP.push({ kind: "acc", k: a.k, n: a.n, ic: a.ic, p: a.p, col: a.col, cat: 4, d: a.d }),
);
SKINS.forEach((s) =>
  SHOP.push({
    kind: "skin",
    k: s.k,
    n: s.n + "造型",
    ic: "🎨",
    p: UNLOCK_TOKENS,
    col: s.pal[1],
    pal: s.pal,
    cat: 5,
    d: "把角色換成「" + s.n + "」配色。解鎖後每位英雄都能在角色頁自由套用。",
  }),
);
const CATN = ["🛡 基礎", "⚔️ 戰鬥", "🧠 技能", "⚽ 足球", "🎽 武裝配件", "🎨 造型"],
  MAXL = 10;
// 屬性升級越升越貴:每升一級價格 +50%
const upPrice = (it) => Math.round(it.p * (1 + 0.5 * (up[it.k] || 0)));
// 商品狀態:{ tag: 卡片價格欄文字, can: 能不能按, btn: 詳細頁按鈕文字, cls: 價格欄樣式 }
function itemState(it) {
  const c = CH[pick];
  if (it.kind === "acc") {
    if (P.accEq === it.k) return { tag: "裝備中", cls: "max", can: true, btn: "卸下" };
    if (P.acc.includes(it.k)) return { tag: "已擁有", cls: "max", can: true, btn: "裝備" };
    const ok = money >= it.p;
    return { tag: "💰" + it.p, cls: ok ? "" : "no", can: ok, btn: "購買 💰" + it.p };
  }
  if (it.kind === "skin") {
    if (P.skins.includes(it.k)) {
      const on = P.skinEq[pick] === it.k;
      return {
        tag: on ? "使用中" : "已解鎖",
        cls: "max",
        can: true,
        btn: on ? "改回原色" : "套用到 " + c.icon + c.name,
      };
    }
    const ok = P.tokens >= it.p;
    return { tag: "⭐" + it.p, cls: ok ? "" : "no", can: ok, btn: "解鎖 ⭐" + it.p };
  }
  const lv = up[it.k] || 0,
    pr = upPrice(it);
  if (lv >= MAXL) return { tag: "MAX", cls: "max", can: false, btn: "已滿級" };
  const ok = money >= pr;
  return { tag: "💰" + pr, cls: ok ? "" : "no", can: ok, btn: "購買 💰" + pr };
}
let sIdx = 0;
function buildShopScr() {
  const g = $s("sgrid");
  g.innerHTML = "";
  $s("sMoney").textContent = wallet("ct");
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
          st = itemState(it),
          b = document.createElement("button");
        b.className = "icard";
        b.style.background =
          "linear-gradient(160deg," + it.col + "66,#1d1f6e)";
        const ic = document.createElement("div");
        ic.className = "icon";
        if (it.pal) {
          ic.className = "icon swatch";
          ic.style.background =
            "radial-gradient(circle at 35% 35%," + it.pal[0] + "," + it.pal[1] + ")";
        } else ic.textContent = it.ic;
        b.appendChild(ic);
        const n = document.createElement("div");
        n.className = "cn";
        n.textContent = it.n;
        b.appendChild(n);
        if (!it.kind) {
          const lv = up[it.k] || 0,
            pp = document.createElement("div");
          pp.className = "pips";
          for (let j = 0; j < MAXL; j++) {
            const q = document.createElement("i");
            if (j < lv) q.className = "on";
            pp.appendChild(q);
          }
          b.appendChild(pp);
        }
        const pr = document.createElement("div");
        pr.className = "price" + (st.cls ? " " + st.cls : "");
        pr.textContent = st.tag;
        b.appendChild(pr);
        b.onclick = () => openShopItem(i);
        row.appendChild(b);
      });
    g.appendChild(row);
  });
}
function showShop() {
  homeOn = true;
  [home, ui, roster, detail, sdetail].forEach((el) => (el.style.display = "none"));
  detailOn = false;
  shopScr.style.display = "block";
  buildShopScr();
  shopScr.scrollTop = 0;
}
function openShopItem(i) {
  sIdx = (i + SHOP.length) % SHOP.length;
  const it = SHOP[sIdx],
    st = itemState(it),
    c = CH[pick];
  shopScr.style.display = "none";
  sdetail.style.display = "flex";
  sdetail.style.background =
    "linear-gradient(180deg," + it.col + "88,#1b1450 60%)";
  $s("sdMoney").textContent = wallet("ct");
  $s("sdIcon").textContent = it.pal ? "" : it.ic;
  $s("sdDesc").textContent = it.d;
  if (!it.kind) {
    const lv = up[it.k] || 0,
      mx = lv >= MAXL;
    $s("sdTitle").innerHTML = it.n + "<small>Lv." + lv + " / " + MAXL + "</small>";
    $s("sdLv").style.display = "";
    $s("sdLv").innerHTML = Array.from(
      { length: MAXL },
      (_, j) => '<i class="' + (j < lv ? "on" : "") + '"></i>',
    ).join("");
    $s("sdCmp").style.display = "";
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
  } else {
    $s("sdTitle").innerHTML =
      it.n + "<small>" + (it.kind === "acc" ? "武裝配件" : "外觀") + "</small>";
    $s("sdLv").style.display = "none";
    $s("sdCmp").style.display = "none";
    if (it.kind === "acc") {
      $s("sdPv").innerHTML =
        "<p>只對你操控的角色有效,一次只能裝備一個配件。</p>";
    } else {
      // 用目前出戰的英雄預覽這個造型
      $s("sdPv").innerHTML = '<canvas width="200" height="170"></canvas>';
      drawPortrait($s("sdPv").firstChild, c, 0.6, 2.4, true, it.pal);
    }
  }
  const bt = $s("sdBuy");
  bt.disabled = !st.can;
  bt.textContent = st.btn;
  sdetail.scrollTop = 0;
}
$s("sdBuy").onclick = () => {
  const it = SHOP[sIdx];
  let done = false;
  if (it.kind === "acc") {
    if (P.acc.includes(it.k)) {
      P.accEq = P.accEq === it.k ? null : it.k;
      save();
      done = true;
    } else done = buyAcc(it.k);
  } else if (it.kind === "skin") {
    if (P.skins.includes(it.k)) {
      if (P.skinEq[pick] === it.k) delete P.skinEq[pick];
      else P.skinEq[pick] = it.k;
      save();
      done = true;
    } else if (unlockSkin(it.k)) {
      P.skinEq[pick] = it.k; // 解鎖後直接套用到目前英雄
      save();
      done = true;
    }
  } else if ((up[it.k] || 0) < MAXL && spendCoins(upPrice(it))) {
    up[it.k] = (up[it.k] || 0) + 1;
    save();
    done = true;
  }
  if (!done) return;
  updHome();
  openShopItem(sIdx);
  const t = $s("sdIcon");
  t.classList.remove("pop");
  void t.offsetWidth;
  t.classList.add("pop");
};
$s("sBack").onclick = showHome;
$s("sdBack").onclick = () => {
  sdetail.style.display = "none";
  showShop();
};
$s("sdPrev").onclick = () => openShopItem(sIdx - 1);
$s("sdNext").onclick = () => openShopItem(sIdx + 1);
