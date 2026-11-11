// 經濟系統(金幣 CIN、戰力能量 PPT)與排行榜同步(LootLocker)
//
// - 沒登入:金幣和能量只存在這台裝置(money、P.energy)。
// - 登入:把裝置上累積的金幣和能量轉進帳號錢包,之後 money、P.energy 顯示錢包餘額。
//   每次登入都會把裝置上的那份轉進去,所以沒登入時賺的也不會不見。
// - 所有交易和排行榜更新先放進佇列(存在 localStorage),依序送出;
//   連不上網路就留著,下次同步時補送。
// - 排行榜只記錄有登入的玩家。
const ECON = LL.currencies,
  LB = LL.leaderboards;
let econCur = null, // { coins: 貨幣 id, energy: 貨幣 id }
  econFlushing = false,
  econRetry = 0;
const econQKey = () => "brawlEconQueue_" + ENV_NAME + "_" + (acct ? acct.email : "");
function econQSave() {
  try {
    localStorage.setItem(econQKey(), JSON.stringify(econ.queue));
  } catch (e) {}
}
function econQLoad() {
  try {
    econ.queue = JSON.parse(localStorage.getItem(econQKey()) || "[]");
  } catch (e) {
    econ.queue = [];
  }
}
function econPush(op) {
  econ.queue.push(op);
  econQSave();
  econFlush();
}

// ── 遊戲裡加減金幣、能量都走這四個函式 ──
function addCoins(n) {
  if (n <= 0) return;
  money += n;
  if (econ.online) econPush({ t: "credit", c: "coins", n });
  econAfterChange();
}
function addEnergy(n) {
  if (n <= 0) return;
  P.energy += n;
  if (econ.online) econPush({ t: "credit", c: "energy", n });
  econAfterChange();
}
function spendCoins(n) {
  if (money < n) return false;
  money -= n;
  if (econ.online) econPush({ t: "debit", c: "coins", n });
  econAfterChange();
  return true;
}
function spendEnergy(n) {
  if (P.energy < n) return false;
  P.energy -= n;
  if (econ.online) econPush({ t: "debit", c: "energy", n });
  econAfterChange();
  return true;
}
// 排行榜累加:score 加 ds,metadata(數字)加 dm
function lbAdd(key, ds, dm) {
  if (!econ.online) return;
  econPush({ t: "lb", key, s: ds, m: dm });
}
function econAfterChange() {
  if (econ.online && acct) {
    acct.bal = { money, energy: P.energy };
    store.set(ACCT_KEY, acct);
  }
  save();
}

// ── 送出 ──
// session 過期時用記住的 token 重開一個,再試一次
async function withSession(fn) {
  try {
    return await fn(acct.session);
  } catch (e) {
    if (e.status !== 401 && e.status !== 403) throw e;
    const s = await llStartSession(acct.email, acct.wlToken);
    acct.session = s.session_token;
    store.set(ACCT_KEY, acct);
    return await fn(acct.session);
  }
}
async function econRun(op) {
  if (op.t === "credit" || op.t === "debit") {
    const f = op.t === "credit" ? llCredit : llDebit;
    return withSession((s) => f(s, acct.walletId, econCur[op.c], op.n));
  }
  if (op.t === "lb") {
    const member = String(acct.playerId);
    let cur = null;
    try {
      cur = await withSession((s) => llLbMember(s, op.key, member));
    } catch (e) {
      if (e.status === 0) throw e; // 網路問題:整筆留到下次
      // 其他錯誤(例如還沒有這位玩家的紀錄)當作從 0 開始
    }
    const score = ((cur && cur.score) || 0) + op.s,
      meta = (parseInt(cur && cur.metadata, 10) || 0) + op.m;
    return withSession((s) => llLbSubmit(s, op.key, member, score, String(meta)));
  }
}
async function econFlush() {
  if (econFlushing || !econ.online || !econ.ready || !acct) return;
  econFlushing = true;
  let resync = false;
  while (econ.queue.length) {
    const op = econ.queue[0];
    try {
      await econRun(op);
    } catch (e) {
      if (e.status === 0) {
        // 連不上:30 秒後再試
        clearTimeout(econRetry);
        econRetry = setTimeout(econFlush, 30000);
        break;
      }
      // 伺服器拒絕(例如餘額不足、沒開 Game API 寫入):丟掉這筆,之後以伺服器餘額為準
      console.warn("LootLocker 拒絕了一筆更新", op, e.message);
      econ.warn = "有一筆更新被伺服器拒絕:" + e.message;
      resync = op.t !== "lb";
    }
    econ.queue.shift();
    econQSave();
  }
  econFlushing = false;
  if (resync) await econRefresh();
  econUI();
}
// 讀錢包餘額;還在佇列裡的交易也算進去,畫面才不會跳動
async function econRefresh() {
  if (!econ.ready) return;
  const r = await withSession((s) => llBalances(s, acct.walletId));
  const amt = (id) => {
    const b = (r.balances || []).find((b) => b.currency && b.currency.id === id);
    return b ? parseInt(b.amount, 10) || 0 : 0;
  };
  const pend = (c) =>
    econ.queue
      .filter((o) => o.c === c)
      .reduce((s, o) => s + (o.t === "credit" ? o.n : -o.n), 0);
  money = amt(econCur.coins) + pend("coins");
  P.energy = amt(econCur.energy) + pend("energy");
  econAfterChange();
  econUI();
}

// ── 登入、登出 ──
// 重新打開網頁、還有記住的登入時:先用上次的餘額顯示,等同步完成再更新
function econUseCached() {
  econ.guest = { money, energy: P.energy };
  econ.online = true;
  econQLoad();
  money = (acct.bal && acct.bal.money) || 0;
  P.energy = (acct.bal && acct.bal.energy) || 0;
}
// 登入成功後呼叫:找貨幣與錢包 → 轉入裝置上的金幣能量 → 送出佇列 → 讀餘額
async function econSync() {
  econ.state = "sync";
  econ.warn = "";
  econUI();
  try {
    const list = (await withSession((s) => llCurrencies(s))).currencies || [];
    // 代碼比對不分大小寫、忽略前後空白
    const norm = (c) => String(c || "").trim().toUpperCase();
    const find = (code) => list.find((c) => norm(c.code) === norm(code));
    const cc = find(ECON.coins),
      ce = find(ECON.energy);
    if (!cc || !ce) {
      const missing = [!cc && ECON.coins, !ce && ECON.energy].filter(Boolean).join("、");
      const got = list.map((c) => c.code + (c.published === false ? "(未發佈)" : "")).join("、");
      console.warn("LootLocker 回傳的貨幣:", list);
      throw new LLError(
        -1,
        "LootLocker 找不到貨幣 " +
          missing +
          "。目前" +
          ENV.name +
          "讀到的貨幣:" +
          (got || "沒有任何貨幣") +
          "。請到 LootLocker 後台確認貨幣已發佈(Publish),而且建立在 game key(" +
          LL.gameKey.split("_")[0] +
          "_ 開頭)對應的環境。",
      );
    }
    econCur = { coins: cc.id, energy: ce.id };
    const noWrite = [cc, ce].filter((c) => c.game_api_writes_enabled === false).map((c) => c.code);
    if (noWrite.length) econ.warn = "貨幣 " + noWrite.join("、") + " 還沒開啟 Game API 寫入,金幣能量無法存進帳號。";
    if (!acct.walletId) {
      try {
        acct.walletId = (await withSession((s) => llWalletByHolder(s, acct.playerUlid))).id;
      } catch (e) {
        if (e.status !== 404) throw e;
        acct.walletId = (await withSession((s) => llCreateWallet(s, acct.playerUlid))).wallet_id;
      }
      store.set(ACCT_KEY, acct);
    }
    // 轉入裝置上的金幣和能量(放進佇列,轉成功之前不會遺失)
    const g = econ.online ? econ.guest : { money, energy: P.energy };
    if (!econ.online) econQLoad();
    if (g.money > 0) econ.queue.push({ t: "credit", c: "coins", n: g.money, guest: 1 });
    if (g.energy > 0) econ.queue.push({ t: "credit", c: "energy", n: g.energy, guest: 1 });
    econQSave();
    econ.guest = { money: 0, energy: 0 };
    econ.online = true;
    econ.ready = true;
    save();
    await econFlush();
    await econRefresh();
    econ.state = "ok";
  } catch (e) {
    econ.state = "err";
    econ.warn =
      e.status === 0 ? "連不上伺服器,稍後會自動再同步。" : e.status === -1 ? e.message : llErrorText(e);
    if (e.status === 0) {
      clearTimeout(econRetry);
      econRetry = setTimeout(() => acct && econSync(), 30000);
    }
  }
  econUI();
}
// 登出:改回裝置上的那份(登入期間是 0,或是同步失敗時保留的原值)
function econLogout() {
  clearTimeout(econRetry);
  const wasOnline = econ.online;
  econ.online = false;
  econ.ready = false;
  econ.state = "";
  econ.warn = "";
  econCur = null;
  if (wasOnline) {
    money = econ.guest.money;
    P.energy = econ.guest.energy;
  }
  econ.guest = { money: 0, energy: 0 };
  econ.queue = [];
  save();
  econUI();
}
// 畫面:首頁錢包、我的帳號的同步狀態
function econUI() {
  if (typeof updHome === "function" && home.style.display !== "none") updHome();
  const el = document.getElementById("aMeSync");
  if (!el) return;
  if (acct) document.getElementById("aMeWallet").textContent = wallet("ce");
  const n = econ.queue.length;
  el.className = "amsg" + (econ.warn ? " err" : econ.state === "ok" && !n ? " ok" : "");
  el.textContent =
    econ.warn ||
    (econ.state === "sync"
      ? "☁️ 同步中…"
      : n
        ? "☁️ 還有 " + n + " 筆資料等待上傳"
        : econ.state === "ok"
          ? "☁️ 金幣、能量、排行榜都已同步"
          : "");
}
