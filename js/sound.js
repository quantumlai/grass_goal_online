// 音效:用 Web Audio 即時合成(復古電子音),不需要音效檔、也沒有新套件。
//
// 遊戲裡用 sfx(名稱, x, y) 播放;x, y 是場地座標,離自己越遠越小聲(沒給就是介面音效,不分遠近)。
// 好友房間:房主播放的同時把事件放進 SFX.out,隨快照送給其他玩家(playroom.js),大家聽到的一樣。
// 開關存在 P.sound(預設開)。
const SFX = {
  ctx: null, // AudioContext,第一次點擊畫面才建立(瀏覽器規定要使用者操作後才能出聲)
  master: null,
  noise: null, // 噪音波形(爆炸、揮擊、翻滾用)
  last: {}, // 每種音效上次播放的時間(避免同一瞬間疊太多)
  out: [], // 房主:還沒送出去的音效事件 [名稱, x, y]
};
const soundOn = () => P.sound !== false;

function sfxInit() {
  if (SFX.ctx) {
    if (SFX.ctx.state === "suspended") SFX.ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return; // 不支援就安靜
  try {
    SFX.ctx = new AC();
    SFX.master = SFX.ctx.createGain();
    SFX.master.gain.value = 0.5;
    SFX.master.connect(SFX.ctx.destination);
    // 1 秒白噪音;用自己的亂數產生器,不動到 Math.random(遊戲模擬要可重現)
    const n = SFX.ctx.sampleRate,
      buf = SFX.ctx.createBuffer(1, n, n),
      d = buf.getChannelData(0);
    let s = 1234567;
    for (let i = 0; i < n; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      d[i] = (s / 0x3fffffff) - 1;
    }
    SFX.noise = buf;
  } catch (e) {
    SFX.ctx = null;
  }
}
// 第一次觸控或點擊時啟動音效(iPhone 一定要這樣)
["pointerdown", "touchstart", "keydown"].forEach((ev) =>
  addEventListener(
    ev,
    () => {
      sfxInit();
      if (typeof musicTick === "function") musicTick();
    },
    { passive: true },
  ),
);

// ── 合成用的小工具 ──
// 音調:波形、起始頻率 → 結束頻率、長度(秒)、音量、延遲(秒)
function tone(type, f0, f1, dur, vol, delay = 0) {
  const c = SFX.ctx,
    t = c.currentTime + delay,
    o = c.createOscillator(),
    g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(SFX.master);
  o.start(t);
  o.stop(t + dur + 0.02);
}
// 噪音:長度、音量、濾波頻率起點 → 終點、濾波種類、延遲
function hiss(dur, vol, f0, f1, type = "bandpass", delay = 0) {
  const c = SFX.ctx,
    t = c.currentTime + delay,
    src = c.createBufferSource(),
    flt = c.createBiquadFilter(),
    g = c.createGain();
  src.buffer = SFX.noise;
  flt.type = type;
  flt.frequency.setValueAtTime(f0, t);
  flt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(flt).connect(g).connect(SFX.master);
  src.start(t);
  src.stop(t + dur + 0.02);
}
const notes = (list, step, type, vol, dur) =>
  list.forEach((f, i) => tone(type, f, f, dur || step * 1.6, vol, i * step));

// ── 每種音效長什麼樣子 ── (v:音量倍率,0~1)
const SOUNDS = {
  pew: (v) => tone("square", 900, 380, 0.08, 0.12 * v), // 槍、散彈類
  snipe: (v) => (tone("sawtooth", 1500, 160, 0.2, 0.14 * v), hiss(0.06, 0.12 * v, 4000, 2000)),
  lob: (v) => tone("sine", 320, 120, 0.22, 0.22 * v), // 投擲
  swing: (v) => hiss(0.14, 0.3 * v, 600, 2600), // 近身揮擊
  magic: (v) => (tone("triangle", 600, 1300, 0.16, 0.12 * v), tone("triangle", 900, 1900, 0.16, 0.08 * v, 0.04)),
  super: (v) => (
    tone("sawtooth", 180, 900, 0.35, 0.16 * v),
    hiss(0.35, 0.22 * v, 300, 3000),
    notes([523, 784, 1047], 0.07, "square", 0.08 * v)
  ),
  ability: (v) => notes([660, 880, 1175], 0.05, "triangle", 0.14 * v),
  roll: (v) => hiss(0.2, 0.25 * v, 2500, 400, "lowpass"),
  kick: (v) => (tone("sine", 170, 55, 0.14, 0.45 * v), hiss(0.03, 0.15 * v, 3000, 3000)),
  hit: (v) => tone("square", 320, 180, 0.05, 0.07 * v),
  ko: (v) => (tone("square", 440, 70, 0.32, 0.14 * v), hiss(0.25, 0.2 * v, 1500, 200, "lowpass")),
  boom: (v) => (hiss(0.45, 0.45 * v, 900, 80, "lowpass"), tone("sine", 95, 38, 0.4, 0.4 * v)),
  goal: (v) => (notes([523, 659, 784, 1047], 0.1, "square", 0.12 * v), hiss(0.8, 0.12 * v, 1200, 1800, "bandpass", 0.1)),
  win: (v) => notes([523, 659, 784, 1047, 1319], 0.11, "square", 0.12 * v, 0.25),
  lose: (v) => notes([523, 440, 349, 262], 0.16, "triangle", 0.16 * v, 0.3),
  tie: (v) => notes([523, 523, 659], 0.14, "triangle", 0.14 * v, 0.2),
  ding: (v) => (tone("sine", 880, 880, 0.18, 0.2 * v), tone("sine", 1320, 1320, 0.22, 0.14 * v, 0.06)),
  buzz: (v) => tone("square", 160, 110, 0.25, 0.1 * v),
  crit: (v) => notes([784, 988, 1175, 1568], 0.05, "square", 0.1 * v, 0.12),
};
// 普通攻擊依角色類型換聲音
const SHOT_SOUND = {
  gun: "pew", eng: "pew", cactus: "pew", bloom: "pew", frost: "pew", toxic: "pew",
  snipe: "snipe", bomb: "lob", mage: "magic",
  tank: "swing", wall: "swing", brute: "swing", bat: "swing", dash: "swing",
};
const SFX_GAP = { pew: 0.05, hit: 0.06, swing: 0.05 }; // 同一種音效最短間隔(秒),其他 0.03

// 播放音效。房主模擬時會順便記下事件,送給好友房間的其他人
function sfx(k, x, y) {
  if (typeof room !== "undefined" && room.active && Net.isHost())
    SFX.out.push(x === undefined ? [k, null, null] : [k, Math.round(x), Math.round(y)]);
  sfxPlay(k, x, y);
}
function sfxPlay(k, x, y) {
  if (!soundOn() || !SFX.ctx || SFX.ctx.state !== "running" || !SOUNDS[k]) return;
  let v = 1;
  if (x !== undefined && G && G.ents[G.me]) {
    // 離自己 400 以內全音量,之後慢慢變小,900 以外聽不到
    const me = G.ents[G.me],
      d = Math.hypot(x - me.x, y - me.y);
    v = Math.max(0, Math.min(1, 1 - (d - 400) / 500));
    if (v <= 0) return;
  }
  const now = SFX.ctx.currentTime;
  if (now - (SFX.last[k] || 0) < (SFX_GAP[k] || 0.03)) return;
  SFX.last[k] = now;
  try {
    SOUNDS[k](v);
  } catch (e) {}
}

// ── 背景音樂 ──
// 數學挑戰、數學練習時播 math_puzzles.mp3,其他時候播 game.mp3,都循環播放。
// 用 <audio> 播放;網址是 http(s) 時再接到 Web Audio 調音量(iPhone 不能直接改 <audio> 的音量)。
const MUSIC = {
  tracks: { game: "assets/music/game.mp3", math: "assets/music/math_puzzles.mp3" },
  vol: 0.35, // 比音效小聲,不會蓋過音效
  els: {}, // 已載入的曲子(用到才下載)
  cur: null, // 正在播哪一首
};
const musicOn = () => P.music !== false;
function musicEl(k) {
  if (MUSIC.els[k]) return MUSIC.els[k];
  const a = new Audio(MUSIC.tracks[k]);
  a.loop = true;
  a.preload = "auto";
  a.volume = MUSIC.vol;
  // 接到 Web Audio 才能在 iPhone 上調音量;直接開檔案(file://)時接上去會沒聲音,所以跳過
  if (SFX.ctx && location.protocol !== "file:") {
    try {
      const g = SFX.ctx.createGain();
      g.gain.value = MUSIC.vol;
      SFX.ctx.createMediaElementSource(a).connect(g).connect(SFX.ctx.destination);
      a.volume = 1;
    } catch (e) {}
  }
  MUSIC.els[k] = a;
  return a;
}
// 每一幀呼叫:決定現在該播哪一首,有變才切換
function musicTick() {
  const want =
    !musicOn() || !SFX.ctx || document.hidden
      ? null
      : mathScr.style.display !== "none" || mresScr.style.display !== "none"
        ? "math"
        : "game";
  if (want === MUSIC.cur) return;
  if (MUSIC.cur) MUSIC.els[MUSIC.cur].pause();
  MUSIC.cur = want;
  if (!want) return;
  const a = musicEl(want);
  a.currentTime = 0;
  const p = a.play();
  if (p && p.catch) p.catch(() => (MUSIC.cur = null)); // 瀏覽器還不讓播,下次點擊後再試
}
addEventListener("visibilitychange", musicTick); // 切到別的 App 時暫停

// ── 開關:設定頁(音樂、音效分開)、比賽中的全部靜音 ──
function sndUI() {
  const any = soundOn() || musicOn();
  const b = document.getElementById("sndBtn");
  b.textContent = any ? "🔊" : "🔇";
  b.setAttribute("aria-label", any ? "全部靜音" : "打開聲音");
  document.getElementById("setMusic").checked = musicOn();
  document.getElementById("setSfx").checked = soundOn();
}
// 比賽中才顯示右上角的靜音按鈕(練習有自己的面板,不顯示)。每一幀呼叫,狀態有變才改畫面
let sndBtnShown = null;
function sndBtnTick() {
  const show = !homeOn && !!G && !G.over && ui.style.display === "none" && !TUT.on;
  if (show !== sndBtnShown) {
    sndBtnShown = show;
    document.getElementById("sndBtn").style.display = show ? "" : "none";
  }
  musicTick();
}
function setAudio(music, sfxOn) {
  P.music = music;
  P.sound = sfxOn;
  save();
  sfxInit();
  if (sfxOn) sfxPlay("ding");
  sndUI();
  musicTick();
}
// 比賽中的按鈕:有任何聲音就全部關掉,全部關著就全部打開
document.getElementById("sndBtn").onclick = (ev) => {
  ev.stopPropagation();
  const any = soundOn() || musicOn();
  setAudio(!any, !any);
};
document.getElementById("setMusic").onchange = (ev) => setAudio(ev.target.checked, soundOn());
document.getElementById("setSfx").onchange = (ev) => setAudio(musicOn(), ev.target.checked);
sndUI();
