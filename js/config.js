// 環境設定:開發環境(development)與正式環境(production)
//
// 判斷規則:
//   1. 網址帶 ?env=development 或 ?env=production 時以它為準(方便在正式網址測開發後端)
//   2. 在本機打開(file://、localhost、127.0.0.1、區網 IP)→ 開發環境
//   3. 其他網址(例如 GitHub Pages)→ 正式環境
//
// LootLocker 的 game key 開頭是 dev_ 或 prod_,本身就決定了連到哪個環境。
// game key 與 domain key 是給遊戲客戶端用的公開金鑰,會出現在瀏覽器裡;
// 不要把 LootLocker 後台的 server key 或帳號密碼放進這個檔案。
// LootLocker 後台建立的經濟系統貨幣代碼與排行榜 key(開發、正式環境共用;不同的話再分開寫)
const LL_ECONOMY = {
  currencies: { coins: "CIN", energy: "PPT" }, // 金幣、戰力能量
  leaderboards: {
    math: "grass_goal_online_math", // 分數 = 累計答對題數,metadata = 累計答題數
    wins: "grass_goal_online_wins", // 分數 = 累計勝場數,metadata = 累計出賽數
  },
};
const ENVS = {
  development: {
    name: "開發環境",
    lootlocker: {
      apiDomain: "https://w3meemf6.api.lootlocker.com",
      domainKey: "w3meemf6",
      gameKey: "dev_a954d9125d1a4cbebec9abb903982380",
      isDevelopment: true,
      ...LL_ECONOMY,
    },
  },
  production: {
    name: "正式環境",
    lootlocker: {
      // TODO: 填入正式環境的 game key(prod_ 開頭)。確認正式環境用的 API 網域是否相同。
      apiDomain: "https://w3meemf6.api.lootlocker.com",
      domainKey: "w3meemf6",
      gameKey: "",
      isDevelopment: false,
      ...LL_ECONOMY,
    },
  },
};
const GAME_VERSION = "1.0.0";
const ENV_NAME = (() => {
  const q = new URLSearchParams(location.search).get("env");
  if (q && ENVS[q]) return q;
  const h = location.hostname;
  const local =
    location.protocol === "file:" ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(h);
  return local ? "development" : "production";
})();
const ENV = ENVS[ENV_NAME];
