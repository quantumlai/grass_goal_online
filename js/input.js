// 輸入:觸控搖桿、鍵盤、滑鼠 → 每一幀整理成一份「輸入資料」(readLocalInput)
// 模擬(update.js)只看輸入資料,不直接讀裝置,所以連線時可以換成別的玩家送來的輸入。
const stick = {
  l: { id: null, x: 0, y: 0, dx: 0, dy: 0 },
  r: { id: null, x: 0, y: 0, dx: 0, dy: 0, on: false },
};
function tpos(t) {
  return { x: t.clientX, y: t.clientY };
}
addEventListener(
  "touchstart",
  (e) => {
    if (ui.style.display !== "none" || homeOn) return;
    if (e.target.closest && e.target.closest("#emoBtn,#emoPanel,#tut button")) return; // 這些按鈕交給 DOM 處理
    for (const t of e.changedTouches) {
      if (Math.hypot(t.clientX - HUD.sup[0], t.clientY - HUD.sup[1]) < 50) {
        superReq = true;
        continue;
      }
      if (Math.hypot(t.clientX - HUD.ab[0], t.clientY - HUD.ab[1]) < 38) {
        abReq = true;
        continue;
      }
      if (Math.hypot(t.clientX - HUD.roll[0], t.clientY - HUD.roll[1]) < 32) {
        rollReq = true;
        continue;
      }
      const s = t.clientX < vw / 2 ? stick.l : stick.r;
      if (s.id === null) {
        s.id = t.identifier;
        s.x = t.clientX;
        s.y = t.clientY;
        s.dx = s.dy = 0;
        if (s === stick.r) s.on = true;
      }
    }
    e.preventDefault();
  },
  { passive: false },
);
addEventListener(
  "touchmove",
  (e) => {
    for (const t of e.changedTouches)
      for (const s of [stick.l, stick.r])
        if (s.id === t.identifier) {
          let dx = t.clientX - s.x,
            dy = t.clientY - s.y;
          const m = Math.hypot(dx, dy),
            L = 60;
          if (m > L) {
            dx *= L / m;
            dy *= L / m;
          }
          s.dx = dx / L;
          s.dy = dy / L;
        }
    // 只有比賽中才擋掉預設的捲動;數學、商店、角色、房間等頁面要能用手指往下捲
    if (!homeOn && ui.style.display === "none") e.preventDefault();
  },
  { passive: false },
);
function tend(e) {
  for (const t of e.changedTouches) {
    if (stick.l.id === t.identifier) {
      stick.l.id = null;
      stick.l.dx = stick.l.dy = 0;
    }
    if (stick.r.id === t.identifier) {
      const s = stick.r;
      s.id = null;
      s.dx = s.dy = 0;
      s.on = false;
    }
  }
}
addEventListener("touchend", tend);
addEventListener("touchcancel", tend);
addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === " ") superReq = true;
  if (e.key.toLowerCase() === "e") abReq = true;
  if (e.key === "Shift" || e.key.toLowerCase() === "q") rollReq = true;
});
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
addEventListener("mousedown", (e) => {
  if (e.target.closest && e.target.closest("#emoBtn,#emoPanel,#tut button")) return;
  if (Math.hypot(e.clientX - HUD.sup[0], e.clientY - HUD.sup[1]) < 50) {
    superReq = true;
    return;
  }
  if (Math.hypot(e.clientX - HUD.ab[0], e.clientY - HUD.ab[1]) < 38) {
    abReq = true;
    return;
  }
  if (Math.hypot(e.clientX - HUD.roll[0], e.clientY - HUD.roll[1]) < 32) {
    rollReq = true;
    return;
  }
  mouse.down = true;
});
addEventListener("mouseup", () => (mouse.down = false));
let superReq = false,
  abReq = false,
  rollReq = false;

// ── 輸入資料 ──
// { mx, my:   移動方向(-1~1)
//   fire:     這一幀要攻擊或踢球
//   tx, ty:   用滑鼠瞄準時,滑鼠指到的場地座標(角色移動完才換算成角度,房主不需要知道對方的螢幕)
//   aim:      用搖桿瞄準時的角度(弧度);aimD:搖桿推的距離換算的投擲距離
//   autoAim:  放大招時可以自動瞄準最近的敵人(沒有手動瞄準時)
//   sup / ab / roll: 這一幀按了大招 / 超能力 / 翻滾 }
// 要能序列化成 JSON(連線時要送出去)。
const NO_INPUT = Object.freeze({
  mx: 0,
  my: 0,
  fire: false,
  tx: null,
  ty: null,
  aim: 0,
  aimD: 0,
  autoAim: true,
  sup: false,
  ab: false,
  roll: false,
});
// 讀本機的鍵盤、滑鼠、搖桿。大招、超能力、翻滾是「按一下」的動作,讀過就清掉。
function readLocalInput() {
  const rm = Math.hypot(stick.r.dx, stick.r.dy),
    stickAim = stick.r.on || stick.r.id !== null,
    mouseAim = !stickAim && (mouse.down || keys.j);
  const inp = {
    mx:
      (keys.d || keys.arrowright ? 1 : 0) -
      (keys.a || keys.arrowleft ? 1 : 0) +
      stick.l.dx,
    my:
      (keys.s || keys.arrowdown ? 1 : 0) -
      (keys.w || keys.arrowup ? 1 : 0) +
      stick.l.dy,
    fire: stickAim ? rm > 0.2 : mouseAim,
    tx: mouseAim ? (mouse.x - vw / 2) / sc + G.cam.x : null,
    ty: mouseAim ? (mouse.y - vh / 2) / sc + G.cam.y : null,
    aim: stickAim && rm > 0.2 ? Math.atan2(stick.r.dy, stick.r.dx) : 0,
    aimD: 70 + Math.min(1, rm) * 180,
    autoAim: stick.r.id === null && !mouse.down,
    sup: superReq,
    ab: abReq,
    roll: rollReq,
  };
  superReq = abReq = rollReq = false;
  return inp;
}
