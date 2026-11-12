// 主迴圈與啟動
let last = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  try {
    if (homeOn) {
      drawHome(ts);
      if (detailOn) drawDetail(ts);
    } else {
      if (G && !G.over && ui.style.display === "none") {
        if (Net.isHost()) {
          update(dt, Net.collectInputs());
          Net.publish(G);
        } else Net.sendInput(readLocalInput());
      }
      if (G) draw();
    }
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(loop);
}

updHome();
reset();
requestAnimationFrame(loop);
