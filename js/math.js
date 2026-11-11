// 2 分鐘數學挑戰:題庫(小學三年級上學期)與作答流程
const MATH_SECS = 120,
  CRIT_EVERY = 5, // 連續答對幾題觸發能量暴擊
  TOKEN_AT = 12, // 單次答對幾題得到星光代幣
  CRIT_ENERGY = 30,
  CRIT_COINS = 50;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = (a) => a[(Math.random() * a.length) | 0];
// 分數用直式顯示:fr("□", 5) → 5 分之 □
const fr = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;

// 題型:t 單元標籤、c 答對金幣(簡單 15、難 20)、w 出題權重
// g() 回傳 { q: 題目 HTML(□ 是要填的空格), a: 正確答案(非負整數) }
const QTYPES = [
  // ── 10000 以內的數 ──
  {
    t: "數的認識",
    c: 15,
    w: 1,
    g() {
      if (Math.random() < 0.5) {
        const d = [rnd(1, 9), rnd(0, 9), rnd(0, 9), rnd(0, 9)];
        const n = +d.join(""),
          i = rnd(0, 3);
        return { q: `${n} 的${["千", "百", "十", "個"][i]}位數字是 □`, a: d[i] };
      }
      const k = rnd(1, 9),
        h = rnd(0, 9),
        o = rnd(1, 9);
      return {
        q: `${k} 個千、${h} 個百和 ${o} 個一<br>合起來是 □`,
        a: k * 1000 + h * 100 + o,
      };
    },
  },
  // ── 加減法 ──
  {
    t: "加法",
    c: 15,
    w: 2,
    g() {
      const a = rnd(100, 799),
        b = rnd(100, 999 - a);
      return { q: `${a} + ${b} = □`, a: a + b };
    },
  },
  {
    t: "減法",
    c: 15,
    w: 2,
    g() {
      const a = rnd(300, 999),
        b = rnd(100, a - 50);
      return { q: `${a} − ${b} = □`, a: a - b };
    },
  },
  {
    t: "四位數加法",
    c: 20,
    w: 1.5,
    g() {
      const a = rnd(1000, 7999),
        b = rnd(100, 9999 - a);
      return { q: `${a} + ${b} = □`, a: a + b };
    },
  },
  {
    t: "四位數減法",
    c: 20,
    w: 1.5,
    g() {
      const a = rnd(2000, 9999),
        b = rnd(100, a - 1000);
      return { q: `${a} − ${b} = □`, a: a - b };
    },
  },
  // ── 乘法 ──
  {
    t: "九九乘法",
    c: 15,
    w: 2,
    g() {
      const a = rnd(2, 9),
        b = rnd(2, 9);
      return { q: `${a} × ${b} = □`, a: a * b };
    },
  },
  {
    t: "二位數乘法",
    c: 20,
    w: 1.5,
    g() {
      const a = rnd(12, 99),
        b = rnd(2, 9);
      return { q: `${a} × ${b} = □`, a: a * b };
    },
  },
  {
    t: "三位數乘法",
    c: 20,
    w: 1,
    g() {
      const a = rnd(101, 999),
        b = rnd(2, 9);
      return { q: `${a} × ${b} = □`, a: a * b };
    },
  },
  // ── 除法 ──
  {
    t: "除法",
    c: 15,
    w: 2,
    g() {
      const b = rnd(2, 9),
        a = rnd(2, 9);
      return { q: `${a * b} ÷ ${b} = □`, a };
    },
  },
  {
    t: "有餘數的除法",
    c: 20,
    w: 1.5,
    g() {
      const b = rnd(3, 9),
        qt = rnd(2, 9),
        r = rnd(1, b - 1),
        n = b * qt + r;
      return Math.random() < 0.5
        ? { q: `${n} ÷ ${b} = □ … ${r}`, a: qt }
        : { q: `${n} ÷ ${b} = ${qt} … □`, a: r };
    },
  },
  // ── 應用題 ──
  {
    t: "應用題",
    c: 15,
    w: 1.5,
    g() {
      const a = rnd(3, 9),
        b = rnd(2, 9),
        it = pickOne(["顆糖果", "枝鉛筆", "張貼紙", "顆彈珠"]),
        u = it[0]; // 量詞
      return Math.random() < 0.5
        ? { q: `每盒有 ${a} ${it},<br>${b} 盒共有 □ ${u}`, a: a * b }
        : { q: `${a * b} ${it}平分給 ${b} 人,<br>每人分到 □ ${u}`, a };
    },
  },
  {
    t: "應用題",
    c: 20,
    w: 1,
    g() {
      const a = rnd(1200, 6000),
        b = rnd(300, 2999);
      return Math.random() < 0.5
        ? { q: `圖書館有 ${a} 本書,<br>又買了 ${b} 本,現在有 □ 本`, a: a + b }
        : { q: `${a + b} 人去看球賽,<br>其中 ${b} 人是小孩,大人有 □ 人`, a };
    },
  },
  // ── 長度:公分與毫米 ──
  {
    t: "公分與毫米",
    c: 15,
    w: 1,
    g() {
      const n = rnd(2, 30);
      return Math.random() < 0.5
        ? { q: `${n} 公分 = □ 毫米`, a: n * 10 }
        : { q: `${n * 10} 毫米 = □ 公分`, a: n };
    },
  },
  {
    t: "公分與毫米",
    c: 20,
    w: 1,
    g() {
      const a = rnd(2, 25),
        b = rnd(1, 9);
      return Math.random() < 0.5
        ? { q: `${a} 公分 ${b} 毫米 = □ 毫米`, a: a * 10 + b }
        : { q: `${a * 10 + b} 毫米 = ${a} 公分 □ 毫米`, a: b };
    },
  },
  // ── 時間:時、分、秒 ──
  {
    t: "時間",
    c: 20,
    w: 1.5,
    g() {
      const h = rnd(1, 3),
        m = rnd(1, 11) * 5,
        s = rnd(1, 11) * 5;
      return pickOne([
        { q: `${h} 時 ${m} 分 = □ 分`, a: h * 60 + m },
        { q: `${h * 60 + m} 分 = ${h} 時 □ 分`, a: m },
        { q: `1 分 ${s} 秒 = □ 秒`, a: 60 + s },
        { q: `${h} 時 = □ 分`, a: h * 60 },
      ]);
    },
  },
  // ── 分數 ──
  {
    t: "分數",
    c: 15,
    w: 1,
    g() {
      const d = rnd(3, 9),
        n = rnd(1, d - 1);
      return pickOne([
        { q: `1 個蛋糕平分成 ${d} 塊,<br>${n} 塊是 ${fr("□", d)} 個`, a: n },
        { q: `1 個披薩 = ${fr("□", d)} 個`, a: d },
        { q: `${fr(n, d)} 是 □ 個 ${fr(1, d)}`, a: n },
      ]);
    },
  },
];
const QW = QTYPES.reduce((s, t) => s + t.w, 0);
let lastQT = -1;
function genQ() {
  let i;
  do {
    let r = Math.random() * QW;
    i = 0;
    while ((r -= QTYPES[i].w) > 0) i++;
  } while (i === lastQT);
  lastQT = i;
  const t = QTYPES[i];
  return Object.assign({ t: t.t, c: t.c }, t.g());
}

// ── 作答流程 ──
const mEl = (id) => document.getElementById(id);
const mathScr = mEl("math"),
  mresScr = mEl("mres");
let M = null,
  mTimer = 0;
function startMath() {
  homeOn = true; // 讓遊戲輸入不攔截觸控
  [home, ui, shopScr, sdetail, roster, detail, mresScr].forEach(
    (el) => (el.style.display = "none"),
  );
  detailOn = false;
  M = {
    on: false,
    t0: 0,
    left: MATH_SECS,
    right: 0,
    total: 0,
    coins: 0,
    streak: 0,
    crits: 0,
    wrong: [],
    cur: null,
    typed: "",
    lock: false,
    dbl: P.dbl,
  };
  mathScr.style.display = "flex";
  mEl("mIntro").style.display = "flex";
  mEl("mPlay").style.display = "none";
  mEl("mDbl").style.display = M.dbl ? "block" : "none";
  mHud();
}
function mBegin() {
  M.on = true;
  M.t0 = performance.now();
  mEl("mIntro").style.display = "none";
  mEl("mPlay").style.display = "flex";
  mNext();
  clearInterval(mTimer);
  mTimer = setInterval(mTick, 200);
  mTick();
}
function mTick() {
  M.left = Math.max(0, MATH_SECS - (performance.now() - M.t0) / 1000);
  const s = Math.ceil(M.left);
  mEl("mTime").textContent = ((s / 60) | 0) + ":" + String(s % 60).padStart(2, "0");
  mEl("mBar").style.width = (M.left / MATH_SECS) * 100 + "%";
  mEl("mBar").className = M.left < 20 ? "low" : "";
  if (M.left <= 0) mFinish();
}
function mHud() {
  mEl("mRight").textContent = "✅ " + M.right;
  mEl("mCoins").textContent = "💰 " + M.coins;
  mEl("mStreak").textContent = "🔥 " + M.streak;
}
function mNext() {
  M.cur = genQ();
  M.typed = "";
  M.lock = false;
  mEl("mTag").textContent = M.cur.t + " · 答對 +" + M.cur.c * (M.dbl ? 2 : 1) + " 💰";
  mEl("mFx").textContent = "";
  mEl("mFx").className = "";
  mDraw();
}
function mDraw(state) {
  const v = M.typed === "" ? "&nbsp;" : M.typed;
  mEl("mQ").innerHTML = M.cur.q.replace(
    "□",
    `<span class="slot${state ? " " + state : ""}">${v}</span>`,
  );
}
function mKey(k) {
  if (!M || !M.on || M.lock) return;
  if (k === "del") M.typed = M.typed.slice(0, -1);
  else if (k === "ok") return mSubmit();
  else if (M.typed.length < 5) M.typed = (M.typed === "0" ? "" : M.typed) + k;
  mDraw();
}
function mSubmit() {
  if (M.typed === "") return;
  M.lock = true;
  M.total++;
  const fx = mEl("mFx");
  if (+M.typed === M.cur.a) {
    M.right++;
    M.streak++;
    M.coins += M.cur.c * (M.dbl ? 2 : 1);
    mDraw("ok");
    if (M.streak % CRIT_EVERY === 0) {
      M.crits++;
      fx.textContent = "⚡ 能量暴擊!連續答對 " + M.streak + " 題";
      fx.className = "crit";
    } else {
      fx.textContent = "答對了! +" + M.cur.c * (M.dbl ? 2 : 1) + " 💰";
      fx.className = "ok";
    }
    mHud();
    setTimeout(() => M.on && mNext(), M.streak % CRIT_EVERY === 0 ? 900 : 450);
  } else {
    M.streak = 0;
    M.wrong.push({ q: M.cur.q, a: M.cur.a, you: M.typed });
    mDraw("bad");
    fx.innerHTML = "正確答案是 <b>" + M.cur.a + "</b>";
    fx.className = "bad";
    mHud();
    setTimeout(() => M.on && mNext(), 1500);
  }
}
// 數字鍵盤
(() => {
  const pad = mEl("mPad");
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"].forEach((k) => {
    const b = document.createElement("button");
    b.textContent = k === "del" ? "⌫" : k === "ok" ? "✔" : k;
    b.className = k === "ok" ? "ok" : k === "del" ? "del" : "";
    b.setAttribute("aria-label", k === "del" ? "刪除" : k === "ok" ? "確定" : k);
    b.onclick = () => mKey(k);
    pad.appendChild(b);
  });
})();
addEventListener("keydown", (e) => {
  if (!M || !M.on) return;
  if (/^[0-9]$/.test(e.key)) mKey(e.key);
  else if (e.key === "Backspace") mKey("del");
  else if (e.key === "Enter") mKey("ok");
  else return;
  e.preventDefault();
});
mEl("mStart").onclick = mBegin;

// ── 結算 ──
let critPick = null;
function mFinish() {
  clearInterval(mTimer);
  M.on = false;
  mathScr.style.display = "none";
  mresScr.style.display = "flex";
  mresScr.scrollTop = 0;
  critPick = M.crits ? null : "none";
  const base = M.dbl ? M.coins / 2 : M.coins;
  mEl("mrBig").innerHTML =
    "<b>" + M.right + "</b><small>答對題數(共作答 " + M.total + " 題)</small>";
  const rows = [["💰 答題金幣", "+" + base]];
  if (M.dbl) rows.push(["🃏 雙倍卡 ×2", "+" + base]);
  rows.push(
    M.right >= TOKEN_AT
      ? ["⭐ 星光代幣(答對 " + TOKEN_AT + " 題以上)", "+1"]
      : ["⭐ 星光代幣", "再答對 " + (TOKEN_AT - M.right) + " 題就能拿到"],
  );
  if (!acct) rows.push(["🏆 排行榜", "登入後成績才會記錄"]);
  mEl("mrList").innerHTML = rows
    .map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`)
    .join("");
  mCritUI();
  mEl("mrWrong").innerHTML = M.wrong.length
    ? "<h3>📖 再看一次答錯的題目</h3>" +
      M.wrong
        .slice(0, 8)
        .map(
          (w) =>
            `<div class="wq">${w.q.replace("□", `<span class="slot ok">${w.a}</span>`)}<small>你寫的是 ${w.you}</small></div>`,
        )
        .join("")
    : M.total
      ? "<h3>🎉 全部答對,太厲害了!</h3>"
      : "";
}
function mCritUI() {
  const el = mEl("mrCrit");
  if (!M.crits) {
    el.innerHTML = "";
  } else {
    const n = M.crits,
      cc = CRIT_COINS * n * (M.dbl ? 2 : 1);
    el.innerHTML =
      `<h3>⚡ 能量暴擊 ×${n}!選一種獎勵:</h3>` +
      `<div class="cpick"><button data-k="energy" class="${critPick === "energy" ? "on" : ""}">⚡ 戰力能量 +${CRIT_ENERGY * n}</button>` +
      `<button data-k="coins" class="${critPick === "coins" ? "on" : ""}">💰 金幣 +${cc}</button></div>`;
    el.querySelectorAll("button").forEach(
      (b) =>
        (b.onclick = () => {
          critPick = b.dataset.k;
          mCritUI();
        }),
    );
  }
  const ok = mEl("mrOk");
  ok.disabled = critPick === null;
  ok.textContent = critPick === null ? "先選暴擊獎勵" : "領取獎勵";
}
mEl("mrOk").onclick = () => {
  if (critPick === null) return;
  addCoins(
    M.coins + (critPick === "coins" ? CRIT_COINS * M.crits * (M.dbl ? 2 : 1) : 0),
  );
  if (critPick === "energy") addEnergy(CRIT_ENERGY * M.crits);
  lbAdd(LB.math, M.right, M.total); // 答對題數、答題數累加到排行榜
  if (M.right >= TOKEN_AT) P.tokens++;
  P.dbl = false;
  P.mathPending = false;
  save();
  M = null;
  showHome();
};
