// 子彈、射擊、技能、翻滾、踢球、進球、受傷、移動、視野
function B(e, a, o) {
  const b = Object.assign(
    { x: e.x, y: e.y, a, o: e.id, d: 12, sp: 480, life: 0.6, r: 5 },
    o,
  );
  if (e.c && e.c.k === "gun") {
    b.d *= 1.15;
    b.sp *= 1.25;
  }
  b.d *= 1 + 0.1 * (e.cubes || 0) + (e.mods ? e.mods.atk : 0);
  G.bul.push(b);
}
function shoot(e, ang, sup) {
  const k = e.c.k;
  e.invis = 0;
  if (sup) {
    G.parts.push({
      x: e.x,
      y: e.y - 34,
      t: 0.9,
      call: e.c.sname,
      col: e.col,
    });
    G.parts.push({ x: e.x, y: e.y, t: 0.5, heal: 1, col: e.col });
    if (e.id === G.me) G.shake = 0.25; // 畫面震動只給本機玩家
  }
  if (k === "gun") {
    if (sup)
      for (let i = -3; i <= 3; i++)
        B(e, ang + i * 0.16, { d: 34, sp: 520, life: 0.7, r: 7, sup: 1 });
    else
      for (let i = e.rapid > 0 ? -2 : -1; i <= (e.rapid > 0 ? 2 : 1); i++)
        B(e, ang + i * 0.11);
  } else if (k === "tank") {
    if (sup) {
      e.dash = 0.35;
      e.dashA = ang;
      e.dashHit = {};
    } else
      for (let i = -2; i <= 2; i++)
        B(e, ang + i * 0.14 + (Math.random() - 0.5) * 0.05, {
          d: 16,
          sp: 430,
          life: 0.28,
          r: 6,
        });
  } else if (k === "snipe") {
    if (sup)
      B(e, ang, { d: 110, sp: 900, life: 1.1, r: 9, pierce: 1, sup: 1 });
    else {
      B(e, ang, {
        d: e.ambush ? 90 : 42,
        sp: 850,
        life: 0.8,
        r: e.ambush ? 7 : 5,
      });
      e.ambush = 0;
    }
  } else if (k === "bomb") {
    if (sup)
      for (let i = -1; i <= 1; i++)
        B(e, ang + i * 0.25, {
          d: 48,
          sp: 320,
          life: 0.7,
          r: 8,
          lob: 1,
          aoe: 140,
          sup: 1,
        });
    else
      B(e, ang, {
        d: 32,
        sp: 320,
        life: Math.min(240, e.aimD || 220) / 320,
        r: 7,
        lob: 1,
        aoe: 105,
      });
  } else if (k === "brute") {
    if (sup) {
      e.dash = 0.5;
      e.dashA = ang;
      e.dashHit = {};
      e.dashD = 65;
      e.dashHeal = 0;
    } else
      for (let i = -1; i <= 1; i++)
        B(e, ang + i * 0.2, { d: 17, sp: 420, life: 0.17, r: 10 });
  } else if (k === "bat") {
    e.kickBoost = sup ? 1 : 0.3;
    kickBall(e, ang);
    if (sup) {
      for (const o of G.ents)
        if (
          o.tm !== e.tm &&
          !o.dead &&
          Math.hypot(o.x - e.x, o.y - e.y) < 270
        ) {
          hurt(o, 35, e.id);
          const aa = Math.atan2(o.y - e.y, o.x - e.x);
          o.vx += Math.cos(aa) * 700;
          o.vy += Math.sin(aa) * 700;
        }
      G.parts.push({ x: e.x, y: e.y, t: 0.5, heal: 1, col: "#4dabf7" });
    } else
      for (let i = -1; i <= 1; i++)
        B(e, ang + i * 0.22, { d: 13, sp: 420, life: 0.13, r: 11 });
  } else if (k === "cactus") {
    if (sup) {
      for (let i = -1; i <= 1; i++)
        B(e, ang + i * 0.25, {
          d: 26,
          sp: 420,
          life: 0.55,
          r: 7,
          burst: 10,
          bd: 12,
          sup: 1,
        });
    } else
      B(e, ang, { d: 16, sp: 480, life: 0.5, r: 5, burst: 6, bd: 7 });
  } else if (k === "bloom") {
    if (sup) {
      for (const o of G.ents)
        if (
          o.tm === e.tm &&
          !o.dead &&
          Math.hypot(o.x - e.x, o.y - e.y) < 360
        ) {
          o.hp = Math.min(o.max, o.hp + 90);
          o.haste = 4;
          G.parts.push({
            x: o.x,
            y: o.y,
            t: 0.5,
            heal: 1,
            col: "#ff8fc7",
          });
        }
    } else
      for (let i = -1; i <= 1; i++)
        B(e, ang + i * 0.16, { d: 10, sp: 430, life: 0.55, r: 5 });
  } else if (k === "dash") {
    e.dash = sup ? 0.6 : 0.14;
    e.dashA = ang;
    e.dashHit = {};
    e.dashD = sup ? 70 : 28;
    e.dashHeal = sup ? 40 : 0;
  } else if (k === "eng") {
    if (sup) {
      for (let i = 0; i < 18; i++)
        B(e, i * 0.349 + Math.random() * 0.1, {
          d: 26,
          sp: 420,
          life: 0.55,
          r: 6,
          sup: 1,
        });
    } else {
      for (const sg of [-1, 1])
        B(
          {
            x: e.x - Math.sin(ang) * sg * 7,
            y: e.y + Math.cos(ang) * sg * 7,
            id: e.id,
            cubes: e.cubes,
          },
          ang,
          { d: 13, sp: 520, life: 0.6, r: 5 },
        );
    }
  } else if (k === "toxic") {
    if (sup) {
      const dd = Math.max(90, Math.min(260, e.aimD || 200));
      G.clouds.push({
        x: e.x + Math.cos(ang) * dd,
        y: e.y + Math.sin(ang) * dd,
        r: 140,
        t: 7,
        o: e.id,
      });
    } else
      for (let i = -1; i <= 1; i++)
        B(e, ang + i * 0.12, { d: 8, sp: 500, life: 0.6, r: 4, pois: 1 });
  } else if (k === "wall") {
    if (sup) {
      e.dash = 0.45;
      e.dashA = ang;
      e.dashHit = {};
      e.dashD = 55;
      e.dashHeal = 0;
    } else
      for (let i = -1; i <= 1; i++)
        B(e, ang + i * 0.15, { d: 18, sp: 400, life: 0.45, r: 8 });
  } else if (k === "frost") {
    if (sup) {
      for (const o of G.ents)
        if (
          o.tm !== e.tm &&
          !o.dead &&
          Math.hypot(o.x - e.x, o.y - e.y) < 360
        ) {
          hurt(o, 45, e.id);
          o.slow = 4;
          const aa = Math.atan2(o.y - e.y, o.x - e.x);
          o.vx += Math.cos(aa) * 300;
          o.vy += Math.sin(aa) * 300;
        }
      G.parts.push({ x: e.x, y: e.y, t: 0.6, heal: 1, col: "#8be9ff" });
    } else
      for (let i = -1; i <= 1; i++)
        B(e, ang + i * 0.14, { d: 9, sp: 560, life: 0.5, r: 5, slow: 1 });
  } else {
    if (sup) {
      e.hp = Math.min(e.max, e.hp + 100);
      e.haste = 5;
      G.parts.push({ x: e.x, y: e.y, t: 0.5, heal: 1 });
    } else B(e, ang, { d: 14, sp: 420, life: 0.65, r: 6, steal: 0.6 });
  }
  e.vx -= Math.cos(ang) * 30;
  e.vy -= Math.sin(ang) * 30;
}
function stepFx(e, dt) {
  if (e.dead) return;
  if (e.haste > 0) e.haste -= dt;
  if (e.invis > 0) e.invis -= dt;
  if (e.shield > 0) e.shield -= dt;
  if (e.rapid > 0) e.rapid -= dt;
  if (e.acd > 0) e.acd -= dt;
  if (e.slow > 0) e.slow -= dt;
  if (e.rcd > 0) e.rcd -= dt;
  if (e.c.k === "bloom") {
    for (const o of G.ents)
      if (
        o !== e &&
        o.tm === e.tm &&
        !o.dead &&
        Math.hypot(o.x - e.x, o.y - e.y) < 160
      )
        o.hp = Math.min(o.max, o.hp + 8 * dt);
  }
  if (e.kickBoost > 0) e.kickBoost -= dt;
  if (e.c.k === "mage" && e.hp < e.max)
    e.hp = Math.min(e.max, e.hp + 6 * dt);
  if (e.poison > 0) {
    e.poison -= dt;
    e.hp -= 14 * dt;
    if (e.hp <= 0) {
      e.hp = 0;
      hurt(e, 0, e.poisonBy);
    }
  }
  if (e.roll > 0) {
    e.roll -= dt;
    const nx2 = e.x + Math.cos(e.rollA) * 600 * dt,
      ny2 = e.y + Math.sin(e.rollA) * 600 * dt;
    if (!rects(nx2, e.y, e.r, walls)) e.x = nx2;
    if (!rects(e.x, ny2, e.r, walls)) e.y = ny2;
    G.parts.push({
      x: e.x,
      y: e.y,
      t: 0.25,
      ghost: "rgba(255,255,255,.7)",
      r: e.r * 0.8,
    });
  }
  if (e.dash > 0) {
    e.dash -= dt;
    const st = 620 * dt,
      nx = e.x + Math.cos(e.dashA) * st,
      ny = e.y + Math.sin(e.dashA) * st;
    G.parts.push({ x: e.x, y: e.y, t: 0.3, ghost: e.col, r: e.r });
    if (!rects(nx, ny, e.r, walls)) {
      e.x = nx;
      e.y = ny;
    } else e.dash = 0;
    pushBall(e.x, e.y, e.r + 22, 650);
    for (const o of G.ents)
      if (
        o.tm !== e.tm &&
        !o.dead &&
        !e.dashHit[o.id] &&
        Math.hypot(o.x - e.x, o.y - e.y) < e.r + o.r + 8
      ) {
        e.dashHit[o.id] = 1;
        hurt(o, e.dashD || 55, e.id);
        if (e.dashHeal) e.hp = Math.min(e.max, e.hp + e.dashHeal);
        o.vx += Math.cos(e.dashA) * 500;
        o.vy += Math.sin(e.dashA) * 500;
      }
  }
}
function useAbility(e) {
  if (e.acd > 0 || e.dead) return false;
  const k = e.c.k;
  if (k === "gun") {
    e.rapid = 5;
    e.haste = 5;
  } else if (k === "tank") {
    for (const o of G.ents)
      if (o.tm === e.tm && !o.dead) {
        o.shield = 5;
        G.parts.push({ x: o.x, y: o.y, t: 0.5, heal: 1, col: "#7ad7ff" });
      }
    for (const o of G.ents)
      if (
        o.tm !== e.tm &&
        !o.dead &&
        Math.hypot(o.x - e.x, o.y - e.y) < 160
      ) {
        hurt(o, 40, e.id);
        const aa = Math.atan2(o.y - e.y, o.x - e.x);
        o.vx += Math.cos(aa) * 600;
        o.vy += Math.sin(aa) * 600;
      }
    pushBall(e.x, e.y, 150, 700);
    G.parts.push({ x: e.x, y: e.y, t: 0.5, heal: 1, col: "#7ad7ff" });
  } else if (k === "snipe") {
    e.invis = 6;
    e.haste = 6;
    e.ambush = 1;
  } else if (k === "bomb") {
    for (let i = 0; i < 4; i++) {
      const aa = e.ang + i * 1.571;
      G.mines.push({
        x: e.x + Math.cos(aa) * 38,
        y: e.y + Math.sin(aa) * 38,
        o: e.id,
        t: 60,
        arm: 0.6,
      });
    }
  } else if (k === "wall") {
    const ho = Math.abs(Math.cos(e.ang)) > Math.abs(Math.sin(e.ang)),
      wx = e.x + Math.cos(e.ang) * 74,
      wy = e.y + Math.sin(e.ang) * 74;
    walls.push(
      ho
        ? { x: wx - 12, y: wy - 70, w: 24, h: 140, t: 6, tmp: 1 }
        : { x: wx - 70, y: wy - 12, w: 140, h: 24, t: 6, tmp: 1 },
    );
  } else if (k === "frost") {
    e.haste = 3.5;
    e.kickBoost = 3.5;
    for (const o of G.ents)
      if (
        o.tm !== e.tm &&
        !o.dead &&
        Math.hypot(o.x - e.x, o.y - e.y) < 200
      )
        o.slow = 4;
    G.parts.push({ x: e.x, y: e.y, t: 0.5, heal: 1, col: "#8be9ff" });
  } else if (k === "brute") {
    e.shield = 4;
    e.haste = 4;
    G.parts.push({ x: e.x, y: e.y, t: 0.5, heal: 1, col: "#ff7043" });
  } else if (k === "bat") {
    e.kickBoost = 7;
    e.haste = 3.5;
  } else if (k === "cactus") {
    for (let i = 0; i < 3; i++) {
      const aa = e.ang + Math.PI + (i - 1) * 0.9;
      G.mines.push({
        x: e.x + Math.cos(aa) * 40,
        y: e.y + Math.sin(aa) * 40,
        o: e.id,
        t: 60,
        arm: 0.6,
      });
    }
  } else if (k === "bloom") {
    G.clouds.push({ x: e.x, y: e.y, r: 125, t: 7, o: e.id, heal: 1 });
  } else if (k === "dash") {
    e.haste = 5;
    e.invis = 3;
    e.dash = 0.3;
    e.dashA = e.ang;
    e.dashHit = {};
    e.dashD = 40;
    e.dashHeal = 0;
  } else if (k === "eng") {
    G.turrets.push({
      x: e.x + Math.cos(e.ang) * 34,
      y: e.y + Math.sin(e.ang) * 34,
      o: e.id,
      t: 1e9,
      cd: 0.3,
      hp: 60,
      max: 60,
    });
  } else if (k === "toxic") {
    G.clouds.push({ x: e.x, y: e.y, r: 95, t: 5, o: e.id });
    const aa = e.ang + Math.PI;
    let nx = e.x,
      ny = e.y;
    for (let s = 10; s <= 200; s += 10) {
      const tx = e.x + Math.cos(aa) * s,
        ty = e.y + Math.sin(aa) * s;
      if (rects(tx, ty, e.r, walls)) break;
      nx = tx;
      ny = ty;
    }
    G.parts.push({ x: e.x, y: e.y, t: 0.4, ghost: e.col, r: e.r });
    e.x = nx;
    e.y = ny;
    e.haste = 2;
  } else {
    let nx = e.x,
      ny = e.y;
    for (let s = 10; s <= 300; s += 10) {
      const tx = e.x + Math.cos(e.ang) * s,
        ty = e.y + Math.sin(e.ang) * s;
      if (rects(tx, ty, e.r, walls)) break;
      nx = tx;
      ny = ty;
    }
    G.parts.push({ x: e.x, y: e.y, t: 0.4, ghost: e.col, r: e.r });
    e.x = nx;
    e.y = ny;
    e.haste = 4;
    e.hp = Math.min(e.max, e.hp + 35);
    e.shield = 1.2;
    G.parts.push({ x: nx, y: ny, t: 0.4, ghost: e.col, r: e.r });
  }
  e.acd = e.c.acd * e.mods.cdr;
  G.parts.push({
    x: e.x,
    y: e.y - 34,
    t: 0.8,
    call: e.c.aname,
    col: e.col,
  });
  return true;
}
function doRoll(e, dx, dy) {
  if (e.rcd > 0 || e.dead || e.roll > 0) return;
  const m = Math.hypot(dx, dy);
  e.rollA = m > 0.1 ? Math.atan2(dy, dx) : e.ang;
  e.roll = 0.22;
  e.rcd = 3.5 * e.mods.roll;
}
function kickBall(e, ang) {
  const bl = G.ball;
  if (G.goalT > 0 || Math.hypot(bl.x - e.x, bl.y - e.y) > e.r + bl.r + 28)
    return false;
  const ks =
    (e.kickBoost > 0 ? 1000 : 700) *
    e.mods.kick *
    (e.c.k === "bat" ? 1.25 : 1);
  bl.vx = Math.cos(ang) * ks;
  bl.vy = Math.sin(ang) * ks;
  bl.last = e.id;
  G.parts.push({ x: bl.x, y: bl.y, t: 0.3, heal: 1, col: "#fff" });
  return true;
}
function pushBall(x, y, rad, f) {
  const bl = G.ball,
    d = Math.hypot(bl.x - x, bl.y - y);
  if (d < rad + bl.r) {
    const a = Math.atan2(bl.y - y, bl.x - x);
    bl.vx += Math.cos(a) * f;
    bl.vy += Math.sin(a) * f;
  }
}
function kickoff() {
  const bl = G.ball;
  bl.x = W / 2;
  bl.y = H / 2;
  bl.vx = bl.vy = 0;
  G.ents.forEach((e) => {
    e.x = e.sx;
    e.y = e.sy;
    e.dead = 0;
    e.hp = e.max;
    e.vx = e.vy = 0;
    e.dash = 0;
    e.roll = 0;
    e.poison = 0;
    e.px = e.x;
    e.py = e.y;
  });
  G.bul = [];
  G.mines = [];
  G.clouds = [];
  G.turrets = [];
}
function goal(tm) {
  G.score[tm]++;
  G.goalT = 2.2;
  G.goalMsg = "GOAL! " + (tm ? "紅" : "藍") + "隊得分";
  G.goalCol = tm ? "#ff6b6b" : "#6bb3ff";
  G.shake = 0.5;
}
function hurt(e, d, by) {
  if (e.dead || e.roll > 0) return;
  if (e.c.k === "tank") d *= 0.85;
  if (e.c.k === "wall") d *= 0.9;
  if (e.shield > 0) d *= 0.25;
  if (e.dash > 0) d *= 0.5;
  d *= e.mods.def;
  e.hp -= d;
  e.hitT = 0.15;
  if (e.hp <= 0) {
    e.dead = 3 * e.mods.resp;
    const n = e.gems;
    e.gems = 0;
    dropGem(e.x, e.y, n + 0);
    G.gems.push({ x: e.x, y: e.y - 8, vx: 0, vy: -60, age: 0, cube: 1 });
    e.cubes = 0;
    e.max = e.c.hp * e.mods.hp;
    G.parts.push({ x: e.x, y: e.y, t: 0.5, boom: 1 });
    if (e.id === G.me) G.shake = 0.3;
  }
}
function move(e, dx, dy, dt, sp) {
  const m = Math.hypot(dx, dy);
  if (m > 1) {
    dx /= m;
    dy /= m;
  }
  let nx = e.x + dx * sp * dt + e.vx * dt,
    ny = e.y + dy * sp * dt + e.vy * dt;
  if (!rects(nx, e.y, e.r, walls)) e.x = nx;
  if (!rects(e.x, ny, e.r, walls)) e.y = ny;
  e.vx *= 0.85;
  e.vy *= 0.85;
  e.x = Math.max(e.r, Math.min(W - e.r, e.x));
  e.y = Math.max(e.r, Math.min(H - e.r, e.y));
}
function seen(a, b) {
  return (
    (!inBush(b) && !(b.invis > 0)) ||
    Math.hypot(a.x - b.x, a.y - b.y) < 110
  );
}
