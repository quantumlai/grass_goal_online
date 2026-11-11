// 存檔、升級、隊伍與單位建立、重置比賽
let trophy = 0,
  money = 0,
  homeOn = true;
const up = {
  hp: 0,
  rate: 0,
  atk: 0,
  spd: 0,
  cdr: 0,
  chg: 0,
  roll: 0,
  resp: 0,
  kick: 0,
};
try {
  const sv = JSON.parse(localStorage.getItem("brawlSave") || "{}");
  money = sv.money || 0;
  trophy = sv.trophy || 0;
  Object.assign(up, sv.up || {});
} catch (err) {}
function save() {
  try {
    localStorage.setItem(
      "brawlSave",
      JSON.stringify({ money, up, trophy }),
    );
  } catch (err) {}
}
let pick = 0;
const RL = ["守", "後", "中", "前"],
  ROLES = ["守門員", "後衛", "中場", "前鋒"];
const nm = (e) =>
  (e.id ? "" : "你·") + e.c.icon + e.c.name + "·" + RL[e.role];
const cols = ["#4cc9f0", "#ff6b6b", "#b5e48c", "#c77dff", "#ffa94d"];
function mk(i, x, y, ci, tm, role) {
  const c = CH[ci];
  return {
    c,
    tm,
    role,
    id: i,
    x,
    y,
    r: c.k === "tank" || c.k === "wall" || c.k === "brute" ? 21 : 16,
    hp: c.hp * (i === 0 ? 1 + 0.1 * up.hp : 1),
    max: c.hp * (i === 0 ? 1 + 0.1 * up.hp : 1),
    ang: 0,
    cd: 0,
    sup: 0,
    gems: 0,
    vx: 0,
    vy: 0,
    haste: 0,
    dash: 0,
    col: c.col,
    ai: { t: 0, tx: x, ty: y },
    dead: 0,
    hitT: 0,
    sx: x,
    sy: y,
  };
}
function reset() {
  const SPW = [
      [90, 500],
      [240, 300],
      [260, 500],
      [240, 700],
      [420, 380],
      [420, 620],
      [580, 500],
    ],
    SL = [0, 1, 1, 1, 2, 2, 3];
  const lu = (t) => {
    const used = new Set(),
      L = [];
    let took = false;
    if (CH[pick].team === t) used.add(pick);
    for (let q = 0; q < SL.length; q++) {
      const r = SL[q];
      if (CH[pick].team === t && CH[pick].role === r && !took) {
        took = true;
        L.push(pick);
        continue;
      }
      const cs = CH.map((c, i) => i).filter(
        (i) => CH[i].team === t && CH[i].role === r && !used.has(i),
      );
      const ci = cs[(Math.random() * cs.length) | 0];
      used.add(ci);
      L.push(ci);
    }
    return L;
  };
  const mkT = (t) =>
    lu(t).map((ci, q) => ({ ci, tm: t, role: SL[q], slot: q }));
  const all0 = mkT(0).concat(mkT(1)),
    me = all0.find((o) => o.ci === pick),
    all = [me, ...all0.filter((o) => o !== me)];
  G = {
    t: 180,
    ents: all.map((o, i) => {
      const q = SPW[o.slot];
      return mk(i, o.tm ? W - q[0] : q[0], q[1], o.ci, o.tm, o.role);
    }),
    bul: [],
    mines: [],
    clouds: [],
    turrets: [],
    gems: [],
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 15, last: null },
    score: [0, 0],
    goalT: 0,
    goalMsg: "",
    goalCol: "#fff",
    parts: [],
    spawn: 3,
    cam: { x: 0, y: 0 },
    over: false,
    shake: 0,
  };
}
function resetOld() {
  const oth = [0, 1, 2, 3, 4, 5, 6, 7]
    .filter((i) => i !== pick)
    .sort(() => Math.random() - 0.5);
  const SPW = [
    [90, 500],
    [240, 400],
    [360, 620],
    [470, 500],
  ];
  const lu = (t) => {
    const L = [];
    for (let r = 0; r < 4; r++) {
      const cs = CH.map((c, i) => i).filter(
        (i) => CH[i].team === t && CH[i].role === r,
      );
      L.push(
        CH[pick].team === t && CH[pick].role === r
          ? pick
          : cs[(Math.random() * cs.length) | 0],
      );
    }
    return L;
  };
  const TA = lu(0).map((ci, r) => ({ ci, tm: 0, role: r })),
    TB = lu(1).map((ci, r) => ({ ci, tm: 1, role: r }));
  const me = (CH[pick].team ? TB : TA)[CH[pick].role];
  const all = [me, ...TA.concat(TB).filter((o) => o !== me)];
  G = {
    t: 180,
    ents: all.map((o, i) => {
      const q = SPW[o.role];
      return mk(i, o.tm ? W - q[0] : q[0], q[1], o.ci, o.tm, o.role);
    }),
    bul: [],
    mines: [],
    clouds: [],
    turrets: [],
    gems: [],
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 15, last: null },
    score: [0, 0],
    goalT: 0,
    goalMsg: "",
    goalCol: "#fff",
    parts: [],
    spawn: 3,
    cam: { x: 0, y: 0 },
    over: false,
    shake: 0,
  };
}
function dropGem(x, y, n) {
  for (let i = 0; i < n; i++)
    G.gems.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 160,
      vy: (Math.random() - 0.5) * 160,
      age: 0,
    });
}
