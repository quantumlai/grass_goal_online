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

// ── 遊戲裡加減金幣、能量、通行卷都走這些函式 ──
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
function addPasses(n) {
  if (n <= 0) return;
  P.passes += n;
  if (econ.online) econPush({ t: "credit", c: "pass", n });
  econAfterChange();
}
// 用掉 1 張通行卷(開始一場足球比賽時)
function spendPass() {
  if (P.passes < 1) return false;
  P.passes -= 1;
  if (econ.online) econPush({ t: "debit", c: "pass", n: 1 });
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
    acct.bal = { money, energy: P.energy, passes: P.passes };
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
  if (op.t === "store") {
    // 玩家儲存空間(頭像);公開資料,之後排行榜也能顯示別人的頭像
    return withSession((s) => llStorageSet(s, [{ key: op.key, value: op.v, is_public: true, order: 1 }]));
  }
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
  P.passes = amt(econCur.pass) + pend("pass");
  econAfterChange();
  econUI();
}

// ── 登入、登出 ──
// 重新打開網頁、還有記住的登入時:先用上次的餘額顯示,等同步完成再更新
function econUseCached() {
  econ.guest = { money, energy: P.energy, passes: P.passes };
  econ.online = true;
  econQLoad();
  money = (acct.bal && acct.bal.money) || 0;
  P.energy = (acct.bal && acct.bal.energy) || 0;
  P.passes = (acct.bal && acct.bal.passes) || 0;
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
      ce = find(ECON.energy),
      cp = find(ECON.pass);
    if (!cc || !ce || !cp) {
      const missing = [!cc && ECON.coins, !ce && ECON.energy, !cp && ECON.pass].filter(Boolean).join("、");
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
    econCur = { coins: cc.id, energy: ce.id, pass: cp.id };
    const noWrite = [cc, ce, cp].filter((c) => c.game_api_writes_enabled === false).map((c) => c.code);
    if (noWrite.length) econ.warn = "貨幣 " + noWrite.join("、") + " 還沒開啟 Game API 寫入,金幣、能量、通行卷無法存進帳號。";
    if (!acct.walletId) {
      try {
        acct.walletId = (await withSession((s) => llWalletByHolder(s, acct.playerUlid))).id;
      } catch (e) {
        if (e.status !== 404) throw e;
        acct.walletId = (await withSession((s) => llCreateWallet(s, acct.playerUlid))).wallet_id;
      }
      store.set(ACCT_KEY, acct);
    }
    // 轉入裝置上的金幣、能量、通行卷(放進佇列,轉成功之前不會遺失)
    const g = econ.online ? econ.guest : { money, energy: P.energy, passes: P.passes };
    if (!econ.online) econQLoad();
    if (g.money > 0) econ.queue.push({ t: "credit", c: "coins", n: g.money, guest: 1 });
    if (g.energy > 0) econ.queue.push({ t: "credit", c: "energy", n: g.energy, guest: 1 });
    if (g.passes > 0) econ.queue.push({ t: "credit", c: "pass", n: g.passes, guest: 1 });
    econQSave();
    const giftCame = P.giftPending; // 這次轉入的通行卷裡包含這台裝置的見面禮
    P.giftPending = false;
    econ.guest = { money: 0, energy: 0, passes: 0 };
    econ.online = true;
    econ.ready = true;
    save();
    await econFlush();
    await econRefresh();
    await passGiftSync(giftCame);
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
    P.passes = econ.guest.passes || 0;
  }
  econ.guest = { money: 0, energy: 0, passes: 0 };
  econ.queue = [];
  save();
  econUI();
}
// 畫面:首頁錢包、我的帳號的同步狀態
function econUI() {
  if (typeof updHome === "function" && home.style.display !== "none") updHome();
  const el = document.getElementById("aMeSync");
  if (!el) return;
  if (acct) document.getElementById("aMeWallet").innerHTML = wealthHTML();
  const n = econ.queue.length;
  el.className = "amsg" + (econ.warn ? " err" : econ.state === "ok" && !n ? " ok" : "");
  el.textContent =
    econ.warn ||
    (econ.state === "sync"
      ? "☁️ 同步中…"
      : n
        ? "☁️ 還有 " + n + " 筆資料等待上傳"
        : econ.state === "ok"
          ? "☁️ 金幣、能量、通行卷、排行榜都已同步"
          : "");
}

// ── 頭像同步 ──
// 帳號裡有頭像就用帳號的(換手機也會跟著);帳號裡還沒有,就把這台裝置的頭像存上去。
// 讀回來的資料一律經過 avClean() 檢查。跟金幣同步分開:金幣那邊出錯也不影響頭像。
async function avatarSync() {
  let remote = null;
  try {
    const r = await withSession((s) => llStorageGet(s));
    const item = (r.payload || []).find((p) => p.key === "avatar");
    if (item) remote = JSON.parse(item.value);
  } catch (e) {
    console.warn("讀取頭像失敗", e.message);
    return;
  }
  if (remote) {
    P.avatar = avClean(remote);
    save();
    updAcctBtn();
    if (typeof syncProfile === "function") syncProfile();
  } else avatarUpload();
}
// 把目前的頭像放進佇列送到帳號(沒登入就只存在這台裝置)
function avatarUpload() {
  if (!acct) return;
  const v = JSON.stringify(myAvatar());
  if (econ.online && econ.ready) {
    // 走佇列:斷線時留著,恢復後補送
    econ.queue = econ.queue.filter((o) => !(o.t === "store" && o.key === "avatar")); // 只留最新的一筆
    econPush({ t: "store", key: "avatar", v });
  } else {
    // 金幣系統還沒準備好(例如後台貨幣設定有問題):直接送
    withSession((s) => llStorageSet(s, [{ key: "avatar", value: v, is_public: true, order: 1 }])).catch((e) =>
      console.warn("頭像上傳失敗", e.message),
    );
  }
}

// ── 通行卷見面禮(每個帳號一次) ──
// 帳號的玩家儲存空間記一個 "pss_gift";沒有這個標記就補 5 張(已經建立帳號的人第一次登入也會拿到)。
// 這次登入剛好把裝置的見面禮轉進來的話,就不再另外送。
const PASS_GIFT = 5;
async function passGiftSync(giftCame) {
  try {
    const r = await withSession((s) => llStorageGet(s));
    if ((r.payload || []).some((p) => p.key === "pss_gift")) return;
    await withSession((s) => llStorageSet(s, [{ key: "pss_gift", value: "1", is_public: false, order: 2 }]));
    if (!giftCame) addPasses(PASS_GIFT);
  } catch (e) {
    console.warn("檢查通行卷見面禮失敗,下次登入再試", e.message);
  }
}
