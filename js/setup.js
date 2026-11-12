// 畫布、尺寸、地圖(牆與草叢)、共用全域狀態
const cv = document.getElementById("c");
let ctx = cv.getContext("2d");
const ui = document.getElementById("ui"),
  msg = document.getElementById("msg");
// 場地:3 對 3 用 1000 × 700(20 × 14 格,每格 T)
const W = 1000,
  H = 700,
  T = 50,
  GOAL_Y0 = H / 2 - 100, // 球門口上緣
  GOAL_Y1 = H / 2 + 100, // 球門口下緣
  FS = W / 1400; // AI 跑位距離的縮放(原本是照 1400 寬的場地調的)
// 鏡頭一次看到的場地範圍(場地座標)。數字越小,角色在螢幕上越大。
const VIEW_W = 560,
  VIEW_H = 420;
let vw, vh, sc, dpr;
// 畫面上的按鈕位置(大招、超能力、翻滾),觸控判定和繪圖共用;會避開瀏海與底部橫條
const HUD = { sup: [0, 0], ab: [0, 0], roll: [0, 0], top: 0, l: 0, r: 0, b: 0 };
// 用一個看不見的元素量出安全區域(iPhone 瀏海、底部橫條)的大小
const safeProbe = document.createElement("div");
safeProbe.style.cssText =
  "position:fixed;visibility:hidden;pointer-events:none;inset:0;" +
  "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
document.body.appendChild(safeProbe);
function safeInset(side) {
  const k = { t: "paddingTop", r: "paddingRight", b: "paddingBottom", l: "paddingLeft" }[side];
  return parseFloat(getComputedStyle(safeProbe)[k]) || 0;
}
function rs() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  vw = innerWidth;
  vh = innerHeight;
  cv.width = vw * dpr;
  cv.height = vh * dpr;
  sc = Math.min(vw / VIEW_W, vh / VIEW_H);
  const r = safeInset("r"),
    b = safeInset("b");
  HUD.sup = [vw - 62 - r, vh - 78 - b];
  HUD.ab = [vw - 148 - r, vh - 46 - b];
  HUD.roll = [vw - 130 - r, vh - 122 - b];
  HUD.top = safeInset("t");
  HUD.l = safeInset("l");
  HUD.r = r;
  HUD.b = b;
}
addEventListener("resize", rs);
rs();

// 地圖:牆與草叢(單位是格子,左右、上下都對稱)
const walls = [],
  bushes = [];
function R(x, y, w, h, a) {
  a.push({ x: x * T, y: y * T, w: w * T, h: h * T });
}
[
  [0, 0, 20, 1], // 上邊界
  [0, 13, 20, 1], // 下邊界
  [0, 0, 1, 5], // 左邊界(中間留球門口)
  [0, 9, 1, 5],
  [19, 0, 1, 5], // 右邊界
  [19, 9, 1, 5],
  [4, 3, 2, 2], // 四個方塊
  [14, 3, 2, 2],
  [4, 9, 2, 2],
  [14, 9, 2, 2],
  [9, 2, 2, 1], // 中線上下的矮牆
  [9, 11, 2, 1],
].forEach((a) => R(...a, walls));
[
  [1, 1, 3, 2], // 四個角落
  [16, 1, 3, 2],
  [1, 11, 3, 2],
  [16, 11, 3, 2],
  [7, 4, 2, 2], // 中場兩側(點對稱)
  [11, 8, 2, 2],
].forEach((a) => R(...a, bushes));

const rects = (x, y, r, a) =>
  a.some(
    (b) =>
      x + r > b.x &&
      x - r < b.x + b.w &&
      y + r > b.y &&
      y - r < b.y + b.h,
  );
const inBush = (e) => rects(e.x, e.y, 1, bushes);

let G,
  keys = {},
  mouse = { x: 0, y: 0, down: false };
