// 主迴圈與啟動
let last = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  try {
    Net.tick(dt); // 連線:開賽、快照、結果、表情(單機版什麼都不做)
    sndBtnTick(); // 比賽中的靜音按鈕、背景音樂換曲(sound.js)
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
      tutTick(dt); // 遊戲練習的步驟判斷(tutorial.js)
      if (G) draw();
      drawTutHints();
    }
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(loop);
}

updHome();
reset();
requestAnimationFrame(loop);
