// 遊戲練習(教學關卡):一步一步學會移動、攻擊、帶球、射門、放大招
// 隨時都可以從首頁進來練。場上只有自己和一個不會動、不會攻擊的稻草人,沒有時間限制、沒有獎勵。
const isTouchUI = () => matchMedia("(pointer: coarse)").matches; // 手機、平板用手指操作
const TUT = { on: false, step: 0, wait: 0, done: false, sx: 0, sy: 0, hits: 0, lastHp: 0, score0: 0, t: 0 };
const tutEl = document.getElementById("tut");
const tutMe = () => G.ents[G.me],
  tutDummy = () => G.ents.find((e) => e.ctrl === "dummy");
// 每一步:標題、手機說明、電腦說明、開始時要做的事、完成條件、場上要指的目標
const TUT_STEPS = [
  {
    title: "移動",
    touch: "用<b>左手指</b>在螢幕<b>左半邊</b>按住、拖一拖,讓角色走一走。",
    mouse: "按 <b>W A S D</b>(或方向鍵)讓角色走一走。",
    begin() {
      TUT.sx = tutMe().x;
      TUT.sy = tutMe().y;
    },
    done: () => Math.hypot(tutMe().x - TUT.sx, tutMe().y - TUT.sy) > 160,
    pad: "l",
  },
  {
    title: "攻擊",
    touch: "用<b>右手指</b>在螢幕<b>右半邊</b>往稻草人的方向拖,就會攻擊。打中稻草人 <b>3 次</b>!",
    mouse: "把滑鼠移到稻草人身上,<b>按住左鍵</b>攻擊。打中稻草人 <b>3 次</b>!",
    begin() {
      TUT.hits = 0;
      TUT.lastHp = tutDummy().hp;
    },
    done: () => TUT.hits >= 3,
    target: () => tutDummy(),
    pad: "r",
  },
  {
    title: "帶球",
    touch: "走過去<b>碰到球</b>,球就會跟著你走。",
    mouse: "走過去<b>碰到球</b>,球就會跟著你走。",
    done: () => Math.hypot(G.ball.x - tutMe().x, G.ball.y - tutMe().y) < tutMe().r + G.ball.r + 8,
    target: () => G.ball,
  },
  {
    title: "射門",
    touch: "帶著球走到<b>對面的球門</b>前,右手指往球門方向拖,把球踢進去!",
    mouse: "帶著球走到<b>對面的球門</b>前,滑鼠往球門方向點一下,把球踢進去!",
    begin() {
      TUT.score0 = G.score[tutMe().tm];
    },
    done: () => G.score[tutMe().tm] > TUT.score0,
    target: () => ({ x: tutMe().tm ? T * 0.7 : W - T * 0.7, y: H / 2, goal: 1 }),
  },
  {
    title: "大招",
    touch: "大招集滿了!按右下角金色的 <b>⚡大招</b> 按鈕。",
    mouse: "大招集滿了!按<b>空白鍵</b>,或點右下角金色的大招按鈕。",
    begin() {
      tutMe().sup = 100;
    },
    done: () => tutMe().sup < 100,
    pad: "sup",
  },
];

// ── 開始 / 結束 ──
function startTutorial() {
  if (typeof room !== "undefined" && room.active) return; // 好友房間裡不能練習
  Net = LocalNet;
  const c = CH[pick],
    tm = c.team,
    // 出生點上下左右都有空間走(第 1 步要能往任何方向走一段距離)
    me = mk(0, tm ? W - 380 : 380, H / 2, pick, tm, 2, LocalNet.players()[0]),
    // 稻草人:敵隊的守門員英雄,站在對方半場、不擋球的路線(紅隊時點對稱)
    dc = CH.findIndex((h) => h.team !== tm && h.role === 0),
    dummy = mk(1, tm ? W - 620 : 620, tm ? H - 230 : 230, dc, 1 - tm, 0, {
      id: "dummy",
      name: "稻草人",
      loadout: {},
    });
  dummy.ctrl = "dummy";
  for (let i = walls.length - 1; i >= 0; i--) if (walls[i].tmp) walls.splice(i, 1);
  G = makeG([me, dummy]);
  G.practice = true; // update.js 看到這個就不會結算比賽
  G.t = 999;
  Object.assign(TUT, { on: true, step: 0, wait: 0, done: false });
  [ui, shopScr, sdetail, roster, detail].forEach((el) => (el.style.display = "none"));
  detailOn = false;
  leaveHome();
  mouse.down = false;
  TUT_STEPS[0].begin && TUT_STEPS[0].begin();
  tutUI();
}
function tutStop() {
  if (!TUT.on) return;
  TUT.on = false;
  if (G) G.over = true;
  tutEl.style.display = "none";
}

// ── 每一幀 ──
function tutTick(dt) {
  if (!TUT.on || !G) return;
  G.t = 999;
  TUT.t += dt;
  const d = tutDummy();
  if (d) {
    if (d.hp < TUT.lastHp - 0.5) TUT.hits++;
    TUT.lastHp = d.hp;
  }
  if (TUT.done) return;
  if (TUT.wait > 0) {
    // 完成一步後停一下,顯示「很好!」再進下一步
    TUT.wait -= dt;
    if (TUT.wait <= 0) {
      TUT.step++;
      if (TUT.step >= TUT_STEPS.length) {
        TUT.done = true;
        P.tutDone = true;
        save();
      } else TUT_STEPS[TUT.step].begin && TUT_STEPS[TUT.step].begin();
      tutUI();
    }
    return;
  }
  if (TUT_STEPS[TUT.step].done()) {
    TUT.wait = 1.2;
    tutUI(true);
  }
}
function tutUI(good) {
  tutEl.style.display = "flex";
  if (TUT.done) {
    tutEl.className = "done";
    tutEl.innerHTML =
      "<h3>🎉 練習完成!</h3><p>你已經會移動、攻擊、帶球、射門和放大招了!<br>對方球門進 3 球就贏,也可以用翻滾躲子彈、用超能力幫忙。</p>" +
      '<div class="tutbtns"><button data-a="again" class="ch">再練一次</button><button data-a="play">開始比賽</button><button data-a="home" class="ch">回首頁</button></div>';
  } else {
    const s = TUT_STEPS[TUT.step];
    tutEl.className = good ? "good" : "";
    tutEl.innerHTML =
      '<div class="tuttop"><span>練習 ' +
      (TUT.step + 1) +
      " / " +
      TUT_STEPS.length +
      " · <b>" +
      s.title +
      '</b></span><button data-a="home" class="ch">離開</button></div><p>' +
      (good ? "✅ 很好!" : isTouchUI() ? s.touch : s.mouse) +
      "</p>";
  }
  tutEl.querySelectorAll("[data-a]").forEach(
    (b) =>
      (b.onclick = (ev) => {
        ev.stopPropagation();
        const a = b.dataset.a;
        tutStop();
        if (a === "again") startTutorial();
        else if (a === "play") {
          showHome();
          startMatch();
        } else showHome();
      }),
  );
}
// 提示:在畫面上畫跳動的箭頭(指目標)和閃爍的圈(提示要按哪裡)。在 draw() 之後呼叫
function drawTutHints() {
  if (!TUT.on || !G || TUT.done || TUT.wait > 0) return;
  const s = TUT_STEPS[TUT.step],
    pulse = 0.5 + 0.5 * Math.sin(TUT.t * 6);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.save();
  // 場上的目標:頭上一個上下跳動的黃色箭頭
  if (s.target) {
    const t = s.target(),
      x = (t.x - G.cam.x) * sc + vw / 2,
      y = (t.y - G.cam.y) * sc + vh / 2 - (t.goal ? 90 : 50) * sc - Math.abs(Math.sin(TUT.t * 4)) * 14;
    ctx.fillStyle = "#ffd23f";
    ctx.strokeStyle = "#14122b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.lineTo(x - 14, y - 4);
    ctx.lineTo(x - 5, y - 4);
    ctx.lineTo(x - 5, y - 20);
    ctx.lineTo(x + 5, y - 20);
    ctx.lineTo(x + 5, y - 4);
    ctx.lineTo(x + 14, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // 要按的地方:搖桿區或大招按鈕外面一圈閃爍
  let ring = null;
  if (s.pad === "sup") ring = [HUD.sup[0], HUD.sup[1], 56];
  else if (s.pad === "l" && isTouchUI()) ring = [110 + HUD.l, vh - 110 - HUD.b, 70];
  else if (s.pad === "r" && isTouchUI())
    ring = vw < 600 ? [vw * 0.72, vh - 250 - HUD.b, 70] : [vw - 262 - HUD.r, vh - 110 - HUD.b, 70];
  if (ring) {
    ctx.strokeStyle = "rgba(255,210,63," + (0.5 + 0.5 * pulse) + ")";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(ring[0], ring[1], ring[2] + pulse * 8, 0, 6.283);
    ctx.stroke();
  }
  ctx.restore();
}
document.getElementById("hTut").onclick = startTutorial;
document.getElementById("hMathP").onclick = () => startMath({ practice: true });
