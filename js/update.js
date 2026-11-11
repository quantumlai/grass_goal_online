// 每幀遊戲邏輯 update(dt)
function update(dt) {
  const p = G.ents[0];
  G.t -= dt;
  G.shake = Math.max(0, G.shake - dt);
  for (let i = walls.length - 1; i >= 0; i--)
    if (walls[i].tmp && (walls[i].t -= dt) <= 0) walls.splice(i, 1);
  for (const e of G.ents) stepFx(e, dt);
  for (const m of G.mines) {
    m.t -= dt;
    if (m.t <= 0) {
      m.dead = 1;
      continue;
    }
    if (m.arm > 0) {
      m.arm -= dt;
      continue;
    }
    for (const e of G.ents)
      if (
        G.ents[m.o].tm !== e.tm &&
        !e.dead &&
        Math.hypot(e.x - m.x, e.y - m.y) < e.r + 34
      ) {
        m.dead = 1;
        break;
      }
    if (m.dead) {
      for (const e of G.ents)
        if (
          G.ents[m.o].tm !== e.tm &&
          !e.dead &&
          Math.hypot(e.x - m.x, e.y - m.y) < 110 + e.r
        )
          hurt(e, 95, m.o);
      for (const t of G.turrets)
        if (
          G.ents[t.o].tm !== G.ents[m.o].tm &&
          Math.hypot(t.x - m.x, t.y - m.y) < 122
        ) {
          t.hp -= 95;
          t.hit = 0.15;
        }
      G.parts.push({ x: m.x, y: m.y, t: 0.4, blast: 110 });
      G.shake = Math.max(G.shake, 0.1);
    }
  }
  G.mines = G.mines.filter((m) => !m.dead);
  for (const t of G.turrets) {
    t.t -= dt;
    t.cd -= dt;
    t.hit = (t.hit || 0) - dt;
    let bt = null,
      bdd = 330;
    for (const o of G.ents) {
      if (o.tm === G.ents[t.o].tm || o.dead || o.invis > 0) continue;
      const d = Math.hypot(o.x - t.x, o.y - t.y);
      if (d < bdd) {
        bdd = d;
        bt = o;
      }
    }
    if (bt) {
      t.a = Math.atan2(bt.y - t.y, bt.x - t.x);
      if (t.cd <= 0) {
        t.cd = 0.28;
        G.bul.push({
          x: t.x,
          y: t.y,
          a: t.a,
          o: t.o,
          d: 9,
          sp: 520,
          life: 0.65,
          r: 4,
        });
      }
    }
  }
  for (const t of G.turrets)
    if (t.hp <= 0) G.parts.push({ x: t.x, y: t.y, t: 0.5, boom: 1 });
  G.turrets = G.turrets.filter((t) => t.t > 0 && t.hp > 0);
  for (const cl of G.clouds) {
    cl.t -= dt;
    for (const o of G.ents)
      if (!o.dead && Math.hypot(o.x - cl.x, o.y - cl.y) < cl.r + o.r) {
        if (cl.heal) {
          if (o.tm === G.ents[cl.o].tm)
            o.hp = Math.min(o.max, o.hp + 40 * dt);
        } else if (o.tm !== G.ents[cl.o].tm) {
          o.poison = Math.max(o.poison || 0, 1.2);
          o.poisonBy = cl.o;
        }
      }
  }
  G.clouds = G.clouds.filter((c) => c.t > 0);
  // 玩家
  if (!p.dead) {
    let dx =
        (keys.d || keys.arrowright ? 1 : 0) -
        (keys.a || keys.arrowleft ? 1 : 0) +
        stick.l.dx,
      dy =
        (keys.s || keys.arrowdown ? 1 : 0) -
        (keys.w || keys.arrowup ? 1 : 0) +
        stick.l.dy;
    move(
      p,
      dx,
      dy,
      dt,
      p.c.sp *
        (p.haste > 0 ? 1.5 : 1) *
        mySpdMul() *
        (p.slow > 0 ? 0.5 : 1),
    );
    let aiming = false,
      fire = false;
    if (stick.r.on || stick.r.id !== null) {
      if (Math.hypot(stick.r.dx, stick.r.dy) > 0.2) {
        p.ang = Math.atan2(stick.r.dy, stick.r.dx);
        aiming = true;
        fire = true;
      }
    } else if (mouse.down || keys.j) {
      p.ang = Math.atan2(
        (mouse.y - vh / 2) / sc +
          G.cam.y -
          p.y +
          vh / 2 / sc -
          vh / 2 / sc,
        (mouse.x - vw / 2) / sc +
          G.cam.x -
          p.x +
          vw / 2 / sc -
          vw / 2 / sc,
      );
      fire = true;
    }
    p.cd -= dt;
    if (fire && p.cd <= 0 && kickBall(p, p.ang)) p.cd = 0.45;
    else if (fire && p.cd <= 0) {
      p.aimD =
        stick.r.id !== null
          ? 70 + Math.min(1, Math.hypot(stick.r.dx, stick.r.dy)) * 180
          : Math.min(
              240,
              Math.hypot(
                (mouse.x - vw / 2) / sc + G.cam.x - p.x,
                (mouse.y - vh / 2) / sc + G.cam.y - p.y,
              ),
            );
      shoot(p, p.ang, 0);
      p.cd = p.c.cd * (p.rapid > 0 ? 0.35 : 1) * Math.pow(0.92, up.rate);
      p.sup = Math.min(100, p.sup + 8 * myChgMul());
    }
    if (superReq && p.sup >= 100) {
      const nt = G.ents
        .filter((o) => o.tm !== p.tm && !o.dead)
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) -
            Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
      if (nt && stick.r.id === null && !mouse.down) {
        p.ang = Math.atan2(nt.y - p.y, nt.x - p.x);
        p.aimD = Math.min(240, Math.hypot(nt.x - p.x, nt.y - p.y));
      }
      shoot(p, p.ang, 1);
      p.sup = 0;
    }
    if (abReq) useAbility(p);
    abReq = false;
    if (rollReq) doRoll(p, dx, dy);
    rollReq = false;
    superReq = false;
    stick.r.sup = false;
  } else {
    p.dead -= dt;
    if (p.dead <= 0) {
      p.dead = 0;
      p.hp = p.max;
      p.x = p.sx;
      p.y = p.sy;
    }
  }
  // 電腦
  for (let i = 1; i < G.ents.length; i++) {
    const e = G.ents[i];
    if (e.dead) {
      e.dead -= dt;
      if (e.dead <= 0) {
        e.dead = 0;
        e.hp = e.max;
        e.x = e.sx;
        e.y = e.sy;
      }
      continue;
    }
    e.hitT = Math.max(0, e.hitT - dt);
    e.cd -= dt;
    e.ai.t -= dt;
    let tgt = null,
      bd = Math.max(320, e.c.rng + 20);
    for (const o of G.ents) {
      if (o.tm === e.tm || o.dead) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < bd && seen(e, o)) {
        bd = d;
        tgt = o;
      }
    }
    if (!tgt) {
      for (const t of G.turrets) {
        if (G.ents[t.o].tm === e.tm) continue;
        const d = Math.hypot(t.x - e.x, t.y - e.y);
        if (d < Math.min(bd, 300)) {
          bd = d;
          tgt = {
            x: t.x,
            y: t.y,
            r: 12,
            hp: t.hp,
            max: t.max,
            tm: 1 - e.tm,
            isT: 1,
          };
        }
      }
    }
    let gem = null,
      gd = 1e9;
    for (const g of G.gems) {
      const d = Math.hypot(g.x - e.x, g.y - e.y);
      if (d < gd) {
        gd = d;
        gem = g;
      }
    }
    if (e.ai.t <= 0) {
      e.ai.t = 0.2 + Math.random() * 0.2;
      if (e.hp < 35 && tgt) {
        const a = Math.atan2(e.y - tgt.y, e.x - tgt.x);
        e.ai.tx = e.x + Math.cos(a) * 200;
        e.ai.ty = e.y + Math.sin(a) * 200;
      } else if (1) {
        const bl = G.ball,
          gx = e.tm ? 0 : W,
          own = e.tm ? W : 0,
          dB = Math.hypot(bl.x - e.x, bl.y - e.y),
          cl = G.ents.filter(
            (o) =>
              o.tm === e.tm &&
              !o.dead &&
              o !== e &&
              Math.hypot(bl.x - o.x, bl.y - o.y) < dB,
          ).length,
          gk = e.role === 0 && Math.abs(bl.x - own) > 380,
          df = e.role === 1 && Math.abs(bl.x - own) > 650 && dB > 260,
          fw = e.role === 3 && cl >= 1 && Math.abs(bl.x - own) < 620;
        if (gk) {
          e.ai.tx = own + (e.tm ? -120 : 120);
          e.ai.ty = H / 2 + (bl.y - H / 2) * 0.45;
        } else if (df) {
          e.ai.tx = own + (e.tm ? -340 : 340);
          e.ai.ty = H / 2 + (bl.y - H / 2) * 0.5;
        } else if (fw) {
          e.ai.tx = gx + (e.tm ? 380 : -380);
          e.ai.ty = H / 2 + (e.id % 2 ? 1 : -1) * 150;
        } else if (cl >= 2) {
          e.ai.tx = bl.x + (gx > bl.x ? 150 : -150);
          e.ai.ty = H / 2 + (e.role - 1.5) * 170;
        } else if (dB < e.r + bl.r + 14) {
          e.ai.tx = gx;
          e.ai.ty = H / 2;
        } else {
          const dg = Math.atan2(H / 2 - bl.y, gx - bl.x);
          e.ai.tx = bl.x - Math.cos(dg) * 32;
          e.ai.ty = bl.y - Math.sin(dg) * 32;
        }
        e.ai.tx = Math.max(100, Math.min(W - 100, e.ai.tx));
        e.ai.ty = Math.max(100, Math.min(H - 100, e.ai.ty));
      } else if (tgt && bd > e.c.keep) {
        e.ai.tx = tgt.x + (Math.random() - 0.5) * 100;
        e.ai.ty = tgt.y + (Math.random() - 0.5) * 100;
      } else if (tgt) {
        const a = Math.random() * 6.28;
        e.ai.tx = e.x + Math.cos(a) * 120;
        e.ai.ty = e.y + Math.sin(a) * 120;
      } else {
        e.ai.tx = T * 3 + Math.random() * (W - T * 6);
        e.ai.ty = T * 3 + Math.random() * (H - T * 6);
      }
    }
    {
      const bl2 = G.ball,
        gx2 = e.tm ? 0 : W;
      if (
        e.cd <= 0 &&
        Math.hypot(bl2.x - e.x, bl2.y - e.y) < e.r + bl2.r + 26
      ) {
        const ka = Math.atan2(
          H / 2 + (Math.random() - 0.5) * 110 - bl2.y,
          gx2 - bl2.x,
        );
        e.ang = ka;
        if (kickBall(e, ka)) e.cd = 0.6;
      }
    }
    move(
      e,
      e.ai.tx - e.x,
      e.ai.ty - e.y,
      dt,
      (e.c.sp - 30) * (e.haste > 0 ? 1.5 : 1) * (e.slow > 0 ? 0.5 : 1),
    );
    if (tgt) {
      e.ang =
        Math.atan2(tgt.y - e.y, tgt.x - e.x) +
        (Math.random() - 0.5) * 0.25;
      if (!(e.rcd > 0) && e.hp < e.max * 0.5 && bd < 220)
        doRoll(e, e.x - tgt.x, e.y - tgt.y);
      if (!(e.acd > 0)) {
        const k = e.c.k;
        if (
          (k === "gun" && bd < 260) ||
          (k === "tank" && bd < 220) ||
          (k === "snipe" && bd < 400) ||
          (k === "bomb" && bd < 200) ||
          (k === "mage" && bd > 170) ||
          (k === "dash" && bd < 300) ||
          (k === "eng" && bd < 320) ||
          (k === "toxic" && bd < 130) ||
          (k === "wall" && bd < 260) ||
          (k === "frost" && bd < 200) ||
          (k === "brute" && bd < 220) ||
          (k === "bat" && bd < 260) ||
          (k === "cactus" && bd < 260) ||
          (k === "bloom" && bd < 320)
        )
          useAbility(e);
      }
      if (e.cd <= 0 && bd < e.c.rng) {
        e.aimD = bd;
        if (e.sup >= 100 && bd < e.c.rng * 0.9) {
          shoot(e, e.ang, 1);
          e.sup = 0;
        } else {
          shoot(e, e.ang, 0);
          e.sup += 8;
        }
        e.cd = e.c.cd * (e.rapid > 0 ? 0.5 : 1.5) + Math.random() * 0.3;
      }
    }
  }
  // 子彈
  for (const b of G.bul) {
    b.x += Math.cos(b.a) * b.sp * dt;
    b.y += Math.sin(b.a) * b.sp * dt;
    b.life -= dt;
    if (!b.lob && rects(b.x, b.y, 2, walls)) b.life = 0;
    {
      const bl = G.ball;
      if (
        !b.lob &&
        b.life > 0 &&
        Math.hypot(bl.x - b.x, bl.y - b.y) < bl.r + b.r + 2
      ) {
        bl.vx += Math.cos(b.a) * b.d * 7;
        bl.vy += Math.sin(b.a) * b.d * 7;
        bl.last = b.o;
        if (!b.pierce) b.life = 0;
      }
    }
    for (const e of G.ents) {
      if (
        e.tm === G.ents[b.o].tm ||
        e.dead ||
        b.life <= 0 ||
        b.lob ||
        (b.hit && b.hit[e.id])
      )
        continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
        hurt(
          e,
          b.d *
            (G.ents[b.o].c.k === "snipe" && e.hp < e.max * 0.5 ? 1.4 : 1),
          b.o,
        );
        if (b.slow) e.slow = 1.5;
        if (b.pois) {
          e.poison = G.ents[b.o].c.k === "toxic" ? 4.5 : 3;
          e.poisonBy = b.o;
        }
        if (b.steal) {
          const ow = G.ents[b.o];
          ow.hp = Math.min(ow.max, ow.hp + b.d * b.steal);
        }
        if (b.pierce) {
          (b.hit = b.hit || {})[e.id] = 1;
        } else b.life = 0;
        const o = G.ents[b.o];
        if (o && !b.sup)
          o.sup = Math.min(
            100,
            o.sup + 10 * (o.id === 0 ? myChgMul() : 1),
          );
        G.parts.push({ x: b.x, y: b.y, t: 0.25, txt: b.d, hit: 1 });
      }
    }
    if (!b.lob && b.life > 0) {
      for (const t of G.turrets) {
        if (
          G.ents[t.o].tm === G.ents[b.o].tm ||
          (b.hit && b.hit["t" + t.o + t.x])
        )
          continue;
        if (Math.hypot(t.x - b.x, t.y - b.y) < 13 + b.r) {
          t.hp -= b.d;
          t.hit = 0.15;
          G.parts.push({
            x: b.x,
            y: b.y,
            t: 0.25,
            txt: Math.round(b.d),
            hit: 1,
          });
          if (b.pierce) {
            (b.hit = b.hit || {})["t" + t.o + t.x] = 1;
          } else {
            b.life = 0;
            break;
          }
        }
      }
    }
  }
  for (const b of G.bul)
    if (b.lob && b.life <= 0) {
      let n = 0;
      for (const e of G.ents)
        if (
          e.tm !== G.ents[b.o].tm &&
          !e.dead &&
          Math.hypot(e.x - b.x, e.y - b.y) < b.aoe + e.r
        ) {
          hurt(e, b.d, b.o);
          n++;
        }
      for (const t of G.turrets)
        if (
          G.ents[t.o].tm !== G.ents[b.o].tm &&
          Math.hypot(t.x - b.x, t.y - b.y) < b.aoe + 12
        ) {
          t.hp -= b.d;
          t.hit = 0.15;
        }
      pushBall(b.x, b.y, b.aoe, 520);
      const ow = G.ents[b.o];
      if (n && ow && !b.sup) ow.sup = Math.min(100, ow.sup + 12);
      G.parts.push({ x: b.x, y: b.y, t: 0.4, blast: b.aoe });
      if (rects(b.x, b.y, 20, [{ x: 0, y: 0, w: 0, h: 0 }])) 0;
    }
  for (const b of G.bul)
    if (b.burst && b.life <= 0) {
      for (let i = 0; i < b.burst; i++) {
        const a = b.a + (i * 6.283) / b.burst;
        G.bul.push({
          x: b.x,
          y: b.y,
          a,
          o: b.o,
          d: b.bd || 6,
          sp: 380,
          life: 0.22,
          r: 4,
        });
      }
    }
  G.bul = G.bul.filter((b) => b.life > 0);
  // 寶石
  G.spawn -= dt;
  if (false) {
    G.spawn = 3.5;
    dropGem(
      W / 2 + (Math.random() - 0.5) * 60,
      H / 2 + (Math.random() - 0.5) * 60,
      1,
    );
  }
  for (const g of G.gems) {
    g.age += dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.vx *= 0.9;
    g.vy *= 0.9;
    if (rects(g.x, g.y, 6, walls)) {
      g.x -= g.vx * dt * 2;
      g.y -= g.vy * dt * 2;
      g.vx = g.vy = 0;
    }
    for (const e of G.ents) {
      if (!e.dead && Math.hypot(e.x - g.x, e.y - g.y) < e.r + 8) {
        if (g.cube) {
          e.cubes = (e.cubes || 0) + 1;
          e.max += 10;
          e.hp += 10;
          G.parts.push({
            x: e.x,
            y: e.y - 30,
            t: 0.7,
            call: "+強化",
            col: "#7cfc9a",
          });
        } else e.gems++;
        g.got = 1;
        break;
      }
    }
  }
  G.gems = G.gems.filter((g) => !g.got);
  for (const q of G.parts) q.t -= dt;
  G.parts = G.parts.filter((q) => q.t > 0);
  // 回血
  for (const e of G.ents) {
    if (!e.dead && e.hp < e.max) {
      e.regen = (e.regen || 0) + dt;
      const charm = e.id === 0 && accVal("charm");
      if (e.hitT <= 0 && e.regen > (charm ? 2 : 4))
        e.hp = Math.min(e.max, e.hp + (charm ? 40 : 25) * dt);
    }
    if (e.hitT > 0) e.regen = 0;
  }
  p.hitT = Math.max(0, p.hitT - dt);
  {
    const bl = G.ball;
    if (G.goalT > 0) {
      G.goalT -= dt;
      if (G.goalT <= 0) kickoff();
    } else {
      let nx = bl.x + bl.vx * dt,
        ny = bl.y + bl.vy * dt;
      if (rects(nx, bl.y, bl.r, walls)) {
        bl.vx *= -0.7;
        nx = bl.x;
      }
      if (rects(nx, ny, bl.r, walls)) {
        bl.vy *= -0.7;
        ny = bl.y;
      }
      bl.x = nx;
      bl.y = ny;
      const fr = Math.pow(0.25, dt);
      bl.vx *= fr;
      bl.vy *= fr;
      const bsp = Math.hypot(bl.vx, bl.vy);
      if (bsp > 1100) {
        bl.vx *= 1100 / bsp;
        bl.vy *= 1100 / bsp;
      }
      for (const e of G.ents) {
        const mvx = (e.x - (e.px === undefined ? e.x : e.px)) / dt,
          mvy = (e.y - (e.py === undefined ? e.y : e.py)) / dt;
        e.px = e.x;
        e.py = e.y;
        if (e.dead) continue;
        const d = Math.hypot(bl.x - e.x, bl.y - e.y);
        if (d < e.r + bl.r) {
          const ux = (bl.x - e.x) / (d || 1),
            uy = (bl.y - e.y) / (d || 1),
            ms = Math.hypot(mvx, mvy);
          bl.x = e.x + ux * (e.r + bl.r);
          bl.y = e.y + uy * (e.r + bl.r);
          bl.vx = ux * (160 + ms * 0.5) + mvx * 0.7;
          bl.vy = uy * (160 + ms * 0.5) + mvy * 0.7;
          bl.last = e.id;
        }
      }
      if (rects(bl.x, bl.y, bl.r, walls)) {
        bl.x += (W / 2 - bl.x) * 0.06;
        bl.y += (H / 2 - bl.y) * 0.06;
      }
      if (bl.x < 28) goal(1);
      else if (bl.x > W - 28) goal(0);
      bl.x = Math.max(bl.r, Math.min(W - bl.r, bl.x));
      bl.y = Math.max(bl.r, Math.min(H - bl.r, bl.y));
    }
  }
  // 結束:結算交給 rewards.js(比賽獎勵 → 數學挑戰)
  if (G.t <= 0 || G.score[0] >= 3 || G.score[1] >= 3) {
    G.over = true;
    const sm = G.score[G.ents[0].tm],
      so = G.score[1 - G.ents[0].tm];
    onMatchEnd(sm > so ? "win" : sm === so ? "tie" : "lose");
  }
}
