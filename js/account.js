// 帳號:登入 / 建立帳號 / 忘記密碼 / 我的帳號(登出)
// 裝置上只記住 Email、名稱、玩家 ID 和 LootLocker 發的登入 token,不記住密碼。
const acctScr = document.getElementById("acct"),
  aEl = (id) => document.getElementById(id),
  ACCT_KEY = "brawlAccount_" + ENV_NAME, // 開發、正式環境的帳號分開存
  PEND_KEY = "brawlPendingName_" + ENV_NAME, // 註冊時沒設成功的名稱,第一次登入時補設
  NAME_MIN = 2,
  NAME_MAX = 16,
  EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const store = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem(k) || "null");
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
};
// acct = { email, name, playerId, publicUid, wlToken(記住我), session(遊戲 session) }
let acct = store.get(ACCT_KEY);
if (acct && !acct.wlToken) acct = null; // 舊版只存了 Email 的資料,不算登入
const escHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ── 畫面切換 ──
const VIEWS = {
  aLogin: "登入",
  aForm: "建立帳號",
  aReset: "🔑 忘記密碼",
  aDone: "建立帳號",
  aMe: "我的帳號",
};
function setMsg(id, text, cls) {
  aEl(id).textContent = text || "";
  aEl(id).className = "amsg" + (cls ? " " + cls : "");
}
function view(v) {
  Object.keys(VIEWS).forEach((id) => (aEl(id).style.display = id === v ? "flex" : "none"));
  aEl("aTitle").textContent = VIEWS[v];
  ["aLMsg", "aMsg", "aRMsg", "aMeMsg"].forEach((id) => setMsg(id));
  // 這個環境還沒設定 LootLocker 時,所有送出按鈕都停用
  ["aLSubmit", "aSubmit", "aRSubmit"].forEach((id) => (aEl(id).disabled = !llReady()));
  const off = { aLogin: "aLMsg", aForm: "aMsg", aReset: "aRMsg" }[v];
  if (off && !llReady()) setMsg(off, ENV.name + "還沒設定 LootLocker,暫時不能使用帳號功能。", "err");
  if (v === "aMe") renderMe();
}
function showAcct(v) {
  homeOn = true;
  [home, ui, shopScr, sdetail, roster, detail].forEach((el) => (el.style.display = "none"));
  detailOn = false;
  acctScr.style.display = "flex";
  view(v || (acct ? "aMe" : "aLogin"));
}
function updAcctBtn() {
  aEl("hAcct").textContent = acct ? "👤 " + (acct.name || acct.email) : "👤 登入 / 註冊";
  const t = aEl("envTag");
  t.textContent = "DEV · " + ENV.name;
  t.style.display = ENV_NAME === "development" ? "" : "none";
}
function renderMe() {
  aEl("aMeName").textContent = acct.name || "(還沒設定名稱)";
  aEl("aMeEmail").textContent = acct.email;
  aEl("aMeWallet").textContent = wallet("ce");
  econUI();
}

// ── 登入狀態 ──
function setPendingName(email, name) {
  store.set(PEND_KEY, name ? { email, name } : null);
}
// 拿到 White Label token 之後:開遊戲 session、補設或讀取名稱、存起來
async function finishLogin(email, wlToken) {
  const s = await llStartSession(email, wlToken);
  let name = "";
  const pend = store.get(PEND_KEY);
  if (pend && pend.email === email) {
    try {
      await llSetName(s.session_token, pend.name);
      name = pend.name;
      setPendingName(null);
    } catch (e) {}
  }
  if (!name) {
    try {
      name = (await llGetName(s.session_token)).name || "";
    } catch (e) {}
  }
  const same = acct && acct.email === email;
  acct = {
    email,
    name,
    playerId: s.player_id,
    playerUlid: s.player_ulid,
    publicUid: s.public_uid,
    walletId: s.wallet_id || (same ? acct.walletId : undefined),
    bal: same ? acct.bal : undefined,
    wlToken,
    session: s.session_token,
  };
  store.set(ACCT_KEY, acct);
  updAcctBtn();
  econSync(); // 背景同步金幣、能量、排行榜,不擋住登入畫面
}
async function doLogin(email, pw) {
  const l = await llLogin(email, pw);
  await finishLogin(email, l.session_token);
}
function clearLogin() {
  econLogout();
  acct = null;
  store.set(ACCT_KEY, null);
  updAcctBtn();
}
// 重新打開網頁時,用記住的 token 自動登入;token 失效就登出,連不上網路就先保留
async function restoreLogin() {
  if (!acct || !llReady()) return;
  const { email, wlToken } = acct;
  try {
    await llVerifySession(email, wlToken);
    await finishLogin(email, wlToken);
  } catch (e) {
    if (e.status !== 0) clearLogin();
  }
}

// ── 登入 ──
aEl("aLogin").onsubmit = async (ev) => {
  ev.preventDefault();
  const email = aEl("aLEmail").value.trim(),
    pw = aEl("aLPw").value,
    btn = aEl("aLSubmit");
  if (!EMAIL_RE.test(email)) return setMsg("aLMsg", "請輸入正確的 Email。", "err");
  if (!pw) return setMsg("aLMsg", "請輸入密碼。", "err");
  btn.disabled = true;
  setMsg("aLMsg", "登入中…");
  try {
    await doLogin(email, pw);
    aEl("aLPw").value = "";
    view("aMe");
    setMsg("aMeMsg", "🎉 登入成功!", "ok");
  } catch (e) {
    setMsg("aLMsg", llErrorText(e), "err");
  }
  btn.disabled = !llReady();
};

// ── 建立帳號 ──
function validate(email, pw, pw2, name) {
  if (!EMAIL_RE.test(email)) return "請輸入正確的 Email。";
  if (pw.length < 8) return "密碼至少要 8 個字元。"; // LootLocker 伺服器的規定
  if (pw !== pw2) return "兩次輸入的密碼不一樣。";
  if (name && (name.length < NAME_MIN || name.length > NAME_MAX))
    return "名稱要 " + NAME_MIN + "~" + NAME_MAX + " 個字。";
  return "";
}
aEl("aForm").onsubmit = async (ev) => {
  ev.preventDefault();
  const email = aEl("aEmail").value.trim(),
    pw = aEl("aPw").value,
    pw2 = aEl("aPw2").value,
    name = aEl("aName").value.trim(),
    btn = aEl("aSubmit");
  const bad = validate(email, pw, pw2, name);
  if (bad) return setMsg("aMsg", bad, "err");
  btn.disabled = true;
  setMsg("aMsg", "建立帳號中…");
  try {
    await llSignUp(email, pw);
  } catch (e) {
    setMsg("aMsg", llErrorText(e), "err");
    btn.disabled = !llReady();
    return;
  }
  ["aPw", "aPw2"].forEach((id) => (aEl(id).value = ""));
  btn.disabled = !llReady();
  // 名稱要登入後才能設定;先記下來,登入成功時再設
  setPendingName(email, name);
  try {
    await doLogin(email, pw);
    view("aMe");
    setMsg("aMeMsg", "✅ 帳號建立成功!", "ok"); // LootLocker 後台沒有開 Email 驗證,不用收信
  } catch (e) {
    // 帳號建好了但自動登入失敗(例如網路斷掉):請他自己登入一次
    aEl("aDoneBody").innerHTML =
      "<p>帳號:<b>" +
      escHtml(email) +
      "</b></p><p>請用剛剛的 Email 和密碼登入。</p>" +
      (name ? "<p>名稱「" + escHtml(name) + "」會在第一次登入時設定。</p>" : "");
    aEl("aLEmail").value = email;
    view("aDone");
  }
};

// ── 忘記密碼 ──
function showReset() {
  view("aReset");
  aEl("aREmail").value =
    aEl("aLEmail").value.trim() || aEl("aEmail").value.trim() || (acct ? acct.email : "");
}
aEl("aReset").onsubmit = async (ev) => {
  ev.preventDefault();
  const email = aEl("aREmail").value.trim(),
    btn = aEl("aRSubmit");
  if (!EMAIL_RE.test(email)) return setMsg("aRMsg", "請輸入正確的 Email。", "err");
  btn.disabled = true;
  setMsg("aRMsg", "寄送中…");
  try {
    await llRequestReset(email);
    // 不透露這個 Email 有沒有註冊過
    setMsg(
      "aRMsg",
      "📧 如果這個 Email 有註冊過,重設密碼的信已經寄出。請到信箱(也看看垃圾郵件)點開連結設定新密碼。",
      "ok",
    );
  } catch (e) {
    setMsg("aRMsg", llErrorText(e), "err");
  }
  // 避免連按一直寄信:30 秒後才能再寄
  setTimeout(() => (btn.disabled = !llReady()), 30000);
};

// ── 登出 ──
aEl("aLogout").onclick = async () => {
  const btn = aEl("aLogout"),
    sess = acct && acct.session,
    email = acct ? acct.email : "";
  btn.disabled = true;
  try {
    if (sess) await llEndSession(sess);
  } catch (e) {} // 伺服器那邊失敗也照樣登出這台裝置
  clearLogin();
  btn.disabled = false;
  aEl("aLEmail").value = email;
  aEl("aLPw").value = "";
  view("aLogin");
  setMsg("aLMsg", "已經登出。", "ok");
};

// ── 按鈕 ──
const backHome = () => {
  acctScr.style.display = "none";
  showHome();
};
aEl("aBack").onclick = backHome;
aEl("aMeHome").onclick = backHome;
aEl("aLToSignup").onclick = () => view("aForm");
aEl("aToLogin").onclick = () => view("aLogin");
aEl("aLToReset").onclick = showReset;
aEl("aRToLogin").onclick = () => view(acct ? "aMe" : "aLogin");
aEl("aMeReset").onclick = showReset;
aEl("aDoneLogin").onclick = () => view("aLogin");
aEl("hAcct").onclick = () => showAcct();
if (acct) econUseCached(); // 先用上次的餘額顯示,自動登入後再同步
updAcctBtn();
restoreLogin();
