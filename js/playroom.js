// 好友房間連線(Playroom Kit,房主模式)
//
// - 房主:跑 update(),每秒送 PLAYROOM.snapHz 次狀態快照(不可靠通道,掉了下一次補上)。
//   開賽(match)與結束(result)走可靠通道,一定送得到。
// - 其他玩家:每秒送 PLAYROOM.inputHz 次輸入。大招 / 超能力 / 翻滾用「計數器」表示,
//   封包掉了或被下一筆蓋過也不會漏按。
// - 畫面:自己的角色先在本機預測移動,再慢慢對齊房主的位置;其他角色和球在快照之間補間,
//   子彈依速度自己往前飛。
// - 比賽中有人離開:他的角色改由電腦接手。房主離開:這場取消,大家回到房間(不給獎勵、不用做數學)。
//
// Playroom 的狀態:
//   每位玩家 prof  { name, ci, loadout, ready, st }   可靠   名稱、英雄、配置、是否準備好、目前在做什麼
//   每位玩家 inp   精簡的輸入資料                       不可靠
//   每位玩家 emo   { k, n }                             可靠   表情 / 短語(n 是計數器)
//   全域    match  { id, ents }                         可靠   房主開賽時的陣容
//   全域    snap   精簡的狀態快照                       不可靠
//   全域    result { id, score } 或 { id, aborted }     可靠
//   全域    hostId                                      可靠   房主是誰(顯示皇冠用)
let PR = null; // window.Playroom
const room = {
  active: false, // 已經在房間裡
  players: [], // Playroom 的 PlayerState
  matchId: null, // 目前(或最後一場)比賽的 id
  inMatch: false, // 本機正在這場比賽中
  wasHost: false, // 開賽時本機是不是房主
  resultSent: false,
  seen: {}, // 房主:玩家 id → 上次看到的按鍵計數
  cnt: { s: 0, a: 0, r: 0 }, // 本機按鍵計數
  inp: NO_INPUT, // 本機最新輸入(預測用)
  sendT: 0,
  pubT: 0,
  profT: 0,
  profLast: "",
  snapN: 0, // 房主:快照流水號
  snapSeen: -1, // 非房主:已套用的快照流水號
  note: "", // 房間畫面的提示
};
// 還連著房間嗎(離開或斷線後 myPlayer() 會不見)
const roomOn = () => room.active && PR && PR.myPlayer();
const r1 = (v) => Math.round(v * 10) / 10,
  r2 = (v) => Math.round(v * 100) / 100,
  r3 = (v) => Math.round(v * 1000) / 1000;

function loadPlayroom() {
  if (window.Playroom) return Promise.resolve(window.Playroom);
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = PLAYROOM.sdk;
    s.onload = () => (window.Playroom ? ok(window.Playroom) : fail(new Error("Playroom 載入失敗")));
    s.onerror = () => fail(new Error("Playroom 載入失敗,請檢查網路"));
    document.head.appendChild(s);
  });
}
// 加入房間。code 沒給:網址有 #r= 就加入那個房間,否則開新房間
async function joinRoom(code) {
  PR = await loadPlayroom();
  const fromLink = /[#&]r=/.test(location.hash);
  if (!code && !fromLink) history.replaceState(null, "", location.pathname + location.search);
  let err = null;
  await PR.insertCoin(
    {
      skipLobby: true,
      maxPlayersPerRoom: PLAYROOM.maxPlayers,
      reconnectGracePeriod: 5000,
      ...(code ? { roomCode: code } : {}),
      ...(PLAYROOM.gameId ? { gameId: PLAYROOM.gameId } : {}),
    },
    undefined,
    (e) => (err = e),
  );
  if (err) throw err;
  room.active = true;
  Net = PlayroomNet;
  const m = PR.getState("match");
  room.matchId = m ? m.id : null; // 加入前就開打的比賽不算
  PR.onPlayerJoin((pl) => {
    if (!room.players.includes(pl)) room.players.push(pl);
    const em = pl.getState("emo");
    emo.seen[pl.id] = em ? em.n : 0; // 加入前的舊表情不顯示
    pl.onQuit(() => {
      room.players = room.players.filter((p) => p !== pl);
      onPlayerQuit(pl.id);
    });
  });
  syncProfile(true);
}
function leaveRoom() {
  try {
    PR && PR.myPlayer().leaveRoom();
  } catch (e) {}
  history.replaceState(null, "", location.pathname + location.search);
  location.reload(); // Playroom 不支援同一頁重開連線,直接重新整理回首頁
}
function inviteLink() {
  const base = location.href.split("#")[0];
  return /[#&]r=/.test(location.hash) ? base + location.hash : base + "#r=" + PR.getRoomCode();
}

// ── 每位玩家的資料 ──
// 沒登入時的名稱:玩家 + 兩位數字(由 Playroom 的玩家 id 算出來,同一個人固定)
const myName = () =>
  (typeof acct !== "undefined" && acct && acct.name) ||
  "玩家" + (10 + ([...PR.myPlayer().id].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0) % 90);
function myStatus() {
  if (room.inMatch) return "play";
  if (mathScr.style.display !== "none" || mresScr.style.display !== "none" || P.mathPending)
    return "math";
  return "lobby";
}
// 名稱、英雄、配置、狀態有變就送出去(最多每 0.5 秒一次)
function syncProfile(force) {
  if (!roomOn()) return;
  const prof = {
    name: myName(),
    ci: pick,
    loadout: myLoadout(),
    avatar: myAvatar(), // 頭像(別人收到後會經過 avClean 檢查)
    ready: !P.mathPending,
    st: myStatus(),
  };
  const j = JSON.stringify(prof);
  if (!force && j === room.profLast) return;
  room.profLast = j;
  PR.myPlayer().setState("prof", prof, true);
}
const profOf = (pl) => pl.getState("prof");
// 房間裡的真人玩家(已送出資料的,最多 PLAYROOM.maxPlayers 位)
function roomPlayers() {
  return room.players
    .map((pl) => ({ pl, prof: profOf(pl) }))
    .filter((o) => o.prof)
    .slice(0, PLAYROOM.maxPlayers);
}

// ── 快照 ──
function packSnap(G) {
  const bl = G.ball;
  return {
    id: room.matchId,
    n: ++room.snapN,
    fx: SFX.out.splice(0), // 這段時間房主播放過的音效(sound.js)
    t: r2(G.t),
    sc: G.score,
    gT: r2(G.goalT),
    gM: G.goalMsg,
    gC: G.goalCol,
    e: G.ents.map((e) => [
      r1(e.x),
      r1(e.y),
      r3(e.ang),
      r1(e.hp),
      r1(e.max),
      r2(e.dead || 0),
      r2(e.invis || 0),
      r2(e.shield || 0),
      r2(e.haste || 0),
      r2(e.slow || 0),
      r2(e.rapid || 0),
      r2(e.hitT || 0),
      e.cubes || 0,
      r1(e.sup),
      r2(e.acd || 0),
      r2(e.rcd || 0),
    ]),
    b: G.bul.map((b) => [r1(b.x), r1(b.y), b.r, b.o, b.sup ? 1 : 0, r3(b.a), b.lob ? 0 : b.sp]),
    ball: [r1(bl.x), r1(bl.y), r1(bl.vx), r1(bl.vy)],
    m: G.mines.map((m) => [r1(m.x), r1(m.y), m.o, r2(m.t), r2(m.arm || 0)]),
    c: G.clouds.map((c) => [r1(c.x), r1(c.y), c.r, c.heal ? 1 : 0, r2(c.t)]),
    tu: G.turrets.map((t) => [r1(t.x), r1(t.y), r3(t.a || 0), r1(t.hp), t.max, t.o, r2(t.hit || 0)]),
    g: G.gems.map((g) => [r1(g.x), r1(g.y), r2(g.age), g.cube ? 1 : 0]),
    p: G.parts.map((q) =>
      Object.fromEntries(Object.entries(q).map(([k, v]) => [k, typeof v === "number" ? r2(v) : v])),
    ),
    w: walls.filter((w) => w.tmp).map((w) => [w.x, w.y, w.w, w.h, r2(w.t)]),
  };
}
function applySnap(s) {
  if (!G || s.id !== room.matchId) return;
  G.t = s.t;
  G.score = s.sc;
  G.goalT = s.gT;
  G.goalMsg = s.gM;
  G.goalCol = s.gC;
  s.e.forEach((a, i) => {
    const e = G.ents[i];
    if (!e) return;
    const [x, y, ang, hp, max, dead, invis, shield, haste, slow, rapid, hitT, cubes, sup, acd, rcd] = a;
    if (i === G.me && dead > 0 && !(e.dead > 0)) G.shake = 0.3;
    // 剛重生或距離太遠就直接跳過去,否則交給 netTick 慢慢補間
    if (dead > 0 || e.dead > 0 || Math.hypot(x - e.x, y - e.y) > 150) {
      e.x = x;
      e.y = y;
    }
    e.nx = x;
    e.ny = y;
    if (i !== G.me) e.ang = ang;
    Object.assign(e, { hp, max, dead, invis, shield, haste, slow, rapid, hitT, cubes, sup, acd, rcd });
  });
  G.bul = s.b.map(([x, y, r, o, sup, a, sp]) => ({ x, y, r, o, sup, a, sp }));
  const [bx, by, bvx, bvy] = s.ball;
  Object.assign(G.ball, { nx: bx, ny: by, vx: bvx, vy: bvy });
  if (Math.hypot(bx - G.ball.x, by - G.ball.y) > 200) Object.assign(G.ball, { x: bx, y: by });
  G.mines = s.m.map(([x, y, o, t, arm]) => ({ x, y, o, t, arm }));
  G.clouds = s.c.map(([x, y, r, heal, t]) => ({ x, y, r, heal, t }));
  G.turrets = s.tu.map(([x, y, a, hp, max, o, hit]) => ({ x, y, a, hp, max, o, hit }));
  G.gems = s.g.map(([x, y, age, cube]) => ({ x, y, age, cube }));
  G.parts = s.p;
  for (const [k, x, y] of s.fx || []) sfxPlay(k, x === null ? undefined : x, y === null ? undefined : y);
  for (let i = walls.length - 1; i >= 0; i--) if (walls[i].tmp) walls.splice(i, 1);
  for (const [x, y, w, h, t] of s.w) walls.push({ x, y, w, h, t, tmp: 1 });
}
// 非房主每一幀:預測自己、補間其他人、讓子彈和特效繼續動
function clientFrame(dt) {
  const k = 1 - Math.exp(-dt * 12);
  G.t = Math.max(0, G.t - dt);
  G.shake = Math.max(0, G.shake - dt);
  G.ents.forEach((e, i) => {
    if (e.nx === undefined) return;
    if (i === G.me && !e.dead) {
      const inp = room.inp;
      move(e, inp.mx, inp.my, dt, e.c.sp * (e.haste > 0 ? 1.5 : 1) * e.mods.spd * (e.slow > 0 ? 0.5 : 1));
      if (inp.fire)
        e.ang =
          inp.tx !== null && inp.tx !== undefined ? Math.atan2(inp.ty - e.y, inp.tx - e.x) : inp.aim;
      const c = 1 - Math.exp(-dt * 4); // 自己的位置慢慢對齊房主
      e.x += (e.nx - e.x) * c;
      e.y += (e.ny - e.y) * c;
    } else {
      e.x += (e.nx - e.x) * k;
      e.y += (e.ny - e.y) * k;
    }
  });
  const bl = G.ball;
  if (bl.nx !== undefined) {
    const fr = Math.pow(0.25, dt);
    bl.x += bl.vx * dt;
    bl.y += bl.vy * dt;
    bl.vx *= fr;
    bl.vy *= fr;
    bl.x += (bl.nx - bl.x) * k;
    bl.y += (bl.ny - bl.y) * k;
  }
  for (const b of G.bul) {
    b.x += Math.cos(b.a) * b.sp * dt;
    b.y += Math.sin(b.a) * b.sp * dt;
  }
  for (const q of G.parts) q.t -= dt;
  G.parts = G.parts.filter((q) => q.t > 0);
}
// 非房主收到開賽資料:照房主的陣容建立比賽
function buildFromInit(m) {
  const myId = Net.myId();
  const ents = m.ents.map(([ci, tm, role, pid, pname, skin, x, y], i) =>
    mk(
      i,
      x,
      y,
      ci,
      tm,
      role,
      pid
        ? { id: pid, name: pname, loadout: pid === myId ? myLoadout() : { skin } }
        : null,
    ),
  );
  for (let i = walls.length - 1; i >= 0; i--) if (walls[i].tmp) walls.splice(i, 1);
  G = makeG(ents);
}

// ── 比賽流程 ──
function enterMatch() {
  room.inMatch = true;
  room.seen = {};
  room.snapSeen = -1;
  [ui, roomScr].forEach((el) => (el.style.display = "none"));
  detailOn = false;
  leaveHome();
  mouse.down = false;
  syncProfile();
}
// 房主按「開始比賽」
function hostStartMatch() {
  if (!PR || !PR.isHost()) return;
  const ps = PlayroomNet.players();
  reset(ps);
  room.matchId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  room.resultSent = false;
  room.wasHost = true;
  PR.setState("result", null, true);
  PR.setState(
    "match",
    {
      id: room.matchId,
      ents: G.ents.map((e) => [
        CH.indexOf(e.c),
        e.tm,
        e.role,
        e.pid,
        e.pname,
        e.pid ? ps.find((p) => p.id === e.pid).loadout.skin || null : null,
        e.sx,
        e.sy,
      ]),
    },
    true,
  );
  enterMatch();
}
// 比賽取消(房主離開)
function abortMatch(msg) {
  room.inMatch = false;
  if (G) G.over = true;
  room.note = msg;
  showRoom();
}
// 有人離開:房主把他的角色交給電腦
function onPlayerQuit(id) {
  if (G && room.inMatch && PR.isHost()) {
    const e = G.ents.find((e) => e.pid === id);
    if (e) e.ctrl = "ai";
  }
  if (roomScr.style.display !== "none") roomUI();
}

const PlayroomNet = {
  name: "playroom",
  isHost: () => PR.isHost(),
  myId: () => PR.myPlayer().id,
  players: () =>
    roomPlayers().map(({ pl, prof }) => ({
      id: pl.id,
      name: prof.name,
      ci: prof.ci,
      loadout: prof.loadout,
    })),
  // 房主:自己的輸入直接讀本機,其他人讀他們送來的 inp
  collectInputs() {
    const out = {},
      myId = PlayroomNet.myId();
    for (const pl of room.players) {
      if (pl.id === myId) {
        out[pl.id] = readLocalInput();
        continue;
      }
      const r = pl.getState("inp");
      if (!r) continue;
      const last = room.seen[pl.id] || (room.seen[pl.id] = { s: r.s, a: r.a, r: r.r });
      out[pl.id] = {
        mx: r.mx,
        my: r.my,
        fire: !!r.f,
        tx: r.tx,
        ty: r.ty,
        aim: r.aim,
        aimD: r.d,
        autoAim: !!r.au,
        sup: r.s !== last.s,
        ab: r.a !== last.a,
        roll: r.r !== last.r,
      };
      last.s = r.s;
      last.a = r.a;
      last.r = r.r;
    }
    return out;
  },
  // 非房主:按鍵變成計數器,每秒送 inputHz 次(有按鍵時立刻送)
  sendInput(inp) {
    room.inp = inp;
    if (!roomOn()) return;
    const edge = inp.sup || inp.ab || inp.roll;
    if (inp.sup) room.cnt.s++;
    if (inp.ab) room.cnt.a++;
    if (inp.roll) room.cnt.r++;
    const now = performance.now();
    if (!edge && now - room.sendT < 1000 / PLAYROOM.inputHz) return;
    room.sendT = now;
    PR.myPlayer().setState(
      "inp",
      {
        mx: r2(inp.mx),
        my: r2(inp.my),
        f: inp.fire ? 1 : 0,
        tx: inp.tx === null ? null : r1(inp.tx),
        ty: inp.ty === null ? null : r1(inp.ty),
        aim: r3(inp.aim),
        d: r1(inp.aimD),
        au: inp.autoAim ? 1 : 0,
        s: room.cnt.s,
        a: room.cnt.a,
        r: room.cnt.r,
      },
      false,
    );
  },
  // 房主:比賽結束送結果(可靠),平常每秒送 snapHz 次快照
  publish(G) {
    if (!roomOn()) return;
    if (G.over && !room.resultSent) {
      room.resultSent = true;
      room.inMatch = false;
      PR.setState("snap", packSnap(G), false);
      PR.setState("result", { id: room.matchId, score: G.score }, true);
      return;
    }
    const now = performance.now();
    if (now - room.pubT < 1000 / PLAYROOM.snapHz) return;
    room.pubT = now;
    PR.setState("snap", packSnap(G), false);
  },
  // 每一幀(房主和其他人都跑):開賽、快照、結果、換房主、表情、玩家資料
  tick(dt) {
    if (!roomOn()) return;
    const host = PR.isHost();
    if (host && PR.getState("hostId") !== PR.myPlayer().id) PR.setState("hostId", PR.myPlayer().id, true);
    // 非房主:看到新的比賽就加入(要在房間畫面、而且陣容裡有自己)
    const m = PR.getState("match");
    if (m && m.id !== room.matchId && !host) {
      room.matchId = m.id;
      if (m.ents.some((a) => a[3] === PlayroomNet.myId()) && roomScr.style.display !== "none") {
        room.wasHost = false;
        buildFromInit(m);
        enterMatch();
      } else room.note = "比賽進行中,下一場就能一起玩!";
    }
    if (room.inMatch && G && !G.over) {
      if (!room.wasHost && host) {
        // 原本的房主離開,我被換成房主:這場取消
        PR.setState("result", { id: room.matchId, aborted: 1 }, true);
        abortMatch("房主離開了,這場比賽取消。");
      } else if (!host) {
        const s = PR.getState("snap");
        if (s && s.id === room.matchId && s.n !== room.snapSeen) {
          room.snapSeen = s.n;
          applySnap(s);
        }
        clientFrame(dt);
        const r = PR.getState("result");
        if (r && r.id === room.matchId) {
          if (r.aborted) abortMatch("房主離開了,這場比賽取消。");
          else {
            room.inMatch = false;
            G.score = r.score;
            G.over = true;
            const me = G.ents[G.me];
            const sm = G.score[me.tm],
              so = G.score[1 - me.tm];
            onMatchEnd(sm > so ? "win" : sm === so ? "tie" : "lose");
          }
        }
      }
    }
    emoTick(dt);
    room.profT += dt;
    if (room.profT > 0.5) {
      room.profT = 0;
      syncProfile();
      if (roomScr.style.display !== "none") roomUI();
    }
  },
};
