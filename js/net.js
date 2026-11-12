// 連線層:決定誰負責跑模擬、這場有哪些真人玩家、輸入從哪裡來、結果送到哪裡。
//
// 遊戲只透過 Net 這個物件跟連線打交道。單機版用 LocalNet:自己就是房主,只有一位真人。
// 下一步做 Playroom 好友房間時,另外寫一個實作同樣函式的物件,開房時把 Net 換掉即可。
//
// 介面:
//   isHost()             這台裝置是否負責跑 update()(房主)
//   myId()               本機玩家的 id(對應角色的 pid)
//   players()            這場比賽的真人玩家 [{ id, name, ci: 英雄, loadout }](最多 4 位)
//   collectInputs()      房主:取得這一幀所有真人的輸入 { 玩家 id: 輸入資料 }
//   sendInput(inp)       非房主:把自己這一幀的輸入送給房主
//   publish(G)           房主:模擬完一幀後把狀態送給其他玩家
//   tick(dt)             每一幀都會呼叫:處理收到的資料(開賽、快照、結果…)
const LocalNet = {
  name: "local",
  isHost: () => true,
  myId: () => "local",
  players: () => [
    {
      id: "local",
      name: typeof acct !== "undefined" && acct ? acct.name || "" : "",
      ci: pick,
      loadout: myLoadout(),
    },
  ],
  collectInputs: () => ({ local: readLocalInput() }),
  sendInput() {},
  publish() {},
  tick() {},
};
let Net = LocalNet;
