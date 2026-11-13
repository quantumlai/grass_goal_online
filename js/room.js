// 好友房間畫面、預設表情與短語
// 不提供文字聊天,只能送下面這些固定的表情和短語(小朋友使用比較安全)。
const EMOTES = ["👍", "😂", "😮", "😢", "😡", "🎉", "好球!", "傳給我!", "加油!", "小心!", "謝謝!", "再來一場!"];
const roomScr = document.getElementById("room"),
  rEl = (id) => document.getElementById(id);
const emo = { n: 0, lastT: 0, seen: {}, show: {} }; // show:玩家 id → { txt, t }

function showRoom() {
  homeOn = true;
  [home, ui, shopScr, sdetail, roster, detail, mathScr, mresScr, acctScr].forEach(
    (el) => (el.style.display = "none"),
  );
  detailOn = false;
  roomScr.style.display = "flex";
  rEl("rmStart").style.display = room.active ? "none" : "flex";
  rEl("rmIn").style.display = room.active ? "flex" : "none";
  if (room.active) {
    syncProfile();
    roomUI();
  }
  // 直接打開檔案(file://)時網頁沒有來源網址,Playroom 會拒絕連線
  if (location.protocol === "file:") {
    ["rmCreate", "rmJoin"].forEach((id) => (rEl(id).disabled = true));
    rEl("rmMsg").className = "amsg err";
    rEl("rmMsg").textContent =
      "好友房間要用網址打開才能連線(直接開 index.html 檔案不行)。本機測試請在專案資料夾執行 python3 -m http.server 8765,再打開 http://localhost:8765";
  }
  emoBtnUI();
}
// 數學挑戰做完:在房間裡就回房間,否則回首頁
function afterMath() {
  if (room.active) showRoom();
  else showHome();
}

// ── 房間列表 ──
const STATUS = { lobby: "✅ 準備好了", math: "📝 刷題中", play: "⚽ 比賽中", nopass: "🎟️ 沒有通行卷" };
function roomUI() {
  if (!roomOn()) return;
  rEl("rmCodeShow").textContent = PR.getRoomCode() || "";
  const ps = roomPlayers(),
    myId = PR.myPlayer().id,
    hostId = PR.getState("hostId"),
    tmOf = teamOf(ps.map(({ pl, prof }) => ({ id: pl.id, ci: prof.ci }))); // 實際會坐哪一隊
  rEl("rmList").innerHTML =
    ps
      .map(({ pl, prof }) => {
        const c = CH[prof.ci],
          e = emo.show[pl.id],
          tm = tmOf[pl.id] ?? c.team,
          moved = tm !== c.team;
        return (
          '<div class="rmp' +
          (pl.id === myId ? " me" : "") +
          '" style="border-color:' +
          TEAMC[tm] +
          '"><span class="rmic">' +
          avatarSVG(prof.avatar, 36) +
          "</span><div><b>" +
          (pl.id === hostId ? "👑 " : "") +
          escHtml(prof.name) +
          (pl.id === myId ? "(你)" : "") +
          "</b><small>" +
          TEAMN[tm] +
          (moved ? "(原隊已滿)" : "") +
          " · " +
          c.icon +
          c.name +
          " · " +
          ROLES[c.role] +
          "</small></div><em>" +
          (STATUS[prof.st] || "") +
          "</em>" +
          (e && e.t > 0 ? '<span class="rmemo">' + escHtml(e.txt) + "</span>" : "") +
          "</div>"
        );
      })
      .join("") +
    (ps.length < PLAYROOM.maxPlayers
      ? '<p class="ahint">把房間代碼或邀請連結傳給朋友,最多 ' +
        PLAYROOM.maxPlayers +
        " 人。每隊 " +
        TEAM_SIZE +
        " 人,沒坐滿的位置由電腦補上;英雄的隊伍坐滿了,會自動換到另一隊。</p>"
      : "");
  const c = CH[pick];
  rEl("rmHero").innerHTML =
    c.icon + " " + c.name + "<small>" + TEAMN[c.team] + " · " + ROLES[c.role] + " · Lv." + heroLv(pick) + "</small>";
  // 開始比賽:只有房主能按,而且大家都準備好(每個人都有通行卷,沒有人在刷題)
  const host = PR.isHost(),
    allReady = ps.length > 0 && ps.every(({ prof }) => prof.ready && prof.st === "lobby");
  rEl("rmMath").style.display = P.passes < 1 ? "" : "none";
  rEl("rmGo").style.display = host ? "" : "none";
  rEl("rmGo").disabled = !allReady;
  rEl("rmNote").className = "amsg" + (room.note ? " err" : "");
  rEl("rmNote").textContent =
    room.note ||
    (P.passes < 1
      ? "🎟️ 你的通行卷用完了,刷數學題換一張才能一起玩。"
      : host
        ? allReady
          ? "大家都準備好了,可以開始!(每人用 1 張通行卷)"
          : "等大家都準備好(有通行卷、沒有在刷題)就能開始。"
        : "等待房主開始比賽…(會用 1 張通行卷)");
}

// ── 表情與短語 ──
function sendEmote(k) {
  const now = performance.now();
  if (!roomOn() || now - emo.lastT < 1000) return; // 每秒最多一次
  emo.lastT = now;
  emo.n++;
  PR.myPlayer().setState("emo", { k, n: emo.n }, true);
  emo.show[PR.myPlayer().id] = { txt: EMOTES[k], t: 2.5 };
  rEl("emoPanel").style.display = "none";
  if (roomScr.style.display !== "none") roomUI();
}
function emoTick(dt) {
  for (const pl of room.players) {
    const s = pl.getState("emo");
    if (!s || pl.id === PR.myPlayer().id) continue; // 自己的表情送出時就顯示了
    if (s.n !== (emo.seen[pl.id] || 0)) {
      emo.seen[pl.id] = s.n;
      emo.show[pl.id] = { txt: EMOTES[s.k] || "", t: 2.5 };
    }
  }
  for (const id in emo.show) emo.show[id].t -= dt;
  emoBtnUI();
}
// 比賽中顯示在角色頭上的對話框(在場地座標裡畫,render.js 會呼叫)
function drawEmotes() {
  if (!room.active || !G) return;
  for (const e of G.ents) {
    const s = e.pid && emo.show[e.pid];
    if (!s || s.t <= 0 || e.dead) continue;
    const a = Math.min(1, s.t / 0.3),
      y = e.y - e.r - 46;
    ctx.globalAlpha = a;
    ctx.font = "800 18px sans-serif";
    const w = ctx.measureText(s.txt).width + 20;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#14122b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(e.x - w / 2, y - 16, w, 32, 12);
    ctx.moveTo(e.x - 7, y + 16);
    ctx.lineTo(e.x, y + 25);
    ctx.lineTo(e.x + 7, y + 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#14122b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.txt, e.x, y + 1);
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = 1;
  }
}
// 比賽中的表情按鈕:只在房間比賽時出現
function emoBtnUI() {
  const on = room.active && !homeOn && G && !G.over && ui.style.display === "none";
  rEl("emoBtn").style.display = on ? "" : "none";
  if (!on) rEl("emoPanel").style.display = "none";
}
function buildEmoButtons(el) {
  el.innerHTML = "";
  EMOTES.forEach((t, k) => {
    const b = document.createElement("button");
    b.textContent = t;
    b.onclick = (ev) => {
      ev.stopPropagation();
      sendEmote(k);
    };
    el.appendChild(b);
  });
}
buildEmoButtons(rEl("rmEmos"));
buildEmoButtons(rEl("emoPanel"));
rEl("emoBtn").onclick = (ev) => {
  ev.stopPropagation();
  const p = rEl("emoPanel");
  p.style.display = p.style.display === "none" ? "grid" : "none";
};

// ── 建立 / 加入 / 離開 ──
async function doJoin(code) {
  const msg = rEl("rmMsg");
  msg.className = "amsg";
  msg.textContent = "連線中…";
  ["rmCreate", "rmJoin"].forEach((id) => (rEl(id).disabled = true));
  try {
    await joinRoom(code);
    P.roomUsed = true; // 用過好友房間(例如點邀請連結),首頁就顯示好友房間按鈕
    save();
    msg.textContent = "";
    room.note = "";
    showRoom();
  } catch (e) {
    console.error(e);
    const m = String((e && (e.reason || e.message)) || e);
    msg.className = "amsg err";
    msg.textContent = /LIMIT/i.test(m)
      ? "這個房間已經滿了(最多 " + PLAYROOM.maxPlayers + " 人)。"
      : "連線失敗:" + m;
  }
  ["rmCreate", "rmJoin"].forEach((id) => (rEl(id).disabled = false));
}
rEl("hRoom").onclick = showRoom;
rEl("rmCreate").onclick = () => doJoin(null);
rEl("rmJoin").onclick = () => {
  const code = rEl("rmCode").value.trim();
  if (!code) {
    rEl("rmMsg").className = "amsg err";
    rEl("rmMsg").textContent = "請輸入房間代碼。";
    return;
  }
  doJoin(code);
};
rEl("rmBack").onclick = () => {
  if (room.active) {
    if (confirm("要離開房間嗎?")) leaveRoom();
  } else {
    roomScr.style.display = "none";
    showHome();
  }
};
rEl("rmLeave").onclick = () => confirm("要離開房間嗎?") && leaveRoom();
rEl("rmGo").onclick = () => {
  room.note = "";
  hostStartMatch();
};
rEl("rmMath").onclick = () => startMath({ pass: true });
rEl("rmPrev").onclick = () => {
  stepPick(-1);
  syncProfile();
  roomUI();
};
rEl("rmNext").onclick = () => {
  stepPick(1);
  syncProfile();
  roomUI();
};
rEl("rmCopy").onclick = async () => {
  const link = inviteLink();
  try {
    await navigator.clipboard.writeText(link);
    rEl("rmCopy").textContent = "✅ 已複製";
  } catch (e) {
    prompt("複製這個連結傳給朋友:", link);
  }
  setTimeout(() => (rEl("rmCopy").textContent = "📋 複製邀請連結"), 2000);
};
// 從邀請連結(網址有 #r=)打開:直接進房間
if (/[#&]r=/.test(location.hash)) {
  showRoom();
  doJoin(null);
}
