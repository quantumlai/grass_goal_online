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
// 金幣、能量的來源:沒登入時用這台裝置的(money、P.energy);
// 登入後 money、P.energy 改成顯示 LootLocker 錢包的餘額,裝置上的那份暫存在 econ.guest(見 economy.js)
const econ = {
  online: false, // 目前是否使用帳號錢包
  ready: false, // 貨幣 ID 與錢包 ID 都已取得,可以送出交易
  guest: { money: 0, energy: 0 },
  queue: [], // 還沒送到 LootLocker 的交易與排行榜更新
  state: "", // "" | "sync" | "ok" | "err"
  warn: "",
};
function save() {
  P.pick = pick;
  // 登入期間只把裝置上的那份寫進存檔,避免帳號的錢在登出後被複製到裝置上
  const sv = econ.online
    ? { v: 2, money: econ.guest.money, up, P: { ...P, energy: econ.guest.energy } }
    : { v: 2, money, up, P };
  try {
    localStorage.setItem("brawlSave", JSON.stringify(sv));
  } catch (err) {}
}
const heroLv = (ci) => P.lv[ci] || 1;
const isUnlocked = (ci) => P.unlocked.includes(ci);
const skinOf = (ci) => {
  const s = SKINS.find((s) => s.k === P.skinEq[ci]);
  return s ? s.pal : null;
};
const skinPal = (k) => {
  const s = SKINS.find((s) => s.k === k);
  return s ? s.pal : null;
};

// ── 玩家配置(loadout)與角色加成(mods) ──
// loadout:一位真人玩家帶進比賽的東西,連線時會傳給房主。
//   { up: 商店升級, lv: 英雄等級, acc: 裝備中的配件, skin: 造型 k }
// mods:由 loadout 算出來、掛在角色身上的倍率。電腦角色用 NEUTRAL_MODS(全部不加成)。
function myLoadout() {
  return { up: { ...up }, lv: heroLv(pick), acc: P.accEq, skin: P.skinEq[pick] || null };
}
function makeMods(lo) {
  const u = lo.up || {},
    n = (k) => u[k] || 0,
    lv = lo.lv || 1,
    acc = (k) => (lo.acc === k ? ACCS.find((a) => a.k === k).v : 0);
  return {
    hp: (1 + 0.1 * n("hp")) * (1 + 0.05 * (lv - 1)), // 血量倍率
    atk: 0.1 * n("atk") + 0.05 * (lv - 1) + acc("glove"), // 傷害加成(加在 1 上)
    def: 1 - acc("helm"), // 受到傷害倍率
    spd: (1 + 0.05 * n("spd")) * (1 + acc("shoe")), // 移動速度倍率
    chg: (1 + 0.15 * n("chg")) * (1 + acc("core")), // 大招充能倍率
    kick: (1 + 0.08 * n("kick")) * (1 + acc("boot")), // 踢球力道倍率
    rate: Math.pow(0.92, n("rate")), // 攻擊間隔倍率
    cdr: Math.pow(0.94, n("cdr")), // 超能力冷卻倍率
    roll: Math.pow(0.92, n("roll")), // 翻滾冷卻倍率
    resp: Math.pow(0.85, n("resp")), // 重生時間倍率
    charm: lo.acc === "charm", // 再生護符
  };
}
const NEUTRAL_MODS = makeMods({});
let pick = isUnlocked(P.pick) ? P.pick : P.unlocked[0];
const RL = ["守", "後", "中", "前"],
  ROLES = ["守門員", "後衛", "中場", "前鋒"];
// 角色頭上的名字:自己加「你·」,其他真人玩家加上他的名稱
const nm = (e) =>
  (e.id === G.me ? "你·" : e.pname ? e.pname + "·" : "") +
  e.c.icon +
  e.c.name +
  "·" +
  RL[e.role];
const cols = ["#4cc9f0", "#ff6b6b", "#b5e48c", "#c77dff", "#ffa94d"];
// 建立一個場上角色。pl 是真人玩家({ id, name, ci, loadout }),電腦角色傳 null
function mk(i, x, y, ci, tm, role, pl) {
  const c = CH[ci],
    mods = pl ? makeMods(pl.loadout) : NEUTRAL_MODS;
  return {
    c,
    tm,
    role,
    id: i, // 等於在 G.ents 裡的位置,子彈、地雷用它找回主人
    ctrl: pl ? "human" : "ai",
    pid: pl ? pl.id : null, // 真人玩家 id,用來對應每一幀的輸入
    pname: pl ? pl.name || "" : "",
    mods,
    x,
    y,
    r: c.k === "tank" || c.k === "wall" || c.k === "brute" ? 21 : 16,
    hp: c.hp * mods.hp,
    max: c.hp * mods.hp,
    skin: pl ? skinPal(pl.loadout.skin) : null,
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
// 開一場新比賽。players:這場的真人玩家(最多 4 位),其餘位置由電腦補滿 7 對 7。
// 每位真人依所選英雄決定隊伍,優先坐英雄本來的位置;同隊同位置已經有人時改坐其他空位。
function reset(players = Net.players()) {
  const SPW = [
      [90, 500],
      [240, 300],
      [260, 500],
      [240, 700],
      [420, 380],
      [420, 620],
      [580, 500],
    ],
    SL = [0, 1, 1, 1, 2, 2, 3]; // 每隊 7 個位置的角色定位:守門員、後衛×3、中場×2、前鋒
  const slots = [];
  for (const t of [0, 1]) {
    const row = SL.map((role, slot) => ({ tm: t, role, slot, ci: null, pl: null })),
      used = new Set();
    for (const pl of players.filter((pl) => CH[pl.ci].team === t)) {
      const s =
        row.find((s) => !s.pl && s.role === CH[pl.ci].role) || row.find((s) => !s.pl);
      if (!s) continue;
      s.pl = pl;
      s.ci = pl.ci;
      used.add(pl.ci);
    }
    for (const s of row) {
      if (s.pl) continue;
      const ofTeam = CH.map((c, i) => i).filter((i) => CH[i].team === t);
      let cs = ofTeam.filter((i) => CH[i].role === s.role && !used.has(i));
      if (!cs.length) cs = ofTeam.filter((i) => !used.has(i));
      if (!cs.length) cs = ofTeam;
      s.ci = cs[(Math.random() * cs.length) | 0];
      used.add(s.ci);
    }
    slots.push(...row);
  }
  // 真人排在最前面(id 0 起),電腦在後
  const all = slots.filter((s) => s.pl).concat(slots.filter((s) => !s.pl));
  G = {
    t: TIMING.matchSecs, // 比賽時間(秒),見 config.js
    ents: all.map((s, i) => {
      const q = SPW[s.slot];
      return mk(i, s.tm ? W - q[0] : q[0], q[1], s.ci, s.tm, s.role, s.pl);
    }),
    me: 0, // 本機玩家操控的角色在 G.ents 的位置
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
  G.me = Math.max(0, G.ents.findIndex((e) => e.pid === Net.myId()));
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
