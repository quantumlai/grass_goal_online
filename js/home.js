// 開戰選角、首頁
const pk = document.getElementById("pick");
function buildPick() {
  pk.innerHTML = "";
  CH.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "ch" + (i === pick ? " on" : "");
    b.innerHTML =
      c.icon +
      " " +
      c.name +
      "<small>" +
      (c.team ? "紅隊" : "藍隊") +
      "·" +
      ROLES[c.role] +
      "</small>";
    b.onclick = () => {
      pick = i;
      buildPick();
    };
    pk.appendChild(b);
  });
  document.getElementById("desc").textContent =
    (CH[pick].team ? "紅隊" : "藍隊") +
    "·" +
    ROLES[CH[pick].role] +
    "(" +
    CH[pick].job +
    ")\n" +
    CH[pick].d +
    "\n超能力「" +
    CH[pick].aname +
    "」:" +
    CH[pick].ad +
    "\n星之力「" +
    CH[pick].star +
    "」:" +
    CH[pick].sd +
    "\n翻滾:短暫無敵的閃避";
}
buildPick();
function buildShop() {
  const el = document.getElementById("shop");
  el.innerHTML = "";
  const h = document.createElement("div");
  h.id = "money";
  h.textContent = "💰 $" + money;
  updHome();
  el.appendChild(h);
  [
    ["hp", "血量變高", 100, "+10% 血量"],
    ["resp", "重生加速", 100, "重生時間 -15%"],
    ["spd", "移動加速", 120, "+5% 移速"],
    ["roll", "翻滾冷卻", 150, "冷卻 -8%"],
    ["kick", "射門力量", 180, "+8% 踢球力道"],
    ["rate", "射速變快", 200, "+8% 射速"],
    ["cdr", "超能力冷卻", 200, "冷卻 -6%"],
    ["chg", "大招充能", 250, "+15% 充能速度"],
    ["atk", "攻擊力變強", 300, "+10% 傷害"],
  ].forEach(([k, n, c, d]) => {
    const b = document.createElement("button");
    b.className = "ch";
    b.disabled = money < c || up[k] >= 10;
    b.style.opacity = b.disabled ? 0.5 : 1;
    b.innerHTML =
      n + " Lv." + up[k] + "<small>$" + c + " · " + d + "</small>";
    b.onclick = () => {
      if (money >= c && up[k] < 10) {
        money -= c;
        up[k]++;
        save();
        buildShop();
      }
    };
    el.appendChild(b);
  });
}
buildShop();
document.getElementById("go").onclick = () => {
  reset();
  ui.style.display = "none";
  mouse.down = false;
};
const home = document.getElementById("home");
function updHome() {
  const t = document.getElementById("hTrophy");
  if (!t) return;
  const c = CH[pick];
  t.textContent = "🏆 " + trophy;
  document.getElementById("hMoney").textContent = "💰 $" + money;
  document.getElementById("hName").innerHTML =
    c.icon +
    " " +
    c.name +
    "<small>" +
    (c.team ? "紅隊" : "藍隊") +
    " · " +
    ROLES[c.role] +
    " · " +
    c.job +
    "</small>";
}
function showHome() {
  homeOn = true;
  ui.style.display = "none";
  shopScr.style.display = "none";
  sdetail.style.display = "none";
  roster.style.display = "none";
  detail.style.display = "none";
  detailOn = false;
  home.style.display = "flex";
  updHome();
}
function leaveHome() {
  homeOn = false;
  home.style.display = "none";
}
document.getElementById("play").onclick = () => {
  leaveHome();
  document.getElementById("go").onclick();
};
document.getElementById("hChars").onclick = () => showRoster();
document.getElementById("hShop").onclick = () => showShop();
document.getElementById("backHome").onclick = showHome;
document.getElementById("hPrev").onclick = () => {
  pick = (pick + CH.length - 1) % CH.length;
  updHome();
  buildPick();
};
document.getElementById("hNext").onclick = () => {
  pick = (pick + 1) % CH.length;
  updHome();
  buildPick();
};
function drawHome(ts) {
  const t = ts / 1000,
    c = CH[pick];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, vh);
  g.addColorStop(0, "#6a2fb8");
  g.addColorStop(0.55, "#2b2a86");
  g.addColorStop(1, "#14175a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, vw, vh);
  const cy = (vh - 50) / 2,
    big = Math.max(vw, vh);
  ctx.save();
  ctx.translate(vw / 2, cy);
  ctx.rotate(t * 0.12);
  ctx.fillStyle = "rgba(255,255,255,.07)";
  for (let i = 0; i < 10; i++) {
    ctx.rotate(Math.PI / 5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(big, -70);
    ctx.lineTo(big, 70);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = c.team ? "rgba(255,77,77,.22)" : "rgba(59,130,246,.25)";
  ctx.beginPath();
  ctx.arc(vw / 2, cy, Math.min(vw, vh) * 0.3, 0, 6.283);
  ctx.fill();
  for (let i = 0; i < 16; i++) {
    const x = ((i * 173 + t * (14 + (i % 4) * 8)) % (vw + 80)) - 40,
      y = (i * 97 + Math.sin(t * 0.8 + i) * 18 + vh) % vh;
    ctx.fillStyle = "rgba(255,255,255," + (0.06 + (i % 3) * 0.04) + ")";
    ctx.beginPath();
    ctx.arc(x, y, 5 + (i % 4) * 3, 0, 6.283);
    ctx.fill();
  }
  const s = Math.max(1.4, Math.min(4.6, (vh - 340) / 60)),
    R = c.k === "tank" || c.k === "wall" || c.k === "brute" ? 21 : 16;
  const e = {
    x: 0,
    y: 0,
    r: R,
    ang: Math.sin(t * 1.3) * 0.6,
    c,
    hitT: 0,
    tm: c.team,
    role: c.role,
    id: 9,
    hp: 1,
    max: 1,
  };
  ctx.save();
  ctx.translate(vw / 2, cy + Math.sin(t * 3) * 5);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(4, R + 1, R * 1.3, 7, 0, 0, 6.283);
  ctx.fill();
  const sv = G.t;
  G.t = t;
  drawChar(e);
  G.t = sv;
  ctx.restore();
}
