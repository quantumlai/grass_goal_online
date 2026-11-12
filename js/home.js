// 首頁:錢包、今日勝場、切換英雄、出擊
const home = document.getElementById("home");
// 錢包文字,ks 例如 "cet" = 金幣、能量、代幣
function wallet(ks) {
  const m = { c: "💰 " + money, e: "⚡ " + P.energy, t: "⭐ " + P.tokens };
  return ks
    .split("")
    .map((k) => m[k])
    .join(" · ");
}
function updHome() {
  const c = CH[pick];
  document.getElementById("hMoney").textContent = "💰 " + money;
  document.getElementById("hEnergy").textContent = "⚡ " + P.energy;
  document.getElementById("hTokens").textContent = "⭐ " + P.tokens;
  document.getElementById("hDaily").innerHTML = dailyHTML();
  document.getElementById("hName").innerHTML =
    c.icon +
    " " +
    c.name +
    " <span class=\"lvb\">Lv." +
    heroLv(pick) +
    "</span><small>" +
    (c.team ? "紅隊" : "藍隊") +
    " · " +
    ROLES[c.role] +
    " · " +
    c.job +
    "</small>";
  // 還沒練習過:練習按鈕閃爍提醒
  document.getElementById("hTut").classList.toggle("hint", !P.tutDone);
  const pl = document.getElementById("play");
  pl.textContent = P.mathPending ? "📝 先做數學" : "出擊!";
}
function showHome() {
  homeOn = true;
  if (typeof tutStop === "function") tutStop(); // 從練習回首頁
  [ui, shopScr, sdetail, roster, detail, mathScr, mresScr, acctScr, roomScr].forEach(
    (el) => (el.style.display = "none"),
  );
  detailOn = false;
  home.style.display = "flex";
  updHome();
}
function leaveHome() {
  homeOn = false;
  home.style.display = "none";
}
// 開始比賽;還沒做完上一場的數學挑戰就先去做
function startMatch() {
  if (P.mathPending) return startMath();
  if (!isUnlocked(pick)) return;
  save();
  [ui, shopScr, sdetail, roster, detail].forEach((el) => (el.style.display = "none"));
  detailOn = false;
  leaveHome();
  reset();
  mouse.down = false;
}
document.getElementById("play").onclick = startMatch;
// 首頁右下角的版本號(開發環境另外標示)
document.getElementById("ver").textContent =
  "v" + APP_VERSION + (ENV_NAME === "development" ? " · dev" : "");
document.getElementById("hChars").onclick = () => showRoster();
document.getElementById("hShop").onclick = () => showShop();
// 首頁左右切換只在已解鎖的英雄之間
function stepPick(d) {
  const L = CH.map((c, i) => i).filter(isUnlocked);
  pick = L[(L.indexOf(pick) + d + L.length) % L.length];
  save();
  updHome();
}
document.getElementById("hPrev").onclick = () => stepPick(-1);
document.getElementById("hNext").onclick = () => stepPick(1);
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
    skin: skinOf(pick),
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
