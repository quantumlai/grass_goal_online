// 輸入:觸控搖桿、鍵盤、滑鼠
// 輸入
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
    for (const t of e.changedTouches) {
      if (Math.hypot(t.clientX - (vw - 62), t.clientY - (vh - 78)) < 50) {
        superReq = true;
        continue;
      }
      if (
        Math.hypot(t.clientX - (vw - 148), t.clientY - (vh - 46)) < 38
      ) {
        abReq = true;
        continue;
      }
      if (
        Math.hypot(t.clientX - (vw - 130), t.clientY - (vh - 122)) < 32
      ) {
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
    e.preventDefault();
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
  if (Math.hypot(e.clientX - (vw - 62), e.clientY - (vh - 78)) < 50) {
    superReq = true;
    return;
  }
  if (Math.hypot(e.clientX - (vw - 148), e.clientY - (vh - 46)) < 38) {
    abReq = true;
    return;
  }
  if (Math.hypot(e.clientX - (vw - 130), e.clientY - (vh - 122)) < 32) {
    rollReq = true;
    return;
  }
  mouse.down = true;
});
addEventListener("mouseup", () => (mouse.down = false));
let superReq = false,
  abReq = false,
  rollReq = false;
