// 畫布、尺寸、地圖(牆與草叢)、共用全域狀態
const cv = document.getElementById("c");
let ctx = cv.getContext("2d");
const ui = document.getElementById("ui"),
  msg = document.getElementById("msg");
const W = 1400,
  H = 1000,
  T = 50;
let vw, vh, sc, dpr;
function rs() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  vw = innerWidth;
  vh = innerHeight;
  cv.width = vw * dpr;
  cv.height = vh * dpr;
  sc = Math.min(vw / 620, vh / 460);
}
addEventListener("resize", rs);
rs();

// 地圖:牆與草叢
const walls = [],
  bushes = [];
function R(x, y, w, h, a) {
  a.push({ x: x * T, y: y * T, w: w * T, h: h * T });
}
[
  [0, 0, 28, 1],
  [0, 19, 28, 1],
  [0, 0, 1, 7],
  [0, 13, 1, 7],
  [27, 0, 1, 7],
  [27, 13, 1, 7],
  [6, 4, 2, 2],
  [20, 4, 2, 2],
  [6, 14, 2, 2],
  [20, 14, 2, 2],
  [13, 3, 2, 2],
  [13, 15, 2, 2],
  [10, 9, 1, 2],
  [17, 9, 1, 2],
].forEach((a) => R(...a, walls));
[
  [3, 2, 4, 3],
  [21, 2, 4, 3],
  [3, 15, 4, 3],
  [21, 15, 4, 3],
  [11, 5, 3, 2],
  [14, 13, 3, 2],
  [9, 14, 2, 2],
  [17, 4, 2, 2],
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
