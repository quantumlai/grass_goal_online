// 角色列表與角色詳細頁
const roster = document.getElementById("roster"),
  detail = document.getElementById("detail"),
  dcv = document.getElementById("dcv");
let detailOn = false,
  dIdx = 0;
const TEAMC = ["#3b82f6", "#ff4d4d"],
  TEAMN = ["藍隊", "紅隊"];
const ROLEINFO = [
  "留在球門前守住球門,清除危險球",
  "守在後場攔截對手,把球往前踢",
  "連接攻守,負責搶球與傳球",
  "待在前場,負責把球射進對方球門",
];
function drawPortrait(cn, c, t, sc, bg, skin) {
  const x = cn.getContext("2d"),
    old = ctx;
  ctx = x;
  try {
    const w = cn.width,
      h = cn.height;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, w, h);
    if (bg) {
      const g = x.createRadialGradient(
        w / 2,
        h * 0.55,
        10,
        w / 2,
        h * 0.55,
        w * 0.55,
      );
      g.addColorStop(0, c.col + "aa");
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
    }
    const R =
      c.k === "tank" || c.k === "wall" || c.k === "brute" ? 21 : 16;
    const e = {
      x: 0,
      y: 0,
      r: R,
      ang: Math.sin(t * 1.3) * 0.5,
      c,
      hitT: 0,
      tm: c.team,
      role: c.role,
      id: 9,
      hp: 1,
      max: 1,
      skin: skin !== undefined ? skin : skinOf(CH.indexOf(c)),
    };
    x.save();
    x.translate(w / 2, h * 0.58);
    x.scale(sc, sc);
    x.fillStyle = "rgba(0,0,0,.35)";
    x.beginPath();
    x.ellipse(4, R + 1, R * 1.3, 7, 0, 0, 6.283);
    x.fill();
    const sv = G.t;
    G.t = t;
    drawChar(e);
    G.t = sv;
    x.restore();
  } finally {
    ctx = old;
  }
}
function buildRoster() {
  const g = document.getElementById("rgrid");
  g.innerHTML = "";
  document.getElementById("rMoney").textContent = wallet("et");
  [0, 1].forEach((tm) => {
    const h = document.createElement("h3");
    h.textContent = (tm ? "🔴 " : "🔵 ") + TEAMN[tm];
    h.style.color = TEAMC[tm];
    g.appendChild(h);
    const row = document.createElement("div");
    row.className = "rrow";
    CH.map((c, i) => i)
      .filter((i) => CH[i].team === tm)
      .sort((a, b) => CH[a].role - CH[b].role)
      .forEach((i) => {
        const c = CH[i],
          b = document.createElement("button");
        const lk = !isUnlocked(i);
        b.className = "card" + (i === pick ? " on" : "") + (lk ? " lock" : "");
        b.style.borderColor = TEAMC[tm];
        b.style.background =
          "linear-gradient(160deg," + c.col + "66,#1d1f6e)";
        const cn = document.createElement("canvas");
        cn.width = 96;
        cn.height = 96;
        drawPortrait(cn, c, 0.6, 1.45, false);
        b.appendChild(cn);
        const n = document.createElement("div");
        n.className = "cn";
        n.textContent = c.name;
        b.appendChild(n);
        const sm = document.createElement("small");
        sm.textContent = ROLES[c.role] + " · " + c.job;
        b.appendChild(sm);
        const lb = document.createElement("span");
        lb.className = "lvtag";
        lb.textContent = lk ? "🔒" : "Lv." + heroLv(i);
        b.appendChild(lb);
        if (i === pick) {
          const k = document.createElement("span");
          k.className = "cb";
          k.textContent = "出戰中";
          b.appendChild(k);
        }
        b.onclick = () => openDetail(i);
        row.appendChild(b);
      });
    g.appendChild(row);
  });
}
function showRoster() {
  homeOn = true;
  home.style.display = "none";
  ui.style.display = "none";
  detail.style.display = "none";
  detailOn = false;
  roster.style.display = "block";
  buildRoster();
  roster.scrollTop = 0;
}
function openDetail(i) {
  dIdx = (i + CH.length) % CH.length;
  const c = CH[dIdx];
  detailOn = true;
  roster.style.display = "none";
  detail.style.display = "flex";
  detail.style.background =
    "linear-gradient(180deg," + c.col + "88,#14175a 55%)";
  document.getElementById("dTitle").innerHTML =
    c.icon + " " + c.name + "<small>" + c.job + "</small>";
  document.getElementById("dtags").innerHTML =
    '<span style="border-color:' +
    TEAMC[c.team] +
    '">' +
    TEAMN[c.team] +
    "</span><span>" +
    ROLES[c.role] +
    "</span><span>" +
    c.job +
    "</span>";
  dProg();
  const st = [
    ["血量", c.hp, 230, c.hp],
    ["移動速度", c.sp, 240, c.sp],
    ["射程", c.rng, 520, c.rng],
    ["射速", 1 / c.cd, 2.2, (1 / c.cd).toFixed(1) + "/秒"],
  ];
  document.getElementById("dstats").innerHTML = st
    .map(
      ([n, v, m, t]) =>
        '<div class="st"><b>' +
        n +
        '</b><i><u style="width:' +
        Math.min(100, (v / m) * 100) +
        "%;background:" +
        c.col +
        '"></u></i><em>' +
        t +
        "</em></div>",
    )
    .join("");
  const pt = c.d.split("大招:"),
    mv = [
      ["⚔️", "普通攻擊", pt[0].replace(/。$/, "")],
      ["💥", "大招「" + c.sname + "」", pt[1] || ""],
      [
        "⚡",
        "超能力「" + c.aname + "」",
        c.ad + "(冷卻 " + c.acd + " 秒)",
      ],
      ["⭐", "星之力「" + c.star + "」", c.sd],
      ["💨", "翻滾", "短暫無敵的閃避(冷卻 3.5 秒)"],
      ["🧭", "位置職責:" + ROLES[c.role], ROLEINFO[c.role]],
    ];
  document.getElementById("dmoves").innerHTML = mv
    .map(
      ([ic, n, t]) =>
        '<div class="mv"><span>' +
        ic +
        "</span><div><b>" +
        n +
        "</b><p>" +
        t +
        "</p></div></div>",
    )
    .join("");
  detail.scrollTop = 0;
}
// 英雄養成區:解鎖 / 升級 / 升級券 / 造型
function dProg() {
  const ci = dIdx,
    el = document.getElementById("dprog"),
    lk = !isUnlocked(ci),
    l = heroLv(ci);
  let h = '<div class="pwal">' + wallet("et") + (P.vouchers ? " · 🎫 " + P.vouchers : "") + "</div>";
  if (lk) {
    h +=
      '<p>這位英雄還沒解鎖。集滿 ⭐' +
      UNLOCK_TOKENS +
      ' 枚星光代幣就能解鎖!</p><button class="pbtn" data-a="unlock"' +
      (P.tokens < UNLOCK_TOKENS ? " disabled" : "") +
      ">🔓 解鎖(⭐" +
      UNLOCK_TOKENS +
      ")</button>";
  } else {
    h +=
      '<div class="plv"><b>Lv.' +
      l +
      "</b><small> / " +
      HERO_MAXLV +
      "</small><span>血量、傷害各 +" +
      5 * (l - 1) +
      "%</span></div>";
    if (l < HERO_MAXLV)
      h +=
        '<div class="prow"><button class="pbtn" data-a="lv"' +
        (P.energy < lvCost(l) ? " disabled" : "") +
        ">⬆ 升級(⚡" +
        lvCost(l) +
        ")</button>" +
        (P.vouchers
          ? '<button class="pbtn alt" data-a="voucher">🎫 用升級券</button>'
          : "") +
        "</div>";
    else h += "<p>🏅 已經升到最高等級!</p>";
    const own = SKINS.filter((s) => P.skins.includes(s.k));
    h +=
      '<div class="pskin"><span>🎨 造型</span>' +
      [{ k: "", n: "原色" }]
        .concat(own)
        .map(
          (s) =>
            '<button data-skin="' +
            s.k +
            '" class="' +
            ((P.skinEq[ci] || "") === s.k ? "on" : "") +
            '">' +
            s.n +
            "</button>",
        )
        .join("") +
      (own.length ? "" : "<small>到商店用 ⭐ 解鎖造型</small>") +
      "</div>";
  }
  el.innerHTML = h;
  el.querySelectorAll("[data-a]").forEach(
    (b) =>
      (b.onclick = () => {
        const a = b.dataset.a;
        if (a === "unlock") unlockHero(ci);
        if (a === "lv") levelUpHero(ci, false);
        if (a === "voucher") levelUpHero(ci, true);
        openDetail(ci);
      }),
  );
  el.querySelectorAll("[data-skin]").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.skin) P.skinEq[ci] = b.dataset.skin;
        else delete P.skinEq[ci];
        save();
        dProg();
      }),
  );
  document.getElementById("dPick").disabled = lk;
  document.getElementById("dPlay").disabled = lk;
}
function drawDetail(ts) {
  drawPortrait(dcv, CH[dIdx], ts / 1000, 3.3, true);
}
document.getElementById("rBack").onclick = showHome;
document.getElementById("dBack").onclick = () => {
  detail.style.display = "none";
  detailOn = false;
  showRoster();
};
document.getElementById("dPrev").onclick = () => openDetail(dIdx - 1);
document.getElementById("dNext").onclick = () => openDetail(dIdx + 1);
document.getElementById("dPick").onclick = () => {
  if (!isUnlocked(dIdx)) return;
  pick = dIdx;
  save();
  showHome();
};
document.getElementById("dPlay").onclick = () => {
  if (!isUnlocked(dIdx)) return;
  pick = dIdx;
  startMatch();
};
