// 存檔、玩家進度(金幣/能量/代幣/英雄/配件/造型)、加成、隊伍與單位建立、重置比賽
let money = 0, // 金幣
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
// 一開始就能用的英雄:雷雷、磐石、月光、疾風
const START_HEROES = [0, 1, 4, 5];
const HERO_MAXLV = 10,
  UNLOCK_TOKENS = 3; // 解鎖一位英雄或一個造型需要的星光代幣
const lvCost = (l) => 50 + 50 * l; // 從 Lv.l 升到 Lv.l+1 需要的戰力能量
// 武裝配件:一次只能裝備一個,只對你操控的角色有效
const ACCS = [
  { k: "helm", n: "鋼鐵頭盔", ic: "🪖", p: 1000, v: 0.12, col: "#94a3b8", d: "受到的傷害 -12%" },
  { k: "glove", n: "烈焰手套", ic: "🧤", p: 1000, v: 0.12, col: "#ff6b3d", d: "攻擊傷害 +12%" },
  { k: "shoe", n: "疾風跑鞋", ic: "👟", p: 1000, v: 0.1, col: "#4cc9f0", d: "移動速度 +10%" },
  { k: "core", n: "能量核心", ic: "🔋", p: 1000, v: 0.3, col: "#ffd23f", d: "大招充能速度 +30%" },
  { k: "boot", n: "黃金球鞋", ic: "🥇", p: 1000, v: 0.25, col: "#f5c542", d: "踢球力道 +25%" },
  { k: "charm", n: "再生護符", ic: "💚", p: 1000, v: 1, col: "#4ade80", d: "脫離戰鬥 2 秒就開始回血,每秒回 40 血" },
];
// 造型:換掉角色的主色(亮色、暗色),用星光代幣解鎖,每位英雄可以各自套用
const SKINS = [
  { k: "gold", n: "黃金", pal: ["#fff2a8", "#d4a017"] },
  { k: "shadow", n: "暗影", pal: ["#a99bff", "#2b2160"] },
  { k: "lava", n: "熔岩", pal: ["#ffb36b", "#c2261b"] },
  { k: "ice", n: "冰晶", pal: ["#e6fbff", "#5fc8f0"] },
  { k: "candy", n: "糖果", pal: ["#ffd1f0", "#b84fd6"] },
  { k: "jungle", n: "叢林", pal: ["#d7ff9a", "#2f8f3a"] },
];
const P = {
  energy: 0, // 戰力能量
  tokens: 0, // 星光代幣
  vouchers: 0, // 升級券(當日 5 勝獎勵,可免費升一級)
  lv: {}, // 英雄等級 {角色索引: 等級},沒有記錄就是 Lv.1
  unlocked: START_HEROES.slice(),
  acc: [], // 已購買的配件
  accEq: null, // 裝備中的配件
  skins: [], // 已解鎖的造型
  skinEq: {}, // {角色索引: 造型 k}
  mathPending: false, // 打完比賽還沒做數學挑戰
  dbl: false, // 下一場數學挑戰金幣 ×2
  daily: { date: "", wins: 0, m3: false, m5: false },
  pick: 0,
};
try {
  const sv = JSON.parse(localStorage.getItem("brawlSave") || "{}");
  money = sv.money || 0;
  Object.assign(up, sv.up || {});
  if (sv.P) Object.assign(P, sv.P);
} catch (err) {}
function save() {
  P.pick = pick;
  try {
    localStorage.setItem("brawlSave", JSON.stringify({ v: 2, money, up, P }));
  } catch (err) {}
}
const heroLv = (ci) => P.lv[ci] || 1;
const isUnlocked = (ci) => P.unlocked.includes(ci);
const skinOf = (ci) => {
  const s = SKINS.find((s) => s.k === P.skinEq[ci]);
  return s ? s.pal : null;
};
const accVal = (k) => (P.accEq === k ? ACCS.find((a) => a.k === k).v : 0);
// 你操控角色的加成:商店升級 × 英雄等級 × 配件
const myHpMul = () => (1 + 0.1 * up.hp) * (1 + 0.05 * (heroLv(pick) - 1));
const myAtkAdd = () =>
  0.1 * up.atk + 0.05 * (heroLv(pick) - 1) + accVal("glove");
const myDefMul = () => 1 - accVal("helm");
const mySpdMul = () => (1 + 0.05 * up.spd) * (1 + accVal("shoe"));
const myChgMul = () => (1 + 0.15 * up.chg) * (1 + accVal("core"));
const myKickMul = () => (1 + 0.08 * up.kick) * (1 + accVal("boot"));
let pick = isUnlocked(P.pick) ? P.pick : P.unlocked[0];
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
    hp: c.hp * (i === 0 ? myHpMul() : 1),
    max: c.hp * (i === 0 ? myHpMul() : 1),
    skin: i === 0 ? skinOf(ci) : null,
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
