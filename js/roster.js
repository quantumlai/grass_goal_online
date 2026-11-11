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
function drawPortrait(cn, c, t, sc, bg) {
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
  document.getElementById("rMoney").textContent = "💰 $" + money;
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
        b.className = "card" + (i === pick ? " on" : "");
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
  pick = dIdx;
  buildPick();
  showHome();
};
document.getElementById("dPlay").onclick = () => {
  pick = dIdx;
  buildPick();
  detail.style.display = "none";
  detailOn = false;
  roster.style.display = "none";
  leaveHome();
  document.getElementById("go").onclick();
};
