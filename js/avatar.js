// 頭像:自己組合臉、耳朵、眼睛、鼻子、嘴巴、鬍子、配件(頭上 / 臉上 / 脖子)、上衣。
// 用 SVG 一層一層疊出來(viewBox 0 0 120 120),不需要圖片檔。
// 設定存在 P.avatar;好友房間會把設定送給其他人(playroom.js 的 prof.avatar)。
// 別人送來的設定一律經過 avClean():只接受下面表格裡有的選項、#rrggbb 格式的顏色。

const AV_SKIN = ["#ffe0bd", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#f6a04d", "#a0522d", "#f5f5f5", "#9e9e9e", "#90caf9"];
const AV_SHIRT = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];
const OL = "#2b2140"; // 線條顏色
const HEAD = { cx: 60, cy: 54, r: 30 };

// ── 臉 ──(back:頭後面的頭髮;front:頭前面的頭髮、斑紋;def:選這張臉時自動配的部位)
const AV_FACES = {
  boy: {
    n: "男孩",
    c: "#f1c27d",
    hair: "#5b3a1e",
    front: (h) =>
      `<path d="M31 50 Q30 22 60 21 Q90 22 89 50 Q84 36 76 38 Q70 30 60 36 Q50 30 44 38 Q36 36 31 50Z" fill="${h}" stroke="${OL}" stroke-width="2"/>`,
    def: { ears: "human", nose: "dot", beard: "none" },
  },
  girl: {
    n: "女孩",
    c: "#ffe0bd",
    hair: "#3b2416",
    back: (h) => `<path d="M26 56 Q24 18 60 18 Q96 18 94 56 L96 92 Q84 84 80 70 L40 70 Q36 84 24 92Z" fill="${h}" stroke="${OL}" stroke-width="2"/>`,
    front: (h) =>
      `<path d="M30 52 Q30 22 60 22 Q90 22 90 52 Q80 34 66 38 Q60 30 52 38 Q40 34 30 52Z" fill="${h}" stroke="${OL}" stroke-width="2"/>`,
    def: { ears: "human", nose: "dot", beard: "none" },
  },
  grandpa: {
    n: "老爺爺",
    c: "#f1c27d",
    hair: "#d9d9d9",
    front: (h) =>
      `<path d="M30 58 Q27 40 36 36 Q34 48 37 56Z M90 58 Q93 40 84 36 Q86 48 83 56Z" fill="${h}" stroke="${OL}" stroke-width="1.5"/>` +
      `<path d="M50 34 Q60 31 70 34 M52 39 Q60 36 68 39" stroke="#b07a4a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    def: { ears: "human", nose: "big", beard: "mustache" },
  },
  grandma: {
    n: "老奶奶",
    c: "#ffe0bd",
    hair: "#e5e5e5",
    back: (h) => `<circle cx="60" cy="20" r="11" fill="${h}" stroke="${OL}" stroke-width="2"/>`,
    front: (h) =>
      `<path d="M30 54 Q30 26 60 25 Q90 26 90 54 Q84 38 72 38 Q60 32 48 38 Q36 38 30 54Z" fill="${h}" stroke="${OL}" stroke-width="2"/>`,
    def: { ears: "human", nose: "dot", beard: "none" },
  },
  robot: {
    n: "機器人",
    c: "#9e9e9e",
    shape: (c) => `<rect x="31" y="25" width="58" height="58" rx="12" fill="${c}" stroke="${OL}" stroke-width="2.5"/>`,
    front: () =>
      `<circle cx="37" cy="31" r="2" fill="${OL}"/><circle cx="83" cy="31" r="2" fill="${OL}"/><circle cx="37" cy="77" r="2" fill="${OL}"/><circle cx="83" cy="77" r="2" fill="${OL}"/>`,
    def: { ears: "robot", nose: "robot", eyes: "robot", mouth: "robot", beard: "none" },
  },
  cat: { n: "貓", c: "#f6a04d", muzzle: 1, def: { ears: "cat", nose: "cat", mouth: "cat", beard: "whiskers" } },
  dog: { n: "狗", c: "#a0522d", muzzle: 1, def: { ears: "dog", nose: "big", mouth: "tongue", beard: "none" } },
  bear: { n: "熊", c: "#a0522d", muzzle: 1, def: { ears: "bear", nose: "big", mouth: "smile", beard: "none" } },
  rabbit: { n: "兔子", c: "#f5f5f5", muzzle: 1, def: { ears: "rabbit", nose: "cat", mouth: "cat", beard: "whiskers" } },
  panda: {
    n: "熊貓",
    c: "#f5f5f5",
    muzzle: 1,
    front: () =>
      `<ellipse cx="47" cy="53" rx="8" ry="10" transform="rotate(-20 47 53)" fill="#222"/><ellipse cx="73" cy="53" rx="8" ry="10" transform="rotate(20 73 53)" fill="#222"/>`,
    def: { ears: "panda", nose: "big", mouth: "smile", beard: "none" },
  },
};
// ── 耳朵 ──(畫在頭的後面;c 是臉的顏色)
const AV_EARS = {
  none: { n: "無", d: () => "" },
  human: { n: "人", d: (c) => `<circle cx="29" cy="57" r="7" fill="${c}" stroke="${OL}" stroke-width="2"/><circle cx="91" cy="57" r="7" fill="${c}" stroke="${OL}" stroke-width="2"/>` },
  cat: {
    n: "貓",
    d: (c) =>
      `<path d="M33 40 L36 14 L54 30Z M87 40 L84 14 L66 30Z" fill="${c}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M38 34 L39 21 L48 29Z M82 34 L81 21 L72 29Z" fill="#f9a8d4"/>`,
  },
  dog: { n: "狗", d: (c) => `<ellipse cx="30" cy="54" rx="9" ry="18" transform="rotate(20 30 54)" fill="${c}" stroke="${OL}" stroke-width="2"/><ellipse cx="90" cy="54" rx="9" ry="18" transform="rotate(-20 90 54)" fill="${c}" stroke="${OL}" stroke-width="2"/>` },
  bear: { n: "熊", d: (c) => `<circle cx="36" cy="30" r="10" fill="${c}" stroke="${OL}" stroke-width="2"/><circle cx="84" cy="30" r="10" fill="${c}" stroke="${OL}" stroke-width="2"/><circle cx="36" cy="30" r="5" fill="#00000033"/><circle cx="84" cy="30" r="5" fill="#00000033"/>` },
  panda: { n: "熊貓", d: () => `<circle cx="36" cy="30" r="10" fill="#222" stroke="${OL}" stroke-width="2"/><circle cx="84" cy="30" r="10" fill="#222" stroke="${OL}" stroke-width="2"/>` },
  rabbit: {
    n: "兔子",
    d: (c) =>
      `<ellipse cx="47" cy="16" rx="7" ry="20" fill="${c}" stroke="${OL}" stroke-width="2"/><ellipse cx="73" cy="16" rx="7" ry="20" fill="${c}" stroke="${OL}" stroke-width="2"/><ellipse cx="47" cy="17" rx="3" ry="13" fill="#f9a8d4"/><ellipse cx="73" cy="17" rx="3" ry="13" fill="#f9a8d4"/>`,
  },
  robot: { n: "機器人", d: () => `<rect x="22" y="47" width="10" height="18" rx="3" fill="#64748b" stroke="${OL}" stroke-width="2"/><rect x="88" y="47" width="10" height="18" rx="3" fill="#64748b" stroke="${OL}" stroke-width="2"/>` },
  elf: { n: "精靈", d: (c) => `<path d="M33 52 L14 40 L32 64Z M87 52 L106 40 L88 64Z" fill="${c}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>` },
};
// ── 眼睛 ──(左右眼中心 (48,53)、(72,53))
const eye2 = (f) => f(48, 53) + f(72, 53);
const AV_EYES = {
  dots: { n: "圓眼", d: () => eye2((x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="${OL}"/><circle cx="${x + 1.3}" cy="${y - 1.4}" r="1.3" fill="#fff"/>`) },
  happy: { n: "笑眼", d: () => eye2((x, y) => `<path d="M${x - 5} ${y + 2} Q${x} ${y - 5} ${x + 5} ${y + 2}" stroke="${OL}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`) },
  big: { n: "大眼", d: () => eye2((x, y) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="8" fill="#fff" stroke="${OL}" stroke-width="2"/><circle cx="${x + 1}" cy="${y + 1}" r="4" fill="${OL}"/><circle cx="${x + 2.5}" cy="${y - 1}" r="1.5" fill="#fff"/>`) },
  sleepy: { n: "瞇瞇眼", d: () => eye2((x, y) => `<path d="M${x - 5} ${y} L${x + 5} ${y}" stroke="${OL}" stroke-width="2.5" stroke-linecap="round"/>`) },
  wink: {
    n: "眨眼",
    d: () =>
      `<circle cx="48" cy="53" r="4" fill="${OL}"/><circle cx="49.3" cy="51.6" r="1.3" fill="#fff"/><path d="M67 54 Q72 49 77 54" stroke="${OL}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  },
  star: { n: "星星眼", d: () => eye2((x, y) => `<path d="M${x} ${y - 6} L${x + 1.8} ${y - 1.8} L${x + 6} ${y - 1.5} L${x + 2.8} ${y + 1.3} L${x + 3.8} ${y + 6} L${x} ${y + 3.4} L${x - 3.8} ${y + 6} L${x - 2.8} ${y + 1.3} L${x - 6} ${y - 1.5} L${x - 1.8} ${y - 1.8}Z" fill="#facc15" stroke="${OL}" stroke-width="1.2"/>`) },
  heart: { n: "愛心眼", d: () => eye2((x, y) => `<path d="M${x} ${y + 5} C${x - 9} ${y - 1} ${x - 4} ${y - 8} ${x} ${y - 3} C${x + 4} ${y - 8} ${x + 9} ${y - 1} ${x} ${y + 5}Z" fill="#ef4444" stroke="${OL}" stroke-width="1.2"/>`) },
  robot: { n: "機器眼", d: () => eye2((x, y) => `<rect x="${x - 7}" y="${y - 4}" width="14" height="8" rx="2" fill="#22d3ee" stroke="${OL}" stroke-width="2"/>`) },
};
// ── 鼻子 ──(中心 (60,63))
const AV_NOSES = {
  none: { n: "無", d: () => "" },
  dot: { n: "小鼻子", d: () => `<ellipse cx="60" cy="63" rx="2.5" ry="2" fill="#00000040"/>` },
  big: { n: "大鼻子", d: () => `<ellipse cx="60" cy="63" rx="5.5" ry="4" fill="${OL}"/><ellipse cx="58.5" cy="61.8" rx="1.8" ry="1.2" fill="#fff8"/>` },
  cat: { n: "貓鼻子", d: () => `<path d="M56 61 L64 61 L60 66Z" fill="#f472b6" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/>` },
  pig: { n: "豬鼻子", d: () => `<ellipse cx="60" cy="63" rx="7" ry="5" fill="#f9a8d4" stroke="${OL}" stroke-width="1.5"/><ellipse cx="57.5" cy="63" rx="1.4" ry="2" fill="${OL}"/><ellipse cx="62.5" cy="63" rx="1.4" ry="2" fill="${OL}"/>` },
  robot: { n: "機器鼻", d: () => `<rect x="57" y="60" width="6" height="6" rx="1" fill="#64748b" stroke="${OL}" stroke-width="1.2"/>` },
};
// ── 嘴巴 ──(中心 (60,72))
const AV_MOUTHS = {
  smile: { n: "微笑", d: () => `<path d="M51 70 Q60 78 69 70" stroke="${OL}" stroke-width="2.5" fill="none" stroke-linecap="round"/>` },
  grin: { n: "大笑", d: () => `<path d="M49 69 Q60 70 71 69 Q69 82 60 82 Q51 82 49 69Z" fill="#7f1d1d" stroke="${OL}" stroke-width="2"/><path d="M51 70 Q60 71 69 70 L68 73 Q60 74 52 73Z" fill="#fff"/>` },
  tongue: { n: "吐舌", d: () => `<path d="M51 70 Q60 78 69 70" stroke="${OL}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M56 74 Q56 82 60 82 Q64 82 64 74Z" fill="#f472b6" stroke="${OL}" stroke-width="1.5"/>` },
  o: { n: "O 嘴", d: () => `<ellipse cx="60" cy="73" rx="4" ry="5" fill="#7f1d1d" stroke="${OL}" stroke-width="2"/>` },
  flat: { n: "一字嘴", d: () => `<path d="M53 73 L67 73" stroke="${OL}" stroke-width="2.5" stroke-linecap="round"/>` },
  cat: { n: "貓嘴", d: () => `<path d="M52 70 Q56 75 60 70 Q64 75 68 70" stroke="${OL}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` },
  robot: { n: "機器嘴", d: () => `<rect x="49" y="68" width="22" height="9" rx="2" fill="#e5e7eb" stroke="${OL}" stroke-width="2"/><path d="M54.5 68 V77 M60 68 V77 M65.5 68 V77" stroke="${OL}" stroke-width="1.5"/>` },
  smirk: { n: "壞笑", d: () => `<path d="M52 73 Q62 75 69 68" stroke="${OL}" stroke-width="2.5" fill="none" stroke-linecap="round"/>` },
};
// ── 鬍子 ──(h:鬍子顏色,跟著臉的頭髮顏色)
const AV_BEARDS = {
  none: { n: "無", d: () => "" },
  mustache: { n: "八字鬍", d: (h) => `<path d="M60 67 Q52 63 46 69 Q52 70 60 68 Q68 70 74 69 Q68 63 60 67Z" fill="${h}" stroke="${OL}" stroke-width="1.2"/>` },
  curly: { n: "捲捲鬍", d: (h) => `<path d="M60 67 Q50 62 44 68 Q41 64 44 62 M60 67 Q70 62 76 68 Q79 64 76 62" stroke="${h === "#d9d9d9" ? "#9ca3af" : h}" stroke-width="3" fill="none" stroke-linecap="round"/>` },
  goatee: { n: "山羊鬍", d: (h) => `<path d="M55 80 Q60 92 65 80Z" fill="${h}" stroke="${OL}" stroke-width="1.2"/>` },
  full: { n: "大鬍子", d: (h) => `<path d="M31 58 Q32 90 60 94 Q88 90 89 58 Q86 74 74 76 Q60 70 46 76 Q34 74 31 58Z" fill="${h}" stroke="${OL}" stroke-width="2"/>` },
  whiskers: { n: "貓鬍鬚", d: () => `<path d="M44 66 L30 63 M44 69 L30 70 M76 66 L90 63 M76 69 L90 70" stroke="${OL}" stroke-width="1.3" stroke-linecap="round"/>` },
};
// ── 配件 ──(頭上 / 臉上 / 脖子,三處可以同時戴)
const AV_HEAD = {
  none: { n: "無", d: () => "" },
  cap: { n: "棒球帽", d: () => `<path d="M31 40 Q31 16 60 16 Q89 16 89 40Z" fill="#ef4444" stroke="${OL}" stroke-width="2"/><path d="M60 38 Q86 36 100 42 Q86 46 60 43Z" fill="#b91c1c" stroke="${OL}" stroke-width="2"/><circle cx="60" cy="17" r="2.5" fill="#fff" stroke="${OL}"/>` },
  crown: { n: "皇冠", d: () => `<path d="M40 30 L38 12 L49 22 L60 8 L71 22 L82 12 L80 30Z" fill="#facc15" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="22" r="2.5" fill="#ef4444"/>` },
  wizard: { n: "巫師帽", d: () => `<path d="M30 34 L64 -2 L90 34Z" fill="#7c3aed" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M26 34 Q60 42 94 34" stroke="${OL}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M60 16 l1.5 3 3 .4 -2.2 2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2 3 -.4Z" fill="#facc15"/>` },
  bow: { n: "蝴蝶結", d: () => `<path d="M76 26 L64 18 L64 34Z M76 26 L88 18 L88 34Z" fill="#ec4899" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><circle cx="76" cy="26" r="3.5" fill="#be185d" stroke="${OL}" stroke-width="1.5"/>` },
  antenna: { n: "天線", d: () => `<path d="M60 26 L60 6" stroke="${OL}" stroke-width="2.5"/><circle cx="60" cy="6" r="4.5" fill="#ef4444" stroke="${OL}" stroke-width="2"/>` },
  headphones: { n: "耳機", d: () => `<path d="M28 58 Q24 14 60 14 Q96 14 92 58" stroke="${OL}" stroke-width="5" fill="none"/><rect x="21" y="48" width="12" height="20" rx="5" fill="#3b82f6" stroke="${OL}" stroke-width="2"/><rect x="87" y="48" width="12" height="20" rx="5" fill="#3b82f6" stroke="${OL}" stroke-width="2"/>` },
  flower: { n: "花", d: () => [0, 72, 144, 216, 288].map((a) => `<circle cx="${80 + 6 * Math.cos((a * Math.PI) / 180)}" cy="${28 + 6 * Math.sin((a * Math.PI) / 180)}" r="4.5" fill="#f9a8d4" stroke="${OL}" stroke-width="1"/>`).join("") + `<circle cx="80" cy="28" r="3.5" fill="#facc15"/>` },
};
const AV_FACEACC = {
  none: { n: "無", d: () => "" },
  glasses: { n: "眼鏡", d: () => `<circle cx="48" cy="53" r="9" fill="#ffffff33" stroke="${OL}" stroke-width="2.2"/><circle cx="72" cy="53" r="9" fill="#ffffff33" stroke="${OL}" stroke-width="2.2"/><path d="M57 53 L63 53 M39 51 L31 49 M81 51 L89 49" stroke="${OL}" stroke-width="2.2"/>` },
  shades: { n: "墨鏡", d: () => `<path d="M38 48 L58 48 Q58 60 48 60 Q38 60 38 48Z M62 48 L82 48 Q82 60 72 60 Q62 60 62 48Z" fill="#111" stroke="${OL}" stroke-width="2"/><path d="M58 50 L62 50 M38 49 L31 47 M82 49 L89 47" stroke="${OL}" stroke-width="2"/>` },
};
const AV_NECK = {
  none: { n: "無", d: () => "" },
  tie: { n: "領帶", d: () => `<path d="M56 86 L64 86 L62 91 L66 108 L60 114 L54 108 L58 91Z" fill="#dc2626" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>` },
  bowtie: { n: "領結", d: () => `<path d="M60 90 L48 84 L48 96Z M60 90 L72 84 L72 96Z" fill="#1d4ed8" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="60" cy="90" r="3" fill="#1e3a8a"/>` },
  scarf: { n: "圍巾", d: () => `<path d="M38 84 Q60 94 82 84 L84 92 Q60 102 36 92Z" fill="#16a34a" stroke="${OL}" stroke-width="1.5"/><path d="M70 92 L76 112 L68 112 L64 94Z" fill="#16a34a" stroke="${OL}" stroke-width="1.5"/>` },
};
// ── 上衣 ──(c:上衣顏色;身體在 y 86 以下)
const AV_TOPS = {
  tee: { n: "T 恤", d: (c) => `<path d="M18 122 Q20 92 46 86 Q60 92 74 86 Q100 92 102 122Z" fill="${c}" stroke="${OL}" stroke-width="2"/>` },
  hoodie: { n: "連帽外套", d: (c) => `<path d="M16 122 Q18 90 42 84 Q60 98 78 84 Q102 90 104 122Z" fill="${c}" stroke="${OL}" stroke-width="2"/><path d="M42 84 Q60 104 78 84" stroke="${OL}" stroke-width="2" fill="none"/><path d="M54 96 L53 108 M66 96 L67 108" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` },
  suit: { n: "西裝", d: (c) => `<path d="M18 122 Q20 92 46 86 L60 104 L74 86 Q100 92 102 122Z" fill="${c}" stroke="${OL}" stroke-width="2"/><path d="M50 88 L60 104 L70 88 L66 86 L60 92 L54 86Z" fill="#fff" stroke="${OL}" stroke-width="1.5"/>` },
  jersey: { n: "球衣", d: (c) => `<path d="M18 122 Q20 92 46 86 Q60 94 74 86 Q100 92 102 122Z" fill="${c}" stroke="${OL}" stroke-width="2"/><path d="M28 104 L28 122 M92 104 L92 122" stroke="#fff" stroke-width="3"/><text x="60" y="116" font-size="16" font-weight="900" text-anchor="middle" fill="#fff" stroke="${OL}" stroke-width="0.8" font-family="sans-serif">10</text>` },
  overalls: { n: "吊帶褲", d: (c) => `<path d="M18 122 Q20 92 46 86 Q60 92 74 86 Q100 92 102 122Z" fill="#fff" stroke="${OL}" stroke-width="2"/><path d="M40 122 L42 100 L78 100 L80 122Z" fill="${c}" stroke="${OL}" stroke-width="2"/><path d="M44 100 L46 88 M76 100 L74 88" stroke="${c}" stroke-width="4"/><circle cx="46" cy="101" r="2" fill="#facc15"/><circle cx="74" cy="101" r="2" fill="#facc15"/>` },
  dress: { n: "洋裝", d: (c) => `<path d="M14 124 Q24 96 46 86 Q60 92 74 86 Q96 96 106 124Z" fill="${c}" stroke="${OL}" stroke-width="2"/><path d="M44 88 Q60 100 76 88" stroke="#fff" stroke-width="3" fill="none"/>` },
};

// 編輯器的分頁:每一頁改哪個欄位、用哪張表
const AV_TABS = [
  { k: "face", n: "臉", t: AV_FACES, color: "skin" },
  { k: "ears", n: "耳朵", t: AV_EARS },
  { k: "eyes", n: "眼睛", t: AV_EYES },
  { k: "nose", n: "鼻子", t: AV_NOSES },
  { k: "mouth", n: "嘴巴", t: AV_MOUTHS },
  { k: "beard", n: "鬍子", t: AV_BEARDS },
  { k: "acc", n: "配件", groups: [["head", "頭上", AV_HEAD], ["faceAcc", "臉上", AV_FACEACC], ["neck", "脖子", AV_NECK]] },
  { k: "top", n: "上衣", t: AV_TOPS, color: "shirt" },
];
const AV_DEFAULT = { face: "boy", skin: "#f1c27d", ears: "human", eyes: "dots", nose: "dot", mouth: "smile", beard: "none", head: "none", faceAcc: "none", neck: "none", top: "tee", shirt: "#3b82f6" };
const AV_TABLES = { face: AV_FACES, ears: AV_EARS, eyes: AV_EYES, nose: AV_NOSES, mouth: AV_MOUTHS, beard: AV_BEARDS, head: AV_HEAD, faceAcc: AV_FACEACC, neck: AV_NECK, top: AV_TOPS };
const isColor = (c) => typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c);
// 只留下表格裡有的選項、合法的顏色(別人送來的資料也要經過這裡)
function avClean(a) {
  const out = { ...AV_DEFAULT };
  if (!a || typeof a !== "object") return out;
  for (const k in AV_TABLES) if (typeof a[k] === "string" && Object.prototype.hasOwnProperty.call(AV_TABLES[k], a[k])) out[k] = a[k];
  for (const k of ["skin", "shirt"]) if (isColor(a[k])) out[k] = a[k];
  return out;
}
let avSeq = 0;
// 組出 SVG。size:顯示大小(px)
function avatarSVG(a, size) {
  const v = avClean(a),
    f = AV_FACES[v.face],
    c = v.skin,
    hair = f.hair || "#5b3a1e",
    id = "avc" + ++avSeq; // 每張圖的裁切範圍要有不同 id(不用 Math.random,遊戲模擬要可重現)
  const head = f.shape ? f.shape(c) : `<circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="${c}" stroke="${OL}" stroke-width="2.5"/>`;
  const muzzle = f.muzzle ? `<ellipse cx="60" cy="68" rx="15" ry="11" fill="#ffffffcc"/>` : "";
  return (
    `<svg viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">` +
    `<defs><clipPath id="${id}"><circle cx="60" cy="60" r="60"/></clipPath></defs>` +
    `<g clip-path="url(#${id})">` +
    `<rect width="120" height="120" fill="#c7d2fe"/>` +
    AV_TOPS[v.top].d(v.shirt) +
    `<rect x="52" y="76" width="16" height="14" fill="${c}" stroke="${OL}" stroke-width="2"/>` +
    AV_NECK[v.neck].d() +
    (f.back ? f.back(hair) : "") +
    AV_EARS[v.ears].d(c) +
    head +
    muzzle +
    (f.front ? f.front(hair) : "") +
    AV_EYES[v.eyes].d() +
    AV_NOSES[v.nose].d() +
    AV_MOUTHS[v.mouth].d() +
    AV_BEARDS[v.beard].d(hair) +
    AV_FACEACC[v.faceAcc].d() +
    AV_HEAD[v.head].d() +
    `</g></svg>`
  );
}
const myAvatar = () => avClean(P.avatar);

// ── 編輯器 ──
const avaScr = document.getElementById("avatar");
let avDraft = null,
  avTab = "face";
function openAvatar() {
  homeOn = true;
  [home, ui, shopScr, sdetail, roster, detail, acctScr, roomScr].forEach((el) => (el.style.display = "none"));
  if (typeof closeMenu === "function") closeMenu();
  avDraft = myAvatar();
  avTab = "face";
  avaScr.style.display = ""; // 版面交給 CSS(橫式手機改成左右兩欄)
  avRender();
}
function avRender() {
  document.getElementById("avPrev").innerHTML = avatarSVG(avDraft, 150);
  document.getElementById("avTabs").innerHTML = AV_TABS.map(
    (t) => `<button class="${t.k === avTab ? "on" : ""}" data-tab="${t.k}">${t.n}</button>`,
  ).join("");
  const tab = AV_TABS.find((t) => t.k === avTab);
  const grid = (key, table) =>
    '<div class="avgrid">' +
    Object.entries(table)
      .map(
        ([k, o]) =>
          `<button class="${avDraft[key] === k ? "on" : ""}" data-key="${key}" data-val="${k}" aria-label="${o.n}">${avatarSVG({ ...avDraft, [key]: k, ...(key === "face" ? faceDefaults(k) : {}) }, 64)}<small>${o.n}</small></button>`,
      )
      .join("") +
    "</div>";
  const colors = (key, list, label) =>
    `<div class="avcolors"><span>${label}</span>` +
    list.map((c) => `<button class="${avDraft[key] === c ? "on" : ""}" data-key="${key}" data-val="${c}" style="background:${c}" aria-label="顏色 ${c}"></button>`).join("") +
    "</div>";
  let h = "";
  if (tab.groups) for (const [key, label, table] of tab.groups) h += `<h4>${label}</h4>` + grid(key, table);
  else h = grid(tab.k, tab.t);
  if (tab.color === "skin") h = colors("skin", AV_SKIN, "顏色") + h;
  if (tab.color === "shirt") h = colors("shirt", AV_SHIRT, "顏色") + h;
  document.getElementById("avOpts").innerHTML = h;
}
// 選臉的時候,順便換成這張臉配的耳朵、鼻子…和預設顏色
function faceDefaults(k) {
  const f = AV_FACES[k];
  return { ...f.def, skin: f.c };
}
avaScr.addEventListener("click", (ev) => {
  const b = ev.target.closest("button");
  if (!b) return;
  if (b.dataset.tab) avTab = b.dataset.tab;
  else if (b.dataset.key) {
    if (b.dataset.key === "face") Object.assign(avDraft, faceDefaults(b.dataset.val));
    avDraft[b.dataset.key] = b.dataset.val;
  } else return;
  avRender();
});
document.getElementById("avRandom").onclick = () => {
  const pick = (t) => {
    const ks = Object.keys(t);
    return ks[(Math.random() * ks.length) | 0];
  };
  const face = pick(AV_FACES);
  avDraft = avClean({
    ...faceDefaults(face),
    face,
    eyes: pick(AV_EYES),
    mouth: pick(AV_MOUTHS),
    head: pick(AV_HEAD),
    faceAcc: Math.random() < 0.3 ? pick(AV_FACEACC) : "none",
    neck: pick(AV_NECK),
    top: pick(AV_TOPS),
    shirt: AV_SHIRT[(Math.random() * AV_SHIRT.length) | 0],
  });
  avRender();
};
document.getElementById("avSave").onclick = () => {
  P.avatar = avClean(avDraft);
  save();
  avatarUpload(); // 有登入就同步到 LootLocker 帳號(economy.js)
  if (typeof syncProfile === "function") syncProfile(); // 好友房間的朋友也會看到新頭像
  avaScr.style.display = "none";
  showHome();
};
document.getElementById("hAva").onclick = openAvatar;
document.getElementById("avBack").onclick = () => {
  avaScr.style.display = "none";
  showHome();
};
