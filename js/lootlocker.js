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
  try {
    r = await fetch(LL.apiDomain.replace(/\/$/, "") + "/" + path, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new LLError(0, "network");
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

// 建立帳號(建立後 LootLocker 會寄驗證信)
const llSignUp = (email, password) =>
  llFetch("white-label-login/sign-up", { headers: wlHeaders(), body: { email, password } });
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
const llSetName = (sessionToken, name) =>
  llFetch("game/player/name", {
    method: "PATCH",
    headers: { "x-session-token": sessionToken },
    body: { name },
  });

// 把 API 錯誤翻成給小朋友和家長看得懂的中文
function llErrorText(e) {
  const m = String((e && e.message) || "").toLowerCase();
  if (e && e.status === 0) return "連不上伺服器,請檢查網路後再試一次。";
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
