// LootLocker API(White Label Login:用 Email + 密碼建立帳號)
// 文件:https://docs.lootlocker.com/players/white-label-login
const LL = ENV.lootlocker;
const llReady = () => !!(LL.apiDomain && LL.domainKey && LL.gameKey);

class LLError extends Error {
  constructor(status, msg) {
    super(msg);
    this.status = status;
  }
}
async function llFetch(path, { method = "POST", body, headers = {} } = {}) {
  let r;
  const ac = new AbortController(),
    timer = setTimeout(() => ac.abort(), 15000); // 15 秒沒回應就當作連線失敗
  try {
    r = await fetch(LL.apiDomain.replace(/\/$/, "") + "/" + path, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: ac.signal,
    });
  } catch (e) {
    throw new LLError(0, "network");
  } finally {
    clearTimeout(timer);
  }
  let data = {};
  try {
    data = await r.json();
  } catch (e) {}
  if (!r.ok || data.success === false)
    throw new LLError(r.status, data.message || data.error || "HTTP " + r.status);
  return data;
}
const wlHeaders = () => ({
  "domain-key": LL.domainKey,
  "is-development": String(LL.isDevelopment),
});

// 建立帳號(目前後台沒有開 Email 驗證,建立後就能直接登入)
const llSignUp = (email, password) =>
  llFetch("white-label-login/sign-up", { headers: wlHeaders(), body: { email, password } });
// 忘記密碼:LootLocker 會寄出重設密碼的信,使用者在 LootLocker 的網頁設定新密碼(成功回傳 204)
const llRequestReset = (email) =>
  llFetch("white-label-login/request-reset-password", { headers: wlHeaders(), body: { email } });
// 登入,取得 White Label 的 session_token
const llLogin = (email, password) =>
  llFetch("white-label-login/login", {
    headers: wlHeaders(),
    body: { email, password, remember: true },
  });
// 用 White Label token 開一個遊戲 session(之後呼叫遊戲 API 要帶 x-session-token)
const llStartSession = (email, token) =>
  llFetch("game/v2/session/white-label", {
    body: { game_key: LL.gameKey, email, token, game_version: GAME_VERSION },
  });
// 用之前登入時拿到的「記住我」token 確認登入還有效(重新打開網頁時自動登入)
const llVerifySession = (email, token) =>
  llFetch("white-label-login/verify-session", { headers: wlHeaders(), body: { email, token } });
const llGetName = (sessionToken) =>
  llFetch("game/player/name", { method: "GET", headers: { "x-session-token": sessionToken } });
// 登出時結束遊戲 session
const llEndSession = (sessionToken) =>
  llFetch("game/v1/session", { method: "DELETE", headers: { "x-session-token": sessionToken } });
const llSetName = (sessionToken, name) =>
  llFetch("game/player/name", {
    method: "PATCH",
    headers: { "x-session-token": sessionToken },
    body: { name },
  });

// ── 需要遊戲 session 的 API(x-session-token)──
// 路徑與欄位對照 LootLocker 官方 Unity SDK(LootLockerEndPoints.cs、BalanceRequests.cs、LeaderboardRequest.cs)
const llGame = (sess, path, opt = {}) =>
  llFetch("game/" + path, { ...opt, headers: { "x-session-token": sess, ...(opt.headers || {}) } });
// 經濟系統:貨幣、錢包、餘額
const llCurrencies = (s) => llGame(s, "currencies", { method: "GET" }); // → { currencies: [{ id, code, game_api_writes_enabled }] }
const llWalletByHolder = (s, ulid) => llGame(s, "wallet/holder/" + ulid, { method: "GET" }); // → { id, holder_id }
const llCreateWallet = (s, ulid) =>
  llGame(s, "wallet", { body: { holder_id: ulid, holder_type: "player" } }); // → { wallet_id }
const llBalances = (s, wallet) => llGame(s, "balances/wallet/" + wallet, { method: "GET" }); // → { balances: [{ amount, currency: { id, code } }] }
const llCredit = (s, wallet, currencyId, n) =>
  llGame(s, "balances/credit", { body: { amount: String(n), currency_id: currencyId, wallet_id: wallet } });
const llDebit = (s, wallet, currencyId, n) =>
  llGame(s, "balances/debit", { body: { amount: String(n), currency_id: currencyId, wallet_id: wallet } });
// 玩家儲存空間(key / value 都是字串):頭像設定存在 key "avatar"
const llStorageGet = (s) => llGame(s, "v1/player/storage", { method: "GET" }); // → { payload: [{ key, value, is_public, order }] }
const llStorageSet = (s, items) => llGame(s, "v1/player/storage", { body: { payload: items } });
// 排行榜
const llLbMember = (s, key, member) =>
  llGame(s, "leaderboards/" + key + "/member/" + encodeURIComponent(member), { method: "GET" }); // → { rank, score, metadata }
const llLbSubmit = (s, key, member, score, metadata) =>
  llGame(s, "leaderboards/" + key + "/submit", { body: { member_id: member, score, metadata } });

// 把 API 錯誤翻成給小朋友和家長看得懂的中文
function llErrorText(e) {
  const m = String((e && e.message) || "").toLowerCase();
  if (e && e.status === 0) return "連不上伺服器,請檢查網路後再試一次。";
  if (m.includes("wrong email/password")) return "Email 或密碼錯誤。";
  if (m.includes("no session found") || m.includes("invalid session"))
    return "登入已經過期,請重新登入。";
  if (m.includes("platform is not enabled"))
    return "帳號功能還沒開通(LootLocker 後台尚未啟用 White Label Login)。";
  if (m.includes("exist") || m.includes("taken") || (e && e.status === 409))
    return "這個 Email 已經註冊過了。";
  if (m.includes("verif") || m.includes("validat")) return "請先到信箱點開驗證信,完成 Email 驗證。";
  if (m.includes("password")) return "密碼不符合規定(至少 8 個字元)。";
  if (m.includes("email")) return "Email 格式不正確。";
  if (m.includes("name")) return "這個名稱不能使用,請換一個。";
  return "發生錯誤:" + ((e && e.message) || "未知錯誤");
}
