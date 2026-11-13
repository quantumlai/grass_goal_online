// 環境設定:開發環境(development)與正式環境(production)
//
// 判斷規則:
//   1. 網址帶 ?env=development 或 ?env=production 時以它為準(方便在正式網址測開發後端)
//   2. 在本機打開(file://、localhost、127.0.0.1、區網 IP)→ 開發環境
//   3. 其他網址(例如 GitHub Pages)→ 正式環境
//
// LootLocker 已經不再區分 Stage/Live 兩個環境,新建立的遊戲只有一個環境、只有 dev_ 開頭的 key。
// 所以開發和正式各用一個獨立的 LootLocker 遊戲(各自的網域與 key)。
// game key 與 domain key 是給遊戲客戶端用的公開金鑰,會出現在瀏覽器裡;
// 不要把 LootLocker 後台的 server key 或帳號密碼放進這個檔案。
// LootLocker 後台建立的經濟系統貨幣代碼與排行榜 key(開發、正式環境共用;不同的話再分開寫)
const LL_ECONOMY = {
  currencies: { coins: "CIN", energy: "PPT", pass: "PSS", star: "SAR" }, // 金幣、戰力能量、通行卷、星光代幣
  leaderboards: {
    math: "grass_goal_online_math", // 分數 = 累計答對題數,metadata = 累計答題數
    wins: "grass_goal_online_wins", // 分數 = 累計勝場數,metadata = 累計出賽數
  },
};
const ENVS = {
  development: {
    name: "開發環境",
    // 測試用:比賽、數學挑戰都縮短成 30 秒
    timing: { matchSecs: 30, mathSecs: 30 },
    lootlocker: {
      apiDomain: "https://w3meemf6.api.lootlocker.com",
      domainKey: "w3meemf6",
      gameKey: "dev_a954d9125d1a4cbebec9abb903982380",
      ...LL_ECONOMY,
    },
  },
  production: {
    name: "正式環境",
    // 比賽 3 分鐘、數學挑戰 2 分鐘
    timing: { matchSecs: 180, mathSecs: 120 },
    lootlocker: {
      // 正式環境用另一個獨立的 LootLocker 遊戲。後台的 White Label、貨幣、排行榜要在這個遊戲裡另外設定一次。
      apiDomain: "https://1jjsx26h.api.lootlocker.com",
      domainKey: "1jjsx26h",
      gameKey: "dev_27d7155e7efb473097dba7f324246fdf",
      ...LL_ECONOMY,
    },
  },
};
// 版本號:顯示在首頁右下角,用來確認手機上跑的是不是最新版。
// 每次要推上 GitHub Pages 之前改一下(格式:年.月.日-當天第幾版)。
const APP_VERSION = "2026.11.12-6";
const GAME_VERSION = "1.0.0";
// Playroom Kit(好友房間連線)。只有打開「好友房間」時才會載入。
// gameId:到 Playroom Dev Portal 建立專案後取得(Configuration → General)。
//   沒填也能連線,但會出現警告;免費方案每天限 10 位不重複玩家。
const PLAYROOM = {
  sdk: "https://unpkg.com/playroomkit@0.0.97/multiplayer.full.umd.js", // 固定版本,升級前先測試
  gameId: "1n71gAP8uNaLs5JyZqdG", 
  maxPlayers: 6, // 3 對 3 坐滿兩隊
  snapHz: 15, // 房主每秒送幾次狀態
  inputHz: 30, // 其他玩家每秒送幾次輸入
};
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
// White Label 登入要送 is-development 標頭,這裡自動跟 key 對齊:
// dev_ 開頭(現在所有新遊戲都是)→ true;只有舊版雙環境遊戲的 prod_ key 才是 false。
for (const e of Object.values(ENVS))
  e.lootlocker.isDevelopment = !/^prod_/.test(e.lootlocker.gameKey);
const TIMING = ENV.timing;
// 秒數轉成畫面文字:120 → "2 分鐘"、30 → "30 秒"
const durText = (s) => (s % 60 === 0 ? s / 60 + " 分鐘" : s + " 秒");
