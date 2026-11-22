// 首頁的「☰ 選單」:遊戲練習、數學練習、開房間、設定、帳號
// 各項目原本的動作寫在各自的檔案(tutorial.js、room.js、account.js);這裡只負責打開、關閉選單。
const menuScr = document.getElementById("menu");
function openMenu() {
  menuScr.style.display = "flex";
  document.getElementById("mnMain").style.display = "";
  document.getElementById("mnSettings").style.display = "none";
  sndUI();
}
function closeMenu() {
  menuScr.style.display = "none";
}
document.getElementById("hMenu").onclick = openMenu;
document.getElementById("mnClose").onclick = closeMenu;
menuScr.addEventListener("click", (ev) => ev.target === menuScr && closeMenu()); // 點選單外面也會關
// 點了會離開首頁的項目:做完動作後把選單收起來
for (const id of ["hTut", "hMathP", "hRoom", "hAcct"])
  document.getElementById(id).addEventListener("click", closeMenu);
document.getElementById("mnSet").onclick = () => {
  document.getElementById("mnMain").style.display = "none";
  document.getElementById("mnSettings").style.display = "";
  sndUI();
  aiUI();
};
// 電腦強度:弱 / 中 / 強(下一場比賽開始時套用;好友房間用房主的設定)
function aiUI() {
  const el = document.getElementById("setAi"),
    cur = aiLevel();
  el.innerHTML = Object.entries(AI_LV)
    .map(([k, v]) => `<button type="button" role="radio" aria-checked="${k === cur}" data-k="${k}" class="${k === cur ? "on" : ""}">${v.n}</button>`)
    .join("");
  el.querySelectorAll("button").forEach(
    (b) =>
      (b.onclick = () => {
        P.aiLv = b.dataset.k;
        save();
        aiUI();
      }),
  );
}
document.getElementById("mnBack").onclick = () => {
  document.getElementById("mnSettings").style.display = "none";
  document.getElementById("mnMain").style.display = "";
};
