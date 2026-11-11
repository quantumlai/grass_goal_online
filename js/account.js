// 建立帳號畫面(Email + 密碼,可自訂使用者名稱)
const acctScr = document.getElementById("acct"),
  aEl = (id) => document.getElementById(id),
  ACCT_KEY = "brawlAccount_" + ENV_NAME, // 開發、正式環境的帳號分開存
  NAME_MIN = 2,
  NAME_MAX = 16;
let acct = null;
try {
  acct = JSON.parse(localStorage.getItem(ACCT_KEY) || "null");
} catch (e) {}
function saveAcct() {
  try {
    localStorage.setItem(ACCT_KEY, JSON.stringify(acct));
  } catch (e) {}
}
function updAcctBtn() {
  aEl("hAcct").textContent = acct ? "👤 " + (acct.name || acct.email) : "👤 建立帳號";
  const t = aEl("envTag");
  t.textContent = "DEV · " + ENV.name;
  t.style.display = ENV_NAME === "development" ? "" : "none";
}
function showAcct() {
  homeOn = true;
  [home, ui, shopScr, sdetail, roster, detail].forEach((el) => (el.style.display = "none"));
  detailOn = false;
  acctScr.style.display = "flex";
  aEl("aMsg").textContent = "";
  aEl("aMsg").className = "";
  if (acct) return showAcctDone();
  aEl("aForm").style.display = "flex";
  aEl("aDone").style.display = "none";
  aEl("aReset").style.display = "none";
  aEl("aTitle").textContent = "建立帳號";
  if (!llReady()) {
    aEl("aMsg").textContent = ENV.name + "還沒設定 LootLocker,暫時不能建立帳號。";
    aEl("aMsg").className = "err";
    aEl("aSubmit").disabled = true;
  }
}
function showAcctDone(nameErr) {
  aEl("aForm").style.display = "none";
  aEl("aReset").style.display = "none";
  aEl("aTitle").textContent = "我的帳號";
  aEl("aDone").style.display = "flex";
  aEl("aDoneBody").innerHTML =
    "<p>帳號:<b>" +
    escHtml(acct.email) +
    "</b></p>" +
    (acct.name ? "<p>名稱:<b>" + escHtml(acct.name) + "</b></p>" : "") +
    (nameErr ? '<p class="err">名稱還沒設定成功:' + escHtml(nameErr) + "</p>" : "") +
    "<p>📧 我們寄了一封驗證信到這個信箱,請打開信件完成驗證,帳號才能使用。</p>";
}
const escHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function validate(email, pw, pw2, name) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "請輸入正確的 Email。";
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
    msg = aEl("aMsg"),
    btn = aEl("aSubmit");
  const bad = validate(email, pw, pw2, name);
  msg.className = bad ? "err" : "";
  msg.textContent = bad;
  if (bad) return;
  btn.disabled = true;
  msg.textContent = "建立帳號中…";
  try {
    await llSignUp(email, pw);
  } catch (e) {
    msg.className = "err";
    msg.textContent = llErrorText(e);
    btn.disabled = false;
    return;
  }
  acct = { email, name: "" };
  let nameErr = "";
  // 設定名稱需要遊戲 session:登入 → 開 session → 改名。
  // 如果後台設定「Email 驗證後才能登入」,這一步會失敗,帳號本身仍然建立成功。
  if (name) {
    msg.textContent = "設定名稱中…";
    try {
      const l = await llLogin(email, pw);
      const s = await llStartSession(email, l.session_token);
      await llSetName(s.session_token, name);
      acct.name = name;
      acct.publicUid = s.public_uid;
    } catch (e) {
      nameErr = llErrorText(e);
    }
  }
  saveAcct();
  ["aPw", "aPw2"].forEach((id) => (aEl(id).value = ""));
  btn.disabled = false;
  updAcctBtn();
  showAcctDone(nameErr);
};
// 只清掉這台裝置上記住的帳號資訊,不會刪除 LootLocker 上的帳號
aEl("aForget").onclick = () => {
  acct = null;
  try {
    localStorage.removeItem(ACCT_KEY);
  } catch (e) {}
  updAcctBtn();
  showAcct();
};
// ── 忘記密碼 ──
function showReset() {
  acctScr.style.display = "flex";
  aEl("aForm").style.display = "none";
  aEl("aDone").style.display = "none";
  aEl("aReset").style.display = "flex";
  aEl("aTitle").textContent = "🔑 忘記密碼";
  aEl("aREmail").value = aEl("aEmail").value.trim() || (acct ? acct.email : "");
  aEl("aRMsg").textContent = "";
  aEl("aRMsg").className = "";
  aEl("aRSubmit").disabled = !llReady();
  if (!llReady()) {
    aEl("aRMsg").textContent = ENV.name + "還沒設定 LootLocker,暫時不能重設密碼。";
    aEl("aRMsg").className = "err";
  }
}
aEl("aToReset").onclick = showReset;
aEl("aToForm").onclick = showAcct;
aEl("aReset").onsubmit = async (ev) => {
  ev.preventDefault();
  const email = aEl("aREmail").value.trim(),
    msg = aEl("aRMsg"),
    btn = aEl("aRSubmit");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.className = "err";
    msg.textContent = "請輸入正確的 Email。";
    return;
  }
  btn.disabled = true;
  msg.className = "";
  msg.textContent = "寄送中…";
  try {
    await llRequestReset(email);
    msg.className = "ok";
    // 不透露這個 Email 有沒有註冊過
    msg.textContent = "📧 如果這個 Email 有註冊過,重設密碼的信已經寄出。請到信箱(也看看垃圾郵件)點開連結設定新密碼。";
  } catch (e) {
    msg.className = "err";
    msg.textContent = llErrorText(e);
  }
  // 避免連按一直寄信:30 秒後才能再寄
  setTimeout(() => (btn.disabled = !llReady()), 30000);
};
aEl("aBack").onclick = () => {
  acctScr.style.display = "none";
  showHome();
};
aEl("aDoneReset").onclick = showReset;
aEl("aDoneHome").onclick = aEl("aBack").onclick;
aEl("hAcct").onclick = showAcct;
updAcctBtn();
