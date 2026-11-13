// 數學挑戰(正式環境 2 分鐘):題庫(小學三年級上學期)與作答流程
const MATH_SECS = TIMING.mathSecs, // 見 config.js
  CRIT_EVERY = 5, // 連續答對幾題觸發能量暴擊
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
// 單元清單(題型標籤去重複),數學練習時可以只選某些單元
const Q_UNITS = [...new Set(QTYPES.map((t) => t.t))];
// 出一題。units:只從這些單元出題(數學練習用),沒給就全部
function genQ(units) {
  const ok = QTYPES.map((t, i) => (!units || units.includes(t.t) ? i : -1)).filter((i) => i >= 0),
    tw = ok.reduce((s, i) => s + QTYPES[i].w, 0);
  let i;
  do {
    let r = Math.random() * tw;
    i = ok[0];
    for (const j of ok) if ((r -= QTYPES[j].w) <= 0) { i = j; break; }
  } while (i === lastQT && ok.length > 1);
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
// 開始數學挑戰。opts.practice = true 是「數學練習」:不計時、沒有獎勵、可以選單元
// opts.pass = true 是「刷題換通行卷」,進去後選兩種模式:
//   連對模式(M.pass):不計時,連續答對 PASS_STREAK 題換 1 張通行卷,答錯或離開就歸零
//   限時模式(M.timed):MATH_SECS 秒內答對 PASS_TIMED 題換 1 張(就是原本的 2 分鐘數學挑戰,有能量暴擊)
// PASS_TIMED 的估算:一般小朋友(答對率約 8 成、每題約 12 秒)連對 5 題平均要 2 分多鐘,
// 2 分鐘大約答 10 題、對 7~8 題;6 題時約 8 成的機會達標,換卷速度和連對模式差不多。
// 開發環境秒數較短,題數照比例縮小。
const PASS_STREAK = 5,
  PASS_TIMED = Math.max(1, Math.round((6 * MATH_SECS) / 120));
function startMath(opts) {
  const practice = !!(opts && opts.practice === true),
    pass = !!(opts && opts.pass === true);
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
    dbl: practice ? false : P.dbl,
    practice,
    pass,
    timed: false, // 刷題換通行卷的限時模式
    passes: 0, // 這次刷題換到幾張通行卷
    units: null, // 練習時選的單元(null = 全部)
  };
  mathScr.style.display = "flex";
  mathScr.classList.toggle("practice", practice);
  mEl("mIntro").style.display = "flex"; // 先顯示說明頁,按開始才出現題目和鍵盤
  mEl("mPlay").style.display = "none";
  mEl("mRules").style.display = practice ? "none" : "";
  mEl("mUnits").style.display = practice ? "" : "none";
  mEl("mModes").style.display = pass ? "" : "none";
  mEl("mEnd").style.display = "none"; // 練習開始作答後才出現
  mEl("mStart").textContent = practice ? "開始練習" : "準備好了,開始!";
  mEl("mStart").disabled = false;
  if (practice) {
    mEl("mTitle").textContent = "📝 數學練習";
    mEl("mTime").textContent = "練習模式 · 不計時、沒有獎勵";
    mEl("mBar").style.width = "100%";
    mEl("mDbl").style.display = "none";
    buildUnitChips();
    mHud();
    return;
  }
  if (pass) {
    mEl("mTitle").textContent = "🎟️ 刷題換通行卷";
    mEl("mDbl").style.display = M.dbl ? "block" : "none";
    buildPassModes();
    return;
  }
  mEl("mTitle").textContent = "📝 " + durText(MATH_SECS) + "數學挑戰";
  mEl("mTime").textContent = ((MATH_SECS / 60) | 0) + ":" + String(MATH_SECS % 60).padStart(2, "0");
  mEl("mBar").style.width = "100%";
  mEl("mIntro").style.display = "flex";
  mEl("mPlay").style.display = "none";
  mEl("mDbl").style.display = M.dbl ? "block" : "none";
  mHud();
}
function mBegin() {
  if (M.practice) {
    M.units = [...document.querySelectorAll("#mUnits .on")].map((b) => b.dataset.u);
    if (!M.units.length) return; // 至少選一個單元
  }
  M.on = true;
  M.t0 = performance.now();
  mEl("mIntro").style.display = "none";
  mEl("mPlay").style.display = ""; // 版面交給 CSS(橫式手機會改成左右排)
  mNext();
  clearInterval(mTimer);
  if (M.practice || M.pass) {
    mEl("mEnd").style.display = ""; // 練習、刷題不計時,自己按「結束」
    mEl("mEnd").textContent = M.pass ? "結束刷題" : "結束練習";
    return;
  }
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
  mEl("mRight").textContent =
    "✅ " + M.right + (M.timed ? (M.passes ? " 🎟️" : " / " + PASS_TIMED) : "");
  mEl("mCoins").textContent = "💰 " + M.coins;
  mEl("mStreak").textContent = "🔥 " + M.streak;
  if (M.pass) {
    // 上方的進度條改成「連對幾題 / 5」
    const k = M.streak % PASS_STREAK;
    mEl("mTime").textContent = "連對 " + k + " / " + PASS_STREAK + " · 已換 " + M.passes + " 張 🎟️";
    mEl("mBar").style.width = (k / PASS_STREAK) * 100 + "%";
    mEl("mBar").className = "";
  }
}
function mNext() {
  M.cur = genQ(M.practice ? M.units : null);
  M.typed = "";
  M.lock = false;
  mEl("mTag").textContent = M.practice
    ? M.cur.t
    : M.cur.t + " · 答對 +" + M.cur.c * (M.dbl ? 2 : 1) + " 💰";
  mEl("mFx").textContent = "";
  mEl("mFx").className = "";
  mDraw();
}
function mDraw(state) {
  const v = M.typed === "" ? "&nbsp;" : M.typed;
  // 整段題目包在一個 span 裡,多行題目才會照一般文字的順序換行(#mQ 是 flex 置中)
  mEl("mQ").innerHTML =
    '<span class="qtxt">' +
    M.cur.q.replace("□", `<span class="slot${state ? " " + state : ""}">${v}</span>`) +
    "</span>";
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
    if (!M.practice) M.coins += M.cur.c * (M.dbl ? 2 : 1);
    const ci = M.pass || M.timed ? streakCheckIn() : null; // 今天第一次答對:記一天上線
    if (ci) M.checkin = ci;
    const crit = !M.practice && !M.pass && M.streak % CRIT_EVERY === 0;
    if (crit) M.crits++;
    mDraw("ok");
    sfxPlay(!M.practice && M.streak % CRIT_EVERY === 0 ? "crit" : "ding");
    if (M.practice) {
      fx.textContent = M.streak >= 3 ? "答對了!連續 " + M.streak + " 題 🔥" : "答對了!";
      fx.className = "ok";
    } else if (M.pass && M.streak % PASS_STREAK === 0) {
      addPasses(1); // 馬上入帳,就算之後離開也不會不見
      M.passes++;
      fx.textContent = "🎟️ 換到 1 張通行卷!(這次已換 " + M.passes + " 張)";
      fx.className = "crit";
    } else if (M.timed && M.right === PASS_TIMED) {
      addPasses(1); // 達標馬上入帳
      M.passes = 1;
      fx.textContent = "🎟️ 達標!換到 1 張通行卷!" + (crit ? " ⚡ 還觸發能量暴擊!" : "");
      fx.className = "crit";
    } else if (ci) {
      fx.textContent = ci.got
        ? "📅 今天上線了!這一輪第 " + ci.n + " 天,得到 " + ci.got + " 枚 ⭐ 星光代幣!"
        : "📅 今天上線了!這一輪第 " + ci.n + " 天";
      fx.className = ci.got ? "crit" : "ok";
    } else if (crit) {
      fx.textContent = "⚡ 能量暴擊!連續答對 " + M.streak + " 題";
      fx.className = "crit";
    } else {
      fx.textContent = "答對了! +" + M.cur.c * (M.dbl ? 2 : 1) + " 💰";
      fx.className = "ok";
    }
    mHud();
    setTimeout(() => M.on && mNext(), !M.practice && M.streak % CRIT_EVERY === 0 ? 900 : 450);
  } else {
    M.streak = 0;
    sfxPlay("buzz");
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
  mresScr.querySelector("h2").textContent = M.practice ? "📝 練習結束" : M.pass ? "🎟️ 刷題結束" : "⏰ 時間到!";
  const rows = M.practice
    ? [["📝 練習模式", "雖然沒有獎勵，但你超棒！"]]
    : [["💰 答題金幣", "+" + base]];
  if (M.dbl) rows.push(["🃏 雙倍卡 ×2", "+" + base]);
  if (M.pass || (M.timed && M.passes)) rows.push(["🎟️ 換到通行卷(已入帳)", "+" + M.passes]);
  else if (M.timed) rows.push(["🎟️ 通行卷", "還差 " + (PASS_TIMED - M.right) + " 題,再挑戰一次!"]);
  if (M.checkin)
    rows.push(
      M.checkin.got
        ? ["⭐ 上線第 " + M.checkin.n + " 天(已入帳)", "+" + M.checkin.got]
        : ["📅 今天上線了", "這一輪第 " + M.checkin.n + " 天"],
    );
  if (!acct && !M.practice) rows.push(["🏆 排行榜", "登入後成績才會記錄"]);
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
  ok.textContent = M.practice ? "完成" : critPick === null ? "先選暴擊獎勵" : "領取獎勵";
}
mEl("mrOk").onclick = () => {
  if (critPick === null) return;
  if (M.practice) {
    // 練習:不給獎勵、不記錄、不影響「打完比賽要做數學」的規則
    M = null;
    afterMath();
    return;
  }
  addCoins(
    M.coins + (critPick === "coins" ? CRIT_COINS * M.crits * (M.dbl ? 2 : 1) : 0),
  );
  if (critPick === "energy") addEnergy(CRIT_ENERGY * M.crits);
  lbAdd(LB.math, M.right, M.total); // 答對題數、答題數累加到排行榜
  P.dbl = false;
  P.mathPending = false;
  save();
  M = null;
  afterMath(); // 在好友房間就回房間,否則回首頁(room.js)
};

// ── 刷題換通行卷:選模式 ──
function buildPassModes() {
  const el = mEl("mModes");
  el.innerHTML =
    '<button data-m="streak">🔥 連對模式<small>連續答對 ' + PASS_STREAK + " 題換 1 張<br>不計時,可以一直換</small></button>" +
    '<button data-m="timed">⏱️ 限時模式<small>' + durText(MATH_SECS) + "內答對 " + PASS_TIMED + " 題換 1 張<br>答錯不歸零</small></button>";
  el.querySelectorAll("button").forEach((b) => (b.onclick = () => passMode(b.dataset.m)));
  passMode("streak");
}
function passMode(m) {
  M.pass = m === "streak";
  M.timed = !M.pass;
  mEl("mModes")
    .querySelectorAll("button")
    .forEach((b) => b.classList.toggle("on", b.dataset.m === m));
  const common =
    "<li>每答對 1 題得 <b>15~20 金幣</b>(難題 20)</li>" +
    "<li>今天答對 1 題就算<b>上線</b>:7 天裡上線 3、5、7 天得 <b>⭐星光代幣</b></li>";
  if (M.pass) {
    mEl("mRules").innerHTML =
      "<li>連續答對 <b>" + PASS_STREAK + " 題</b>換 <b>1 張 🎟️ 通行卷</b>,馬上入帳</li>" +
      "<li>答錯或離開,連對次數就從 0 開始</li>" +
      common +
      "<li>不計時,刷夠了按「結束」</li>";
    mEl("mStart").textContent = "開始刷題!";
    mHud();
  } else {
    mEl("mRules").innerHTML =
      "<li>" + durText(MATH_SECS) + "內答對 <b>" + PASS_TIMED + " 題</b>換 <b>1 張 🎟️ 通行卷</b>,達標馬上入帳</li>" +
      "<li>答錯不會歸零,把握時間繼續答</li>" +
      "<li>連續答對 " + CRIT_EVERY + " 題觸發 <b>⚡能量暴擊</b></li>" +
      common;
    mEl("mStart").textContent = "準備好了,開始!";
    mEl("mTime").textContent = ((MATH_SECS / 60) | 0) + ":" + String(MATH_SECS % 60).padStart(2, "0");
    mEl("mBar").style.width = "100%";
    mEl("mBar").className = "";
    mHud();
  }
}

// ── 數學練習:選單元 ──
function buildUnitChips() {
  const el = mEl("mUnits");
  el.innerHTML =
    '<p>想練哪些單元?(可以選好幾個)</p><div class="chips">' +
    Q_UNITS.map((u) => '<button class="on" data-u="' + u + '">' + u + "</button>").join("") +
    '</div><div class="chips2"><button data-all="1">全選</button><button data-all="0">全部取消</button></div>';
  el.querySelectorAll("[data-u]").forEach(
    (b) =>
      (b.onclick = () => {
        b.classList.toggle("on");
        unitStartUI();
      }),
  );
  el.querySelectorAll("[data-all]").forEach(
    (b) =>
      (b.onclick = () => {
        el.querySelectorAll("[data-u]").forEach((x) => x.classList.toggle("on", b.dataset.all === "1"));
        unitStartUI();
      }),
  );
  unitStartUI();
}
function unitStartUI() {
  const n = document.querySelectorAll("#mUnits .on").length;
  mEl("mStart").disabled = n === 0;
  mEl("mStart").textContent = n === 0 ? "先選一個單元" : "開始練習";
}
// 說明頁的「返回」:還沒開始作答就離開(沒有任何獎勵,也不扣任何東西)
mEl("mBack").onclick = () => {
  M = null;
  mathScr.style.display = "none";
  afterMath();
};
mEl("mEnd").onclick = () => M && (M.practice || M.pass) && mFinish();
