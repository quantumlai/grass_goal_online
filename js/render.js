// 繪圖:場地、牆、角色
function drawWall(w) {
  const hh = 22,
    x = w.x,
    y = w.y,
    ww = w.w,
    h = w.h;
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(x + 12, y + 12, ww, h);
  ctx.fillStyle = "#6b543d";
  ctx.fillRect(x, y + h - hh, ww, hh);
  ctx.strokeStyle = "rgba(0,0,0,.25)";
  ctx.lineWidth = 2;
  for (let yy = y + h - hh + 11; yy < y + h; yy += 11) {
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + ww, yy);
    ctx.stroke();
  }
  for (let xx = x + 25; xx < x + ww; xx += 50) {
    ctx.beginPath();
    ctx.moveTo(xx, y + h - hh);
    ctx.lineTo(xx, y + h - hh + 11);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, y - hh, 0, y + h - hh);
  g.addColorStop(0, "#cfa877");
  g.addColorStop(1, "#9a7a54");
  ctx.fillStyle = g;
  ctx.fillRect(x, y - hh, ww, h);
  ctx.fillStyle = "rgba(255,255,255,.3)";
  ctx.fillRect(x, y - hh, ww, 4);
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fillRect(x, y + h - hh - 3, ww, 3);
}
function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#14203a";
  ctx.fillRect(0, 0, vw, vh);
  const p = G.ents[0];
  const cx = Math.max(vw / 2 / sc, Math.min(W - vw / 2 / sc, p.x)),
    cy = Math.max(vh / 2 / sc, Math.min(H - vh / 2 / sc, p.y));
  G.cam.x = cx;
  G.cam.y = cy;
  const sh = G.shake > 0 ? (Math.random() - 0.5) * 8 : 0;
  ctx.save();
  ctx.translate(vw / 2 + sh, vh / 2 + sh);
  ctx.scale(sc, sc);
  ctx.translate(-cx, -cy);
  // 地板
  ctx.fillStyle = sand();
  ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 100) {
    ctx.fillStyle =
      (x / 100) % 2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";
    ctx.fillRect(x, 0, 100, H);
  }
  {
    const gg = ctx.createLinearGradient(0, 0, 0, H);
    gg.addColorStop(0, "rgba(0,0,30,.3)");
    gg.addColorStop(0.5, "rgba(0,0,0,0)");
    gg.addColorStop(1, "rgba(255,255,200,.12)");
    ctx.fillStyle = gg;
    ctx.fillRect(0, 0, W, H);
  }
  // 中央寶石礦
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 90, 0, 6.28);
  ctx.moveTo(W / 2, T);
  ctx.lineTo(W / 2, H - T);
  ctx.rect(T, 260, 170, 480);
  ctx.rect(W - T - 170, 260, 170, 480);
  ctx.stroke();
  ctx.fillStyle = "rgba(59,130,246,.4)";
  ctx.fillRect(0, 350, T * 1.4, 300);
  ctx.fillStyle = "rgba(239,68,68,.4)";
  ctx.fillRect(W - T * 1.4, 350, T * 1.4, 300);
  for (const gx of [0, W - T * 1.4]) {
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.lineWidth = 1.5;
    for (let yy = 350; yy <= 650; yy += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, yy);
      ctx.lineTo(gx + T * 1.4, yy);
      ctx.stroke();
    }
    for (let xx = 0; xx <= T * 1.4; xx += 14) {
      ctx.beginPath();
      ctx.moveTo(gx + xx, 350);
      ctx.lineTo(gx + xx, 650);
      ctx.stroke();
    }
  }
  for (const [px, py] of [
    [T * 1.4, 350],
    [T * 1.4, 650],
    [W - T * 1.4, 350],
    [W - T * 1.4, 650],
  ]) {
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath();
    ctx.ellipse(px + 5, py + 6, 10, 5, 0, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#14122b";
    ctx.lineWidth = 3;
    ctx.fillRect(px - 6, py - 30, 12, 32);
    ctx.strokeRect(px - 6, py - 30, 12, 32);
    ctx.beginPath();
    ctx.arc(px, py - 30, 6, 0, 6.28);
    ctx.fill();
    ctx.stroke();
  }
  // 牆

  // 寶石
  for (const g of G.gems) {
    const y = g.y + Math.sin(g.age * 4) * 3;
    if (g.cube) {
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(g.x - 8, y - 8, 16, 16);
      ctx.strokeStyle = "#14532d";
      ctx.lineWidth = 3;
      ctx.strokeRect(g.x - 8, y - 8, 16, 16);
      ctx.fillStyle = "#fff";
      ctx.fillRect(g.x - 2, y - 5, 4, 10);
      ctx.fillRect(g.x - 5, y - 2, 10, 4);
      continue;
    }
    ctx.fillStyle = "#c77dff";
    ctx.beginPath();
    ctx.moveTo(g.x, y - 9);
    ctx.lineTo(g.x + 7, y);
    ctx.lineTo(g.x, y + 9);
    ctx.lineTo(g.x - 7, y);
    ctx.fill();
    ctx.fillStyle = "#f1d4ff";
    ctx.fillRect(g.x - 2, y - 5, 3, 5);
  }
  for (const cl of G.clouds) {
    ctx.fillStyle =
      (cl.heal ? "rgba(255,143,199," : "rgba(120,255,140,") +
      (0.18 + Math.sin(G.t * 6) * 0.05) +
      ")";
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, cl.r, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = "rgba(60,200,90,.6)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  for (const t of G.turrets) {
    ctx.fillStyle = t.hit > 0 ? "#fff" : "#6c757d";
    ctx.strokeStyle = "#14122b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 12, 0, 6.28);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.a || 0);
    ctx.fillStyle = "#ffb703";
    ctx.fillRect(2, -4, 18, 8);
    ctx.strokeRect(2, -4, 18, 8);
    ctx.restore();
    const fr = G.ents[t.o].tm === G.ents[0].tm,
      pc = Math.max(0, t.hp / t.max);
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(t.x - 21, t.y - 27, 42, 9);
    ctx.fillStyle = fr ? "#5ee06f" : "#ff5b6b";
    ctx.fillRect(t.x - 19, t.y - 25, 38 * pc, 5);
  }
  for (const m of G.mines) {
    ctx.globalAlpha = m.o === 0 ? 1 : m.arm > 0 ? 0.3 : 0.5;
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(m.x, m.y, 10, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = Math.floor(m.t * 3) % 2 ? "#ff4d6d" : "#ffa94d";
    ctx.beginPath();
    ctx.arc(m.x, m.y, 4, 0, 6.28);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  {
    const bl = G.ball,
      spd = Math.hypot(bl.vx, bl.vy),
      z =
        Math.abs(Math.sin((bl.x + bl.y) * 0.045)) *
        Math.min(18, spd * 0.035),
      by0 = bl.y - z;
    ctx.fillStyle = "rgba(0,0,0," + (0.32 - z * 0.008) + ")";
    ctx.beginPath();
    ctx.ellipse(
      bl.x + 3,
      bl.y + bl.r - 2,
      bl.r * (1 - z * 0.015),
      6 * (1 - z * 0.015),
      0,
      0,
      6.28,
    );
    ctx.fill();
    const gb = ctx.createRadialGradient(
      bl.x - 5,
      by0 - 6,
      2,
      bl.x,
      by0,
      bl.r + 2,
    );
    gb.addColorStop(0, "#fff");
    gb.addColorStop(1, "#c9ced6");
    ctx.fillStyle = gb;
    ctx.strokeStyle = "#14122b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bl.x, by0, bl.r, 0, 6.28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#14122b";
    ctx.beginPath();
    ctx.arc(bl.x, by0, 5, 0, 6.28);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2566 + (bl.x + bl.y) * 0.03;
      ctx.beginPath();
      ctx.arc(
        bl.x + Math.cos(a) * 10,
        by0 + Math.sin(a) * 10,
        2.5,
        0,
        6.28,
      );
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.beginPath();
    ctx.ellipse(bl.x - 5, by0 - 6, 4, 2.5, -0.6, 0, 6.28);
    ctx.fill();
  }
  // 角色
  const ws = walls.slice().sort((a, b) => a.y + a.h - (b.y + b.h));
  let wi = 0;
  for (const e of [...G.ents].sort((a, b) => a.y - b.y)) {
    while (wi < ws.length && ws[wi].y + ws[wi].h <= e.y + e.r)
      drawWall(ws[wi++]);
    if (e.dead) continue;
    const hidden =
      e.tm !== p.tm &&
      (inBush(e) || e.invis > 0) &&
      Math.hypot(e.x - p.x, e.y - p.y) > 110;
    if (hidden) continue;
    ctx.globalAlpha = e.invis > 0 ? 0.35 : inBush(e) ? 0.6 : 1;
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath();
    ctx.ellipse(e.x + 5, e.y + e.r - 1, e.r * 1.15, 7, 0, 0, 6.28);
    ctx.fill();
    {
      const ps = 0.9 + (0.2 * e.y) / H,
        spd = Math.hypot(e.evx || 0, e.evy || 0),
        bob =
          Math.abs(Math.sin(G.t * 13 + e.id)) *
          Math.min(1, spd / 160) *
          5;
      ctx.save();
      ctx.translate(e.x, e.y + e.r);
      ctx.scale(ps, ps);
      ctx.translate(-e.x, -(e.y + e.r) - bob);
      drawChar(e);
      ctx.restore();
    }
    ctx.strokeStyle = e.tm ? "#ff4d4d" : "#3b82f6";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + e.r - 2, e.r + 7, 9, 0, 0, 6.28);
    ctx.stroke();
    if (e.id === 0) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + e.r - 2, e.r + 11, 12, 0, 0, 6.28);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    // 血條
    const bw = 44,
      by = e.y - e.r - 18;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(e.x - bw / 2 - 2, by - 2, bw + 4, 9);
    ctx.fillStyle = e.tm === p.tm ? "#5ee06f" : "#ff5b6b";
    ctx.fillRect(e.x - bw / 2, by, (bw * Math.max(0, e.hp)) / e.max, 5);
    ctx.fillStyle = "#fff";
    ctx.font = "700 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(nm(e) + (e.cubes ? " ⬆" + e.cubes : ""), e.x, by - 5);
  }
  while (wi < ws.length) drawWall(ws[wi++]);
  // 瞄準線
  if (!p.dead && stick.r.id !== null) {
    ctx.strokeStyle = "rgba(255,70,70,.85)";
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.ang) * 260, p.y + Math.sin(p.ang) * 260);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // 子彈
  for (const b of G.bul) {
    ctx.fillStyle = b.sup ? "#ffd23f" : "#fff";
    ctx.strokeStyle = G.ents[b.o].col;
    ctx.lineWidth = 3;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 12, b.r, b.r * 0.5, 0, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = b.sup ? "#ffd23f" : "#fff";
    ctx.beginPath();
    ctx.arc(b.x, b.y - 6, b.r, 0, 6.28);
    ctx.fill();
    ctx.stroke();
  }
  // 草叢(蓋在角色上)
  for (const b of bushes) {
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
    const gbg = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    gbg.addColorStop(0, "#3fbf5a");
    gbg.addColorStop(1, "#1f7a35");
    ctx.fillStyle = gbg;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "#51cf66";
    for (let x = b.x; x < b.x + b.w; x += 25)
      for (let y = b.y; y < b.y + b.h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(x, y + 25);
        ctx.lineTo(x + 12, y + 4 + ((x + y) % 7));
        ctx.lineTo(x + 25, y + 25);
        ctx.fill();
      }
  }
  // 特效
  for (const q of G.parts) {
    if (q.ghost) {
      ctx.globalAlpha = q.t * 2;
      ctx.fillStyle = q.ghost;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (q.call) {
      ctx.globalAlpha = Math.min(1, q.t * 2);
      ctx.fillStyle = q.col;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.font = "900 20px sans-serif";
      ctx.textAlign = "center";
      const yy = q.y - (0.9 - q.t) * 30;
      ctx.strokeText(q.call, q.x, yy);
      ctx.fillText(q.call, q.x, yy);
      ctx.globalAlpha = 1;
    } else if (q.blast) {
      ctx.fillStyle = "rgba(255,140,40," + q.t * 1.2 + ")";
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.blast * (1 - (q.t / 0.4) * 0.3), 0, 6.28);
      ctx.fill();
    } else if (q.heal) {
      ctx.strokeStyle = q.col || "#7cfc9a";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(0, (0.5 - q.t) * 160), 0, 6.28);
      ctx.stroke();
    } else if (q.boom) {
      ctx.strokeStyle = "#ffd23f";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(q.x, q.y, (0.5 - q.t) * 140, 0, 6.28);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ff4d6d";
      ctx.font = "800 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(q.txt, q.x, q.y - (0.25 - q.t) * 60);
    }
  }
  ctx.restore();
  {
    const vg = ctx.createRadialGradient(
      vw / 2,
      vh / 2,
      Math.min(vw, vh) * 0.35,
      vw / 2,
      vh / 2,
      Math.max(vw, vh) * 0.75,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,25,.4)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, vw, vh);
  }
  // HUD
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(0,0,0,.45)";
  ctx.fillRect(10, 12, 138, 40);
  ctx.fillStyle = "#c77dff";
  ctx.font = "800 24px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.font = "800 20px sans-serif";
  ctx.font = "800 17px sans-serif";
  ctx.fillText(
    (p.tm ? "" : "▶") +
      "藍 " +
      G.score[0] +
      " : " +
      G.score[1] +
      " 紅" +
      (p.tm ? "◀" : ""),
    18,
    39,
  );
  const t = Math.max(0, Math.ceil(G.t));
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "800 26px sans-serif";
  ctx.fillText(
    Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"),
    vw / 2,
    38,
  );
  // 大招條
  const bx = vw - 170,
    bh = 14;
  ctx.fillStyle = "rgba(0,0,0,.5)";
  ctx.fillRect(bx, 24, 150, bh);
  ctx.fillStyle = p.sup >= 100 ? "#ffd23f" : "#4cc9f0";
  ctx.fillRect(bx, 24, (150 * p.sup) / 100, bh);
  ctx.fillStyle = "#fff";
  ctx.font = "700 12px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(p.sup >= 100 ? "大招就緒!" : "大招", vw - 20, 18);
  {
    const bx2 = vw - 148,
      by2 = vh - 46,
      rdy = !(p.acd > 0);
    ctx.fillStyle = rdy ? p.col : "rgba(0,0,0,.55)";
    ctx.beginPath();
    ctx.arc(bx2, by2, 34, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "22px sans-serif";
    ctx.fillText(p.c.icon, bx2, by2 + 2);
    ctx.font = "700 11px sans-serif";
    ctx.fillText(rdy ? p.c.aname : Math.ceil(p.acd) + "s", bx2, by2 + 22);
  }
  {
    const rx = vw - 130,
      ry = vh - 122,
      ok = !(p.rcd > 0);
    ctx.fillStyle = ok ? "#e9ecef" : "rgba(0,0,0,.55)";
    ctx.beginPath();
    ctx.arc(rx, ry, 30, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = ok ? "#222" : "#fff";
    ctx.textAlign = "center";
    ctx.font = "20px sans-serif";
    ctx.fillText("💨", rx, ry + 3);
    ctx.font = "700 11px sans-serif";
    ctx.fillText(ok ? "翻滾" : Math.ceil(p.rcd) + "s", rx, ry + 20);
  }
  {
    const sx = vw - 62,
      sy = vh - 78,
      rd = p.sup >= 100,
      pr = Math.min(1, p.sup / 100);
    ctx.fillStyle = rd ? "#ffd23f" : "rgba(0,0,0,.55)";
    ctx.beginPath();
    ctx.arc(sx, sy, rd ? 46 + Math.sin(G.t * 10) * 2 : 46, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = rd ? "#fff" : "#ffd23f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(sx, sy, 46, -Math.PI / 2, -Math.PI / 2 + 6.283 * pr);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = rd ? "#3a2a00" : "#fff";
    ctx.font = "26px sans-serif";
    ctx.fillText("⚡", sx, sy + 4);
    ctx.font = "800 12px sans-serif";
    ctx.fillText(
      rd ? p.c.sname : "大招 " + Math.floor(p.sup) + "%",
      sx,
      sy + 24,
    );
  }
  {
    const bl = G.ball,
      bsx = (bl.x - cx) * sc + vw / 2,
      bsy = (bl.y - cy) * sc + vh / 2;
    if (bsx < 10 || bsx > vw - 10 || bsy < 60 || bsy > vh - 10) {
      const a = Math.atan2(bsy - vh / 2, bsx - vw / 2),
        ex = Math.max(24, Math.min(vw - 24, vw / 2 + Math.cos(a) * vw)),
        ey = Math.max(70, Math.min(vh - 24, vh / 2 + Math.sin(a) * vh));
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#14122b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ex, ey, 10, 0, 6.28);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (G.goalT > 0) {
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(0, vh / 2 - 60, vw, 80);
    ctx.textAlign = "center";
    ctx.fillStyle = G.goalCol;
    ctx.font = "900 34px sans-serif";
    ctx.fillText(G.goalMsg, vw / 2, vh / 2 - 10);
  }
  if (p.dead) {
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = "#fff";
    ctx.font = "800 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("重生中 " + Math.ceil(p.dead) + "…", vw / 2, vh / 2);
  }
  // 搖桿
  for (const s of [stick.l, stick.r])
    if (s.id !== null) {
      const rc = s === stick.r;
      ctx.fillStyle = rc ? "rgba(255,60,60,.22)" : "rgba(70,140,255,.22)";
      ctx.strokeStyle = rc ? "rgba(255,90,90,.9)" : "rgba(90,160,255,.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 60, 0, 6.28);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rc ? "rgba(255,70,70,.95)" : "rgba(60,130,255,.95)";
      ctx.beginPath();
      ctx.arc(s.x + s.dx * 60, s.y + s.dy * 60, 24, 0, 6.28);
      ctx.fill();
    }
  for (const [st, hx, hy, col, fc, lb] of [
    [
      stick.l,
      110,
      vh - 110,
      "rgba(90,160,255,.5)",
      "rgba(70,140,255,.12)",
      "移動",
    ],
    [
      stick.r,
      vw - 262,
      vh - 110,
      "rgba(255,90,90,.5)",
      "rgba(255,60,60,.12)",
      "攻擊",
    ],
  ])
    if (st.id === null) {
      ctx.strokeStyle = col;
      ctx.fillStyle = fc;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(hx, hy, 56, 0, 6.28);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = "700 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(lb, hx, hy + 5);
    }
}
function drawChar(e) {
  const x = e.x,
    y = e.y,
    r = e.r,
    a = e.ang,
    k = e.c.k,
    hit = e.hitT > 0,
    c = Math.cos(a),
    s = Math.sin(a),
    T = G.t,
    OL = "#14122b";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (e.shield > 0) {
    ctx.strokeStyle = "rgba(120,220,255,.9)";
    ctx.fillStyle = "rgba(120,220,255,.25)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, r + 12, 0, 6.283);
    ctx.fill();
    ctx.stroke();
  }
  if (e.haste > 0) {
    ctx.strokeStyle = "rgba(124,252,154,.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 8 + Math.sin(T * 20) * 2, 0, 6.283);
    ctx.stroke();
  }
  if (e.rapid > 0) {
    ctx.fillStyle = "rgba(255,210,63,.35)";
    ctx.beginPath();
    ctx.arc(x, y, r + 10, 0, 6.283);
    ctx.fill();
  }
  if (e.slow > 0) {
    ctx.fillStyle = "rgba(140,220,255,.4)";
    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, 6.283);
    ctx.fill();
  }
  const P = {
    gun: ["#9af0ff", "#2a9fd6"],
    tank: ["#ff9a8b", "#d63d3d"],
    snipe: ["#c9f27a", "#4f9d3a"],
    bomb: ["#ffcf7a", "#e8761a"],
    mage: ["#e6baff", "#8a3fd1"],
    dash: ["#ffa8d9", "#d6336c"],
    eng: ["#ffe08a", "#d99a1e"],
    toxic: ["#b8b5ff", "#4a3fb5"],
    wall: ["#bcd6ff", "#4f7bd9"],
    frost: ["#d6f6ff", "#4fb6e8"],
    brute: ["#ffb199", "#e0502a"],
    bat: ["#bde0ff", "#3b82f6"],
    cactus: ["#b6f5a0", "#37a04a"],
    bloom: ["#ffc2e2", "#e2559b"],
  }[k];
  const oval = (px, py, rx, ry, col, w) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0, 6.283);
    ctx.fill();
    if (w) {
      ctx.strokeStyle = OL;
      ctx.lineWidth = w;
      ctx.stroke();
    }
  };
  const rot = (fn) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    fn();
    ctx.restore();
  };
  const rr = (px, py, w, h, col) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(px, py, w, h);
    ctx.fill();
    ctx.stroke();
  };
  const body = () => {
    const g = ctx.createRadialGradient(
      x - r * 0.35,
      y - r * 0.4,
      r * 0.1,
      x,
      y,
      r,
    );
    g.addColorStop(0, P[0]);
    g.addColorStop(1, P[1]);
    ctx.fillStyle = hit ? "#fff" : g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.4)";
    ctx.beginPath();
    ctx.ellipse(
      x - r * 0.4,
      y - r * 0.5,
      r * 0.25,
      r * 0.14,
      -0.5,
      0,
      6.283,
    );
    ctx.fill();
  };
  const face = (oy, m) => {
    for (const sx of [-5.5, 5.5]) {
      oval(x + sx, y + oy, 4.4, 5, "#fff", 2);
      ctx.fillStyle = OL;
      ctx.beginPath();
      ctx.arc(x + sx + c * 1.8, y + oy + s * 1.8, 2.4, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(
        x + sx + c * 1.8 - 0.8,
        y + oy + s * 1.8 - 0.9,
        0.9,
        0,
        6.283,
      );
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,90,120,.45)";
    for (const sx of [-9.5, 9.5]) {
      ctx.beginPath();
      ctx.arc(x + sx, y + oy + 6, 2.8, 0, 6.283);
      ctx.fill();
    }
    if (m) {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + oy + 5, 3, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  };
  if (k === "gun") {
    body();
    face(2, 1);
    ctx.strokeStyle = "#ff5964";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, r - 2, 0.6, Math.PI - 0.6);
    ctx.stroke();
    ctx.fillStyle = hit ? "#fff" : "#ff5964";
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - 3, r, Math.PI * 1.04, Math.PI * 1.96);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - 3, r - 5, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
    rot(() => {
      rr(r - 6, -5, 20, 10, "#8d99ae");
      rr(r + 10, -3.5, 9, 7, "#ff9f1c");
      ctx.fillStyle = "#fff3b0";
      ctx.beginPath();
      ctx.arc(r + 20, 0, 3, 0, 6.283);
      ctx.fill();
    });
  } else if (k === "tank") {
    rot(() => {
      for (const sg of [-1, 1]) {
        ctx.fillStyle = "#6b7280";
        ctx.beginPath();
        ctx.arc(r - 2, sg * (r - 3), 8, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      rr(r - 4, -7, 16, 14, "#4b5563");
    });
    body();
    ctx.fillStyle = "#8a5a2b";
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 11, y + 3);
    ctx.lineTo(x + 11, y + 3);
    ctx.lineTo(x + 7, y + r + 2);
    ctx.lineTo(x, y + r - 4);
    ctx.lineTo(x - 7, y + r + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    face(-3, 0);
    for (const sg of [-1, 1]) {
      ctx.fillStyle = "#f5f0e1";
      ctx.beginPath();
      ctx.moveTo(x + sg * (r - 3), y - 9);
      ctx.quadraticCurveTo(
        x + sg * (r + 13),
        y - 8,
        x + sg * (r + 9),
        y - r - 12,
      );
      ctx.quadraticCurveTo(
        x + sg * (r + 2),
        y - r + 2,
        x + sg * (r - 6),
        y - r + 4,
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = hit ? "#fff" : "#aab4c3";
    ctx.beginPath();
    ctx.arc(x, y - 7, r + 1, Math.PI * 1.02, Math.PI * 1.98);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd23f";
    ctx.beginPath();
    ctx.arc(x, y - r + 1, 3, 0, 6.283);
    ctx.fill();
  } else if (k === "snipe") {
    rot(() => {
      ctx.fillStyle = "#2d6a4f";
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r + 4, -9);
      ctx.lineTo(-r - 18 + Math.sin(T * 6) * 2, 0);
      ctx.lineTo(-r + 4, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    body();
    ctx.fillStyle = hit ? "#fff" : "#2d6a4f";
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y + 1, r + 1, Math.PI * 0.95, Math.PI * 2.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 7, y - r + 3);
    ctx.lineTo(x + 2, y - r - 13);
    ctx.lineTo(x + 9, y - r + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    oval(x, y + 4, r - 5, r - 8, "#10231a");
    for (const sx of [-5.5, 5.5]) {
      oval(x + sx, y + 3, 3.4, 2.4, "#ffe66d");
      ctx.fillStyle = OL;
      ctx.beginPath();
      ctx.arc(x + sx + c * 1.2, y + 3 + s * 1, 1.2, 0, 6.283);
      ctx.fill();
    }
    ctx.fillStyle = "#1f4d38";
    ctx.beginPath();
    ctx.arc(x, y + 2, r - 3, 0.35, Math.PI - 0.35);
    ctx.closePath();
    ctx.fill();
    rot(() => {
      rr(r - 8, -3, 40, 6, "#2b2d42");
      rr(r + 6, -7.5, 11, 4.5, "#4a4e69");
      rr(r - 10, -4.5, 10, 9, "#6d597a");
      ctx.fillStyle = "#ff4d6d";
      ctx.beginPath();
      ctx.arc(r + 33, 0, 2.2, 0, 6.283);
      ctx.fill();
    });
  } else if (k === "bomb") {
    body();
    for (let i = -2; i <= 2; i++) {
      const h = (i === 0 ? 20 : 14) + Math.sin(T * 12 + i * 1.7) * 3;
      ctx.fillStyle = i % 2 ? "#ffd23f" : "#ff5a36";
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + i * 5.5 - 5, y - r + 4);
      ctx.quadraticCurveTo(
        x + i * 6 + Math.sin(T * 9 + i) * 2,
        y - r - h * 0.5,
        x + i * 5.5 + i * 1.5,
        y - r - h,
      );
      ctx.lineTo(x + i * 5.5 + 5, y - r + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    face(3, 1);
    ctx.fillStyle = "#7bdff2";
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.5;
    for (const sx of [-6.5, 6.5]) {
      ctx.beginPath();
      ctx.arc(x + sx, y - 8, 5, 0, 6.283);
      ctx.fill();
      ctx.stroke();
    }
    rot(() => {
      ctx.fillStyle = "#2b2d42";
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r + 7, 0, 8.5, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.beginPath();
      ctx.arc(r + 4, -3, 2.5, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = "#8d6e3f";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(r + 7, -8);
      ctx.quadraticCurveTo(r + 10, -14, r + 14, -13);
      ctx.stroke();
      ctx.fillStyle = Math.sin(T * 30) > 0 ? "#ffd23f" : "#ff5a36";
      ctx.beginPath();
      ctx.arc(r + 14, -13, 2.5 + Math.sin(T * 30), 0, 6.283);
      ctx.fill();
    });
  } else {
    if (k === "dash") {
      rot(() => {
        ctx.fillStyle = "#ff4d6d";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-r + 3, -3);
        ctx.lineTo(-r - 22, -9 + Math.sin(T * 9) * 3);
        ctx.lineTo(-r - 14, 0);
        ctx.lineTo(-r - 22, 9 - Math.sin(T * 9) * 3);
        ctx.lineTo(-r + 3, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      body();
      for (const sg of [-1, 1]) {
        ctx.fillStyle = hit ? "#fff" : "#d6336c";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + sg * 3, y - r + 4);
        ctx.lineTo(x + sg * 11, y - r - 10);
        ctx.lineTo(x + sg * 14, y - r + 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      face(2, 1);
      ctx.strokeStyle = "#ff4d6d";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, r - 3, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
      rot(() => {
        for (const [w, cl] of [
          [7, OL],
          [3, "#e9ecef"],
        ]) {
          ctx.strokeStyle = cl;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.arc(r - 8, 0, 15, -1, 1);
          ctx.stroke();
        }
      });
    } else if (k === "wall") {
      body();
      face(-1, 0);
      ctx.fillStyle = hit ? "#fff" : "#cfd8e3";
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 6, r + 1, Math.PI * 1.02, Math.PI * 1.98);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e63946";
      ctx.fillRect(x - 3, y - r - 8, 6, 13);
      rot(() => {
        ctx.fillStyle = "#4f7bd9";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(r - 2, -17);
        ctx.lineTo(r + 9, -13);
        ctx.lineTo(r + 9, 13);
        ctx.lineTo(r - 2, 17);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(r + 1, -3, 5, 6);
      });
    } else if (k === "frost") {
      rot(() => {
        ctx.strokeStyle = "#bdeeff";
        ctx.lineWidth = 3;
        for (let j = 0; j < 3; j++) {
          const q = T * 3 + j * 2.1;
          ctx.beginPath();
          ctx.moveTo(-r - 6 - j * 7, Math.sin(q) * 8 - 3);
          ctx.lineTo(-r - 6 - j * 7, Math.sin(q) * 8 + 3);
          ctx.moveTo(-r - 9 - j * 7, Math.sin(q) * 8);
          ctx.lineTo(-r - 3 - j * 7, Math.sin(q) * 8);
          ctx.stroke();
        }
      });
      body();
      for (let i = -2; i <= 2; i++) {
        ctx.fillStyle = hit ? "#fff" : "#9be7ff";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + i * 5 - 4, y - r + 3);
        ctx.lineTo(x + i * 7 + 3, y - r - 12 - (i % 2 ? 0 : 5));
        ctx.lineTo(x + i * 5 + 4, y - r + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      face(2, 1);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y - r - 8, 5, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      rot(() => {
        rr(r - 4, -5, 14, 10, "#8be9ff");
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(r + 10, 0);
        ctx.lineTo(r + 16, -4);
        ctx.lineTo(r + 22, 0);
        ctx.lineTo(r + 16, 4);
        ctx.closePath();
        ctx.fill();
      });
    } else if (k === "brute") {
      rot(() => {
        for (const sg of [-1, 1]) {
          ctx.fillStyle = "#ff7043";
          ctx.strokeStyle = OL;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(r - 2, sg * (r - 3), 9, 0, 6.283);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffd166";
          ctx.fillRect(r + 2, sg * (r - 3) - 3, 5, 6);
        }
      });
      body();
      face(2, 0);
      ctx.strokeStyle = "#d62828";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, r - 3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y - 6);
      ctx.lineTo(x + 9, y + 1);
      ctx.stroke();
    } else if (k === "bat") {
      rot(() => {
        for (const [w, cl] of [
          [9, OL],
          [5, "#d9a066"],
        ]) {
          ctx.strokeStyle = cl;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(4, 9);
          ctx.lineTo(r + 26, 9);
          ctx.stroke();
        }
      });
      body();
      face(2, 1);
      ctx.fillStyle = hit ? "#fff" : "#e63946";
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 3, r, Math.PI * 1.04, Math.PI * 1.96);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      rot(() => {
        rr(-r - 7, -5, 11, 10, "#e63946");
      });
    } else if (k === "cactus") {
      for (let i = 0; i < 9; i++) {
        const q = i * 0.698 + 0.3;
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          x + Math.cos(q - 0.14) * (r - 1),
          y + Math.sin(q - 0.14) * (r - 1),
        );
        ctx.lineTo(x + Math.cos(q) * (r + 8), y + Math.sin(q) * (r + 8));
        ctx.lineTo(
          x + Math.cos(q + 0.14) * (r - 1),
          y + Math.sin(q + 0.14) * (r - 1),
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      body();
      face(2, 1);
      oval(x + 5, y - r + 1, 5, 4, "#ff5da2", 2);
      rot(() => {
        rr(r - 4, -4, 12, 8, "#2f9e44");
      });
    } else if (k === "bloom") {
      body();
      for (let i = 0; i < 6; i++) {
        const q = i * 1.047;
        ctx.fillStyle = i % 2 ? "#fff" : "#ffd6ec";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          x + Math.cos(q) * 8,
          y - r - 1 + Math.sin(q) * 5,
          6,
          4,
          q,
          0,
          6.283,
        );
        ctx.fill();
        ctx.stroke();
      }
      oval(x, y - r - 1, 3.5, 3, "#ffd23f", 2);
      face(3, 1);
      rot(() => {
        ctx.strokeStyle = "#2f9e44";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 7);
        ctx.lineTo(r + 18, 7);
        ctx.stroke();
        ctx.fillStyle = "#ff5da2";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(r + 20, 7, 7 + Math.sin(T * 6), 0, 6.283);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffd23f";
        ctx.beginPath();
        ctx.arc(r + 20, 7, 2.5, 0, 6.283);
        ctx.fill();
      });
    } else if (k === "eng") {
      body();
      face(3, 1);
      ctx.fillStyle = hit ? "#fff" : "#ffb703";
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 4, r + 1, Math.PI * 1.03, Math.PI * 1.97);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      oval(x, y - 5, r + 6, 4, hit ? "#fff" : "#fb8500", 3);
      oval(x, y - r + 2, 5, 4, "#fff3b0", 2.5);
      rot(() => {
        rr(r - 6, -6, 16, 12, "#6c757d");
        rr(r + 8, -4, 12, 8, "#adb5bd");
        ctx.fillStyle = "#fb8500";
        ctx.beginPath();
        ctx.arc(r + 2, 0, 3, 0, 6.283);
        ctx.fill();
      });
    } else if (k === "toxic") {
      rot(() => {
        ctx.fillStyle = "#3b3490";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.5;
        for (const sg of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(-r + 4, sg * 4);
          ctx.lineTo(-r - 16, sg * (11 + Math.sin(T * 7) * 2));
          ctx.lineTo(-r - 4, sg * 14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });
      body();
      for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = hit ? "#fff" : "#3b3490";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + i * 5 - 3, y - r + 3);
        ctx.lineTo(x + i * 8, y - r - 10 + Math.abs(i) * 4);
        ctx.lineTo(x + i * 5 + 3, y - r + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      face(1, 0);
      rot(() => {
        ctx.fillStyle = "#ffd23f";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(r - 3, -5);
        ctx.lineTo(r + 10, 0);
        ctx.lineTo(r - 3, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#7cfc9a";
        ctx.beginPath();
        ctx.moveTo(r - 2, 11);
        ctx.lineTo(r + 20, 13);
        ctx.lineTo(r - 2, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else {
      rot(() => {
        ctx.fillStyle = "#4a1a7a";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-r + 5, -10);
        ctx.lineTo(-r - 14, Math.sin(T * 5) * 3);
        ctx.lineTo(-r + 5, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#8d6e3f";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(r + 24, 6);
        ctx.stroke();
        ctx.fillStyle = "rgba(155,255,208,.35)";
        ctx.beginPath();
        ctx.arc(r + 26, 6, 11, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = "#9bffd0";
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(r + 26, 6, 6 + Math.sin(T * 8), 0, 6.283);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        for (let j = 0; j < 3; j++) {
          const q = T * 4 + j * 2.094;
          ctx.beginPath();
          ctx.arc(
            r + 26 + Math.cos(q) * 13,
            6 + Math.sin(q) * 13,
            1.6,
            0,
            6.283,
          );
          ctx.fill();
        }
      });
      body();
      face(4, 1);
      ctx.fillStyle = hit ? "#fff" : "#5a189a";
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - r + 1, y - 5);
      ctx.lineTo(x + 4 + Math.sin(T * 3) * 2, y - r - 24);
      ctx.lineTo(x + r - 1, y - 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      oval(x, y - 5, r + 7, 5, hit ? "#fff" : "#7b2cbf", 3);
      ctx.strokeStyle = "#ffd23f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y - 6, r - 2, 3, 0, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = "#ffd23f";
      ctx.beginPath();
      ctx.arc(x + 1, y - r - 6, 3.2, 0, 6.283);
      ctx.fill();
    }
  }
}
function drawCharOld(e) {
  const x = e.x,
    y = e.y,
    r = e.r,
    a = e.ang,
    k = e.c.k,
    f = e.hitT > 0 ? "#fff" : e.col,
    c = Math.cos(a),
    s = Math.sin(a),
    dk = "rgba(0,0,0,.55)";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (e.shield > 0) {
    ctx.strokeStyle = "rgba(120,220,255,.9)";
    ctx.fillStyle = "rgba(120,220,255,.25)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, r + 12, 0, 6.28);
    ctx.fill();
    ctx.stroke();
  }
  if (e.haste > 0) {
    ctx.strokeStyle = "rgba(124,252,154,.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 8 + Math.sin(G.t * 20) * 2, 0, 6.28);
    ctx.stroke();
  }
  if (e.rapid > 0) {
    ctx.fillStyle = "rgba(255,210,63,.35)";
    ctx.beginPath();
    ctx.arc(x, y, r + 10, 0, 6.28);
    ctx.fill();
  }
  ctx.lineWidth = 3;
  ctx.strokeStyle = dk;
  const body = () => {
    ctx.fillStyle = f;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.28);
    ctx.fill();
    ctx.stroke();
  };
  const wpn = (l, w, col) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = col;
    ctx.fillRect(r - 4, -w / 2, l, w);
    ctx.strokeRect(r - 4, -w / 2, l, w);
    ctx.restore();
  };
  const eyes = (oy) => {
    for (const sx of [-5, 5]) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x + sx, y + oy, 4, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(x + sx + c * 1.8, y + oy + s * 1.8, 2, 0, 6.28);
      ctx.fill();
    }
  };
  if (k === "gun") {
    body();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, r - 3, 3.5, 5.9);
    ctx.stroke();
    ctx.strokeStyle = dk;
    ctx.lineWidth = 3;
    eyes(1);
    wpn(18, 9, "#6b7280");
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = "#ff9f1c";
    ctx.fillRect(r + 12, -4, 6, 8);
    ctx.restore();
  } else if (k === "tank") {
    body();
    ctx.fillStyle = e.hitT > 0 ? "#fff" : "#6b7280";
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, 6.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#222";
    ctx.fillRect(x - r + 3, y - 4, 2 * r - 6, 5);
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(x - 2, y - r + 1, 4, 8);
    wpn(14, 14, "#374151");
    ctx.fillStyle = "#374151";
    for (const sg of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x - s * sg * (r + 1), y + c * sg * (r + 1), 7, 0, 6.28);
      ctx.fill();
      ctx.stroke();
    }
  } else if (k === "snipe") {
    body();
    ctx.fillStyle = e.hitT > 0 ? "#fff" : "#2d6a4f";
    ctx.beginPath();
    ctx.moveTo(x - r - 2, y + 2);
    ctx.lineTo(x, y - r - 13);
    ctx.lineTo(x + r + 2, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#10231a";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, r - 4, 8, 0, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = "#ffe66d";
    for (const sx of [-5, 5]) {
      ctx.beginPath();
      ctx.arc(x + sx + c * 1.5, y + 4 + s * 1.5, 2.5, 0, 6.28);
      ctx.fill();
    }
    wpn(36, 5, "#222");
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(r + 10, -6, 4, 3);
    ctx.restore();
  } else if (k === "bomb") {
    body();
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = i ? "#ffd23f" : "#ff4d6d";
      ctx.beginPath();
      ctx.moveTo(x + i * 8 - 5, y - r + 3);
      ctx.lineTo(
        x + i * 9,
        y - r - 10 - (i ? 0 : 6) + Math.sin(G.t * 14 + i) * 2,
      );
      ctx.lineTo(x + i * 8 + 5, y - r + 3);
      ctx.closePath();
      ctx.fill();
    }
    eyes(1);
    const bx = x + c * (r + 8),
      by = y + s * (r + 8);
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, 6.28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd23f";
    ctx.beginPath();
    ctx.arc(bx, by - 9, 3, 0, 6.28);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#8d6e3f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - c * 6, y - s * 6);
    ctx.lineTo(x + c * (r + 20), y + s * (r + 20));
    ctx.stroke();
    ctx.fillStyle = "#7cfc9a";
    ctx.beginPath();
    ctx.arc(
      x + c * (r + 22),
      y + s * (r + 22),
      6 + Math.sin(G.t * 10),
      0,
      6.28,
    );
    ctx.fill();
    ctx.strokeStyle = dk;
    ctx.lineWidth = 3;
    body();
    eyes(3);
    ctx.fillStyle = e.hitT > 0 ? "#fff" : "#5a189a";
    ctx.beginPath();
    ctx.moveTo(x - r - 5, y - 4);
    ctx.lineTo(x + 4, y - r - 22);
    ctx.lineTo(x + r + 5, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd23f";
    ctx.beginPath();
    ctx.arc(x + 2, y - r - 2, 3, 0, 6.28);
    ctx.fill();
  }
}
function sand() {
  return "#8fd16b";
}
