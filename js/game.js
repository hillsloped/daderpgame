(function () {
"use strict";
// =====================================================================
// core helpers
// =====================================================================
const $ = (id) => document.getElementById(id);
const V3 = THREE.Vector3;
const pick = (a) => a[(Math.random() * a.length) | 0];
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const angWrap = (a) => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
function mulberry(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

let SEED = 1234567;
function h3(x, y, z) {
  let h = SEED ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x1b873593);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const sm = (t) => t * t * (3 - 2 * t);
function n2(x, z, o) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = sm(x - xi), zf = sm(z - zi);
  return lerp(lerp(h3(xi, o, zi), h3(xi + 1, o, zi), xf), lerp(h3(xi, o, zi + 1), h3(xi + 1, o, zi + 1), xf), zf);
}
function n3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
  return lerp(lerp(lerp(h3(xi, yi, zi), h3(xi + 1, yi, zi), xf), lerp(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), xf), yf),
    lerp(lerp(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), xf), lerp(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), xf), yf), zf);
}
function fbm(x, z, oct, off) { let s = 0, a = 1, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += n2(x * f, z * f, off + i * 131) * a; n += a; a *= 0.5; f *= 2; } return s / n; }
const stretch = (v) => clamp01((v - 0.5) * 2.4 + 0.5);

// =====================================================================
// blocks
// =====================================================================
const AIR = 0, HAPI = 1, MUD = 2, ROK = 3, WAAD = 4, BUG = 5, PLANKS = 6, WALL = 7, CARPET = 8, CEIL = 9, LIGHT = 10,
  ORE = 11, POLE = 12, SAND = 13, WATER = 14, LAVA = 15, EVIL = 16, HELLROK = 17, BEDROK = 18, KOLE = 19, IRUN = 20,
  GOALD = 21, BLU = 22, BRICK = 23, HBRICK = 24, FROST = 25, VINE = 26, FIRE = 27, FLOWER = 28, PORTAL = 29, EXIT = 30,
  TOILET = 31, SNEAKERS = 32, RAMP = 33, CHEST = 34, CHEST_OPEN = 35, GLOCKF = 36, CHEST_BIG = 37;
const NT = 30;
const BLOCK_NAME = { 1: "Hapi Boi", 2: "Mud Bread", 3: "Rok", 4: "Waad", 5: "Bug Food", 6: "Waad Planks", 7: "Moist Wallpaper", 8: "Damp Carpet", 9: "Ceiling (load-bearing?)", 10: "Buzzing Light",
  11: "Cinderelly Ore", 12: "Cinderelly (do not touch)", 13: "Sandd", 14: "Wet", 15: "Hot Wet", 16: "Evil Grass", 17: "Hellrok", 18: "Bedrok", 19: "Kole", 20: "Irun Ore", 21: "Goald Ore", 22: "Blu Rok",
  23: "Rok Brick", 24: "Hell Brick", 25: "Frosting", 26: "Vine", 27: "Fire", 28: "Flowur", 29: "Backrooms Portal", 30: "Exit Portal", 31: "Toilet", 32: "Sneakers", 33: "Waad Ramp", 34: "Chest", 35: "Empty Chest", 36: "Glock Flower", 37: "Big Chest" };
const BLOCK_COLOR = { 1: 0xc4ff99, 2: 0xb06a3f, 3: 0x8f8cc4, 4: 0x8a3fb8, 5: 0xff4fb3, 6: 0xc9a8f0, 7: 0xd8c66e, 8: 0x9c8a45, 9: 0xece6c8, 10: 0xfffdf0, 11: 0xff4fd8, 12: 0xff2bd6, 13: 0xffe08a, 14: 0x3d7bff, 15: 0xff6a00,
  16: 0xe0213c, 17: 0x7a1a2e, 18: 0x2b2b33, 19: 0x55546e, 20: 0xb8a68f, 21: 0xffd23f, 22: 0x3df2ff, 23: 0x9e9bd0, 24: 0x5c1020, 25: 0xf4fbff, 26: 0x4fd66b, 27: 0xffb02e, 28: 0xff7be6, 29: 0xffe27a, 30: 0x7ff0ff,
  31: 0xf4f4f8, 32: 0xd9a07a, 33: 0xc9a8f0, 34: 0xb07a3a, 35: 0xb07a3a, 36: 0x4fd66b, 37: 0xffd23f };
const SPECIAL = new Uint8Array(64); [TOILET, SNEAKERS, RAMP, CHEST, CHEST_OPEN, GLOCKF, CHEST_BIG].forEach((b) => (SPECIAL[b] = 1));
const CROSS = new Uint8Array(64); [VINE, FIRE, FLOWER].forEach((b) => (CROSS[b] = 1));
const TRANS = new Uint8Array(64); [WATER, PORTAL, EXIT].forEach((b) => (TRANS[b] = 1));
const OPAQUE = new Uint8Array(64); for (let b = 1; b < 64; b++) OPAQUE[b] = !SPECIAL[b] && !CROSS[b] && !TRANS[b] && b !== LAVA && b <= 37 ? 1 : 0;
const SOLIDB = new Uint8Array(64); for (let b = 1; b < 64; b++) SOLIDB[b] = (OPAQUE[b] || b === TOILET || b === SNEAKERS || b === CHEST || b === CHEST_OPEN || b === CHEST_BIG) ? 1 : 0;
const blocksMove = (b) => SOLIDB[b] === 1;
const UNBREAK = (b) => b === WALL || b === CARPET || b === POLE || b === BEDROK || b === PORTAL || b === EXIT || b === WATER || b === LAVA;
const BLOCK_ITEM = { 1: "hapi", 2: "mud", 3: "rok", 4: "waad", 5: "bug", 6: "planks", 11: "ore", 13: "sand", 16: "evil", 17: "hellrok", 19: "kole", 20: "irun", 21: "goald", 22: "blu", 23: "brick", 24: "hbrick", 25: "frost", 26: "vine", 28: "flower", 31: "toilet", 32: "sneakers", 33: "ramp", 36: "glockf", 34: "planks", 35: "planks", 37: "goald" };
const HARD = { 1: 0.6, 2: 0.6, 3: 1.4, 4: 1.5, 5: 0.3, 6: 1.5, 9: 1.2, 10: 1.2, 11: 2.0, 13: 0.5, 16: 0.7, 17: 1.0, 19: 1.6, 20: 2.0, 21: 2.2, 22: 3.0, 23: 2.0, 24: 2.0, 25: 0.4, 26: 0.2, 27: 0.05, 28: 0.05,
  31: 0.8, 32: 1.0, 33: 1.0, 34: 1.2, 35: 1.2, 36: 0.3, 37: 1.5 };
const NEEDS = { 3: 1, 11: 1, 17: 1, 19: 1, 20: 1, 21: 1, 22: 2, 23: 1, 24: 1 };

function paintTile(id) {
  const c = document.createElement("canvas"); c.width = c.height = 16;
  const g = c.getContext("2d");
  const f = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w || 1, h || 1); };
  const r = mulberry(id * 977 + 13);
  const hex = (n) => "#" + n.toString(16).padStart(6, "0");
  const spots = (base, col, hi, n) => { f(base, 0, 0, 16, 16); for (let i = 0; i < n; i++) { const x = 1 + ((r() * 13) | 0), y = 1 + ((r() * 13) | 0); f(col, x, y, 2, 2); if (hi) f(hi, x, y); } };
  const bricks = (base, mortar) => { f(base, 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { f(mortar, 0, y + 3, 16, 1); const o = (y / 4) % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) f(mortar, x, y, 1, 3); } };
  switch (id) {
    case PLANKS: { const L = "#c9a8f0", Dk = "#a985d6"; f(L, 0, 0, 16, 16); for (let row = 0; row < 4; row++) { const y0 = row * 4; f(Dk, 0, y0 + 3, 16, 1); f(Dk, row % 2 ? 4 : 11, y0, 1, 3); f(Dk, (row * 5 + 1) % 14, y0 + 1, 2, 1); f(Dk, (row * 7 + 8) % 14, y0 + 1, 1, 1); } break; }
    case WALL: f("#d8c66e", 0, 0, 16, 16); for (let x = 1; x < 16; x += 4) f("#cbb85c", x, 0, 1, 16); for (let y = 3; y < 16; y += 8) for (let x = 3; x < 16; x += 8) f("#c3af55", x, y); break;
    case CARPET: f("#9c8a45", 0, 0, 16, 16); for (let i = 0; i < 40; i++) f("#8c7a3b", (r() * 16) | 0, (r() * 16) | 0); for (let i = 0; i < 14; i++) f("#a89650", (r() * 16) | 0, (r() * 16) | 0); break;
    case CEIL: f("#ece6c8", 0, 0, 16, 16); f("#cfc8a6", 0, 0, 16, 1); f("#cfc8a6", 0, 0, 1, 16); break;
    case LIGHT: f("#e2dbb8", 0, 0, 16, 16); f("#fffdf0", 1, 1, 14, 14); break;
    case ORE: spots("#8f8cc4", "#ff2bd6", "#ffa6f0", 7); break;
    case POLE: f("#ff2bd6", 0, 0, 16, 16); f("#ff7be6", 3, 0, 2, 16); f("#ff7be6", 11, 0, 1, 16); break;
    case KOLE: spots("#8f8cc4", "#1d1e21", "#3a3b40", 8); break;
    case IRUN: spots("#8f8cc4", "#e8c9a0", "#fff1dc", 6); break;
    case GOALD: spots("#8f8cc4", "#ffd23f", "#fff3a8", 6); break;
    case BLU: spots("#8f8cc4", "#3df2ff", "#d8ffff", 5); break;
    case BRICK: bricks("#9e9bd0", "#7f7cb0"); break;
    case HBRICK: bricks("#5c1020", "#3a0814"); break;
    case BEDROK: f("#2b2b33", 0, 0, 16, 16); for (let i = 0; i < 30; i++) f(r() < 0.5 ? "#1b1b22" : "#3e3e48", (r() * 15) | 0, (r() * 15) | 0, 2, 2); break;
    case HELLROK: f("#7a1a2e", 0, 0, 16, 16); for (let i = 0; i < 16; i++) f("#621224", (r() * 15) | 0, (r() * 15) | 0, 2, 1); break;
    case WATER: g.fillStyle = "rgba(61,123,255,0.78)"; g.fillRect(0, 0, 16, 16); g.fillStyle = "rgba(160,200,255,0.5)"; g.fillRect(2, 3, 5, 1); g.fillRect(9, 10, 5, 1); break;
    case LAVA: f("#ff6a00", 0, 0, 16, 16); for (let i = 0; i < 9; i++) f("#ffc23d", (r() * 14) | 0, (r() * 14) | 0, 3, 2); for (let i = 0; i < 6; i++) f("#d43a00", (r() * 14) | 0, (r() * 14) | 0, 2, 2); break;
    case VINE: for (let k = 0; k < 4; k++) { let x = 2 + k * 4; for (let y = 0; y < 16; y++) { f("#4fd66b", x, y); if (r() < 0.3) f("#2f9e4a", x + 1, y); if (r() < 0.25) x += r() < 0.5 ? -1 : 1; x = clamp(x, 0, 15); } } break;
    case FIRE: {
      const cols = ["#ff4a1c", "#ff8a1c", "#ffd23f"];
      for (let k = 0; k < 3; k++) { const s = 6 - k * 2; for (let x = 0; x < 16; x++) { const hgt = Math.max(0, (Math.sin(x * 0.9 + k) * 0.5 + 0.5) * (13 - k * 3) + 2); g.fillStyle = cols[k]; g.fillRect(x, 16 - hgt, 1, hgt); } void s; }
      break;
    }
    case FLOWER: f("#4fd66b", 7, 7, 2, 9); f("#4fd66b", 4, 11, 3, 1); f("#4fd66b", 9, 9, 3, 1); f("#ff7be6", 5, 2, 6, 4); f("#ff7be6", 6, 1, 4, 6); f("#ffd23f", 7, 3, 2, 2); break;
    case PORTAL: g.fillStyle = "rgba(255,226,122,0.6)"; g.fillRect(0, 0, 16, 16); g.fillStyle = "rgba(255,250,210,0.7)"; for (let i = 0; i < 5; i++) g.fillRect((r() * 14) | 0, (r() * 14) | 0, 2, 2); break;
    case EXIT: g.fillStyle = "rgba(127,240,255,0.6)"; g.fillRect(0, 0, 16, 16); g.fillStyle = "rgba(230,255,255,0.75)"; for (let i = 0; i < 5; i++) g.fillRect((r() * 14) | 0, (r() * 14) | 0, 2, 2); break;
    default: f(hex(BLOCK_COLOR[id] || 0xff00ff), 0, 0, 16, 16);
  }
  return c;
}
const tileCanvas = {};
const atlasCanvas = document.createElement("canvas");
atlasCanvas.width = 16 * NT; atlasCanvas.height = 16;
{ const g = atlasCanvas.getContext("2d"); for (let id = 1; id <= NT; id++) { tileCanvas[id] = paintTile(id); g.drawImage(tileCanvas[id], (id - 1) * 16, 0); } }
for (const id of [TOILET, SNEAKERS, CHEST, CHEST_OPEN, CHEST_BIG, GLOCKF]) tileCanvas[id] = paintTile(id);
tileCanvas[RAMP] = tileCanvas[PLANKS];
const atlasTex = new THREE.CanvasTexture(atlasCanvas);
atlasTex.magFilter = THREE.NearestFilter; atlasTex.minFilter = THREE.NearestFilter; atlasTex.generateMipmaps = false;
const tileU = (id, c) => ((id - 1) * 16 + 0.02 + c * 15.96) / (16 * NT);

// =====================================================================
// items
// =====================================================================
const TIER = {
  waad: { a: "#c9a8f0", b: "#a985d6" }, irun: { a: "#eeeef4", b: "#a8a8bc" }, blu: { a: "#8ff4ff", b: "#2bb5d6" }, hell: { a: "#ff8a3c", b: "#c0262c" },
  sherman: { a: "#6f7b46", b: "#4f5a30" }, tiger: { a: "#9a9a88", b: "#ff8a1c" }, liltonk: { a: "#d9c08a", b: "#a8905a" },
};
const ITEMS = {
  hapi: { name: "Hapi Boi", block: HAPI }, mud: { name: "Mud Bread", block: MUD }, rok: { name: "Rok", block: ROK }, waad: { name: "Waad", block: WAAD }, bug: { name: "Bug Food", block: BUG },
  planks: { name: "Waad Planks", block: PLANKS }, ore: { name: "Cinderelly Ore", block: ORE }, sand: { name: "Sandd", block: SAND }, evil: { name: "Evil Grass", block: EVIL }, hellrok: { name: "Hellrok", block: HELLROK },
  brick: { name: "Rok Brick", block: BRICK }, hbrick: { name: "Hell Brick", block: HBRICK }, frost: { name: "Frosting", block: FROST },
  vine: { name: "Vine", block: VINE, sprite: "vine" }, flower: { name: "Flowur", block: FLOWER, sprite: "flower" }, glockf: { name: "Glock Flower", block: GLOCKF, sprite: "glockf" },
  toilet: { name: "Toilet", block: TOILET, sprite: "toilet", stack: 16 }, sneakers: { name: "Sneakers", block: SNEAKERS }, ramp: { name: "Waad Ramp", block: RAMP, sprite: "ramp" },
  stick: { name: "Stick", sprite: "stick" }, kole: { name: "Kole", sprite: "lump", pal: { m: "#3a3b40", s: "#1d1e21", r: "#55546e" } },
  irun: { name: "Irun Chunk", sprite: "lump", pal: { m: "#e8c9a0", s: "#b8a68f", r: "#fff1dc" } }, goald: { name: "Goald Nugget", sprite: "lump", pal: { m: "#ffd23f", s: "#d99a1c", r: "#fff3a8" } },
  blu: { name: "Blu Rok", sprite: "gem" },
  pickaxe: { name: "Waad Pickaxe", sprite: "pickaxe", pal: TIER.waad, stack: 1, tool: "pick", tier: 1, speed: 0.6 },
  irunpick: { name: "Irun Pickaxe", sprite: "pickaxe", pal: TIER.irun, stack: 1, tool: "pick", tier: 2, speed: 0.38 },
  blupick: { name: "Blu Pickaxe", sprite: "pickaxe", pal: TIER.blu, stack: 1, tool: "pick", tier: 3, speed: 0.22 },
  sword: { name: "Waad Sword", sprite: "sword", pal: TIER.waad, stack: 1, tool: "sword", dmg: 7 },
  irunsword: { name: "Irun Sword", sprite: "sword", pal: TIER.irun, stack: 1, tool: "sword", dmg: 9 },
  blusword: { name: "Blu Sword", sprite: "sword", pal: TIER.blu, stack: 1, tool: "sword", dmg: 12 },
  hellsword: { name: "Hell Sword", sprite: "sword", pal: TIER.hell, stack: 1, tool: "sword", dmg: 14, burn: true },
  bonk: { name: "Bonk Bat", sprite: "bonk", stack: 1, tool: "sword", dmg: 6, bonk: true },
  helmet: { name: "Waad Helmet", sprite: "helmet", pal: TIER.waad, stack: 1, armor: 0, pts: 1 }, chest: { name: "Waad Chestplate", sprite: "chestp", pal: TIER.waad, stack: 1, armor: 1, pts: 3 },
  legs: { name: "Waad Pants", sprite: "legs", pal: TIER.waad, stack: 1, armor: 2, pts: 2 }, boots: { name: "Waad Boots", sprite: "boots", pal: TIER.waad, stack: 1, armor: 3, pts: 1 },
  irunhelm: { name: "Irun Helmet", sprite: "helmet", pal: TIER.irun, stack: 1, armor: 0, pts: 2 }, irunchest: { name: "Irun Chestplate", sprite: "chestp", pal: TIER.irun, stack: 1, armor: 1, pts: 6 },
  irunlegs: { name: "Irun Pants", sprite: "legs", pal: TIER.irun, stack: 1, armor: 2, pts: 5 }, irunboots: { name: "Irun Boots", sprite: "boots", pal: TIER.irun, stack: 1, armor: 3, pts: 2 },
  guymask: { name: "Guy Mask", sprite: "guymask", stack: 1, armor: 0, pts: 5 },
  hook: { name: "Grappling Hook", sprite: "hook", stack: 1, tool: "hook" },
  rifle: { name: "Slop-47", sprite: "rifle", stack: 1, tool: "rifle" }, rifle2: { name: "Slop-47 Multishot", sprite: "rifle2", stack: 1, tool: "rifle2" },
  rpg: { name: "iPod RPG", sprite: "rpg", stack: 1, tool: "rpg" }, shotgun: { name: "Ditch's Pump Shotgun", sprite: "shotgun", stack: 1, tool: "shotgun" },
  chikcannon: { name: "Chicken Cannon", sprite: "chikcannon", stack: 1, tool: "chikcannon" },
  poopy: { name: "Poopy", sprite: "poopy", stack: 16 },
  ipod: { name: "iPod", sprite: "ipod", heal: 4, esp: 25, anyArmor: true, pts: 2 }, nugget: { name: "Chikn Nugget", sprite: "nugget", heal: 4 },
  skateboard: { name: "Skateboard", sprite: "skateboard", stack: 1, tool: "skate" }, book: { name: "Recipe Book", sprite: "book", stack: 1, tool: "book" },
  heli: { name: "Helicopter", sprite: "heli", stack: 1, vehicle: "heli" },
  v_sherman: { name: "M4 Sherman", sprite: "tank", pal: TIER.sherman, stack: 1, vehicle: "tank", variant: "sherman" },
  v_tiger: { name: "Tiger Tonk", sprite: "tank", pal: TIER.tiger, stack: 1, vehicle: "tank", variant: "tiger" },
  v_liltonk: { name: "Lil Tonk", sprite: "tank", pal: TIER.liltonk, stack: 1, vehicle: "tank", variant: "liltonk" },
  v_mech: { name: "Mech", sprite: "mech", stack: 1, vehicle: "mech" }, v_clanker: { name: "Clanker", sprite: "jet", stack: 1, vehicle: "clanker" },
};
for (const k in ITEMS) { ITEMS[k].id = k; if (!ITEMS[k].stack) ITEMS[k].stack = 64; }

const PAL = { k: "#2b1240", a: "#c9a8f0", b: "#a985d6", h: "#6e4a9e", s: "#b8b8c4", r: "#d8c9a3", g: "#3a3b40", d: "#1d1e21", w: "#8a4a22", o: "#9c4a1c", e: "#4a1f3d", p: "#ff4fb3", W: "#ffffff",
  n: "#6b3d1e", N: "#b07a3a", l: "#eeeef3", m: "#c7c7d1", v: "#7fb4ff", y: "#ffd23f", q: "#e03a3a", G: "#5f6b3a", L: "#8f8cc4", D: "#6c69a3", t: "#f4f4f8", T: "#c9c9d6", P: "#ff2bd6",
  c: "#8ff4ff", C: "#2bb5d6", f: "#4fd66b", F: "#2f9e4a", O: "#ff8c1a" };
const SPRITES = {
  stick: ["", "", "", "............kk", "...........kbk", "..........kak", ".........kbk", "........kak", ".......kbk", "......kak", ".....kbk", "....kak", "...kbk", "...kk"],
  pickaxe: ["", "....kkkkkkk", "...kaaaaaaak", "....kkbbbaaak", ".......kkbbak", "........khkbak", ".......khk.kak", "......khk...kak", ".....khk....kk", "....khk", "...khk", "..khk", ".khk", ".kk"],
  sword: ["", "............kkk", "...........kaak", "..........kabk", ".........kabk", "........kabk", ".......kabk", "..kk..kabk", "..kbkkabk", "...kbbbk", "....khk", "...khkbk", "..khk.kk", "..kk"],
  helmet: ["", "", "", "....kkkkkkkk", "...kaaaaaaaak", "..kabbbbbbbbak", "..kab......bak", "..kab......bak", "..kkk......kkk"],
  chestp: ["", "...kkk....kkk", "..kaak....kaak", "..kabkkkkkkbak", "..kabaaaaaabak", "..kkbaaaaaabkk", "....kaaaaaak", "....kabbbbak", "....kaaaaaak", "....kabbbbak", "....kaaaaaak", "....kkkkkkkk"],
  legs: ["", "", "....kkkkkkkk", "....kaaaaaak", "....kbbbbbbk", "....kaakkaak", "....kaakkaak", "....kabkkbak", "....kaakkaak", "....kabkkbak", "....kaakkaak", "....kkkkkkkk"],
  boots: ["", "", "", "", "", "", "...kkk....kkk", "...kak....kak", "...kak....kak", "..kbak....kabk", ".kaaak....kaaak", ".kkkkk....kkkkk"],
  hook: ["", ".........k.k.k", "........ks.s.sk", "........ks.s.sk", ".........ksssk", "..........ksk", "..........ksk", ".........krk", "........krk", ".......krk", "......krrk", ".....krk.rk", "....krk...rk", "...krk.....k", "..krk", "..kk"],
  rifle: ["", "", "", "", "......k......k", "..kkkkkkkkkkkkkk", "kwwwkgggggwwwddd", "kwwwgggggggwwk", "kwwk.kgokkkkk", "kwk..kwook", ".k...kk.ook", ".........kook", "..........kk"],
  rifle2: ["", "", "", "....kkkkk", "....kPPPk....k", "..kkkkkkkkkkkkkk", "kwwwkgggggPPPddd", "kwwwgggggggPPkdd", "kwwk.kgPkkkkkk", "kwk..kwPPk", ".k...kk.PPk", ".........kPPk", "..........kk"],
  rpg: ["", "", "", "", "", "..kkkkkkkkkkkkk", "kkGGGGGGGGGGGGqk", "kkGGGGGGGGGGGGqk", "..kkkkGkkkkkkkk", ".....kdk.kdk", ".....kdk.kk", ".....kk"],
  shotgun: ["", "", "", "", "", "kkkkkkkkkkkkkkk", "kwwkddddddddddd", "kwwwkddddddddk", "kwwk.kkNNNNNkk", ".kwk..kNNNNNk", "..kk...kkkkk"],
  toilet: ["", "..kkkkk", "..ktttk", "..ktTtk", "..ktttkkkkkkkk", "..kttttttttttk", "..kTttttttttTk", "...kTttttttTk", "....kTTTTTTk", ".....kttttk", ".....kttttk", "....kTTTTTTk", "....kkkkkkkk"],
  ramp: ["", "", "", "............kk", "..........kkak", "........kkaaak", "......kkaabaak", "....kkaaaaaaak", "..kkabaaabaaak", ".kaaaaaaaaaaak", ".kbbbbbbbbbbbk", ".kkkkkkkkkkkkk"],
  poopy: ["", "", ".......kk", "......knNk", ".....knnnk", "......kkkk", "....knNnnnk", "...knnnnNnnk", "..knNnnnnnnnk", "..knnnnnNnnnk", ".knnnNnnnnnnnk", ".kkkkkkkkkkkkk"],
  ipod: ["", "....kkkkkkkk", "....kllllllk", "....klvvvvlk", "....klvvvvlk", "....klvvvvlk", "....kllllllk", "....kllmmllk", "....klmllmlk", "....klmllmlk", "....kllmmllk", "....kllllllk", "....kkkkkkkk"],
  nugget: ["", "", "", "", "", ".....kkkkk", "....kyyoyyk", "...kyoyyyoyk", "...kyyyyoyyk", "....kyyyyyk", ".....kkkkk"],
  skateboard: ["", "", "", "", "", "", ".kk..........kk", ".kpkkkkkkkkkkpk", "..kppppppppppk", "...kkkkkkkkkk", "....ks....ks", "...kddk..kddk", "....kk....kk"],
  heli: ["", "kkkkkkkkkkkkkk", "......kk", "....kkLLkk", "...kvvLLLLkkkkkk", "..kvvvLLLLLLLLDk", "..kvvLLLLLLkkkkk", "...kLLLLLLk", "....kkkkkk", "...k.k..k.k", "..kkkkkkkkkk"],
  book: ["", "", "...kkkkkkkkkk", "...kqqqqqqqqqk", "...kqyyyyyyyqk", "...kqqqqqqqqqk", "...kqyyyyyqqqk", "...kqqqqqqqqqk", "...kqqqqqqqqqk", "...kqqqqqqqqqk", "...kqqqqqqqqqk", "...ktttttttttk", "...kkkkkkkkkkk"],
  lump: ["", "", "", "", ".....kkkk", "...kkmsmkk", "..kmsmmrmk", "..ksmmmmsmk", "..kmmmsmmmk", "...kmmmmsk", "....kkkkk"],
  gem: ["", "", "......kkkk", ".....kccWck", "....kccccccck", "...kcCCccCCcck", "...kkkkkkkkkkk", "....kcCccCck", ".....kccCck", "......kcck", ".......kk"],
  flower: ["", "", "", "......kk", ".....kppk", "....kpypk", ".....kppk", "......kfk", "......kfk", "....kkkfkkfk", "....kffkffk", "......kfk", "......kfk", "......kkk"],
  glockf: ["", "", "..........kkkkk", "......kk..kggggk", ".....kppkkkgkkk", "....kpypk.kgk", ".....kppk..kk", "......kfk", "......kfk.kk", "....kkkfkkfk", "....kffkffk", "......kfk", "......kfk", "......kkk"],
  vine: ["....kk", "...kfk", "...kfk..kk", "....kfkkfk", "....kffffk", ".....kfk", "....kfk", "...kfk.kk", "...kfkkfk", "....kfffk", "......kfk", ".....kfk", "....kfk", "....kk"],
  chikcannon: ["", "", "....kkk", "...kqqk", "..kkWWWk", ".kyWkWWk", "..kWWWWWkkk", "...kWWWWWWWk", "...kWWlWWWWk", "....kWWWWWk", ".....kkkkk", "......kOk.kO", "......kOk.k"],
  bonk: ["", "............kkk", "...........kNNNk", "..........kNwNNk", ".........kNwNNk", "........kNwNNk", ".......kNwNNk", "......kNwNk", ".....kNwNk", "....kwNk", "...knk", "..knk", ".knk", ".kk"],
  guymask: ["", "....kkkkkkkk", "...kmmmmmmmmk", "..kmmmmmmmmmmk", "..kmmkkmmkkmmk", "..kmmkkmmkkmmk", "..kmmmmmmmmmmk", "..kmmmmkkmmmmk", "...kmmmmmmmmk", "...kmmkkkkmmk", "....kmmmmmmk", ".....kkkkkk"],
  tank: ["", "", "", "", "....kkkkk", "...kaaaaakkkkkkk", "...kaaaaabbbbbbk", "..kkkkkkkkkkk", ".kaaaaaaaaaaak", "kbbbbbbbbbbbbbk", "kdkdkdkdkdkdkdk", ".kkkkkkkkkkkkk"],
  mech: ["", "....kkkkk", "...kLLLLLk", "...kLqLqLk", "..kkLLLLLkk", ".kLkkkkkkkLk", ".kLkLLLLLkLk", ".kk.kLLLk.kk", "....kLkLk", "...kLk.kLk", "...kLk.kLk", "..kkk...kkk"],
  jet: ["", "", "", "..k", "..kk.........kk", "..kLk.......kLk", "..kLLkkkkkkkLLk", ".kLLLLLLLLLLLLvvk", "..kkkLLLLLLLkkkk", "......kLLLk", ".......kLk", "........k"],
};
for (const k in SPRITES) { SPRITES[k] = SPRITES[k].map((r) => r.padEnd(16, ".").slice(0, 16)); while (SPRITES[k].length < 16) SPRITES[k].push("................"); }

const PW = ["planks", "waad"];
const RECIPES = [
  { shapeless: ["waad"], out: ["planks", 4] },
  { shape: ["P", "P"], key: { P: ["planks"] }, out: ["stick", 4] },
  { shapeless: ["planks", "bug"], out: ["book", 1] },
  { shape: ["PPP", ".S.", ".S."], key: { P: ["planks"], S: ["stick"] }, out: ["pickaxe", 1] },
  { shape: ["III", ".S.", ".S."], key: { I: ["irun"], S: ["stick"] }, out: ["irunpick", 1] },
  { shape: ["BBB", ".S.", ".S."], key: { B: ["blu"], S: ["stick"] }, out: ["blupick", 1] },
  { shape: ["P", "P", "S"], key: { P: ["planks"], S: ["stick"] }, out: ["sword", 1] },
  { shape: ["I", "I", "S"], key: { I: ["irun"], S: ["stick"] }, out: ["irunsword", 1] },
  { shape: ["B", "B", "S"], key: { B: ["blu"], S: ["stick"] }, out: ["blusword", 1] },
  { shape: ["PPP", "P.P"], key: { P: PW }, out: ["helmet", 1] },
  { shape: ["P.P", "PPP", "PPP"], key: { P: PW }, out: ["chest", 1] },
  { shape: ["PPP", "P.P", "P.P"], key: { P: PW }, out: ["legs", 1] },
  { shape: ["P.P", "P.P"], key: { P: PW }, out: ["boots", 1] },
  { shape: ["III", "I.I"], key: { I: ["irun"] }, out: ["irunhelm", 1] },
  { shape: ["I.I", "III", "III"], key: { I: ["irun"] }, out: ["irunchest", 1] },
  { shape: ["III", "I.I", "I.I"], key: { I: ["irun"] }, out: ["irunlegs", 1] },
  { shape: ["I.I", "I.I"], key: { I: ["irun"] }, out: ["irunboots", 1] },
  { shape: ["P..", "PP.", "PPP"], key: { P: ["planks"] }, out: ["ramp", 4] },
  { shape: ["PPP", "R.R"], key: { P: ["planks"], R: ["rok"] }, out: ["skateboard", 1] },
  { shapeless: ["flower", "irun", "kole"], out: ["glockf", 1] },
  { shapeless: ["stick", "pickaxe"], out: ["hook", 1] },
  { shapeless: ["hook", "rok"], out: ["rifle", 1] },
  { shapeless: ["rifle", "ipod", "ipod", "ipod"], out: ["rifle2", 1] },
  { shape: ["IIIII"], key: { I: ["ipod"] }, out: ["rpg", 1] },
  { shape: ["RRRRR", "..R..", ".RRR.", "RRRRR", ".R.R."], key: { R: ["rok"] }, out: ["heli", 1] },
  { shape: ["S", "S", "S"], key: { S: ["bug"] }, out: ["vine", 6] },
];
//CRAFT-START
function matchRecipe(grid) {
  let minx = 5, miny = 5, maxx = -1, maxy = -1;
  const ids = [];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    const s = grid[y * 5 + x]; if (!s) continue;
    ids.push(s.id); minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
  }
  if (!ids.length) return null;
  const w = maxx - minx + 1, h = maxy - miny + 1;
  const cell = (x, y) => { const s = grid[(miny + y) * 5 + minx + x]; return s ? s.id : null; };
  for (const r of RECIPES) {
    if (r.shapeless) {
      if (r.shapeless.length !== ids.length) continue;
      if ([...ids].sort().join(",") === [...r.shapeless].sort().join(",")) return { id: r.out[0], n: r.out[1] };
      continue;
    }
    if (r.shape.length !== h || r.shape[0].length !== w) continue;
    for (const mirror of [false, true]) {
      let ok = true;
      for (let y = 0; y < h && ok; y++) for (let x = 0; x < w && ok; x++) {
        const ch = r.shape[y][mirror ? w - 1 - x : x], id = cell(x, y);
        if (ch === ".") { if (id) ok = false; } else if (!id || !r.key[ch].includes(id)) ok = false;
      }
      if (ok) return { id: r.out[0], n: r.out[1] };
    }
  }
  return null;
}
//CRAFT-END

// icons
const iconCache = {}, iconCanvas = {};
function drawSprite(g, map, scale, ox, oy, pal) {
  for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) {
    const ch = map[y][x]; if (ch === ".") continue;
    const col = (pal && pal[ch]) || PAL[ch]; if (!col) continue;
    g.fillStyle = col; g.fillRect(ox + x * scale, oy + y * scale, scale, scale);
  }
}
function iconCanvasFor(id) {
  if (iconCanvas[id]) return iconCanvas[id];
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  const it = ITEMS[id];
  if (it.sprite) drawSprite(g, SPRITES[it.sprite], 2, 0, 0, it.pal);
  else {
    const t = tileCanvas[it.block];
    const face = (a, b, cc, d, e, f, dark) => { g.setTransform(a, b, cc, d, e, f); g.drawImage(t, 0, 0, 16, 16); if (dark) { g.fillStyle = "rgba(0,0,0," + dark + ")"; g.fillRect(0, 0, 16, 16); } };
    face(1, -0.5, 1, 0.5, 0, 8, 0); face(1, 0.5, 0, 1, 0, 8, 0.22); face(1, -0.5, 0, 1, 16, 16, 0.4);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  return (iconCanvas[id] = c);
}
function iconFor(id) { return iconCache[id] || (iconCache[id] = iconCanvasFor(id).toDataURL()); }
function smallIcon(map) { const c = document.createElement("canvas"); c.width = c.height = map.length; drawSprite(c.getContext("2d"), map, 1, 0, 0); return c.toDataURL(); }
const HEART = [".kk.kk.", "kWpkppk", "kpppppk", "kpppppk", ".kpppk.", "..kpk..", "...k..."];
const ARMOR = ["kk...kk", "kakkkak", "kaaaaak", "kabbbak", ".kaaak.", ".kabak.", ".kkkkk."];
const halfOf = (m) => m.map((r) => r.split("").map((ch, x) => (x >= 4 && "pWab".includes(ch) ? "e" : ch)).join(""));
const emptyOf = (m) => m.map((r) => r.replace(/[pWab]/g, "e"));
const HEART_IMG = { full: smallIcon(HEART), half: smallIcon(halfOf(HEART)), empty: smallIcon(emptyOf(HEART)) };
const ARMOR_IMG = { full: smallIcon(ARMOR), half: smallIcon(halfOf(ARMOR)), empty: smallIcon(emptyOf(ARMOR)) };

const SNEAK_SRC = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCACAAIADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDs3iweOlN2nGMVHLq9nnh2/wC+DUf9sWuPvN/3wa6eVnNctBTinbMdKqrq9qf4m/74NO/tW1/vt/3waGmUn1JypzyKMc5xUJ1S1z95/wDvg0f2lbDqz/8AfBpcrL5kThTmnhDVUalb56v/AN8mnDUrbuzf98mlbuLmLSiqOreI9I8ORrLq16lnG5wJJFbb+JAwPxqdNStQeXb/AL4NTG+sponilxJE42ujoSrA9iMc1LjK10UpLqSafe2mq2q3VhdQXdu/SWFw6n8RU7KVHSvmTxJFf/C3xhcv4cu5rXy3E0BAOyeBudjr0bbyOeoHrX0D4T8YWfinw7ZasoETXCYkiGT5cgOGX8+nsRU0530KqU3Fc3Q2CPlqNlzXk3xD+Mt4msjw14LEUt3u8ua8MfmbZM42RqeCQeCTnnjsTXY+Ev7a020z4m8Rx6pcyKrFFtlQQNjlQy/eHviqTu7EOOl2dGy4pqx7j71E2q2ZP+u/Q0seqWWf9aPyNaWM9C5KgxnAqLaPQflVuVAKi24qbsaSIwo6YH5Uuznj+VSLGT0ptzPDYxGWeQKP1P0qJTsrtlxg5O0UAi7nGB7Vk3vizw/YF1n1S13p1jjbe2fTC5rj/HHima/iNnbl47cn5gDjf9a4mw0yS6J2DAHXFedUzJJ+5qerSyttXnoei3HxTs1ciz0u4mjH8cjhM/hg07T/AIjzX0+z/hH5ChP3knHH5rXNWejxpGu7kA102mrDbxqI14zg8VxyzOqdscspdjq7TVrWdA8sU1tn/novH5jNasCpKu6Mq6+qnIrmVYT4VidvTFXYdPjVGa2kaGXHDRsRirp5pO9pIieUwfwOx4Z+0TrsMXjJLGDa0kFmiTf7JYlsfXBFc34d+Kt34Y8B6hodhvF9e3G5J/8An3jKYcr/ALRwMenJ64qp8XPDWraP4qu7zUpJLn7ZIZfPbncT2P5Vw27jGTXpQakuZdTyp80XyS6HuXwV0vRfDthJ408TXlpY+cWhsPtDgMwHDyKvU91BA/vV2178dvAlrKYxd3k5zgtFaNt+vOK+YbWO91S7gtrdLi6uGxHDEgLufRVHX8BXsHh39nLXdUVLvXLyHR0YA+RtE034gHav0JNaJtbENRlue2eHPEWieLLD7fot5FeQA7W2jDRt6Mp5U/WtaOJC2No/KvNtA+DVx4Fv49W8PeI7mW4UqtxazwqkN1Fn5kO08HuD2NenIPn6GtYyezMZRW6KUtzek4Nlj/toKj8287Wf/kQVrSRgHkc1HjsKbkl0JUSgtxdhgGtQo7neOK5zxPeK+PnO9TuBB/StHXvE9tpl2NOBL3rqHK4O1EPQk+p9K878U6uzX0ihvl2jp6189jcU6suWOx9JgMKqEeeXxMhvf9NkAB6nnFbFjpq2kHA+9zmsTRC0qmQ9DwK66yhb7MUlwSDhTnJIx3rhl7qO9alAo3AU4FaWnKQwDjIFNkgVWGOtWbbKc+9YOVzZRsa1sAV+YBTUjb0IMZI+lOgmjeMblAOKnjVWHykUJMGc74p0Oy8U6a1nqVtvJBVZMfd968H174La3YXZFltuLds7WPUV9Nm3MgIkCjHTBqpIj20g3AFT09Aa7cPi6lLY4sRhKdXWSMX4Z/Dmw+HulxS29gL3Vp4wZ78kZ5GSkf8AdT9T39B2L3V2eti//fYosrookakfI/X/AGT/AIVdY19DQxEKsbpHzuIw8qU+VszvtV3/AM+Lf99ihbi8zn7C/wD30KvlR1p8QOea6OZdjm5X3En6mpLCBZmkeQgRxJvYmqE1jfFv+P0/9+xWZ40u77RvAOoiG6/0q9mjt4227SBglsfhWOI92m2b4b3qiTOK8Ya1pdxrE9xa2IkmHyvOnbA4yScDgV5/cvdz3fn3sEsUTEbJCPlf6EcGur03R9HudMuDr0BuWtLZpmtPMI80BS2ffJ/KvGNN1Cd9YeOwuhbQXT7ms4Q/kgFd23afT7ueueRXlU8NGScrns1MU4tRsetaVdQnZHEwbHUV11tccAdRivNfD8ZjmLZOQcAV6LZwgwqTkEivPqR6HfTlpcsyTLnc2FA7mmtfJbxmQkFajkJQ7SuQfWqt5E9wm1PlzxgDpWKhY39oQy+MrC2uAt3exW69t56/hUcHxP0FrlYINWt5XJwNpIz+YrJbwTZ3d/Mt5J5rS28xCglfNdUOyJT6buSB1wBXkvhHQLbXvEdpp5jvIlkbMkvmjMaiMlm4HZ+fpwcnmvRoYWnUhds87E4qpTmlY+mtM8UW10xAYOe4FdCgjniDLhlb1rwLw1NfWN2to8wlaNyhkT7rAdx/hXt3hO5BeKGdvkk457GuOUOWXKdandXZv2GjSSN90iIrkY9akaMxMUbqpK5rqbSBbZNyneP5Vg+JrWdr2J7eZIg0eSCmcnPWvUwUOWVu54+PqKcb9imRk9aliXLAVQFnfk/8faf9+6nhtL/cP9Lj/wC/deuoeZ5HN5DtX1G00exnv7+byLa3QvJJtLbR9Bya5rWtd03VfCtlfXBjmtJJpGjaIkh8HAPPPatnxlZ/2j4a1W1Ay0ttIAPfGR+tcdrD6beaXFo+mOjx6axtyEXA8wAbsD6nr3rzMfUkvd6Hq4ClFx5+tziNVL6nOREihRnax4K1Qg8Hxqnm2+nwyzAYDJGFCfVq7PRPDG65E98jG2j/AIOhkbsPp61dlhFqziJtkZP3B0ryHVlHS579OnGS1Rz+jeHo7aONGYGTO53x94/4CurWNVjAyOKzThAp2kDPUVdMyJDyck1EZNvUUqdtiCaHdJ8rHj16VG0TFgQRkVJFBJKwJyAa0obEthduT71abYpRsjHuLe3mjjFzIAwbcBjgVnf8IpZQrOYbuNPtAO5kAR+eeWAyRnt3rrJtGSVMSKDWVdaDEMlSy+2aam47MT5ZK0kc9a6baWUyiJ/MdeCQOtdVp12sZjD5xkcjtWMdPFsxK549e9QXN+Ldc7jjoKmOruTU20PfdCu47yxjlWQbsDK9ea84+NPi++8L3Wlm2llWC4Em/wArG9mGMKCQcDnPFc/4e8cyWLpCZSVznqawfjHrkusalollFKY7iJHut4525wB169M12RqPocCo66ho3xU8QaXq9o+pWSS6dcOFkUzMZFUnqCeMj6V7nHjcCp3A8g+orwK0gh8R6FY3DW3k6hFepbyIn3DkHOB6ZAP4179bhY0WPI+UAflXZgqkpNpnPmVKEYxa3M19Gs2O3Yw3cfeNeOiG+0TxHMZbRrezuJZHDSttaVg2PlXqRjPPtXtkhy1ea638JdS1vxHJqP8AwkxitmZXTzYWlmjA6KDuAIH8u1a4qlKra3QwwWIjRTUup0rSQXVtaJCceXA0j57sW/wxXNarZywyHAPJ49xUjPfae0trHAbiezdo3jX7xTsQO/0rC1j4j29rEvmHLIduwoSwPpjHWvDdNyZ9FTqRjBW2GXOoyWp2OGHsRVe31d724DQOvljgj0x1rMuvG4veJdDuk38LJIoUflnNM0e1eORnjONzZ2+lNUmtxSqJ7HoFi5kj2lsHPBrZsyuTk5IrkbO4kVttbltc7VGSM4pvQhSubjvCVyBzWddxB8sG/CnxTlhnbUVw5PalKzQIx7odsisLVI1ELkjJA4HrW1doxcnGMUxtNkuoAcZCg5GKzi9SpbHL2FkvmLJKcBTnFY08Nt4m8Stq7ayLN0YRwrIMxBF4Ge47/nXW6XpTa5r1pox3CK4kbzypwViUZfB7ZA2/8CrsLz4H+DZoTHbQX+ntkkNb3bH9H3A130KMpx5kcFfEwpSSZneAdKtrq+ktmeKZoH+1SmFgUU4KryPUnj6GvRI9ItMj5G/77NZ/hjwppPgzTTY6VHIA7b5ZZW3SSt6sfbsBwK2I3y3Fenhafso2R5WMrqvJPojHl1q13ZEn/jppI9dtT/G2fZTVlYxK8mEdlijMrCNdzFRjoPx/rT5pw62cJggR4reMvIM723Anae3GQQetdb5LXOCLnJtLp/wP8zj/ABXPHDqVvqtqx+fEcwwRyOh/Lj8BXPeJ7bSbmE3gs7dLpmLeai4JY9zjqa9PurO31G1ltbhA0UqlWHce49x1ryDxLYX2jTS6bd8kfNFKBhZk7MP6jsa8fF0bT54bM93AYm8PZz3RzsMUsju00zOf9rk1p2sy2qhgNxJwRWXY+fK7ArgDqT61qpGEQ7hk47VzW0OtO7N2F1xuA69xWnbNGoZ5ZUSNRlnc4CiuNkuri2GIicsOBVXV/Dmr63ZodV8RWekWRxiFPmmkz6jPFQoKT940lNrSO50k/wASNEs5WhWV5cE48obi34Vz2q/GzT7N3+z2juU+8J3Cn6bQc1gW3gPwhaM3nXb3IT+NnY7j+GK0YrTwfp2Xt7eHOMHZGoJz155rVQoruy1Cu19lfMl079oDRDNtv9IkCHq0b5x+BrvbHx14X1uyFzpt6rLwGjJw6H3FedrNoHniVdEsJTnlpog27610+h2Fv4tlGl6X4d0yGRdryXsdsEW1X1LDnJ7DvUzp05L3E7kPnhrUkn6HV/Du2S01DV9VuiF3yfZrYkE/IDliPYnA/Cu2fV7Qf8tf0NWLWzhsbSK1hH7uFAi56nHc+560SFfQV7NGEIQUWj5zEVJVJuRRfWLXP+uH5GhNas0YHzR+Rqw23GSBTEKlugrZOBzvmFjjtNgnTUmtblIywxJg78kYBGCOB69xRBBYPIG/tDb5nzM0rb2LFM5J6nnj8OvasP8AtvWIvICWUY8jO3LLzn1qePxDrBRVOm2oYHO/5Qevt0pOmylOysakT9RnOPeotX0Ww8Q2Jsr+LcnVHXh4m/vKex/Q96pvqWqXTK0lkmVUKMOBxU63GoHH+hj/AL+CpdFu9xxqW1R5R4g8Hap4XucSfv7OQ4ju0GFJ7Kw/hP14PY1nRTsHEb8HOK9f8SeJ4vDWiT32qwQrCVKJE7hvPcjhAvf/AAr5el8a6rY3oglhgn837rM4Rh3x6fSuHEYKdrwPVwmOhe1Q9aj0aa+2vBtJHTmnzeGHlb/TYWyPxH51x2j+OdQis47pbRpomGcRtll9QR6irc/xkSNPLntZ48cHcpzXmeyq7WPW56b1Rs32gaTCpDxbiOxNctfRWkbnyoI41zwao3/xFudZn8rTNNlI7vJXE6p4iv8AUL77MsmApwdh4OK1oYarJ2Zz18TCCPUvB3hbUfG2oGDTYSlnGQJ751/dRD0B/ib0UfoK+gtD0LTvDOmJp2mxbIl+Z3P3pX7sx7n+XSvD/gL8QodGil8Mag6oLqfzrWWSTaolIAKHPA3YGPfjvXuElzeKSPsBzn/noK9elhOVXPEr4pz06Ftm4qqzYaoHur0jiwb/AL+Cqst1fgf8eGP+2grV0pI5uZFl33Mfamq3zYrOe7vgebA/9/BTPtd/kYsG/wC/q1Spu1w5kf/Z";
const GUY_JSON = {"p":[0.0499,0.5464,0.0593,0.0465,0.4954,0.0666,0.0841,0.5212,0.0491,0.074,0.5771,0.0407,0.0263,0.8741,0.0632,0.0392,0.8945,0.0096,0.0419,0.9203,0.0097,0.0365,0.9072,0.0668,0.083,0.5952,-0.0002,0.0959,0.5298,-0.0001,0.0813,0.5201,-0.0499,0.0742,0.5781,-0.0424,0.0269,0.5185,-0.0685,0.015,0.4597,-0.0587,0.0,0.4697,-0.0568,0.0,0.5173,-0.0652,0.0074,0.4555,-0.0005,0.0,0.4626,-0.0008,0.0,0.4697,-0.0568,0.015,0.4597,-0.0587,0.0505,0.8206,0.0258,0.0818,0.8154,0.0191,0.0843,0.8225,-0.0105,0.0579,0.832,-0.0115,0.074,0.5771,0.0407,0.0841,0.5212,0.0491,0.0959,0.5298,-0.0001,0.083,0.5952,-0.0002,0.0816,0.7596,-0.0662,0.083,0.8188,-0.038,0.1096,0.82,-0.0385,0.116,0.7723,-0.0527,0.0579,0.832,-0.0115,0.0843,0.8225,-0.0105,0.083,0.8188,-0.038,0.0532,0.8246,-0.0453,0.0772,0.712,0.0389,0.0622,0.6281,0.0443,0.0758,0.6309,0.0031,0.09,0.7111,-0.0047,0.014,0.4643,0.0655,0.0,0.4732,0.0744,0.0,0.4626,-0.0008,0.0074,0.4555,-0.0005,0.0321,0.8342,-0.0431,0.0383,0.759,-0.0821,0.0,0.7587,-0.0788,0.0,0.8451,-0.0486,0.0383,0.759,-0.0821,0.0426,0.7165,-0.0768,0.0,0.723,-0.0732,0.0,0.7587,-0.0788,0.0818,0.8154,0.0191,0.0818,0.7589,0.0447,0.1159,0.7729,0.0326,0.1097,0.819,0.0157,0.0778,0.713,-0.0574,0.0816,0.7596,-0.0662,0.116,0.7723,-0.0527,0.1206,0.7388,-0.0432,0.09,0.7111,-0.0047,0.0778,0.713,-0.0574,0.1206,0.7388,-0.0432,0.1219,0.7292,-0.0077,0.0505,0.8206,0.0258,0.0605,0.7544,0.0553,0.0818,0.7589,0.0447,0.0818,0.8154,0.0191,0.0605,0.7544,0.0553,0.0574,0.7154,0.0518,0.0772,0.712,0.0389,0.0818,0.7589,0.0447,0.0574,0.7154,0.0518,0.0492,0.6252,0.0587,0.0622,0.6281,0.0443,0.0772,0.712,0.0389,0.0426,0.7165,-0.0768,0.0361,0.6355,-0.0433,0.0,0.6369,-0.0383,0.0,0.723,-0.0732,0.0,0.724,0.069,0.0,0.6222,0.0753,0.0361,0.6231,0.0683,0.0425,0.7171,0.0621,0.0,0.7443,0.0725,0.0,0.724,0.069,0.0425,0.7171,0.0621,0.0403,0.75,0.0659,0.0577,0.7159,-0.0671,0.0492,0.6347,-0.0361,0.0361,0.6355,-0.0433,0.0426,0.7165,-0.0768,0.0582,0.7593,-0.0746,0.0577,0.7159,-0.0671,0.0426,0.7165,-0.0768,0.0383,0.759,-0.0821,0.0532,0.8246,-0.0453,0.0582,0.7593,-0.0746,0.0383,0.759,-0.0821,0.0321,0.8342,-0.0431,0.0,0.8212,0.0414,0.0,0.7443,0.0725,0.0403,0.75,0.0659,0.0312,0.8207,0.0324,0.0312,0.8207,0.0324,0.0368,0.8377,-0.0121,0.0329,0.8765,0.01,0.0259,0.8626,0.0385,0.0501,0.5491,-0.0608,0.0509,0.4911,-0.0653,0.015,0.4597,-0.0587,0.0269,0.5185,-0.0685,0.0,0.8212,0.0414,0.0312,0.8207,0.0324,0.0259,0.8626,0.0385,0.0,0.857,0.051,0.0,0.5173,0.0731,0.0,0.4732,0.0744,0.014,0.4643,0.0655,0.0259,0.5179,0.07,0.0492,0.6347,-0.0361,0.0501,0.5491,-0.0608,0.0269,0.5185,-0.0685,0.0361,0.6355,-0.0433,0.0622,0.6281,0.0443,0.074,0.5771,0.0407,0.083,0.5952,-0.0002,0.0758,0.6309,0.0031,0.0,0.6222,0.0753,0.0,0.5173,0.0731,0.0259,0.5179,0.07,0.0361,0.6231,0.0683,0.09,0.7111,-0.0047,0.0758,0.6309,0.0031,0.0622,0.6339,-0.0288,0.0778,0.713,-0.0574,0.0492,0.6252,0.0587,0.0499,0.5464,0.0593,0.074,0.5771,0.0407,0.0622,0.6281,0.0443,0.0627,0.4484,-0.0573,0.0509,0.4911,-0.0653,0.0813,0.5201,-0.0499,0.0974,0.4669,-0.038,0.0758,0.6309,0.0031,0.083,0.5952,-0.0002,0.0742,0.5781,-0.0424,0.0622,0.6339,-0.0288,0.1107,0.4722,0.0036,0.0959,0.5298,-0.0001,0.0841,0.5212,0.0491,0.0947,0.461,0.0429,0.0588,0.4397,0.06,0.0465,0.4954,0.0666,0.014,0.4643,0.0655,0.0239,0.4215,0.0407,0.0239,0.4215,0.0407,0.014,0.4643,0.0655,0.0074,0.4555,-0.0005,0.0132,0.4168,-0.0039,0.0132,0.4168,-0.0039,0.0074,0.4555,-0.0005,0.015,0.4597,-0.0587,0.0226,0.4252,-0.0432,0.0853,0.1156,0.0092,0.0779,0.1103,-0.0092,0.0768,0.065,-0.0087,0.0841,0.07,0.0094,0.0981,0.1035,-0.0364,0.1139,0.1059,-0.0292,0.1195,0.0591,-0.0265,0.1019,0.0573,-0.0341,0.1213,0.1111,-0.0108,0.116,0.1161,0.0081,0.1194,0.0693,0.0097,0.1268,0.0641,-0.0083,0.0779,0.1103,-0.0092,0.0832,0.1053,-0.0281,0.0842,0.0597,-0.0268,0.0768,0.065,-0.0087,0.1011,0.118,0.0164,0.0853,0.1156,0.0092,0.0841,0.07,0.0094,0.1017,0.0718,0.0171,0.0974,0.4669,-0.038,0.0813,0.5201,-0.0499,0.0959,0.5298,-0.0001,0.1107,0.4722,0.0036,0.034,0.3339,0.0038,0.0132,0.4168,-0.0039,0.0226,0.4252,-0.0432,0.0451,0.3435,-0.0248,0.0462,0.3318,0.0335,0.0239,0.4215,0.0407,0.0132,0.4168,-0.0039,0.034,0.3339,0.0038,0.0748,0.3383,0.0468,0.0588,0.4397,0.06,0.0239,0.4215,0.0407,0.0462,0.3318,0.0335,0.114,0.3592,0.0074,0.1107,0.4722,0.0036,0.0947,0.461,0.0429,0.1028,0.3497,0.036,0.1139,0.1059,-0.0292,0.1213,0.1111,-0.0108,0.1268,0.0641,-0.0083,0.1195,0.0591,-0.0265,0.0732,0.3549,-0.0356,0.0627,0.4484,-0.0573,0.0974,0.4669,-0.038,0.1017,0.3614,-0.0222,0.0794,0.3199,-0.0276,0.0732,0.3549,-0.0356,0.1017,0.3614,-0.0222,0.1045,0.3212,-0.0161,0.1017,0.3614,-0.0222,0.0974,0.4669,-0.038,0.1107,0.4722,0.0036,0.114,0.3592,0.0074,0.115,0.3155,0.0089,0.114,0.3592,0.0074,0.1028,0.3497,0.036,0.1046,0.306,0.0328,0.0794,0.2984,0.0416,0.0748,0.3383,0.0468,0.0462,0.3318,0.0335,0.0543,0.2971,0.0301,0.0543,0.2971,0.0301,0.0462,0.3318,0.0335,0.034,0.3339,0.0038,0.0438,0.3028,0.0051,0.0438,0.3028,0.0051,0.034,0.3339,0.0038,0.0451,0.3435,-0.0248,0.0542,0.3123,-0.0188,0.1045,0.3212,-0.0161,0.1017,0.3614,-0.0222,0.114,0.3592,0.0074,0.115,0.3155,0.0089,0.0794,0.2984,0.0416,0.0543,0.2971,0.0301,0.0605,0.2586,0.0176,0.0837,0.2595,0.0285,0.0438,0.3028,0.0051,0.0542,0.3123,-0.0188,0.0613,0.2724,-0.0277,0.0513,0.264,-0.0057,0.115,0.3155,0.0089,0.1046,0.306,0.0328,0.1072,0.266,0.0207,0.1173,0.2745,-0.0013,0.0794,0.3199,-0.0276,0.1045,0.3212,-0.0161,0.108,0.2798,-0.0246,0.0849,0.279,-0.0356,0.0543,0.2971,0.0301,0.0438,0.3028,0.0051,0.0513,0.264,-0.0057,0.0605,0.2586,0.0176,0.1045,0.3212,-0.0161,0.115,0.3155,0.0089,0.1173,0.2745,-0.0013,0.108,0.2798,-0.0246,0.0837,0.2595,0.0285,0.0605,0.2586,0.0176,0.0646,0.2178,0.0142,0.0909,0.2246,0.0247,0.0513,0.264,-0.0057,0.0613,0.2724,-0.0277,0.0631,0.2192,-0.0396,0.0531,0.2156,-0.0125,0.1173,0.2745,-0.0013,0.1072,0.266,0.0207,0.1165,0.2318,0.013,0.1265,0.2354,-0.0141,0.0849,0.279,-0.0356,0.108,0.2798,-0.0246,0.115,0.2332,-0.0407,0.0887,0.2265,-0.0513,0.0605,0.2586,0.0176,0.0513,0.264,-0.0057,0.0531,0.2156,-0.0125,0.0646,0.2178,0.0142,0.0613,0.2724,-0.0277,0.0849,0.279,-0.0356,0.0887,0.2265,-0.0513,0.0631,0.2192,-0.0396,0.0542,0.3123,-0.0188,0.0794,0.3199,-0.0276,0.0849,0.279,-0.0356,0.0613,0.2724,-0.0277,0.0542,0.3123,-0.0188,0.0451,0.3435,-0.0248,0.0732,0.3549,-0.0356,0.0794,0.3199,-0.0276,0.0451,0.3435,-0.0248,0.0226,0.4252,-0.0432,0.0627,0.4484,-0.0573,0.0732,0.3549,-0.0356,0.0832,0.1053,-0.0281,0.0981,0.1035,-0.0364,0.1019,0.0573,-0.0341,0.0842,0.0597,-0.0268,0.0226,0.4252,-0.0432,0.015,0.4597,-0.0587,0.0509,0.4911,-0.0653,0.0627,0.4484,-0.0573,0.1072,0.266,0.0207,0.0837,0.2595,0.0285,0.0909,0.2246,0.0247,0.1165,0.2318,0.013,0.1046,0.306,0.0328,0.0794,0.2984,0.0416,0.0837,0.2595,0.0285,0.1072,0.266,0.0207,0.1046,0.306,0.0328,0.1028,0.3497,0.036,0.0748,0.3383,0.0468,0.0794,0.2984,0.0416,0.1028,0.3497,0.036,0.0947,0.461,0.0429,0.0588,0.4397,0.06,0.0748,0.3383,0.0468,0.116,0.1161,0.0081,0.1011,0.118,0.0164,0.1017,0.0718,0.0171,0.1194,0.0693,0.0097,0.0947,0.461,0.0429,0.0841,0.5212,0.0491,0.0465,0.4954,0.0666,0.0588,0.4397,0.06,0.0361,0.6231,0.0683,0.0259,0.5179,0.07,0.0499,0.5464,0.0593,0.0492,0.6252,0.0587,0.0622,0.6339,-0.0288,0.0742,0.5781,-0.0424,0.0501,0.5491,-0.0608,0.0492,0.6347,-0.0361,0.0742,0.5781,-0.0424,0.0813,0.5201,-0.0499,0.0509,0.4911,-0.0653,0.0501,0.5491,-0.0608,0.083,0.8188,-0.038,0.0816,0.7596,-0.0662,0.0582,0.7593,-0.0746,0.0532,0.8246,-0.0453,0.0816,0.7596,-0.0662,0.0778,0.713,-0.0574,0.0577,0.7159,-0.0671,0.0582,0.7593,-0.0746,0.0778,0.713,-0.0574,0.0622,0.6339,-0.0288,0.0492,0.6347,-0.0361,0.0577,0.7159,-0.0671,0.0425,0.7171,0.0621,0.0361,0.6231,0.0683,0.0492,0.6252,0.0587,0.0574,0.7154,0.0518,0.0403,0.75,0.0659,0.0425,0.7171,0.0621,0.0574,0.7154,0.0518,0.0605,0.7544,0.0553,0.0312,0.8207,0.0324,0.0403,0.75,0.0659,0.0605,0.7544,0.0553,0.0505,0.8206,0.0258,0.0312,0.8207,0.0324,0.0505,0.8206,0.0258,0.0579,0.832,-0.0115,0.0368,0.8377,-0.0121,0.108,0.2798,-0.0246,0.1173,0.2745,-0.0013,0.1265,0.2354,-0.0141,0.115,0.2332,-0.0407,0.0259,0.5179,0.07,0.014,0.4643,0.0655,0.0465,0.4954,0.0666,0.0499,0.5464,0.0593,0.1165,0.2318,0.013,0.0909,0.2246,0.0247,0.1011,0.118,0.0164,0.116,0.1161,0.0081,0.0631,0.2192,-0.0396,0.0887,0.2265,-0.0513,0.0981,0.1035,-0.0364,0.0832,0.1053,-0.0281,0.0368,0.8377,-0.0121,0.0579,0.832,-0.0115,0.0532,0.8246,-0.0453,0.0321,0.8342,-0.0431,0.0909,0.2246,0.0247,0.0646,0.2178,0.0142,0.0853,0.1156,0.0092,0.1011,0.118,0.0164,0.0531,0.2156,-0.0125,0.0631,0.2192,-0.0396,0.0832,0.1053,-0.0281,0.0779,0.1103,-0.0092,0.1265,0.2354,-0.0141,0.1165,0.2318,0.013,0.116,0.1161,0.0081,0.1213,0.1111,-0.0108,0.0887,0.2265,-0.0513,0.115,0.2332,-0.0407,0.1139,0.1059,-0.0292,0.0981,0.1035,-0.0364,0.0646,0.2178,0.0142,0.0531,0.2156,-0.0125,0.0779,0.1103,-0.0092,0.0853,0.1156,0.0092,0.115,0.2332,-0.0407,0.1265,0.2354,-0.0141,0.1213,0.1111,-0.0108,0.1139,0.1059,-0.0292,0.2601,0.7547,-0.0223,0.2629,0.7743,-0.0278,0.3795,0.7698,-0.0129,0.3795,0.7627,-0.0099,0.1874,0.7733,0.0304,0.186,0.7455,0.0233,0.2284,0.7516,0.0144,0.2278,0.7723,0.0237,0.1219,0.7292,-0.0077,0.1206,0.7388,-0.0432,0.1653,0.7449,-0.041,0.1758,0.7381,-0.0088,0.0772,0.712,0.0389,0.09,0.7111,-0.0047,0.1219,0.7292,-0.0077,0.1205,0.739,0.018,0.0818,0.7589,0.0447,0.0772,0.712,0.0389,0.1205,0.739,0.018,0.1159,0.7729,0.0326,0.0843,0.8225,-0.0105,0.0818,0.8154,0.0191,0.1097,0.819,0.0157,0.1083,0.8291,-0.0121,0.083,0.8188,-0.038,0.0843,0.8225,-0.0105,0.1083,0.8291,-0.0121,0.1096,0.82,-0.0385,0.2629,0.7743,-0.0278,0.2655,0.8016,-0.0206,0.3795,0.7797,-0.0092,0.3795,0.7698,-0.0129,0.1841,0.8081,0.0226,0.1874,0.7733,0.0304,0.2278,0.7723,0.0237,0.2291,0.7994,0.0122,0.1097,0.819,0.0157,0.1841,0.8081,0.0226,0.1711,0.8178,-0.0113,0.1083,0.8291,-0.0121,0.1643,0.8108,-0.0363,0.1711,0.8178,-0.0113,0.2307,0.8052,-0.006,0.2321,0.7987,-0.0245,0.2586,0.7746,0.0234,0.257,0.7548,0.0144,0.3795,0.7628,0.0093,0.3795,0.7699,0.0139,0.257,0.7548,0.0144,0.2576,0.7491,-0.0011,0.3795,0.7607,0.0012,0.3795,0.7628,0.0093,0.186,0.7455,0.0233,0.1758,0.7381,-0.0088,0.2298,0.7455,-0.0031,0.2284,0.7516,0.0144,0.2655,0.8016,-0.0206,0.2648,0.8075,-0.0031,0.3795,0.7818,-0.0001,0.3795,0.7797,-0.0092,0.3795,0.7698,-0.0129,0.3795,0.7797,-0.0092,0.3886,0.7786,-0.0127,0.3886,0.7696,-0.0161,0.3795,0.7627,-0.0099,0.3795,0.7698,-0.0129,0.3886,0.7696,-0.0161,0.3886,0.763,-0.0133,0.3795,0.7607,0.0012,0.3795,0.7627,-0.0099,0.3886,0.763,-0.0133,0.3886,0.7592,0.0074,0.1653,0.7449,-0.041,0.1627,0.7729,-0.0466,0.2323,0.772,-0.0323,0.2315,0.7524,-0.0265,0.1627,0.7729,-0.0466,0.1643,0.8108,-0.0363,0.2321,0.7987,-0.0245,0.2323,0.772,-0.0323,0.1841,0.8081,0.0226,0.2291,0.7994,0.0122,0.2307,0.8052,-0.006,0.1711,0.8178,-0.0113,0.3795,0.7797,-0.0092,0.3795,0.7818,-0.0001,0.3873,0.783,0.0043,0.3886,0.7786,-0.0127,0.1159,0.7729,0.0326,0.1205,0.739,0.018,0.186,0.7455,0.0233,0.1874,0.7733,0.0304,0.2576,0.7491,-0.0011,0.2601,0.7547,-0.0223,0.3795,0.7627,-0.0099,0.3795,0.7607,0.0012,0.1097,0.819,0.0157,0.1159,0.7729,0.0326,0.1874,0.7733,0.0304,0.1841,0.8081,0.0226,0.1205,0.739,0.018,0.1219,0.7292,-0.0077,0.1758,0.7381,-0.0088,0.186,0.7455,0.0233,0.1206,0.7388,-0.0432,0.116,0.7723,-0.0527,0.1627,0.7729,-0.0466,0.1653,0.7449,-0.041,0.116,0.7723,-0.0527,0.1096,0.82,-0.0385,0.1643,0.8108,-0.0363,0.1627,0.7729,-0.0466,0.2648,0.8075,-0.0031,0.2627,0.8016,0.0135,0.3795,0.7797,0.0086,0.3795,0.7818,-0.0001,0.2586,0.7746,0.0234,0.2627,0.8016,0.0135,0.2447,0.7979,0.0114,0.2434,0.7739,0.0213,0.2434,0.7739,0.0213,0.2447,0.7979,0.0114,0.2291,0.7994,0.0122,0.2278,0.7723,0.0237,0.1096,0.82,-0.0385,0.1083,0.8291,-0.0121,0.1711,0.8178,-0.0113,0.1643,0.8108,-0.0363,0.2648,0.8075,-0.0031,0.2655,0.8016,-0.0206,0.2474,0.7978,-0.0213,0.2461,0.8032,-0.0047,0.2323,0.772,-0.0323,0.2321,0.7987,-0.0245,0.2474,0.7978,-0.0213,0.2475,0.7736,-0.0281,0.2475,0.7736,-0.0281,0.2474,0.7978,-0.0213,0.2655,0.8016,-0.0206,0.2629,0.7743,-0.0278,0.2627,0.8016,0.0135,0.2648,0.8075,-0.0031,0.2461,0.8032,-0.0047,0.2447,0.7979,0.0114,0.2447,0.7979,0.0114,0.2461,0.8032,-0.0047,0.2307,0.8052,-0.006,0.2291,0.7994,0.0122,0.257,0.7548,0.0144,0.2586,0.7746,0.0234,0.2434,0.7739,0.0213,0.2439,0.7561,0.0129,0.2439,0.7561,0.0129,0.2434,0.7739,0.0213,0.2278,0.7723,0.0237,0.2284,0.7516,0.0144,0.2315,0.7524,-0.0265,0.2323,0.772,-0.0323,0.2475,0.7736,-0.0281,0.2468,0.7562,-0.0228,0.2468,0.7562,-0.0228,0.2475,0.7736,-0.0281,0.2629,0.7743,-0.0278,0.2601,0.7547,-0.0223,0.2284,0.7516,0.0144,0.2298,0.7455,-0.0031,0.2451,0.7509,-0.0022,0.2439,0.7561,0.0129,0.2439,0.7561,0.0129,0.2451,0.7509,-0.0022,0.2576,0.7491,-0.0011,0.257,0.7548,0.0144,0.2461,0.8032,-0.0047,0.2474,0.7978,-0.0213,0.2321,0.7987,-0.0245,0.2307,0.8052,-0.006,0.2298,0.7455,-0.0031,0.2315,0.7524,-0.0265,0.2468,0.7562,-0.0228,0.2451,0.7509,-0.0022,0.2627,0.8016,0.0135,0.2586,0.7746,0.0234,0.3795,0.7699,0.0139,0.3795,0.7797,0.0086,0.2451,0.7509,-0.0022,0.2468,0.7562,-0.0228,0.2601,0.7547,-0.0223,0.2576,0.7491,-0.0011,0.4003,0.7633,-0.0125,0.4003,0.7694,-0.0153,0.4216,0.769,-0.0134,0.4216,0.7644,-0.0108,0.1758,0.7381,-0.0088,0.1653,0.7449,-0.041,0.2315,0.7524,-0.0265,0.2298,0.7455,-0.0031,0.3988,0.7819,0.0054,0.4003,0.7774,0.0248,0.4216,0.7764,0.0246,0.4216,0.7787,0.0063,0.4041,0.7695,0.0259,0.402,0.7629,0.0254,0.4216,0.7637,0.0251,0.4216,0.7691,0.0279,0.3795,0.7797,0.0086,0.3795,0.7699,0.0139,0.3886,0.7697,0.0284,0.3886,0.7783,0.0249,0.3795,0.7628,0.0093,0.3795,0.7607,0.0012,0.3886,0.7592,0.0074,0.3886,0.7628,0.0254,0.3795,0.7699,0.0139,0.3795,0.7628,0.0093,0.3886,0.7628,0.0254,0.3886,0.7697,0.0284,0.3795,0.7818,-0.0001,0.3795,0.7797,0.0086,0.3886,0.7783,0.0249,0.3873,0.783,0.0043,0.4003,0.7779,-0.0119,0.3988,0.7819,0.0054,0.4216,0.7787,0.0063,0.4216,0.7762,-0.0102,0.4216,0.769,-0.0134,0.4216,0.7762,-0.0102,0.4529,0.7736,-0.0071,0.4516,0.7683,-0.0096,0.4216,0.7644,-0.0108,0.4216,0.769,-0.0134,0.4516,0.7683,-0.0096,0.4472,0.764,-0.0072,0.4216,0.7616,0.0084,0.4216,0.7644,-0.0108,0.4472,0.764,-0.0072,0.4501,0.7637,0.0102,0.4003,0.7694,-0.0153,0.4003,0.7779,-0.0119,0.4216,0.7762,-0.0102,0.4216,0.769,-0.0134,0.4216,0.7762,-0.0102,0.4216,0.7787,0.0063,0.4565,0.7736,0.0073,0.4529,0.7736,-0.0071,0.4003,0.7774,0.0248,0.4041,0.7695,0.0259,0.4216,0.7691,0.0279,0.4216,0.7764,0.0246,0.402,0.7629,0.0254,0.4003,0.76,0.0077,0.4216,0.7616,0.0084,0.4216,0.7637,0.0251,0.4607,0.7736,0.0236,0.4616,0.7683,0.0267,0.4569,0.7681,0.0102,0.4565,0.7736,0.0073,0.4616,0.7683,0.0267,0.4548,0.7644,0.0246,0.4501,0.7637,0.0102,0.4569,0.7681,0.0102,0.4003,0.76,0.0077,0.4003,0.7633,-0.0125,0.4216,0.7644,-0.0108,0.4216,0.7616,0.0084,0.4565,0.7736,0.0073,0.4569,0.7681,0.0102,0.4516,0.7683,-0.0096,0.4529,0.7736,-0.0071,0.4216,0.7764,0.0246,0.4216,0.7691,0.0279,0.4616,0.7683,0.0267,0.4607,0.7736,0.0236,0.4216,0.7637,0.0251,0.4216,0.7616,0.0084,0.4501,0.7637,0.0102,0.4548,0.7644,0.0246,0.4216,0.7691,0.0279,0.4216,0.7637,0.0251,0.4548,0.7644,0.0246,0.4616,0.7683,0.0267,0.4216,0.7787,0.0063,0.4216,0.7764,0.0246,0.4607,0.7736,0.0236,0.4565,0.7736,0.0073,0.3886,0.7628,0.0254,0.3886,0.7592,0.0074,0.4003,0.76,0.0077,0.402,0.7629,0.0254,0.3886,0.7783,0.0249,0.3886,0.7697,0.0284,0.3945,0.7706,0.0374,0.3945,0.7764,0.0355,0.4569,0.7681,0.0102,0.4501,0.7637,0.0102,0.4472,0.764,-0.0072,0.4516,0.7683,-0.0096,0.3886,0.7696,-0.0161,0.3886,0.7786,-0.0127,0.4003,0.7779,-0.0119,0.4003,0.7694,-0.0153,0.4003,0.7774,0.0248,0.4024,0.7755,0.0384,0.4224,0.7717,0.0374,0.4221,0.7714,0.0349,0.3873,0.783,0.0043,0.3886,0.7783,0.0249,0.4003,0.7774,0.0248,0.3988,0.7819,0.0054,0.3886,0.7592,0.0074,0.3886,0.763,-0.0133,0.4003,0.7633,-0.0125,0.4003,0.76,0.0077,0.3886,0.763,-0.0133,0.3886,0.7696,-0.0161,0.4003,0.7694,-0.0153,0.4003,0.7633,-0.0125,0.3945,0.7764,0.0355,0.3945,0.7706,0.0374,0.4024,0.7704,0.0402,0.4024,0.7755,0.0384,0.3945,0.7706,0.0374,0.3945,0.7637,0.036,0.4024,0.7638,0.0389,0.4024,0.7704,0.0402,0.3886,0.7628,0.0254,0.402,0.7629,0.0254,0.4024,0.7638,0.0389,0.3945,0.7637,0.036,0.4024,0.7638,0.0389,0.402,0.7629,0.0254,0.4193,0.7665,0.0341,0.4199,0.7668,0.038,0.3886,0.7697,0.0284,0.3886,0.7628,0.0254,0.3945,0.7637,0.036,0.3945,0.7706,0.0374,0.4003,0.7774,0.0248,0.3886,0.7783,0.0249,0.3945,0.7764,0.0355,0.4024,0.7755,0.0384,0.4218,0.7691,0.0338,0.4221,0.7714,0.0349,0.4224,0.7717,0.0374,0.4225,0.7696,0.0389,0.4193,0.7665,0.0341,0.4218,0.7691,0.0338,0.4225,0.7696,0.0389,0.4199,0.7668,0.038,0.4024,0.7704,0.0402,0.4024,0.7638,0.0389,0.4199,0.7668,0.038,0.4225,0.7696,0.0389,0.4041,0.7695,0.0259,0.4003,0.7774,0.0248,0.4221,0.7714,0.0349,0.4218,0.7691,0.0338,0.402,0.7629,0.0254,0.4041,0.7695,0.0259,0.4218,0.7691,0.0338,0.4193,0.7665,0.0341,0.4024,0.7755,0.0384,0.4024,0.7704,0.0402,0.4225,0.7696,0.0389,0.4224,0.7717,0.0374,0.0842,0.0597,-0.0268,0.1019,0.0573,-0.0341,0.106,-0.0,-0.0398,0.0857,-0.0,-0.0318,0.0768,0.065,-0.0087,0.0842,0.0597,-0.0268,0.0857,-0.0,-0.0318,0.077,-0.0,-0.0116,0.3886,0.7786,-0.0127,0.3873,0.783,0.0043,0.3988,0.7819,0.0054,0.4003,0.7779,-0.0119,0.1206,0.0463,0.02,0.1025,0.0485,0.0267,0.1055,0.0066,0.088,0.1232,0.0057,0.084,0.0852,0.0,0.025,0.1051,0.0,0.0311,0.106,0.0,0.082,0.086,0.0,0.0862,0.1019,0.0573,-0.0341,0.1195,0.0591,-0.0265,0.1259,-0.0,-0.031,0.106,-0.0,-0.0398,0.0844,0.0472,0.0215,0.0768,0.0436,0.0151,0.0793,0.0079,0.0936,0.0874,0.0075,0.092,0.0768,0.0436,0.0151,0.077,0.0047,0.0092,0.0769,0.0,0.0879,0.0793,0.0079,0.0936,0.0874,0.0075,0.092,0.0793,0.0079,0.0936,0.0769,0.0,0.0879,0.086,0.0,0.0862,0.1305,0.0053,0.0822,0.1232,0.0057,0.084,0.1256,0.0,0.0777,0.1337,0.0,0.0759,0.1055,0.0066,0.088,0.106,0.0,0.082,0.1256,0.0,0.0777,0.1232,0.0057,0.084,0.0874,0.0075,0.092,0.086,0.0,0.0862,0.106,0.0,0.082,0.1055,0.0066,0.088,0.077,0.0047,0.0092,0.0852,0.0,0.025,0.086,0.0,0.0862,0.0769,0.0,0.0879,0.1281,0.0424,0.0131,0.1206,0.0463,0.02,0.1232,0.0057,0.084,0.1305,0.0053,0.0822,0.1252,0.0,0.0238,0.1338,0.0047,0.0075,0.1337,0.0,0.0759,0.1256,0.0,0.0777,0.1338,0.0047,0.0075,0.1281,0.0424,0.0131,0.1305,0.0053,0.0822,0.1337,0.0,0.0759,0.1051,0.0,0.0311,0.1252,0.0,0.0238,0.1256,0.0,0.0777,0.106,0.0,0.082,0.1025,0.0485,0.0267,0.0844,0.0472,0.0215,0.0874,0.0075,0.092,0.1055,0.0066,0.088,0.1017,0.0718,0.0171,0.0841,0.07,0.0094,0.0844,0.0472,0.0215,0.1025,0.0485,0.0267,0.1049,0.0047,0.0177,0.1251,0.0047,0.0096,0.1252,0.0,0.0238,0.1051,0.0,0.0311,0.1338,-0.0,-0.0105,0.1268,0.0641,-0.0083,0.1281,0.0424,0.0131,0.1338,0.0047,0.0075,0.1251,0.0047,0.0096,0.1338,-0.0,-0.0105,0.1338,0.0047,0.0075,0.1252,0.0,0.0238,0.1268,0.0641,-0.0083,0.1194,0.0693,0.0097,0.1206,0.0463,0.02,0.1281,0.0424,0.0131,0.077,-0.0,-0.0116,0.0849,0.0047,0.0089,0.0852,0.0,0.025,0.077,0.0047,0.0092,0.0768,0.065,-0.0087,0.077,-0.0,-0.0116,0.077,0.0047,0.0092,0.0768,0.0436,0.0151,0.0841,0.07,0.0094,0.0768,0.065,-0.0087,0.0768,0.0436,0.0151,0.0844,0.0472,0.0215,0.0849,0.0047,0.0089,0.1049,0.0047,0.0177,0.1051,0.0,0.0311,0.0852,0.0,0.025,0.1194,0.0693,0.0097,0.1017,0.0718,0.0171,0.1025,0.0485,0.0267,0.1206,0.0463,0.02,0.1195,0.0591,-0.0265,0.1268,0.0641,-0.0083,0.1338,-0.0,-0.0105,0.1259,-0.0,-0.031,0.0259,0.8626,0.0385,0.0329,0.8765,0.01,0.0392,0.8945,0.0096,0.0263,0.8741,0.0632,0.0329,0.8765,0.01,0.029,0.8845,-0.0116,0.0355,0.9052,-0.012,0.0392,0.8945,0.0096,0.0361,0.6355,-0.0433,0.0269,0.5185,-0.0685,0.0,0.5173,-0.0652,0.0,0.6369,-0.0383,0.0368,0.8377,-0.0121,0.0321,0.8342,-0.0431,0.029,0.8845,-0.0116,0.0329,0.8765,0.01,0.0371,0.9461,0.0598,0.0439,0.9529,0.0119,0.0381,0.9813,0.0131,0.0314,0.972,0.0561,0.0321,0.8342,-0.0431,0.0,0.8451,-0.0486,0.0,0.8903,-0.0187,0.029,0.8845,-0.0116,0.0,0.857,0.051,0.0259,0.8626,0.0385,0.0263,0.8741,0.0632,0.0,0.8613,0.0797,0.029,0.8845,-0.0116,0.0,0.8903,-0.0187,0.0,0.9113,-0.0181,0.0355,0.9052,-0.012,0.0,0.9865,0.0704,0.0314,0.972,0.0561,0.0381,0.9813,0.0131,0.0,1.0,0.0145,0.0439,0.9529,0.0119,0.0336,0.9567,-0.0235,0.0306,0.9756,-0.0163,0.0381,0.9813,0.0131,0.0,0.9451,0.0792,0.0371,0.9461,0.0598,0.0314,0.972,0.0561,0.0,0.9865,0.0704,0.0336,0.9567,-0.0235,0.0,0.9614,-0.0305,0.0,0.9843,-0.0257,0.0306,0.9756,-0.0163,0.0345,0.9473,-0.022,0.0,0.95,-0.0309,0.0,0.9614,-0.0305,0.0336,0.9567,-0.0235,0.0,0.9113,-0.0181,0.0,0.9344,-0.0298,0.0364,0.9283,-0.0189,0.0355,0.9052,-0.012,0.0263,0.8741,0.0632,0.0365,0.9072,0.0668,0.0,0.9083,0.0886,0.0,0.8613,0.0797,0.0367,0.9301,0.0577,0.0432,0.9398,0.0108,0.0439,0.9529,0.0119,0.0371,0.9461,0.0598,0.0,1.0,0.0145,0.0381,0.9813,0.0131,0.0306,0.9756,-0.0163,0.0,0.9843,-0.0257,0.0432,0.9398,0.0108,0.0345,0.9473,-0.022,0.0336,0.9567,-0.0235,0.0439,0.9529,0.0119,0.0365,0.9072,0.0668,0.0419,0.9203,0.0097,0.0432,0.9398,0.0108,0.0367,0.9301,0.0577,0.0,0.9321,0.077,0.0367,0.9301,0.0577,0.0371,0.9461,0.0598,0.0,0.9451,0.0792,0.0,0.9083,0.0886,0.0365,0.9072,0.0668,0.0367,0.9301,0.0577,0.0,0.9321,0.077,0.0364,0.9283,-0.0189,0.0,0.9344,-0.0298,0.0,0.95,-0.0309,0.0345,0.9473,-0.022,0.0432,0.9398,0.0108,0.0419,0.9203,0.0097,0.0364,0.9283,-0.0189,0.0345,0.9473,-0.022,0.0419,0.9203,0.0097,0.0392,0.8945,0.0096,0.0355,0.9052,-0.012,0.0364,0.9283,-0.0189,-0.0499,0.5464,0.0593,-0.074,0.5771,0.0407,-0.0841,0.5212,0.0491,-0.0465,0.4954,0.0666,-0.0263,0.8741,0.0632,-0.0365,0.9072,0.0668,-0.0419,0.9203,0.0097,-0.0392,0.8945,0.0096,-0.083,0.5952,-0.0002,-0.0742,0.5781,-0.0424,-0.0813,0.5201,-0.0499,-0.0959,0.5298,-0.0001,-0.0269,0.5185,-0.0685,0.0,0.5173,-0.0652,0.0,0.4697,-0.0568,-0.015,0.4597,-0.0587,-0.0074,0.4555,-0.0005,-0.015,0.4597,-0.0587,0.0,0.4697,-0.0568,0.0,0.4626,-0.0008,-0.0505,0.8206,0.0258,-0.0579,0.832,-0.0115,-0.0843,0.8225,-0.0105,-0.0818,0.8154,0.0191,-0.074,0.5771,0.0407,-0.083,0.5952,-0.0002,-0.0959,0.5298,-0.0001,-0.0841,0.5212,0.0491,-0.0816,0.7596,-0.0662,-0.116,0.7723,-0.0527,-0.1096,0.82,-0.0385,-0.083,0.8188,-0.038,-0.0579,0.832,-0.0115,-0.0532,0.8246,-0.0453,-0.083,0.8188,-0.038,-0.0843,0.8225,-0.0105,-0.0772,0.712,0.0389,-0.09,0.7111,-0.0047,-0.0758,0.6309,0.0031,-0.0622,0.6281,0.0443,-0.014,0.4643,0.0655,-0.0074,0.4555,-0.0005,0.0,0.4626,-0.0008,0.0,0.4732,0.0744,-0.0321,0.8342,-0.0431,0.0,0.8451,-0.0486,0.0,0.7587,-0.0788,-0.0383,0.759,-0.0821,-0.0383,0.759,-0.0821,0.0,0.7587,-0.0788,0.0,0.723,-0.0732,-0.0426,0.7165,-0.0768,-0.0818,0.8154,0.0191,-0.1097,0.819,0.0157,-0.1159,0.7729,0.0326,-0.0818,0.7589,0.0447,-0.0778,0.713,-0.0574,-0.1206,0.7388,-0.0432,-0.116,0.7723,-0.0527,-0.0816,0.7596,-0.0662,-0.09,0.7111,-0.0047,-0.1219,0.7292,-0.0077,-0.1206,0.7388,-0.0432,-0.0778,0.713,-0.0574,-0.0505,0.8206,0.0258,-0.0818,0.8154,0.0191,-0.0818,0.7589,0.0447,-0.0605,0.7544,0.0553,-0.0605,0.7544,0.0553,-0.0818,0.7589,0.0447,-0.0772,0.712,0.0389,-0.0574,0.7154,0.0518,-0.0574,0.7154,0.0518,-0.0772,0.712,0.0389,-0.0622,0.6281,0.0443,-0.0492,0.6252,0.0587,-0.0426,0.7165,-0.0768,0.0,0.723,-0.0732,0.0,0.6369,-0.0383,-0.0361,0.6355,-0.0433,0.0,0.724,0.069,-0.0425,0.7171,0.0621,-0.0361,0.6231,0.0683,0.0,0.6222,0.0753,0.0,0.7443,0.0725,-0.0403,0.75,0.0659,-0.0425,0.7171,0.0621,0.0,0.724,0.069,-0.0577,0.7159,-0.0671,-0.0426,0.7165,-0.0768,-0.0361,0.6355,-0.0433,-0.0492,0.6347,-0.0361,-0.0582,0.7593,-0.0746,-0.0383,0.759,-0.0821,-0.0426,0.7165,-0.0768,-0.0577,0.7159,-0.0671,-0.0532,0.8246,-0.0453,-0.0321,0.8342,-0.0431,-0.0383,0.759,-0.0821,-0.0582,0.7593,-0.0746,0.0,0.8212,0.0414,-0.0312,0.8207,0.0324,-0.0403,0.75,0.0659,0.0,0.7443,0.0725,-0.0312,0.8207,0.0324,-0.0259,0.8626,0.0385,-0.0329,0.8765,0.01,-0.0368,0.8377,-0.0121,-0.0501,0.5491,-0.0608,-0.0269,0.5185,-0.0685,-0.015,0.4597,-0.0587,-0.0509,0.4911,-0.0653,0.0,0.8212,0.0414,0.0,0.857,0.051,-0.0259,0.8626,0.0385,-0.0312,0.8207,0.0324,0.0,0.5173,0.0731,-0.0259,0.5179,0.07,-0.014,0.4643,0.0655,0.0,0.4732,0.0744,-0.0492,0.6347,-0.0361,-0.0361,0.6355,-0.0433,-0.0269,0.5185,-0.0685,-0.0501,0.5491,-0.0608,-0.0622,0.6281,0.0443,-0.0758,0.6309,0.0031,-0.083,0.5952,-0.0002,-0.074,0.5771,0.0407,0.0,0.6222,0.0753,-0.0361,0.6231,0.0683,-0.0259,0.5179,0.07,0.0,0.5173,0.0731,-0.09,0.7111,-0.0047,-0.0778,0.713,-0.0574,-0.0622,0.6339,-0.0288,-0.0758,0.6309,0.0031,-0.0492,0.6252,0.0587,-0.0622,0.6281,0.0443,-0.074,0.5771,0.0407,-0.0499,0.5464,0.0593,-0.0627,0.4484,-0.0573,-0.0974,0.4669,-0.038,-0.0813,0.5201,-0.0499,-0.0509,0.4911,-0.0653,-0.0758,0.6309,0.0031,-0.0622,0.6339,-0.0288,-0.0742,0.5781,-0.0424,-0.083,0.5952,-0.0002,-0.1107,0.4722,0.0036,-0.0947,0.461,0.0429,-0.0841,0.5212,0.0491,-0.0959,0.5298,-0.0001,-0.0588,0.4397,0.06,-0.0239,0.4215,0.0407,-0.014,0.4643,0.0655,-0.0465,0.4954,0.0666,-0.0239,0.4215,0.0407,-0.0132,0.4168,-0.0039,-0.0074,0.4555,-0.0005,-0.014,0.4643,0.0655,-0.0132,0.4168,-0.0039,-0.0226,0.4252,-0.0432,-0.015,0.4597,-0.0587,-0.0074,0.4555,-0.0005,-0.0853,0.1156,0.0092,-0.0841,0.07,0.0094,-0.0768,0.065,-0.0087,-0.0779,0.1103,-0.0092,-0.0981,0.1035,-0.0364,-0.1019,0.0573,-0.0341,-0.1195,0.0591,-0.0265,-0.1139,0.1059,-0.0292,-0.1213,0.1111,-0.0108,-0.1268,0.0641,-0.0083,-0.1194,0.0693,0.0097,-0.116,0.1161,0.0081,-0.0779,0.1103,-0.0092,-0.0768,0.065,-0.0087,-0.0842,0.0597,-0.0268,-0.0832,0.1053,-0.0281,-0.1011,0.118,0.0164,-0.1017,0.0718,0.0171,-0.0841,0.07,0.0094,-0.0853,0.1156,0.0092,-0.0974,0.4669,-0.038,-0.1107,0.4722,0.0036,-0.0959,0.5298,-0.0001,-0.0813,0.5201,-0.0499,-0.034,0.3339,0.0038,-0.0451,0.3435,-0.0248,-0.0226,0.4252,-0.0432,-0.0132,0.4168,-0.0039,-0.0462,0.3318,0.0335,-0.034,0.3339,0.0038,-0.0132,0.4168,-0.0039,-0.0239,0.4215,0.0407,-0.0748,0.3383,0.0468,-0.0462,0.3318,0.0335,-0.0239,0.4215,0.0407,-0.0588,0.4397,0.06,-0.114,0.3592,0.0074,-0.1028,0.3497,0.036,-0.0947,0.461,0.0429,-0.1107,0.4722,0.0036,-0.1139,0.1059,-0.0292,-0.1195,0.0591,-0.0265,-0.1268,0.0641,-0.0083,-0.1213,0.1111,-0.0108,-0.0732,0.3549,-0.0356,-0.1017,0.3614,-0.0222,-0.0974,0.4669,-0.038,-0.0627,0.4484,-0.0573,-0.0794,0.3199,-0.0276,-0.1045,0.3212,-0.0161,-0.1017,0.3614,-0.0222,-0.0732,0.3549,-0.0356,-0.1017,0.3614,-0.0222,-0.114,0.3592,0.0074,-0.1107,0.4722,0.0036,-0.0974,0.4669,-0.038,-0.115,0.3155,0.0089,-0.1046,0.306,0.0328,-0.1028,0.3497,0.036,-0.114,0.3592,0.0074,-0.0794,0.2984,0.0416,-0.0543,0.2971,0.0301,-0.0462,0.3318,0.0335,-0.0748,0.3383,0.0468,-0.0543,0.2971,0.0301,-0.0438,0.3028,0.0051,-0.034,0.3339,0.0038,-0.0462,0.3318,0.0335,-0.0438,0.3028,0.0051,-0.0542,0.3123,-0.0188,-0.0451,0.3435,-0.0248,-0.034,0.3339,0.0038,-0.1045,0.3212,-0.0161,-0.115,0.3155,0.0089,-0.114,0.3592,0.0074,-0.1017,0.3614,-0.0222,-0.0794,0.2984,0.0416,-0.0837,0.2595,0.0285,-0.0605,0.2586,0.0176,-0.0543,0.2971,0.0301,-0.0438,0.3028,0.0051,-0.0513,0.264,-0.0057,-0.0613,0.2724,-0.0277,-0.0542,0.3123,-0.0188,-0.115,0.3155,0.0089,-0.1173,0.2745,-0.0013,-0.1072,0.266,0.0207,-0.1046,0.306,0.0328,-0.0794,0.3199,-0.0276,-0.0849,0.279,-0.0356,-0.108,0.2798,-0.0246,-0.1045,0.3212,-0.0161,-0.0543,0.2971,0.0301,-0.0605,0.2586,0.0176,-0.0513,0.264,-0.0057,-0.0438,0.3028,0.0051,-0.1045,0.3212,-0.0161,-0.108,0.2798,-0.0246,-0.1173,0.2745,-0.0013,-0.115,0.3155,0.0089,-0.0837,0.2595,0.0285,-0.0909,0.2246,0.0247,-0.0646,0.2178,0.0142,-0.0605,0.2586,0.0176,-0.0513,0.264,-0.0057,-0.0531,0.2156,-0.0125,-0.0631,0.2192,-0.0396,-0.0613,0.2724,-0.0277,-0.1173,0.2745,-0.0013,-0.1265,0.2354,-0.0141,-0.1165,0.2318,0.013,-0.1072,0.266,0.0207,-0.0849,0.279,-0.0356,-0.0887,0.2265,-0.0513,-0.115,0.2332,-0.0407,-0.108,0.2798,-0.0246,-0.0605,0.2586,0.0176,-0.0646,0.2178,0.0142,-0.0531,0.2156,-0.0125,-0.0513,0.264,-0.0057,-0.0613,0.2724,-0.0277,-0.0631,0.2192,-0.0396,-0.0887,0.2265,-0.0513,-0.0849,0.279,-0.0356,-0.0542,0.3123,-0.0188,-0.0613,0.2724,-0.0277,-0.0849,0.279,-0.0356,-0.0794,0.3199,-0.0276,-0.0542,0.3123,-0.0188,-0.0794,0.3199,-0.0276,-0.0732,0.3549,-0.0356,-0.0451,0.3435,-0.0248,-0.0451,0.3435,-0.0248,-0.0732,0.3549,-0.0356,-0.0627,0.4484,-0.0573,-0.0226,0.4252,-0.0432,-0.0832,0.1053,-0.0281,-0.0842,0.0597,-0.0268,-0.1019,0.0573,-0.0341,-0.0981,0.1035,-0.0364,-0.0226,0.4252,-0.0432,-0.0627,0.4484,-0.0573,-0.0509,0.4911,-0.0653,-0.015,0.4597,-0.0587,-0.1072,0.266,0.0207,-0.1165,0.2318,0.013,-0.0909,0.2246,0.0247,-0.0837,0.2595,0.0285,-0.1046,0.306,0.0328,-0.1072,0.266,0.0207,-0.0837,0.2595,0.0285,-0.0794,0.2984,0.0416,-0.1046,0.306,0.0328,-0.0794,0.2984,0.0416,-0.0748,0.3383,0.0468,-0.1028,0.3497,0.036,-0.1028,0.3497,0.036,-0.0748,0.3383,0.0468,-0.0588,0.4397,0.06,-0.0947,0.461,0.0429,-0.116,0.1161,0.0081,-0.1194,0.0693,0.0097,-0.1017,0.0718,0.0171,-0.1011,0.118,0.0164,-0.0947,0.461,0.0429,-0.0588,0.4397,0.06,-0.0465,0.4954,0.0666,-0.0841,0.5212,0.0491,-0.0361,0.6231,0.0683,-0.0492,0.6252,0.0587,-0.0499,0.5464,0.0593,-0.0259,0.5179,0.07,-0.0622,0.6339,-0.0288,-0.0492,0.6347,-0.0361,-0.0501,0.5491,-0.0608,-0.0742,0.5781,-0.0424,-0.0742,0.5781,-0.0424,-0.0501,0.5491,-0.0608,-0.0509,0.4911,-0.0653,-0.0813,0.5201,-0.0499,-0.083,0.8188,-0.038,-0.0532,0.8246,-0.0453,-0.0582,0.7593,-0.0746,-0.0816,0.7596,-0.0662,-0.0816,0.7596,-0.0662,-0.0582,0.7593,-0.0746,-0.0577,0.7159,-0.0671,-0.0778,0.713,-0.0574,-0.0778,0.713,-0.0574,-0.0577,0.7159,-0.0671,-0.0492,0.6347,-0.0361,-0.0622,0.6339,-0.0288,-0.0425,0.7171,0.0621,-0.0574,0.7154,0.0518,-0.0492,0.6252,0.0587,-0.0361,0.6231,0.0683,-0.0403,0.75,0.0659,-0.0605,0.7544,0.0553,-0.0574,0.7154,0.0518,-0.0425,0.7171,0.0621,-0.0312,0.8207,0.0324,-0.0505,0.8206,0.0258,-0.0605,0.7544,0.0553,-0.0403,0.75,0.0659,-0.0312,0.8207,0.0324,-0.0368,0.8377,-0.0121,-0.0579,0.832,-0.0115,-0.0505,0.8206,0.0258,-0.108,0.2798,-0.0246,-0.115,0.2332,-0.0407,-0.1265,0.2354,-0.0141,-0.1173,0.2745,-0.0013,-0.0259,0.5179,0.07,-0.0499,0.5464,0.0593,-0.0465,0.4954,0.0666,-0.014,0.4643,0.0655,-0.1165,0.2318,0.013,-0.116,0.1161,0.0081,-0.1011,0.118,0.0164,-0.0909,0.2246,0.0247,-0.0631,0.2192,-0.0396,-0.0832,0.1053,-0.0281,-0.0981,0.1035,-0.0364,-0.0887,0.2265,-0.0513,-0.0368,0.8377,-0.0121,-0.0321,0.8342,-0.0431,-0.0532,0.8246,-0.0453,-0.0579,0.832,-0.0115,-0.0909,0.2246,0.0247,-0.1011,0.118,0.0164,-0.0853,0.1156,0.0092,-0.0646,0.2178,0.0142,-0.0531,0.2156,-0.0125,-0.0779,0.1103,-0.0092,-0.0832,0.1053,-0.0281,-0.0631,0.2192,-0.0396,-0.1265,0.2354,-0.0141,-0.1213,0.1111,-0.0108,-0.116,0.1161,0.0081,-0.1165,0.2318,0.013,-0.0887,0.2265,-0.0513,-0.0981,0.1035,-0.0364,-0.1139,0.1059,-0.0292,-0.115,0.2332,-0.0407,-0.0646,0.2178,0.0142,-0.0853,0.1156,0.0092,-0.0779,0.1103,-0.0092,-0.0531,0.2156,-0.0125,-0.115,0.2332,-0.0407,-0.1139,0.1059,-0.0292,-0.1213,0.1111,-0.0108,-0.1265,0.2354,-0.0141,-0.2601,0.7547,-0.0223,-0.3795,0.7627,-0.0099,-0.3795,0.7698,-0.0129,-0.2629,0.7743,-0.0278,-0.1874,0.7733,0.0304,-0.2278,0.7723,0.0237,-0.2284,0.7516,0.0144,-0.186,0.7455,0.0233,-0.1219,0.7292,-0.0077,-0.1758,0.7381,-0.0088,-0.1653,0.7449,-0.041,-0.1206,0.7388,-0.0432,-0.0772,0.712,0.0389,-0.1205,0.739,0.018,-0.1219,0.7292,-0.0077,-0.09,0.7111,-0.0047,-0.0818,0.7589,0.0447,-0.1159,0.7729,0.0326,-0.1205,0.739,0.018,-0.0772,0.712,0.0389,-0.0843,0.8225,-0.0105,-0.1083,0.8291,-0.0121,-0.1097,0.819,0.0157,-0.0818,0.8154,0.0191,-0.083,0.8188,-0.038,-0.1096,0.82,-0.0385,-0.1083,0.8291,-0.0121,-0.0843,0.8225,-0.0105,-0.2629,0.7743,-0.0278,-0.3795,0.7698,-0.0129,-0.3795,0.7797,-0.0092,-0.2655,0.8016,-0.0206,-0.1841,0.8081,0.0226,-0.2291,0.7994,0.0122,-0.2278,0.7723,0.0237,-0.1874,0.7733,0.0304,-0.1097,0.819,0.0157,-0.1083,0.8291,-0.0121,-0.1711,0.8178,-0.0113,-0.1841,0.8081,0.0226,-0.1643,0.8108,-0.0363,-0.2321,0.7987,-0.0245,-0.2307,0.8052,-0.006,-0.1711,0.8178,-0.0113,-0.2586,0.7746,0.0234,-0.3795,0.7699,0.0139,-0.3795,0.7628,0.0093,-0.257,0.7548,0.0144,-0.257,0.7548,0.0144,-0.3795,0.7628,0.0093,-0.3795,0.7607,0.0012,-0.2576,0.7491,-0.0011,-0.186,0.7455,0.0233,-0.2284,0.7516,0.0144,-0.2298,0.7455,-0.0031,-0.1758,0.7381,-0.0088,-0.2655,0.8016,-0.0206,-0.3795,0.7797,-0.0092,-0.3795,0.7818,-0.0001,-0.2648,0.8075,-0.0031,-0.3795,0.7698,-0.0129,-0.3886,0.7696,-0.0161,-0.3886,0.7786,-0.0127,-0.3795,0.7797,-0.0092,-0.3795,0.7627,-0.0099,-0.3886,0.763,-0.0133,-0.3886,0.7696,-0.0161,-0.3795,0.7698,-0.0129,-0.3795,0.7607,0.0012,-0.3886,0.7592,0.0074,-0.3886,0.763,-0.0133,-0.3795,0.7627,-0.0099,-0.1653,0.7449,-0.041,-0.2315,0.7524,-0.0265,-0.2323,0.772,-0.0323,-0.1627,0.7729,-0.0466,-0.1627,0.7729,-0.0466,-0.2323,0.772,-0.0323,-0.2321,0.7987,-0.0245,-0.1643,0.8108,-0.0363,-0.1841,0.8081,0.0226,-0.1711,0.8178,-0.0113,-0.2307,0.8052,-0.006,-0.2291,0.7994,0.0122,-0.3795,0.7797,-0.0092,-0.3886,0.7786,-0.0127,-0.3873,0.783,0.0043,-0.3795,0.7818,-0.0001,-0.1159,0.7729,0.0326,-0.1874,0.7733,0.0304,-0.186,0.7455,0.0233,-0.1205,0.739,0.018,-0.2576,0.7491,-0.0011,-0.3795,0.7607,0.0012,-0.3795,0.7627,-0.0099,-0.2601,0.7547,-0.0223,-0.1097,0.819,0.0157,-0.1841,0.8081,0.0226,-0.1874,0.7733,0.0304,-0.1159,0.7729,0.0326,-0.1205,0.739,0.018,-0.186,0.7455,0.0233,-0.1758,0.7381,-0.0088,-0.1219,0.7292,-0.0077,-0.1206,0.7388,-0.0432,-0.1653,0.7449,-0.041,-0.1627,0.7729,-0.0466,-0.116,0.7723,-0.0527,-0.116,0.7723,-0.0527,-0.1627,0.7729,-0.0466,-0.1643,0.8108,-0.0363,-0.1096,0.82,-0.0385,-0.2648,0.8075,-0.0031,-0.3795,0.7818,-0.0001,-0.3795,0.7797,0.0086,-0.2627,0.8016,0.0135,-0.2586,0.7746,0.0234,-0.2434,0.7739,0.0213,-0.2447,0.7979,0.0114,-0.2627,0.8016,0.0135,-0.2434,0.7739,0.0213,-0.2278,0.7723,0.0237,-0.2291,0.7994,0.0122,-0.2447,0.7979,0.0114,-0.1096,0.82,-0.0385,-0.1643,0.8108,-0.0363,-0.1711,0.8178,-0.0113,-0.1083,0.8291,-0.0121,-0.2648,0.8075,-0.0031,-0.2461,0.8032,-0.0047,-0.2474,0.7978,-0.0213,-0.2655,0.8016,-0.0206,-0.2323,0.772,-0.0323,-0.2475,0.7736,-0.0281,-0.2474,0.7978,-0.0213,-0.2321,0.7987,-0.0245,-0.2475,0.7736,-0.0281,-0.2629,0.7743,-0.0278,-0.2655,0.8016,-0.0206,-0.2474,0.7978,-0.0213,-0.2627,0.8016,0.0135,-0.2447,0.7979,0.0114,-0.2461,0.8032,-0.0047,-0.2648,0.8075,-0.0031,-0.2447,0.7979,0.0114,-0.2291,0.7994,0.0122,-0.2307,0.8052,-0.006,-0.2461,0.8032,-0.0047,-0.257,0.7548,0.0144,-0.2439,0.7561,0.0129,-0.2434,0.7739,0.0213,-0.2586,0.7746,0.0234,-0.2439,0.7561,0.0129,-0.2284,0.7516,0.0144,-0.2278,0.7723,0.0237,-0.2434,0.7739,0.0213,-0.2315,0.7524,-0.0265,-0.2468,0.7562,-0.0228,-0.2475,0.7736,-0.0281,-0.2323,0.772,-0.0323,-0.2468,0.7562,-0.0228,-0.2601,0.7547,-0.0223,-0.2629,0.7743,-0.0278,-0.2475,0.7736,-0.0281,-0.2284,0.7516,0.0144,-0.2439,0.7561,0.0129,-0.2451,0.7509,-0.0022,-0.2298,0.7455,-0.0031,-0.2439,0.7561,0.0129,-0.257,0.7548,0.0144,-0.2576,0.7491,-0.0011,-0.2451,0.7509,-0.0022,-0.2461,0.8032,-0.0047,-0.2307,0.8052,-0.006,-0.2321,0.7987,-0.0245,-0.2474,0.7978,-0.0213,-0.2298,0.7455,-0.0031,-0.2451,0.7509,-0.0022,-0.2468,0.7562,-0.0228,-0.2315,0.7524,-0.0265,-0.2627,0.8016,0.0135,-0.3795,0.7797,0.0086,-0.3795,0.7699,0.0139,-0.2586,0.7746,0.0234,-0.2451,0.7509,-0.0022,-0.2576,0.7491,-0.0011,-0.2601,0.7547,-0.0223,-0.2468,0.7562,-0.0228,-0.4003,0.7633,-0.0125,-0.4216,0.7644,-0.0108,-0.4216,0.769,-0.0134,-0.4003,0.7694,-0.0153,-0.1758,0.7381,-0.0088,-0.2298,0.7455,-0.0031,-0.2315,0.7524,-0.0265,-0.1653,0.7449,-0.041,-0.3988,0.7819,0.0054,-0.4216,0.7787,0.0063,-0.4216,0.7764,0.0246,-0.4003,0.7774,0.0248,-0.4041,0.7695,0.0259,-0.4216,0.7691,0.0279,-0.4216,0.7637,0.0251,-0.402,0.7629,0.0254,-0.3795,0.7797,0.0086,-0.3886,0.7783,0.0249,-0.3886,0.7697,0.0284,-0.3795,0.7699,0.0139,-0.3795,0.7628,0.0093,-0.3886,0.7628,0.0254,-0.3886,0.7592,0.0074,-0.3795,0.7607,0.0012,-0.3795,0.7699,0.0139,-0.3886,0.7697,0.0284,-0.3886,0.7628,0.0254,-0.3795,0.7628,0.0093,-0.3795,0.7818,-0.0001,-0.3873,0.783,0.0043,-0.3886,0.7783,0.0249,-0.3795,0.7797,0.0086,-0.4003,0.7779,-0.0119,-0.4216,0.7762,-0.0102,-0.4216,0.7787,0.0063,-0.3988,0.7819,0.0054,-0.4216,0.769,-0.0134,-0.4516,0.7683,-0.0096,-0.4529,0.7736,-0.0071,-0.4216,0.7762,-0.0102,-0.4216,0.7644,-0.0108,-0.4472,0.764,-0.0072,-0.4516,0.7683,-0.0096,-0.4216,0.769,-0.0134,-0.4216,0.7616,0.0084,-0.4501,0.7637,0.0102,-0.4472,0.764,-0.0072,-0.4216,0.7644,-0.0108,-0.4003,0.7694,-0.0153,-0.4216,0.769,-0.0134,-0.4216,0.7762,-0.0102,-0.4003,0.7779,-0.0119,-0.4216,0.7762,-0.0102,-0.4529,0.7736,-0.0071,-0.4565,0.7736,0.0073,-0.4216,0.7787,0.0063,-0.4003,0.7774,0.0248,-0.4216,0.7764,0.0246,-0.4216,0.7691,0.0279,-0.4041,0.7695,0.0259,-0.402,0.7629,0.0254,-0.4216,0.7637,0.0251,-0.4216,0.7616,0.0084,-0.4003,0.76,0.0077,-0.4607,0.7736,0.0236,-0.4565,0.7736,0.0073,-0.4569,0.7681,0.0102,-0.4616,0.7683,0.0267,-0.4616,0.7683,0.0267,-0.4569,0.7681,0.0102,-0.4501,0.7637,0.0102,-0.4548,0.7644,0.0246,-0.4003,0.76,0.0077,-0.4216,0.7616,0.0084,-0.4216,0.7644,-0.0108,-0.4003,0.7633,-0.0125,-0.4565,0.7736,0.0073,-0.4529,0.7736,-0.0071,-0.4516,0.7683,-0.0096,-0.4569,0.7681,0.0102,-0.4216,0.7764,0.0246,-0.4607,0.7736,0.0236,-0.4616,0.7683,0.0267,-0.4216,0.7691,0.0279,-0.4216,0.7637,0.0251,-0.4548,0.7644,0.0246,-0.4501,0.7637,0.0102,-0.4216,0.7616,0.0084,-0.4216,0.7691,0.0279,-0.4616,0.7683,0.0267,-0.4548,0.7644,0.0246,-0.4216,0.7637,0.0251,-0.4216,0.7787,0.0063,-0.4565,0.7736,0.0073,-0.4607,0.7736,0.0236,-0.4216,0.7764,0.0246,-0.3886,0.7628,0.0254,-0.402,0.7629,0.0254,-0.4003,0.76,0.0077,-0.3886,0.7592,0.0074,-0.3886,0.7783,0.0249,-0.3945,0.7764,0.0355,-0.3945,0.7706,0.0374,-0.3886,0.7697,0.0284,-0.4569,0.7681,0.0102,-0.4516,0.7683,-0.0096,-0.4472,0.764,-0.0072,-0.4501,0.7637,0.0102,-0.3886,0.7696,-0.0161,-0.4003,0.7694,-0.0153,-0.4003,0.7779,-0.0119,-0.3886,0.7786,-0.0127,-0.4003,0.7774,0.0248,-0.4221,0.7714,0.0349,-0.4224,0.7717,0.0374,-0.4024,0.7755,0.0384,-0.3873,0.783,0.0043,-0.3988,0.7819,0.0054,-0.4003,0.7774,0.0248,-0.3886,0.7783,0.0249,-0.3886,0.7592,0.0074,-0.4003,0.76,0.0077,-0.4003,0.7633,-0.0125,-0.3886,0.763,-0.0133,-0.3886,0.763,-0.0133,-0.4003,0.7633,-0.0125,-0.4003,0.7694,-0.0153,-0.3886,0.7696,-0.0161,-0.3945,0.7764,0.0355,-0.4024,0.7755,0.0384,-0.4024,0.7704,0.0402,-0.3945,0.7706,0.0374,-0.3945,0.7706,0.0374,-0.4024,0.7704,0.0402,-0.4024,0.7638,0.0389,-0.3945,0.7637,0.036,-0.3886,0.7628,0.0254,-0.3945,0.7637,0.036,-0.4024,0.7638,0.0389,-0.402,0.7629,0.0254,-0.4024,0.7638,0.0389,-0.4199,0.7668,0.038,-0.4193,0.7665,0.0341,-0.402,0.7629,0.0254,-0.3886,0.7697,0.0284,-0.3945,0.7706,0.0374,-0.3945,0.7637,0.036,-0.3886,0.7628,0.0254,-0.4003,0.7774,0.0248,-0.4024,0.7755,0.0384,-0.3945,0.7764,0.0355,-0.3886,0.7783,0.0249,-0.4218,0.7691,0.0338,-0.4225,0.7696,0.0389,-0.4224,0.7717,0.0374,-0.4221,0.7714,0.0349,-0.4193,0.7665,0.0341,-0.4199,0.7668,0.038,-0.4225,0.7696,0.0389,-0.4218,0.7691,0.0338,-0.4024,0.7704,0.0402,-0.4225,0.7696,0.0389,-0.4199,0.7668,0.038,-0.4024,0.7638,0.0389,-0.4041,0.7695,0.0259,-0.4218,0.7691,0.0338,-0.4221,0.7714,0.0349,-0.4003,0.7774,0.0248,-0.402,0.7629,0.0254,-0.4193,0.7665,0.0341,-0.4218,0.7691,0.0338,-0.4041,0.7695,0.0259,-0.4024,0.7755,0.0384,-0.4224,0.7717,0.0374,-0.4225,0.7696,0.0389,-0.4024,0.7704,0.0402,-0.0842,0.0597,-0.0268,-0.0857,-0.0,-0.0318,-0.106,-0.0,-0.0398,-0.1019,0.0573,-0.0341,-0.0768,0.065,-0.0087,-0.077,-0.0,-0.0116,-0.0857,-0.0,-0.0318,-0.0842,0.0597,-0.0268,-0.3886,0.7786,-0.0127,-0.4003,0.7779,-0.0119,-0.3988,0.7819,0.0054,-0.3873,0.783,0.0043,-0.1206,0.0463,0.02,-0.1232,0.0057,0.084,-0.1055,0.0066,0.088,-0.1025,0.0485,0.0267,-0.0852,0.0,0.025,-0.086,0.0,0.0862,-0.106,0.0,0.082,-0.1051,0.0,0.0311,-0.1019,0.0573,-0.0341,-0.106,-0.0,-0.0398,-0.1259,-0.0,-0.031,-0.1195,0.0591,-0.0265,-0.0844,0.0472,0.0215,-0.0874,0.0075,0.092,-0.0793,0.0079,0.0936,-0.0768,0.0436,0.0151,-0.0768,0.0436,0.0151,-0.0793,0.0079,0.0936,-0.0769,0.0,0.0879,-0.077,0.0047,0.0092,-0.0874,0.0075,0.092,-0.086,0.0,0.0862,-0.0769,0.0,0.0879,-0.0793,0.0079,0.0936,-0.1305,0.0053,0.0822,-0.1337,0.0,0.0759,-0.1256,0.0,0.0777,-0.1232,0.0057,0.084,-0.1055,0.0066,0.088,-0.1232,0.0057,0.084,-0.1256,0.0,0.0777,-0.106,0.0,0.082,-0.0874,0.0075,0.092,-0.1055,0.0066,0.088,-0.106,0.0,0.082,-0.086,0.0,0.0862,-0.077,0.0047,0.0092,-0.0769,0.0,0.0879,-0.086,0.0,0.0862,-0.0852,0.0,0.025,-0.1281,0.0424,0.0131,-0.1305,0.0053,0.0822,-0.1232,0.0057,0.084,-0.1206,0.0463,0.02,-0.1252,0.0,0.0238,-0.1256,0.0,0.0777,-0.1337,0.0,0.0759,-0.1338,0.0047,0.0075,-0.1338,0.0047,0.0075,-0.1337,0.0,0.0759,-0.1305,0.0053,0.0822,-0.1281,0.0424,0.0131,-0.1051,0.0,0.0311,-0.106,0.0,0.082,-0.1256,0.0,0.0777,-0.1252,0.0,0.0238,-0.1025,0.0485,0.0267,-0.1055,0.0066,0.088,-0.0874,0.0075,0.092,-0.0844,0.0472,0.0215,-0.1017,0.0718,0.0171,-0.1025,0.0485,0.0267,-0.0844,0.0472,0.0215,-0.0841,0.07,0.0094,-0.1049,0.0047,0.0177,-0.1051,0.0,0.0311,-0.1252,0.0,0.0238,-0.1251,0.0047,0.0096,-0.1338,-0.0,-0.0105,-0.1338,0.0047,0.0075,-0.1281,0.0424,0.0131,-0.1268,0.0641,-0.0083,-0.1251,0.0047,0.0096,-0.1252,0.0,0.0238,-0.1338,0.0047,0.0075,-0.1338,-0.0,-0.0105,-0.1268,0.0641,-0.0083,-0.1281,0.0424,0.0131,-0.1206,0.0463,0.02,-0.1194,0.0693,0.0097,-0.077,-0.0,-0.0116,-0.077,0.0047,0.0092,-0.0852,0.0,0.025,-0.0849,0.0047,0.0089,-0.0768,0.065,-0.0087,-0.0768,0.0436,0.0151,-0.077,0.0047,0.0092,-0.077,-0.0,-0.0116,-0.0841,0.07,0.0094,-0.0844,0.0472,0.0215,-0.0768,0.0436,0.0151,-0.0768,0.065,-0.0087,-0.0849,0.0047,0.0089,-0.0852,0.0,0.025,-0.1051,0.0,0.0311,-0.1049,0.0047,0.0177,-0.1194,0.0693,0.0097,-0.1206,0.0463,0.02,-0.1025,0.0485,0.0267,-0.1017,0.0718,0.0171,-0.1195,0.0591,-0.0265,-0.1259,-0.0,-0.031,-0.1338,-0.0,-0.0105,-0.1268,0.0641,-0.0083,-0.0259,0.8626,0.0385,-0.0263,0.8741,0.0632,-0.0392,0.8945,0.0096,-0.0329,0.8765,0.01,-0.0329,0.8765,0.01,-0.0392,0.8945,0.0096,-0.0355,0.9052,-0.012,-0.029,0.8845,-0.0116,-0.0361,0.6355,-0.0433,0.0,0.6369,-0.0383,0.0,0.5173,-0.0652,-0.0269,0.5185,-0.0685,-0.0368,0.8377,-0.0121,-0.0329,0.8765,0.01,-0.029,0.8845,-0.0116,-0.0321,0.8342,-0.0431,-0.0371,0.9461,0.0598,-0.0314,0.972,0.0561,-0.0381,0.9813,0.0131,-0.0439,0.9529,0.0119,-0.0321,0.8342,-0.0431,-0.029,0.8845,-0.0116,0.0,0.8903,-0.0187,0.0,0.8451,-0.0486,0.0,0.857,0.051,0.0,0.8613,0.0797,-0.0263,0.8741,0.0632,-0.0259,0.8626,0.0385,-0.029,0.8845,-0.0116,-0.0355,0.9052,-0.012,0.0,0.9113,-0.0181,0.0,0.8903,-0.0187,0.0,0.9865,0.0704,0.0,1.0,0.0145,-0.0381,0.9813,0.0131,-0.0314,0.972,0.0561,-0.0439,0.9529,0.0119,-0.0381,0.9813,0.0131,-0.0306,0.9756,-0.0163,-0.0336,0.9567,-0.0235,0.0,0.9451,0.0792,0.0,0.9865,0.0704,-0.0314,0.972,0.0561,-0.0371,0.9461,0.0598,-0.0336,0.9567,-0.0235,-0.0306,0.9756,-0.0163,0.0,0.9843,-0.0257,0.0,0.9614,-0.0305,-0.0345,0.9473,-0.022,-0.0336,0.9567,-0.0235,0.0,0.9614,-0.0305,0.0,0.95,-0.0309,0.0,0.9113,-0.0181,-0.0355,0.9052,-0.012,-0.0364,0.9283,-0.0189,0.0,0.9344,-0.0298,-0.0263,0.8741,0.0632,0.0,0.8613,0.0797,0.0,0.9083,0.0886,-0.0365,0.9072,0.0668,-0.0367,0.9301,0.0577,-0.0371,0.9461,0.0598,-0.0439,0.9529,0.0119,-0.0432,0.9398,0.0108,0.0,1.0,0.0145,0.0,0.9843,-0.0257,-0.0306,0.9756,-0.0163,-0.0381,0.9813,0.0131,-0.0432,0.9398,0.0108,-0.0439,0.9529,0.0119,-0.0336,0.9567,-0.0235,-0.0345,0.9473,-0.022,-0.0365,0.9072,0.0668,-0.0367,0.9301,0.0577,-0.0432,0.9398,0.0108,-0.0419,0.9203,0.0097,0.0,0.9321,0.077,0.0,0.9451,0.0792,-0.0371,0.9461,0.0598,-0.0367,0.9301,0.0577,0.0,0.9083,0.0886,0.0,0.9321,0.077,-0.0367,0.9301,0.0577,-0.0365,0.9072,0.0668,-0.0364,0.9283,-0.0189,-0.0345,0.9473,-0.022,0.0,0.95,-0.0309,0.0,0.9344,-0.0298,-0.0432,0.9398,0.0108,-0.0345,0.9473,-0.022,-0.0364,0.9283,-0.0189,-0.0419,0.9203,0.0097,-0.0419,0.9203,0.0097,-0.0364,0.9283,-0.0189,-0.0355,0.9052,-0.012,-0.0392,0.8945,0.0096,0.0857,-0.0,-0.0318,0.106,-0.0,-0.0398,0.1259,-0.0,-0.031,0.1338,-0.0,-0.0105,0.1251,0.0047,0.0096,0.1049,0.0047,0.0177,0.0849,0.0047,0.0089,0.077,-0.0,-0.0116,-0.0857,-0.0,-0.0318,-0.077,-0.0,-0.0116,-0.0849,0.0047,0.0089,-0.1049,0.0047,0.0177,-0.1251,0.0047,0.0096,-0.1338,-0.0,-0.0105,-0.1259,-0.0,-0.031,-0.106,-0.0,-0.0398],"i":[0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23,24,25,26,24,26,27,28,29,30,28,30,31,32,33,34,32,34,35,36,37,38,36,38,39,40,41,42,40,42,43,44,45,46,44,46,47,48,49,50,48,50,51,52,53,54,52,54,55,56,57,58,56,58,59,60,61,62,60,62,63,64,65,66,64,66,67,68,69,70,68,70,71,72,73,74,72,74,75,76,77,78,76,78,79,80,81,82,80,82,83,84,85,86,84,86,87,88,89,90,88,90,91,92,93,94,92,94,95,96,97,98,96,98,99,100,101,102,100,102,103,104,105,106,104,106,107,108,109,110,108,110,111,112,113,114,112,114,115,116,117,118,116,118,119,120,121,122,120,122,123,124,125,126,124,126,127,128,129,130,128,130,131,132,133,134,132,134,135,136,137,138,136,138,139,140,141,142,140,142,143,144,145,146,144,146,147,148,149,150,148,150,151,152,153,154,152,154,155,156,157,158,156,158,159,160,161,162,160,162,163,164,165,166,164,166,167,168,169,170,168,170,171,172,173,174,172,174,175,176,177,178,176,178,179,180,181,182,180,182,183,184,185,186,184,186,187,188,189,190,188,190,191,192,193,194,192,194,195,196,197,198,196,198,199,200,201,202,200,202,203,204,205,206,204,206,207,208,209,210,208,210,211,212,213,214,212,214,215,216,217,218,216,218,219,220,221,222,220,222,223,224,225,226,224,226,227,228,229,230,228,230,231,232,233,234,232,234,235,236,237,238,236,238,239,240,241,242,240,242,243,244,245,246,244,246,247,248,249,250,248,250,251,252,253,254,252,254,255,256,257,258,256,258,259,260,261,262,260,262,263,264,265,266,264,266,267,268,269,270,268,270,271,272,273,274,272,274,275,276,277,278,276,278,279,280,281,282,280,282,283,284,285,286,284,286,287,288,289,290,288,290,291,292,293,294,292,294,295,296,297,298,296,298,299,300,301,302,300,302,303,304,305,306,304,306,307,308,309,310,308,310,311,312,313,314,312,314,315,316,317,318,316,318,319,320,321,322,320,322,323,324,325,326,324,326,327,328,329,330,328,330,331,332,333,334,332,334,335,336,337,338,336,338,339,340,341,342,340,342,343,344,345,346,344,346,347,348,349,350,348,350,351,352,353,354,352,354,355,356,357,358,356,358,359,360,361,362,360,362,363,364,365,366,364,366,367,368,369,370,368,370,371,372,373,374,372,374,375,376,377,378,376,378,379,380,381,382,380,382,383,384,385,386,384,386,387,388,389,390,388,390,391,392,393,394,392,394,395,396,397,398,396,398,399,400,401,402,400,402,403,404,405,406,404,406,407,408,409,410,408,410,411,412,413,414,412,414,415,416,417,418,416,418,419,420,421,422,420,422,423,424,425,426,424,426,427,428,429,430,428,430,431,432,433,434,432,434,435,436,437,438,436,438,439,440,441,442,440,442,443,444,445,446,444,446,447,448,449,450,448,450,451,452,453,454,452,454,455,456,457,458,456,458,459,460,461,462,460,462,463,464,465,466,464,466,467,468,469,470,468,470,471,472,473,474,472,474,475,476,477,478,476,478,479,480,481,482,480,482,483,484,485,486,484,486,487,488,489,490,488,490,491,492,493,494,492,494,495,496,497,498,496,498,499,500,501,502,500,502,503,504,505,506,504,506,507,508,509,510,508,510,511,512,513,514,512,514,515,516,517,518,516,518,519,520,521,522,520,522,523,524,525,526,524,526,527,528,529,530,528,530,531,532,533,534,532,534,535,536,537,538,536,538,539,540,541,542,540,542,543,544,545,546,544,546,547,548,549,550,548,550,551,552,553,554,552,554,555,556,557,558,556,558,559,560,561,562,560,562,563,564,565,566,564,566,567,568,569,570,568,570,571,572,573,574,572,574,575,576,577,578,576,578,579,580,581,582,580,582,583,584,585,586,584,586,587,588,589,590,588,590,591,592,593,594,592,594,595,596,597,598,596,598,599,600,601,602,600,602,603,604,605,606,604,606,607,608,609,610,608,610,611,612,613,614,612,614,615,616,617,618,616,618,619,620,621,622,620,622,623,624,625,626,624,626,627,628,629,630,628,630,631,632,633,634,632,634,635,636,637,638,636,638,639,640,641,642,640,642,643,644,645,646,644,646,647,648,649,650,648,650,651,652,653,654,652,654,655,656,657,658,656,658,659,660,661,662,660,662,663,664,665,666,664,666,667,668,669,670,668,670,671,672,673,674,672,674,675,676,677,678,676,678,679,680,681,682,680,682,683,684,685,686,684,686,687,688,689,690,688,690,691,692,693,694,692,694,695,696,697,698,696,698,699,700,701,702,700,702,703,704,705,706,704,706,707,708,709,710,708,710,711,712,713,714,712,714,715,716,717,718,716,718,719,720,721,722,720,722,723,724,725,726,724,726,727,728,729,730,728,730,731,732,733,734,732,734,735,736,737,738,736,738,739,740,741,742,740,742,743,744,745,746,744,746,747,748,749,750,748,750,751,752,753,754,752,754,755,756,757,758,756,758,759,760,761,762,760,762,763,764,765,766,764,766,767,768,769,770,768,770,771,772,773,774,772,774,775,776,777,778,776,778,779,780,781,782,780,782,783,784,785,786,784,786,787,788,789,790,788,790,791,792,793,794,792,794,795,796,797,798,796,798,799,800,801,802,800,802,803,804,805,806,804,806,807,808,809,810,808,810,811,812,813,814,812,814,815,816,817,818,816,818,819,820,821,822,820,822,823,824,825,826,824,826,827,828,829,830,828,830,831,832,833,834,832,834,835,836,837,838,836,838,839,840,841,842,840,842,843,844,845,846,844,846,847,848,849,850,848,850,851,852,853,854,852,854,855,856,857,858,856,858,859,860,861,862,860,862,863,864,865,866,864,866,867,868,869,870,868,870,871,872,873,874,872,874,875,876,877,878,876,878,879,880,881,882,880,882,883,884,885,886,884,886,887,888,889,890,888,890,891,892,893,894,892,894,895,896,897,898,896,898,899,900,901,902,900,902,903,904,905,906,904,906,907,908,909,910,908,910,911,912,913,914,912,914,915,916,917,918,916,918,919,920,921,922,920,922,923,924,925,926,924,926,927,928,929,930,928,930,931,932,933,934,932,934,935,936,937,938,936,938,939,940,941,942,940,942,943,944,945,946,944,946,947,948,949,950,948,950,951,952,953,954,952,954,955,956,957,958,956,958,959,960,961,962,960,962,963,964,965,966,964,966,967,968,969,970,968,970,971,972,973,974,972,974,975,976,977,978,976,978,979,980,981,982,980,982,983,984,985,986,984,986,987,988,989,990,988,990,991,992,993,994,992,994,995,996,997,998,996,998,999,1000,1001,1002,1000,1002,1003,1004,1005,1006,1004,1006,1007,1008,1009,1010,1008,1010,1011,1012,1013,1014,1012,1014,1015,1016,1017,1018,1016,1018,1019,1020,1021,1022,1020,1022,1023,1024,1025,1026,1024,1026,1027,1028,1029,1030,1028,1030,1031,1032,1033,1034,1032,1034,1035,1036,1037,1038,1036,1038,1039,1040,1041,1042,1040,1042,1043,1044,1045,1046,1044,1046,1047,1048,1049,1050,1048,1050,1051,1052,1053,1054,1052,1054,1055,1056,1057,1058,1056,1058,1059,1060,1061,1062,1060,1062,1063,1064,1065,1066,1064,1066,1067,1068,1069,1070,1068,1070,1071,1072,1073,1074,1072,1074,1075,1076,1077,1078,1076,1078,1079,1080,1081,1082,1080,1082,1083,1084,1085,1086,1084,1086,1087,1088,1089,1090,1088,1090,1091,1092,1093,1094,1092,1094,1095,1096,1097,1098,1096,1098,1099,1100,1101,1102,1100,1102,1103,1104,1105,1106,1104,1106,1107,1108,1109,1110,1108,1110,1111,1112,1113,1114,1112,1114,1115,1116,1117,1118,1116,1118,1119,1120,1121,1122,1120,1122,1123,1124,1125,1126,1124,1126,1127,1128,1129,1130,1128,1130,1131,1132,1133,1134,1132,1134,1135,1136,1137,1138,1136,1138,1139,1140,1141,1142,1140,1142,1143,1144,1145,1146,1144,1146,1147,1148,1149,1150,1148,1150,1151,1152,1153,1154,1152,1154,1155,1156,1157,1158,1156,1158,1159,1160,1161,1162,1160,1162,1163,1164,1165,1166,1164,1166,1167,1168,1169,1170,1168,1170,1171,1172,1173,1174,1172,1174,1175,1176,1177,1178,1176,1178,1179,1180,1181,1182,1180,1182,1183,1184,1185,1186,1184,1186,1187,1188,1189,1190,1188,1190,1191,1192,1193,1194,1192,1194,1195,1196,1197,1198,1196,1198,1199,1200,1201,1202,1200,1202,1203,1204,1205,1206,1204,1206,1207,1208,1209,1210,1208,1210,1211,1212,1213,1214,1212,1214,1215,1216,1217,1218,1216,1218,1219,1220,1221,1222,1220,1222,1223,1224,1225,1226,1224,1226,1227,1228,1229,1230,1228,1230,1231,1232,1233,1234,1232,1234,1235,1236,1237,1238,1236,1238,1239,1240,1241,1242,1240,1242,1243,1244,1245,1246,1244,1246,1247,1248,1249,1250,1248,1250,1251,1252,1253,1254,1252,1254,1255,1256,1257,1258,1256,1258,1259,1260,1261,1262,1260,1262,1263,1264,1265,1266,1264,1266,1267,1268,1269,1270,1268,1270,1271,1272,1273,1274,1272,1274,1275,1276,1277,1278,1276,1278,1279,1280,1281,1282,1280,1282,1283,1284,1285,1286,1284,1286,1287,1288,1289,1290,1288,1290,1291,1292,1293,1294,1292,1294,1295,1296,1297,1298,1296,1298,1299,1300,1301,1302,1300,1302,1303,1304,1305,1306,1304,1306,1307,1308,1309,1310,1308,1310,1311,1312,1313,1314,1312,1314,1315,1316,1317,1318,1316,1318,1319,1320,1321,1322,1320,1322,1323,1324,1325,1326,1324,1326,1327,1328,1329,1330,1328,1330,1331,1332,1333,1334,1332,1334,1335,1336,1337,1338,1336,1338,1339,1340,1341,1342,1340,1342,1343,1344,1345,1346,1344,1346,1347,1348,1349,1350,1348,1350,1351,1352,1353,1354,1352,1354,1355,1356,1357,1358,1356,1358,1359,1360,1361,1362,1360,1362,1363,1364,1365,1366,1364,1366,1367,1368,1369,1370,1368,1370,1371,1372,1373,1374,1372,1374,1375,1376,1377,1378,1376,1378,1379,1380,1381,1382,1380,1382,1383,1384,1385,1386,1384,1386,1387,1388,1389,1390,1388,1390,1391,1392,1393,1394,1392,1394,1395,1396,1397,1398,1396,1398,1399,1400,1401,1402,1400,1402,1403,1404,1405,1406,1404,1406,1407,1408,1409,1410,1408,1410,1411,1412,1413,1414,1412,1414,1415,1416,1417,1418,1416,1418,1419,1420,1421,1422,1420,1422,1423,1424,1425,1426,1424,1426,1427,1428,1429,1430,1428,1430,1431,1432,1433,1434,1432,1434,1435,1436,1437,1438,1436,1438,1439,1440,1441,1442,1440,1442,1443,1444,1445,1446,1444,1446,1447,1448,1449,1450,1448,1450,1451,1452,1453,1454,1452,1454,1455,1456,1457,1458,1456,1458,1459,1460,1461,1462,1460,1462,1463,1464,1465,1466,1464,1466,1467,1468,1469,1470,1468,1470,1471,1472,1473,1474,1472,1474,1475,1476,1477,1478,1476,1478,1479,1480,1481,1482,1480,1482,1483,1484,1485,1486,1484,1486,1487,1488,1489,1490,1488,1490,1491,1492,1493,1494,1492,1494,1495,1496,1497,1498,1496,1498,1499,1500,1501,1502,1500,1502,1503,1504,1505,1506,1504,1506,1507,1508,1509,1510,1508,1510,1511,1512,1513,1514,1512,1514,1515,1516,1517,1518,1516,1518,1519,1520,1521,1522,1520,1522,1523,1524,1525,1526,1524,1526,1527,1528,1529,1530,1528,1530,1531,1532,1533,1534,1532,1534,1535,1536,1537,1538,1536,1538,1539,1540,1541,1542,1540,1542,1543,1544,1545,1546,1544,1546,1547,1548,1549,1550,1548,1550,1551,1552,1553,1554,1552,1554,1555,1556,1557,1558,1556,1558,1559,1560,1561,1562,1560,1562,1563,1564,1565,1566,1564,1566,1567,1568,1569,1570,1568,1570,1571,1572,1573,1574,1572,1574,1575,1576,1577,1578,1576,1578,1579,1580,1581,1582,1580,1582,1583,1584,1585,1586,1584,1586,1587,1588,1589,1590,1588,1590,1591,1592,1593,1594,1592,1594,1595,1596,1597,1598,1596,1598,1599,1600,1601,1602,1600,1602,1603,1604,1605,1606,1604,1606,1607,1608,1609,1610,1608,1610,1611,1612,1613,1614,1612,1614,1615,1616,1617,1618,1616,1618,1619,1620,1621,1622,1620,1622,1623,1624,1625,1626,1624,1626,1627,1628,1629,1630,1628,1630,1631,1632,1633,1634,1632,1634,1635,1636,1637,1638,1636,1638,1639,1640,1641,1642,1640,1642,1643,1644,1645,1646,1644,1646,1647,1648,1649,1650,1648,1650,1651,1652,1653,1654,1652,1654,1655,1656,1657,1658,1656,1658,1659,1660,1661,1662,1660,1662,1663,1664,1665,1666,1664,1666,1667,1668,1669,1670,1668,1670,1671,1672,1673,1674,1672,1674,1675,1676,1677,1678,1676,1678,1679,1680,1681,1682,1680,1682,1683,1684,1685,1686,1684,1686,1687,1688,1689,1690,1688,1690,1691,1692,1693,1694,1692,1694,1695,1696,1697,1698,1696,1698,1699,1700,1701,1702,1700,1702,1703,1704,1705,1706,1704,1706,1707,1708,1709,1710,1708,1710,1711,1712,1713,1714,1712,1714,1715,1716,1717,1718,1716,1718,1719,1720,1721,1722,1720,1722,1723,1724,1725,1726,1724,1726,1727,1728,1729,1730,1728,1730,1731,1732,1733,1734,1732,1734,1735,1736,1737,1738,1736,1738,1739,1740,1741,1742,1740,1742,1743,1744,1745,1746,1744,1746,1747,1748,1749,1750,1748,1750,1751,1752,1753,1754,1752,1754,1755,1756,1757,1758,1756,1758,1759,1760,1761,1762,1760,1762,1763,1764,1765,1766,1764,1766,1767,1768,1769,1770,1768,1770,1771,1772,1773,1774,1772,1774,1775,1776,1777,1778,1776,1778,1779,1780,1781,1782,1780,1782,1783,1784,1785,1786,1784,1786,1787,1788,1789,1790,1788,1790,1791,1792,1793,1794,1792,1794,1795,1796,1797,1798,1796,1798,1799,1800,1801,1802,1800,1802,1803,1804,1805,1806,1804,1806,1807,1808,1809,1810,1808,1810,1811,1812,1813,1814,1812,1814,1815,1816,1817,1818,1816,1818,1819,1820,1821,1822,1820,1822,1823,1824,1825,1826,1824,1826,1827,1828,1829,1830,1828,1830,1831,1832,1833,1834,1832,1834,1835,1836,1837,1838,1836,1838,1839,1840,1841,1842,1840,1842,1843,1844,1845,1846,1844,1846,1847,1848,1849,1850,1848,1850,1851,1852,1853,1854,1852,1854,1855,1856,1857,1858,1856,1858,1859,1860,1861,1862,1860,1862,1863,1864,1865,1866,1864,1866,1867,1868,1869,1870,1868,1870,1871,1872,1873,1874,1872,1874,1875,1876,1877,1878,1876,1878,1879,1880,1881,1882,1880,1882,1883,1884,1885,1886,1884,1886,1887,1888,1889,1890,1888,1890,1891,1892,1893,1894,1892,1894,1895,1896,1897,1898,1896,1898,1899,1900,1901,1902,1900,1902,1903,1904,1905,1906,1904,1906,1907,1908,1909,1910,1908,1910,1911,1912,1913,1914,1912,1914,1915,1916,1917,1918,1916,1918,1919,1920,1921,1922,1920,1922,1923,1924,1925,1926,1924,1926,1927,1928,1929,1930,1928,1930,1931,1932,1933,1934,1932,1934,1935,1936,1937,1938,1936,1938,1939,1940,1941,1942,1940,1942,1943,1944,1945,1946,1944,1946,1947,1948,1949,1950,1948,1950,1951,1952,1953,1954,1952,1954,1955,1956,1957,1958,1956,1958,1959,1960,1961,1962,1960,1962,1963,1964,1965,1966,1964,1966,1967,1968,1969,1970,1968,1970,1971,1972,1973,1974,1972,1974,1975,1976,1977,1978,1976,1978,1979,1980,1981,1982,1980,1982,1983,1984,1990,1991,1990,1984,1989,1989,1984,1985,1989,1985,1988,1988,1985,1986,1988,1986,1987,1998,1996,1997,1996,1998,1999,1996,1999,1995,1995,1999,1992,1995,1992,1994,1994,1992,1993]};
// =====================================================================
// world: biomes, generation, structures, chunk storage, meshing
// =====================================================================
const H_OVER = 128, SEA = 40;
const PLAINS = 0, FOREST = 1, MOUNTAINS = 2, CAVES = 3, OCEAN = 4, HELL = 5;
const BIOME_NAME = ["Plains", "Forest", "Mountains", "Caves", "Ocean", "Hellscape"];

//WORLDGEN-START
const infoCache = new Map();
function colInfo(wx, wz) {
  const ck = (wx + 1048576) * 2097152 + (wz + 1048576);
  let r = infoCache.get(ck); if (r) return r;
  if (infoCache.size > 250000) infoCache.clear();
  r = colInfoRaw(wx, wz); infoCache.set(ck, r); return r;
}
function colInfoRaw(wx, wz) {
  let c = stretch(fbm(wx * 0.0045, wz * 0.0045, 4, 11));
  let m = stretch(fbm(wx * 0.006, wz * 0.006, 3, 23));
  let hl = stretch(fbm(wx * 0.005, wz * 0.005, 3, 37));
  const t = stretch(fbm(wx * 0.007, wz * 0.007, 3, 51));
  const d = fbm(wx * 0.03, wz * 0.03, 3, 63);
  const r = fbm(wx * 0.02, wz * 0.02, 3, 71), ridge = 1 - Math.abs(2 * r - 1);
  const home = clamp01(1 - Math.hypot(wx, wz) / 140);
  if (home > 0) { c = Math.max(c, lerp(c, 0.62, home)); hl *= 1 - home; m *= 1 - home * 0.6; }
  let h = 45 + (d - 0.5) * 12;
  const of = smooth(0.4, 0.29, c);
  h = lerp(h, 24 + (d - 0.5) * 8, of);
  const mf = smooth(0.58, 0.76, m) * (1 - of);
  h += mf * (16 + 44 * ridge * ridge);
  const hf = smooth(0.73, 0.82, hl) * (1 - of);
  h = lerp(h, 39 + (d - 0.5) * 9, hf);
  let biome;
  if (hf > 0.5) biome = HELL; else if (of > 0.5) biome = OCEAN; else if (mf > 0.3) biome = MOUNTAINS; else if (t > 0.66) biome = FOREST; else if (t < 0.3) biome = CAVES; else biome = PLAINS;
  return { h: Math.floor(clamp(h, 6, 118)), biome };
}
const latA = (gx, gy, gz) => n3(gx * 0.18, gy * 0.26, gz * 0.18);
const latB = (gx, gy, gz) => n3(gx * 0.18 + 40.3, gy * 0.26 + 11.7, gz * 0.18 + 13.1);
const latC = (gx, gy, gz) => n3(gx * 0.096, gy * 0.18, gz * 0.096 + 77.7);
function trilerp(get, wx, y, wz) {
  const gx = Math.floor(wx / 4), gy = Math.floor(y / 4), gz = Math.floor(wz / 4);
  const fx = (wx - gx * 4) / 4, fy = (y - gy * 4) / 4, fz = (wz - gz * 4) / 4;
  const a = lerp(get(gx, gy, gz), get(gx + 1, gy, gz), fx), b = lerp(get(gx, gy + 1, gz), get(gx + 1, gy + 1, gz), fx);
  const c = lerp(get(gx, gy, gz + 1), get(gx + 1, gy, gz + 1), fx), d = lerp(get(gx, gy + 1, gz + 1), get(gx + 1, gy + 1, gz + 1), fx);
  return lerp(lerp(a, b, fy), lerp(c, d, fy), fz);
}
let CAVE_L = null;
function makeLattice(X0, Z0, maxH) {
  const gx0 = Math.floor(X0 / 4), gz0 = Math.floor(Z0 / 4), ny = Math.floor(maxH / 4) + 2;
  const mk = (f) => { const arr = new Float32Array(5 * 5 * ny).fill(NaN); return (gx, gy, gz) => { const i = (gy * 5 + (gz - gz0)) * 5 + (gx - gx0); let v = arr[i]; if (v !== v) { v = f(gx, gy, gz); arr[i] = v; } return v; }; };
  return { A: mk(latA), B: mk(latB), C: mk(latC) };
}
function caveCarve(wx, y, wz, h, biome) {
  if (y < 3 || y > h) return false;
  if (biome !== CAVES && y > h - 4) return false;
  if (biome === OCEAN && y > h - 7) return false;
  const L = CAVE_L;
  const w = biome === CAVES ? 0.075 : 0.05;
  const a = trilerp(L ? L.A : latA, wx, y, wz);
  if (Math.abs(a - 0.5) < w) { const b = trilerp(L ? L.B : latB, wx, y, wz); if (Math.abs(b - 0.5) < w) return true; }
  if (biome === CAVES && y < h - 1) { const cv = trilerp(L ? L.C : latC, wx, y, wz); if (cv > 0.7) return true; }
  return false;
}
const ISLANDS = [{ cy: 86, off: 3.1, thresh: 0.62, scale: 0.03 }, { cy: 106, off: 41.7, thresh: 0.67, scale: 0.04 }];
function islandLayer(wx, wz, li) {
  const L = ISLANDS[li];
  let mm = fbm(wx * L.scale, wz * L.scale, 4, 300 + li * 17 + L.off);
  if (li === 0) mm += Math.max(0, 1 - Math.hypot(wx - 8, wz - 8) / 15) * 0.3;
  const t = (mm - L.thresh) / 0.16; if (t <= 0) return null;
  const tt = Math.min(t, 1.4);
  const top = Math.floor(L.cy + tt * 4 + fbm(wx * 0.09, wz * 0.09, 2, 400 + li) * 4);
  const thick = Math.floor(2 + tt * tt * 9 + fbm(wx * 0.15, wz * 0.15, 2, 410 + li) * 6 * tt);
  return { top, bot: top - thick };
}
function oreFor(wx, y, wz, base) {
  const r = h3(wx, y, wz + 911);
  if (r < 0.004 && y < 18) return BLU;
  if (r < 0.014 && y < 34) return GOALD;
  if (r < 0.04 && y < 64) return IRUN;
  if (r < 0.085) return KOLE;
  if (r < 0.091 && y < 44) return ORE;
  return base;
}
// ---------- structures ----------
const structCache = new Map();
function regionStruct(kind, rx, rz) {
  const key = kind + rx + "," + rz;
  if (structCache.has(key)) return structCache.get(key);
  let s = null;
  if (kind === "c") {
    const REG = 144;
    if (h3(rx, 7001, rz) < 0.42) {
      const x = rx * REG + 24 + Math.floor(h3(rx, 7002, rz) * 96), z = rz * REG + 24 + Math.floor(h3(rx, 7003, rz) * 96);
      if (Math.hypot(x, z) > 70) {
        const info = colInfo(x, z);
        const base = info.biome === OCEAN ? SEA + 1 : Math.max(info.h, SEA + 1);
        if (base < 100) s = { kind: "castle", id: "c" + rx + "_" + rz, x, z, base, style: info.biome === HELL ? "hell" : "brick", biome: info.biome, R: 11, F: 13 };
      }
    }
  } else if (kind === "p") {
    const REG = 176;
    if (h3(rx, 7101, rz) < 0.5) {
      const x = rx * REG + 20 + Math.floor(h3(rx, 7102, rz) * 130), z = rz * REG + 20 + Math.floor(h3(rx, 7103, rz) * 130);
      const info = colInfo(x, z);
      if (info.biome !== OCEAN && Math.hypot(x, z) > 40 && info.h >= SEA) s = { kind: "portal", id: "p" + rx + "_" + rz, x, z, base: info.h + 1, F: 6 };
    }
  } else if (kind === "v") {
    const REG = 128;
    if (h3(rx, 7201, rz) < 0.9) {
      const x = rx * REG + 16 + Math.floor(h3(rx, 7202, rz) * 96), z = rz * REG + 16 + Math.floor(h3(rx, 7203, rz) * 96);
      const c = islandLayer(x, z, 0);
      if (c && Math.hypot(x - 8, z - 8) > 34 && c.top < 98) {
        let ok = 0, n = 0;
        for (let dz = -8; dz <= 8; dz += 2) for (let dx = -8; dx <= 8; dx += 2) { if (dx * dx + dz * dz > 64) continue; n++; const t = islandLayer(x + dx, z + dz, 0); if (t && Math.abs(t.top - c.top) <= 4) ok++; }
        if (ok / n >= 0.55) s = { kind: "village", id: "v" + rx + "_" + rz, x, z, base: c.top, F: 10 };
      }
    }
  }
  structCache.set(key, s); return s;
}
function structsTouching(x0, z0, x1, z1) {
  const out = [];
  const add = (kind, REG, F) => {
    for (let rx = Math.floor((x0 - F - 140) / REG); rx <= Math.floor((x1 + F) / REG); rx++)
      for (let rz = Math.floor((z0 - F - 140) / REG); rz <= Math.floor((z1 + F) / REG); rz++) {
        const s = regionStruct(kind, rx, rz);
        if (s && s.x + s.F >= x0 && s.x - s.F <= x1 && s.z + s.F >= z0 && s.z - s.F <= z1) out.push(s);
      }
  };
  add("c", 144, 14); add("p", 176, 7); add("v", 128, 11);
  return out;
}
function structsNear(x, z, r) { return structsTouching(x - r, z - r, x + r, z + r); }
function stampCastle(S, s) {
  const { x: cx, z: cz, base, R } = s, mat = s.style === "hell" ? HBRICK : BRICK, F = R + 2;
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (let dz = -F; dz <= F; dz++) for (let dx = -F; dx <= F; dx++) {
    const wx = cx + dx, wz = cz + dz;
    const inMain = Math.abs(dx) <= R && Math.abs(dz) <= R;
    let tw = null;
    for (const [sx, sz] of corners) if (Math.abs(dx - sx * R) <= 2 && Math.abs(dz - sz * R) <= 2) tw = [dx - sx * R, dz - sz * R, sx, sz];
    if (!inMain && !tw) continue;
    const gh = colInfo(wx, wz).h;
    for (let y = gh + 1; y < base; y++) S(wx, y, wz, mat);
    S(wx, base, wz, mat);
    for (let y = base + 1; y <= base + 16; y++) S(wx, y, wz, AIR);
    if (inMain && (Math.abs(dx) === R || Math.abs(dz) === R)) {
      for (let y = base + 1; y <= base + 6; y++) S(wx, y, wz, mat);
      if (((dx + dz) & 1) === 0) S(wx, base + 7, wz, mat);
      if (dz === R && Math.abs(dx) <= 1) for (let y = base + 1; y <= base + 3; y++) S(wx, y, wz, AIR);
    }
    if (Math.abs(dx) <= 4 && Math.abs(dz) <= 4) {
      const ring = Math.abs(dx) === 4 || Math.abs(dz) === 4;
      if (ring) { for (let y = base + 1; y <= base + 9; y++) S(wx, y, wz, mat); if (((dx + dz) & 1) === 0) S(wx, base + 11, wz, mat); }
      S(wx, base + 10, wz, mat);
      if (dz === 4 && Math.abs(dx) <= 1) for (let y = base + 1; y <= base + 3; y++) S(wx, y, wz, AIR);
      if (Math.abs(dx) === 4 && dz === 0) { S(wx, base + 5, wz, AIR); S(wx, base + 6, wz, AIR); }
    }
    if (tw) {
      const [tx, tz, sx, sz] = tw;
      const ring = Math.abs(tx) === 2 || Math.abs(tz) === 2;
      for (let y = base + 1; y <= base + 11; y++) S(wx, y, wz, ring ? mat : AIR);
      if (!ring) S(wx, base + 6, wz, mat);
      if (ring && ((tx + tz) & 1) === 0) S(wx, base + 12, wz, mat);
      if (tx === -sx * 2 && tz === 0) { S(wx, base + 1, wz, AIR); S(wx, base + 2, wz, AIR); }
      if (tz === -sz * 2 && tx === 0) { S(wx, base + 1, wz, AIR); S(wx, base + 2, wz, AIR); }
    }
  }
  S(cx, base + 1, cz - 2, CHEST_BIG);
  S(cx + R, base + 1, cz - R, CHEST);
  S(cx - R, base + 1, cz + R, CHEST);
}
function stampPortal(S, s) {
  const { x: px, z: pz, base } = s;
  for (let dx = -3; dx <= 6; dx++) for (let dz = -3; dz <= 3; dz++) {
    if (h3(px + dx, 7301, pz + dz) > 0.7) continue;
    const gh = colInfo(px + dx, pz + dz).h; S(px + dx, gh, pz + dz, CARPET);
  }
  for (let i = 0; i < 4; i++) {
    const gh = colInfo(px + i, pz).h;
    for (let y = gh + 1; y < base; y++) S(px + i, y, pz, WALL);
    for (let j = 0; j < 5; j++) S(px + i, base + j, pz, i === 0 || i === 3 || j === 0 || j === 4 ? WALL : PORTAL);
  }
}
function stampVillage(S, s) {
  const { x: vx, z: vz, base: vy } = s;
  for (let dz = -9; dz <= 9; dz++) for (let dx = -9; dx <= 9; dx++) {
    if (dx * dx + dz * dz > 81) continue;
    const x = vx + dx, z = vz + dz;
    for (let y = vy + 1; y <= vy + 12; y++) S(x, y, z, AIR);
    const isl = islandLayer(x, z, 0), t = isl ? isl.top : -1;
    const from = t < vy - 6 ? vy - 2 : t + 1;
    for (let y = from; y < vy; y++) S(x, y, z, MUD);
    S(x, vy, z, HAPI);
  }
  for (let dz = -2; dz <= 3; dz++) for (let dx = -2; dx <= 3; dx++) { const dd = Math.hypot(dx - 0.5, dz - 0.5); if (dd > 1.6 && dd < 3) S(vx + dx, vy, vz + dz, ORE); }
  for (let y = vy + 1; y <= vy + 18; y++) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) S(vx + dx, y, vz + dz, POLE);
  for (let dy = 0; dy < 3; dy++) for (let dz = -1; dz < 3; dz++) for (let dx = -1; dx < 3; dx++) if (dy === 1 || ((dx === 0 || dx === 1) && (dz === 0 || dz === 1))) S(vx + dx, vy + 19 + dy, vz + dz, POLE);
  for (const [ox, oz] of [[7, 0], [-7, 0], [0, 7], [0, -7]]) {
    const hx = vx + ox - 1, hz = vz + oz - 1;
    for (let y = vy + 1; y <= vy + 3; y++) for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) {
      if (x > 0 && x < 3 && z > 0 && z < 3) continue;
      const doorX = ox !== 0 ? (ox > 0 ? 0 : 3) : -1, doorZ = oz !== 0 ? (oz > 0 ? 0 : 3) : -1;
      const isDoor = y <= vy + 2 && ((x === doorX && (z === 1 || z === 2)) || (z === doorZ && (x === 1 || x === 2)));
      if (!isDoor) S(hx + x, y, hz + z, PLANKS);
    }
    for (let z = -1; z < 5; z++) for (let x = -1; x < 5; x++) S(hx + x, vy + 4, hz + z, WAAD);
    for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) S(hx + x, vy + 5, hz + z, BUG);
  }
}
let HOME_VINE = null;
function computeHomeVine() {
  let x = 8; const z = 8;
  const start = islandLayer(8, 8, 0);
  if (!start) return null;
  let prevTop = start.top;
  while (x < 60) { const L = islandLayer(x + 1, z, 0); if (!L) break; prevTop = L.top; x++; }
  const vx = x + 1, gh = colInfo(vx, z).h;
  return { x: vx, z, y0: Math.max(gh, SEA) + 1, y1: prevTop + 1 };
}
// trees
function treeAt(wx, wz, info) {
  const { h, biome } = info;
  if (h < SEA + 1) return 0;
  const p = biome === FOREST ? 0.05 : biome === PLAINS ? 0.006 : biome === CAVES ? 0.006 : biome === MOUNTAINS ? (h < 64 ? 0.012 : 0) : biome === HELL ? 0.006 : 0;
  if (h3(wx, 501, wz) >= p) return 0;
  if (caveCarve(wx, h, wz, h, biome)) return 0;
  let t = 4 + ((h3(wx, 502, wz) * 3) | 0);
  if (biome === FOREST && h3(wx, 503, wz) < 0.15) t += 3;
  if (h3(wx, 504, wz) < 0.04) t += 6;
  return t;
}
function writeTree(S, x, top, z, trunk, leaves) {
  for (let i = 1; i <= trunk; i++) S(x, top + i, z, WAAD);
  if (!leaves) { S(x, top + trunk + 1, z, FIRE); return; }
  const ly = top + trunk;
  for (let dy = -2; dy <= 1; dy++) { const rad = dy >= 1 ? 1 : 2; for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { if (Math.abs(dx) === rad && Math.abs(dz) === rad && h3(x + dx, ly + dy, z + dz) < 0.6) continue; if (dx === 0 && dz === 0 && dy < 1) continue; S(x + dx, ly + dy, z + dz, BUG, true); } }
  S(x, ly + 2, z, BUG, true);
}
//WORLDGEN-END

// ---------- dims ----------
function makeDim(name, H, gen, opts) {
  return Object.assign({ name, H, gen, cols: new Map(), edits: new Map(), meta: new Map(), poo: new Map(), specials: new Map(), group: new THREE.Group(), dark: true, persist: true, last: null, lastKey: NaN, queueKey: "", genQ: [], meshQ: [], unloadT: 0 }, opts || {});
}
const colKey = (cx, cz) => (cx + 32768) * 65536 + (cz + 32768);
const keyOf = (x, y, z) => x + "," + y + "," + z;
function getCol(d, cx, cz) {
  const k = colKey(cx, cz);
  if (k === d.lastKey) return d.last;
  const c = d.cols.get(k); if (c) { d.last = c; d.lastKey = k; } return c;
}
function getD(d, x, y, z) {
  if (y < 0) return BEDROK; if (y >= d.H) return AIR;
  const c = getCol(d, x >> 4, z >> 4); if (!c) return AIR;
  return c.data[((y << 4) + (z & 15) << 4) + (x & 15)];
}

function genOverColumn(d, col) {
  const data = col.data, X0 = col.cx * 16, Z0 = col.cz * 16, H = d.H;
  const infos = new Array(400);
  for (let z = -2; z < 18; z++) for (let x = -2; x < 18; x++) infos[(z + 2) * 20 + x + 2] = colInfo(X0 + x, Z0 + z);
  const I = (lx, ly, lz) => ((ly << 4) + lz << 4) + lx;
  const S = (wx, y, wz, b, onlyAir) => {
    const lx = wx - X0, lz = wz - Z0;
    if (lx < 0 || lx > 15 || lz < 0 || lz > 15 || y < 0 || y >= H) return;
    const i = I(lx, y, lz); if (onlyAir && data[i] !== AIR) return; data[i] = b;
  };
  let maxH = 0; for (const i of infos) if (i.h > maxH) maxH = i.h;
  CAVE_L = makeLattice(X0, Z0, maxH + 4);
  for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
    const wx = X0 + lx, wz = Z0 + lz, info = infos[(lz + 2) * 20 + lx + 2], h = info.h, bio = info.biome;
    const rokPatch = bio === CAVES && n2(wx * 0.15, wz * 0.15, 77) > 0.55;
    for (let y = 0; y <= h && y < H; y++) {
      let b;
      const depth = h - y;
      if (y === 0 || (y === 1 && h3(wx, 1, wz) < 0.5)) b = BEDROK;
      else if (bio === HELL) b = depth === 0 ? EVIL : y > 20 ? HELLROK : ROK;
      else if (bio === OCEAN || (h <= SEA + 1 && bio !== MOUNTAINS)) b = depth < 3 ? SAND : ROK;
      else if (bio === MOUNTAINS) b = h > 80 && depth < 2 ? FROST : h > 66 ? ROK : depth === 0 ? HAPI : depth < 3 ? MUD : ROK;
      else if (bio === CAVES) b = depth === 0 ? (rokPatch ? ROK : HAPI) : depth < 2 && !rokPatch ? MUD : ROK;
      else b = depth === 0 ? HAPI : depth < 4 ? MUD : ROK;
      if (b === ROK || b === HELLROK) b = oreFor(wx, y, wz, b);
      if (b !== BEDROK && caveCarve(wx, y, wz, h, bio)) b = y <= 9 ? LAVA : AIR;
      data[I(lx, y, lz)] = b;
    }
    if (bio === HELL) { for (let y = h + 1; y <= 37; y++) data[I(lx, y, lz)] = LAVA; }
    else for (let y = h + 1; y <= SEA; y++) data[I(lx, y, lz)] = WATER;
    for (let li = 0; li < 2; li++) {
      const L = islandLayer(wx, wz, li); if (!L) continue;
      for (let y = Math.max(L.bot, 2); y <= L.top && y < H - 1; y++) {
        const depth = L.top - y;
        let b = depth === 0 ? HAPI : depth < 3 ? MUD : ROK;
        if (b === ROK) b = oreFor(wx, y, wz, ROK);
        data[I(lx, y, lz)] = b;
      }
      const top = L.top;
      if (top < H - 3 && data[I(lx, top, lz)] === HAPI) {
        const r = h3(wx, 600 + li, wz);
        if (r < 0.02) data[I(lx, top + 1, lz)] = FLOWER;
        else if (r < 0.0215) { data[I(lx, top + 1, lz)] = TOILET; d.meta.set(keyOf(wx, top + 1, wz), (h3(wx, 610, wz) * 4) | 0); }
        else if (r < 0.0225) data[I(lx, top + 1, lz)] = SNEAKERS;
        else if (r < 0.024) data[I(lx, top + 1, lz)] = GLOCKF;
      }
    }
    // ground decorations
    if (h + 1 < H && h >= SEA) {
      const topB = data[I(lx, h, lz)], above = data[I(lx, h + 1, lz)];
      if (above === AIR) {
        const r = h3(wx, 620, wz);
        if (topB === HAPI) {
          const fp = bio === PLAINS ? 0.035 : bio === FOREST ? 0.02 : 0.01;
          if (r < fp) data[I(lx, h + 1, lz)] = FLOWER;
          else if (r < fp + 0.0012) data[I(lx, h + 1, lz)] = GLOCKF;
          else if (r < fp + 0.0024) { data[I(lx, h + 1, lz)] = TOILET; d.meta.set(keyOf(wx, h + 1, wz), (h3(wx, 611, wz) * 4) | 0); }
          else if (r < fp + 0.0034) data[I(lx, h + 1, lz)] = SNEAKERS;
        } else if (topB === EVIL && r < 0.035) data[I(lx, h + 1, lz)] = FIRE;
      }
    }
  }
  CAVE_L = null;
  // trees (including ones from neighbouring columns that overhang)
  for (let z = -2; z < 18; z++) for (let x = -2; x < 18; x++) {
    const wx = X0 + x, wz = Z0 + z, info = infos[(z + 2) * 20 + x + 2];
    const t = treeAt(wx, wz, info);
    if (t && info.h + t + 3 < H) writeTree(S, wx, info.h, wz, t, info.biome !== HELL);
    for (let li = 0; li < 2; li++) {
      if (h3(wx, 700 + li, wz) > 0.02) continue;
      const L = islandLayer(wx, wz, li); if (!L || L.top + 9 >= H) continue;
      writeTree(S, wx, L.top, wz, 4 + ((h3(wx, 710, wz) * 3) | 0), true);
    }
  }
  for (const s of structsTouching(X0, Z0, X0 + 15, Z0 + 15)) {
    if (s.kind === "castle") stampCastle(S, s); else if (s.kind === "portal") stampPortal(S, s); else stampVillage(S, s);
  }
  if (HOME_VINE && HOME_VINE.x >> 4 === col.cx && HOME_VINE.z >> 4 === col.cz) for (let y = HOME_VINE.y0; y <= HOME_VINE.y1; y++) S(HOME_VINE.x, y, HOME_VINE.z, VINE);
}

// backrooms (per visit seed)
let BACK_SEED = 1, BACK_EXIT = { x: 10, z: 10 };
const BACK_W = 96;
function backWall(x, z) {
  if (x <= 0 || z <= 0 || x >= BACK_W - 1 || z >= BACK_W - 1) return true;
  if (Math.abs(x - 48) <= 3 && Math.abs(z - 48) <= 3) return false;
  if (Math.abs(x - BACK_EXIT.x - 0.5) <= 3 && Math.abs(z - BACK_EXIT.z) <= 3) return false;
  const gx = Math.floor(x / 6), gz = Math.floor(z / 6), lx = x % 6, lz = z % 6;
  const hb = (k) => h3(gx * 7 + k * 1013, BACK_SEED, gz * 11 + k);
  if (lz === 0 && hb(1) < 0.55) { const gap = 1 + Math.floor(hb(2) * 4); if (lx !== gap && lx !== gap + 1) return true; }
  if (lx === 0 && hb(3) < 0.55) { const gap = 1 + Math.floor(hb(4) * 4); if (lz !== gap && lz !== gap + 1) return true; }
  if (lx === 3 && lz === 3 && hb(5) < 0.2) return true;
  return false;
}
function genBackColumn(d, col) {
  const data = col.data, X0 = col.cx * 16, Z0 = col.cz * 16;
  for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
    const x = X0 + lx, z = Z0 + lz;
    const I = (y) => ((y << 4) + lz << 4) + lx;
    if (x < 0 || z < 0 || x >= BACK_W || z >= BACK_W) { for (let y = 0; y < 6; y++) data[I(y)] = WALL; continue; }
    data[I(0)] = CARPET;
    data[I(5)] = (x % 6 === 2 || x % 6 === 3) && z % 6 === 3 ? LIGHT : CEIL;
    if (backWall(x, z)) for (let y = 1; y <= 4; y++) data[I(y)] = WALL;
    if (z === BACK_EXIT.z && (x === BACK_EXIT.x || x === BACK_EXIT.x + 1)) for (let y = 1; y <= 3; y++) data[I(y)] = EXIT;
  }
}

const over = makeDim("over", H_OVER, genOverColumn);
const back = makeDim("back", 8, genBackColumn, { dark: false, persist: false });
let dim = over;
const getB = (x, y, z) => getD(dim, x, y, z);

function newCol(d, cx, cz) {
  const col = { cx, cz, data: new Uint8Array(16 * 16 * d.H), top: new Int16Array(256), meshes: new Array(Math.ceil(d.H / 16)).fill(null), meshedCount: 0, meshed: false, maxY: 0, specialKeys: new Set(), spawned: false };
  d.gen(d, col);
  const ed = d.edits.get(colKey(cx, cz));
  if (ed) for (const [i, v] of ed) {
    col.data[i] = v & 255;
    const lx = i & 15, lz = (i >> 4) & 15, y = i >> 8;
    const k = keyOf(cx * 16 + lx, y, cz * 16 + lz);
    if (v >> 8) d.meta.set(k, v >> 8); else d.meta.delete(k);
  }
  let maxY = 0;
  for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
    let t = 0;
    for (let y = Math.min(76, d.H - 1); y >= 0; y--) { const b = col.data[((y << 4) + lz << 4) + lx]; if (OPAQUE[b] || b === WATER) { t = y; break; } }
    col.top[lz * 16 + lx] = t;
  }
  for (let i = col.data.length - 1; i >= 0; i--) if (col.data[i]) { maxY = i >> 8; break; }
  col.maxY = maxY;
  d.cols.set(colKey(cx, cz), col);
  d.lastKey = NaN;
  for (let i = 0; i < col.data.length; i++) {
    const b = col.data[i];
    if (SPECIAL[b]) { const x = cx * 16 + (i & 15), z = cz * 16 + ((i >> 4) & 15), y = i >> 8; addSpecial(d, x, y, z, b); col.specialKeys.add(keyOf(x, y, z)); }
  }
  return col;
}
function unloadCol(d, col) {
  for (const ms of col.meshes) if (ms) for (const m of ms) { d.group.remove(m); m.geometry.dispose(); }
  for (const k of col.specialKeys) removeSpecial(d, k, true);
  d.cols.delete(colKey(col.cx, col.cz)); d.lastKey = NaN;
}
function clearDim(d) { for (const c of [...d.cols.values()]) unloadCol(d, c); d.cols.clear(); d.genQ = []; d.meshQ = []; d.queueKey = ""; }

// ---------- meshing ----------
const FACES = [
  { n: [1, 0, 0], c: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], shade: 0.80, ua: 2, va: 1 },
  { n: [-1, 0, 0], c: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], shade: 0.80, ua: 2, va: 1 },
  { n: [0, 1, 0], c: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], shade: 1.00, ua: 0, va: 2 },
  { n: [0, -1, 0], c: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], shade: 0.55, ua: 0, va: 2 },
  { n: [0, 0, 1], c: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], shade: 0.68, ua: 0, va: 1 },
  { n: [0, 0, -1], c: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], shade: 0.68, ua: 0, va: 1 },
];
for (const f of FACES) {
  const [a, b, c] = f.c;
  const u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], v = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
  const cr = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
  if (cr[0]*f.n[0] + cr[1]*f.n[1] + cr[2]*f.n[2] < 0) f.c.reverse();
  const axis = f.n[0] ? 0 : f.n[1] ? 1 : 2; f.t = [0, 1, 2].filter((k) => k !== axis);
}
const PAD = new Uint8Array(18 * 18 * 18), PTOP = new Int16Array(18 * 18);
const PI3 = (x, y, z) => ((y + 1) * 18 + (z + 1)) * 18 + (x + 1);
function Buf() { return { pos: [], col: [], uv: [], ind: [], vc: 0 }; }
function toGeo(B) {
  if (!B.vc) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(B.pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(B.col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2));
  g.setIndex(B.vc > 65000 ? new THREE.Uint32BufferAttribute(B.ind, 1) : new THREE.Uint16BufferAttribute(B.ind, 1));
  g.computeBoundingSphere(); return g;
}
function meshSub(d, col, sy) {
  const y0 = sy * 16, X0 = col.cx * 16, Z0 = col.cz * 16;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) nb.push(dx === 0 && dz === 0 ? col : d.cols.get(colKey(col.cx + dx, col.cz + dz)));
  for (let z = -1; z <= 16; z++) for (let x = -1; x <= 16; x++) {
    const c = nb[(z < 0 ? 0 : z > 15 ? 2 : 1) * 3 + (x < 0 ? 0 : x > 15 ? 2 : 1)];
    const lx = (x + 16) & 15, lz = (z + 16) & 15;
    PTOP[(z + 1) * 18 + x + 1] = c ? c.top[lz * 16 + lx] : 0;
    for (let y = -1; y <= 16; y++) {
      const wy = y0 + y;
      PAD[PI3(x, y, z)] = wy < 0 ? BEDROK : wy >= d.H ? AIR : c ? c.data[((wy << 4) + lz << 4) + lx] : AIR;
    }
  }
  const O = Buf(), T = Buf(), C = Buf();
  const occ = (x, y, z) => OPAQUE[PAD[PI3(x, y, z)]];
  const darkAt = (x, y, z) => { if (!d.dark) return 1; const wy = y0 + y; return wy < PTOP[(z + 1) * 18 + x + 1] - 1 && wy < 76 ? 0.42 : 1; };
  for (let y = 0; y < 16; y++) {
    if (y0 + y > col.maxY + 1) break;
    for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
      const b = PAD[PI3(x, y, z)];
      if (!b || SPECIAL[b]) continue;
      if (CROSS[b]) {
        const dk = b === FIRE ? 1.1 : darkAt(x, y, z);
        const B = C, u0 = tileU(b, 0), u1 = tileU(b, 1);
        const quads = [[[0.15, 0, 0.15], [0.85, 0, 0.85], [0.85, 1, 0.85], [0.15, 1, 0.15]], [[0.85, 0, 0.15], [0.15, 0, 0.85], [0.15, 1, 0.85], [0.85, 1, 0.15]]];
        for (const q of quads) {
          for (let k = 0; k < 4; k++) { B.pos.push(X0 + x + q[k][0], y0 + y + q[k][1], Z0 + z + q[k][2]); B.uv.push(k === 0 || k === 3 ? u0 : u1, k < 2 ? 0.002 : 0.998); B.col.push(dk, dk, dk); }
          B.ind.push(B.vc, B.vc + 1, B.vc + 2, B.vc, B.vc + 2, B.vc + 3); B.vc += 4;
        }
        continue;
      }
      const trans = TRANS[b], glow = b === LAVA || b === LIGHT || b === POLE || b === PORTAL || b === EXIT;
      const jit = 0.96 + h3(X0 + x, y0 + y, Z0 + z) * 0.08;
      const waterTop = b === WATER && PAD[PI3(x, y + 1, z)] !== WATER;
      for (let fi = 0; fi < 6; fi++) {
        const f = FACES[fi];
        const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2], nbB = PAD[PI3(nx, ny, nz)];
        if (OPAQUE[nbB]) continue;
        if ((trans || b === LAVA) && nbB === b) continue;
        if (b === WATER && TRANS[nbB]) continue;
        const B = trans ? T : O;
        const dk = glow ? 1.1 : darkAt(nx, ny, nz);
        const ao = [0, 0, 0, 0];
        for (let k = 0; k < 4; k++) {
          const c = f.c[k];
          let a = 3;
          if (!trans && !glow) {
            const o1 = [0, 0, 0], o2 = [0, 0, 0];
            o1[f.t[0]] = c[f.t[0]] * 2 - 1; o2[f.t[1]] = c[f.t[1]] * 2 - 1;
            const s1 = occ(nx + o1[0], ny + o1[1], nz + o1[2]), s2 = occ(nx + o2[0], ny + o2[1], nz + o2[2]);
            const cc = occ(nx + o1[0] + o2[0], ny + o1[1] + o2[1], nz + o1[2] + o2[2]);
            a = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
          }
          ao[k] = a;
          const cy = waterTop && c[1] === 1 ? 0.88 : c[1];
          B.pos.push(X0 + x + c[0], y0 + y + cy, Z0 + z + c[2]);
          B.uv.push(tileU(b, c[f.ua]), c[f.va] ? 0.998 : 0.002);
          const lit = glow ? 1.1 : f.shade * jit * (0.58 + a * 0.14) * dk;
          B.col.push(lit, lit, lit);
        }
        const v = B.vc;
        if (ao[0] + ao[2] < ao[1] + ao[3]) B.ind.push(v + 1, v + 2, v + 3, v + 1, v + 3, v); else B.ind.push(v, v + 1, v + 2, v, v + 2, v + 3);
        B.vc += 4;
      }
    }
  }
  const old = col.meshes[sy];
  if (old) for (const m of old) { d.group.remove(m); m.geometry.dispose(); }
  const out = [];
  const gO = toGeo(O), gT = toGeo(T), gC = toGeo(C);
  if (gO) out.push(new THREE.Mesh(gO, MAT.world));
  if (gC) out.push(new THREE.Mesh(gC, MAT.cross));
  if (gT) { const m = new THREE.Mesh(gT, MAT.water); m.renderOrder = 2; out.push(m); }
  for (const m of out) { m.matrixAutoUpdate = false; d.group.add(m); }
  col.meshes[sy] = out;
}
function meshCol(d, col) { for (let sy = 0; sy < col.meshes.length; sy++) meshSub(d, col, sy); col.meshed = true; }
function neighborsReady(d, cx, cz) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!d.cols.has(colKey(cx + dx, cz + dz))) return false;
  return true;
}
let renderDist = 5;
function updateChunks(d, px, pz, budgetMs) {
  const t0 = performance.now();
  const pcx = Math.floor(px / 16), pcz = Math.floor(pz / 16), R = renderDist;
  const qk = pcx + "," + pcz + "," + R;
  if (qk !== d.queueKey || (!d.genQ.length && !d.meshQ.length && (d.unloadT -= 1) < 0)) {
    d.queueKey = qk; d.unloadT = 30;
    const gen = [], mesh = [];
    const RG = R + 1.5;
    for (let dz = -Math.ceil(RG); dz <= Math.ceil(RG); dz++) for (let dx = -Math.ceil(RG); dx <= Math.ceil(RG); dx++) {
      const dd = dx * dx + dz * dz; if (dd > RG * RG) continue;
      const cx = pcx + dx, cz = pcz + dz, c = d.cols.get(colKey(cx, cz));
      if (!c) gen.push([dd, cx, cz]);
      if (dd <= (R + 0.5) * (R + 0.5) && (!c || !c.meshed)) mesh.push([dd, cx, cz]);
    }
    gen.sort((a, b) => a[0] - b[0]); mesh.sort((a, b) => a[0] - b[0]);
    d.genQ = gen; d.meshQ = mesh;
    for (const c of [...d.cols.values()]) { const dx = c.cx - pcx, dz = c.cz - pcz; if (dx * dx + dz * dz > (R + 3.5) * (R + 3.5)) unloadCol(d, c); }
  }
  let did = 0;
  while (performance.now() - t0 < budgetMs) {
    let progressed = false;
    if (d.meshQ.length) {
      for (let i = 0; i < d.meshQ.length; i++) {
        const [, cx, cz] = d.meshQ[i];
        const c = d.cols.get(colKey(cx, cz));
        if (c && c.meshed) { d.meshQ.splice(i, 1); i--; continue; }
        if (c && neighborsReady(d, cx, cz)) { meshCol(d, c); d.meshQ.splice(i, 1); progressed = true; did++; break; }
        if (i > 4) break;
      }
    }
    if (!progressed && d.genQ.length) {
      const [, cx, cz] = d.genQ.shift();
      if (!d.cols.has(colKey(cx, cz))) { newCol(d, cx, cz); did++; }
      progressed = true;
    }
    if (!progressed) break;
  }
  return did;
}
function areaReady(d, px, pz, r) {
  const pcx = Math.floor(px / 16), pcz = Math.floor(pz / 16);
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const c = d.cols.get(colKey(pcx + dx, pcz + dz)); if (!c || !c.meshed) return false; }
  return true;
}

// ---------- editing ----------
function recordEdit(d, x, y, z, b, meta) {
  if (!d.persist) return;
  const cx = x >> 4, cz = z >> 4, k = colKey(cx, cz);
  let m = d.edits.get(k); if (!m) { m = new Map(); d.edits.set(k, m); }
  m.set(((y << 4) + (z & 15) << 4) + (x & 15), b | ((meta || 0) << 8));
  worldDirty = true;
}
let worldDirty = false;
function rawSet(d, x, y, z, b, meta) {
  if (y < 0 || y >= d.H) return false;
  const col = getCol(d, x >> 4, z >> 4); if (!col) return false;
  const i = ((y << 4) + (z & 15) << 4) + (x & 15);
  const old = col.data[i];
  const k = keyOf(x, y, z);
  if (SPECIAL[old]) { removeSpecial(d, k); col.specialKeys.delete(k); }
  col.data[i] = b;
  if (meta !== undefined) d.meta.set(k, meta); else if (!SPECIAL[b]) d.meta.delete(k);
  if (SPECIAL[b]) { addSpecial(d, x, y, z, b); col.specialKeys.add(k); }
  if (y > col.maxY) col.maxY = y;
  if (y <= 76) {
    const ti = (z & 15) * 16 + (x & 15);
    if (OPAQUE[b] || b === WATER) { if (y > col.top[ti]) col.top[ti] = y; }
    else if (y === col.top[ti]) { let t = 0; for (let yy = y - 1; yy >= 0; yy--) { const bb = col.data[((yy << 4) + (z & 15) << 4) + (x & 15)]; if (OPAQUE[bb] || bb === WATER) { t = yy; break; } } col.top[ti] = t; }
  }
  recordEdit(d, x, y, z, b, d.meta.get(k));
  return true;
}
function dirtyAround(d, x, y, z, set) {
  for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
    const ax = x + dx, ay = y + dy, az = z + dz; if (ay < 0 || ay >= d.H) continue;
    set.add(colKey(ax >> 4, az >> 4) + ":" + (ay >> 4));
  }
}
function rebuildSet(d, set) {
  for (const s of set) {
    const [k, sy] = s.split(":"), col = d.cols.get(+k);
    if (col && col.meshed) meshSub(d, col, +sy);
  }
}
function setBlock(x, y, z, b, meta) {
  if (!rawSet(dim, x, y, z, b, meta)) return;
  const s = new Set(); dirtyAround(dim, x, y, z, s);
  // darkness depends on the column top, so refresh the whole column slice under it a little
  rebuildSet(dim, s);
}
function setMeta(x, y, z, meta) { dim.meta.set(keyOf(x, y, z), meta); recordEdit(dim, x, y, z, getD(dim, x, y, z), meta); }
function topSolid(d, x, z, maxY) {
  for (let y = Math.min(maxY, d.H - 1); y >= 1; y--) { const b = getD(d, x, y, z); if (blocksMove(b) || b === WATER || b === LAVA) return y; }
  return -1;
}

// =====================================================================
// rendering setup, sky, special block models, effects, audio
// =====================================================================
const canvas = $("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.autoClear = false;
const scene = new THREE.Scene(), xrayScene = new THREE.Scene(), viewScene = new THREE.Scene();
scene.add(over.group, back.group);
const SKY_DAY = new THREE.Color(0xff9a3c), SKY_NIGHT = new THREE.Color(0x1d0f33), BACK_FOG = new THREE.Color(0xb8a64a), BOSS_FOG = new THREE.Color(0x2a2410);
scene.background = SKY_DAY.clone();
scene.fog = new THREE.Fog(SKY_DAY.getHex(), 50, 110);
const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 900);
camera.rotation.order = "YXZ";
const viewCam = new THREE.PerspectiveCamera(70, 1, 0.01, 10);
const amb = new THREE.AmbientLight(0xffffff, 0.55), sunL = new THREE.DirectionalLight(0xffffff, 0.7);
sunL.position.set(0.4, 1, 0.3); scene.add(amb, sunL);
xrayScene.add(new THREE.AmbientLight(0xffffff, 0.7));
viewScene.add(new THREE.AmbientLight(0xffffff, 0.62));
const viewSun = new THREE.DirectionalLight(0xffffff, 0.8); viewSun.position.set(0.5, 1, 0.7); viewScene.add(viewSun);
function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = viewCam.aspect = w / h; camera.updateProjectionMatrix(); viewCam.updateProjectionMatrix(); }
window.addEventListener("resize", resize); resize();
const MAT = {
  world: new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true }),
  cross: new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }),
  water: new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }),
};
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sunA = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({ color: 0x3df2ff, fog: false }));
const sunB = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshBasicMaterial({ color: 0xc4ff99, fog: false }));
const moon = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0xff7be6, fog: false }));
scene.add(sunA, sunB, moon);
const stars = (() => {
  const pos = [], r = mulberry(99);
  for (let i = 0; i < 700; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); pos.push(Math.cos(a) * s * 500, Math.abs(u) * 500, Math.sin(a) * s * 500); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff4e0, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
})();
scene.add(stars);

// ---------- model helpers ----------
const matCache = {};
const lam = (c) => matCache[c] || (matCache[c] = new THREE.MeshLambertMaterial({ color: c }));
function part(parent, w, h, d, color, x, y, z, rx, ry, rz, mats) {
  const mat = mats ? (mats[color] || (mats[color] = new THREE.MeshLambertMaterial({ color }))) : lam(color);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); parent.add(m); return m;
}
function cylPart(parent, r1, r2, len, color, x, y, z, axis, mats, seg) {
  const mat = mats ? (mats[color] || (mats[color] = new THREE.MeshLambertMaterial({ color }))) : lam(color);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, seg || 12), mat);
  if (axis === "z") m.rotation.x = Math.PI / 2; else if (axis === "x") m.rotation.z = Math.PI / 2;
  m.position.set(x, y, z); parent.add(m); return m;
}
function pivot(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function bubble(text, color) {
  const c = document.createElement("canvas"), g = c.getContext("2d");
  g.font = "bold 44px 'Bagel Fat One', 'Trebuchet MS', sans-serif";
  const w = Math.ceil(g.measureText(text).width) + 40; c.width = w; c.height = 80;
  g.font = "bold 44px 'Bagel Fat One', 'Trebuchet MS', sans-serif";
  g.fillStyle = "#fff4e0"; g.strokeStyle = "#2b1240"; g.lineWidth = 6;
  g.beginPath(); g.roundRect ? g.roundRect(3, 3, w - 6, 74, 18) : g.rect(3, 3, w - 6, 74); g.fill(); g.stroke();
  g.fillStyle = color || "#2b1240"; g.textBaseline = "middle"; g.fillText(text, 20, 42);
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(w / 80 * 0.9, 0.9, 1); s.renderOrder = 10; return s;
}

// ---------- special block models ----------
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const sneakTex = new THREE.Texture();
const sneakMat = new THREE.MeshBasicMaterial({ map: sneakTex });
const sneakImg = new Image();
sneakImg.onload = () => {
  sneakTex.image = sneakImg; sneakTex.needsUpdate = true;
  const g = tileCanvas[SNEAKERS].getContext("2d"); g.drawImage(sneakImg, 0, 0, 16, 16);
  delete iconCache.sneakers; delete iconCanvas.sneakers;
  if (typeof renderInv === "function") try { renderInv(); } catch (e) {}
};
sneakImg.src = SNEAK_SRC;
const RAMP_ROT = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
const rampH = (dir, lx, lz) => [lx, lz, 1 - lx, 1 - lz][dir];
const rampMat = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true, side: THREE.DoubleSide });
const rampGeo = (() => {
  const pos = [], uv = [], col = [];
  const u = (c) => tileU(PLANKS, c);
  const tri = (pts, uvs, shade) => { for (let i = 0; i < 3; i++) { pos.push(pts[i][0] - 0.5, pts[i][1], pts[i][2] - 0.5); uv.push(u(uvs[i][0]), uvs[i][1] ? 0.998 : 0.002); col.push(shade, shade, shade); } };
  const quad = (a, b, c, d, shade) => { tri([a, b, c], [[0, 0], [1, 0], [1, 1]], shade); tri([a, c, d], [[0, 0], [1, 1], [0, 1]], shade); };
  quad([0, 0, 1], [1, 1, 1], [1, 1, 0], [0, 0, 0], 1); quad([1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1], 0.8); quad([0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], 0.55);
  tri([[0, 0, 0], [1, 1, 0], [1, 0, 0]], [[0, 0], [1, 1], [1, 0]], 0.68); tri([[0, 0, 1], [1, 0, 1], [1, 1, 1]], [[0, 0], [1, 0], [1, 1]], 0.68);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
})();
function toiletModel() {
  const g = new THREE.Group();
  part(g, 0.34, 0.3, 0.38, 0xf4f4f8, 0, 0.15, 0.04); cylPart(g, 0.3, 0.2, 0.2, 0xf4f4f8, 0, 0.38, 0.08);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.24, 16), lam(0x7fd4ff)); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.475, 0.08); g.add(water);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 6, 18), lam(0xe8e8ee)); seat.rotation.x = Math.PI / 2; seat.position.set(0, 0.49, 0.08); g.add(seat);
  part(g, 0.56, 0.42, 0.2, 0xf4f4f8, 0, 0.68, -0.32); part(g, 0.6, 0.05, 0.24, 0xe8e8ee, 0, 0.91, -0.32); part(g, 0.5, 0.48, 0.04, 0xe8e8ee, 0, 0.74, -0.2, -0.08); part(g, 0.1, 0.03, 0.03, 0xb8b8c4, 0.2, 0.82, -0.21);
  return g;
}
function pooModel() {
  const g = new THREE.Group(), m = lam(0x6b3d1e);
  [[0.15, 0], [0.11, 0.08], [0.07, 0.15]].forEach(([r, y]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6), m); s.scale.y = 0.6; s.position.y = y; g.add(s); });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 8), m); tip.position.y = 0.21; g.add(tip); return g;
}
function chestModel(big, open) {
  const g = new THREE.Group(), wood = big ? 0x9a5a1c : 0xb07a3a, trim = big ? 0xffd23f : 0x6b3d1e;
  part(g, 0.88, 0.56, 0.88, wood, 0, 0.28, 0); part(g, 0.9, 0.06, 0.9, trim, 0, 0.56, 0);
  const lid = pivot(g, 0, 0.58, -0.44); part(lid, 0.9, 0.26, 0.9, wood, 0, 0.13, 0.44); part(lid, 0.92, 0.05, 0.92, trim, 0, 0.0, 0.44);
  part(g, 0.14, 0.2, 0.05, trim, 0, 0.5, 0.46);
  if (open) lid.rotation.x = -1.2;
  if (big) for (const sx of [-0.42, 0.42]) part(g, 0.06, 0.58, 0.92, trim, sx, 0.29, 0);
  return g;
}
function glockModel() {
  const g = new THREE.Group();
  part(g, 0.18, 0.12, 0.06, 0x2a2a2e, 0, 0, -0.04); part(g, 0.06, 0.12, 0.06, 0x1d1e21, -0.05, -0.1, -0.02, 0.2); part(g, 0.05, 0.05, 0.05, 0x3a3b40, 0.11, 0.02, -0.04);
  return g;
}
function glockFlowerModel() {
  const g = new THREE.Group();
  part(g, 0.06, 0.6, 0.06, 0x4fd66b, 0, 0.3, 0);
  part(g, 0.22, 0.06, 0.08, 0x4fd66b, 0.1, 0.22, 0, 0, 0, 0.5);
  const head = pivot(g, 0, 0.68, 0);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; part(head, 0.14, 0.14, 0.05, 0xff7be6, Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0); }
  part(head, 0.12, 0.12, 0.07, 0xffd23f, 0, 0, 0);
  const gun = glockModel(); gun.position.set(0, 0.12, 0.08); gun.rotation.y = Math.PI / 2; head.add(gun);
  g.userData = { head };
  return g;
}
function addSpecial(d, x, y, z, b) {
  const k = keyOf(x, y, z); let mesh;
  const meta = d.meta.get(k) | 0, dir = meta & 3;
  if (b === SNEAKERS) { mesh = new THREE.Mesh(unitBox, sneakMat); mesh.position.set(x + 0.5, y + 0.5, z + 0.5); }
  else if (b === RAMP) { mesh = new THREE.Mesh(rampGeo, rampMat); mesh.position.set(x + 0.5, y, z + 0.5); mesh.rotation.y = RAMP_ROT[dir]; }
  else if (b === TOILET) { mesh = toiletModel(); mesh.position.set(x + 0.5, y, z + 0.5); mesh.rotation.y = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][dir]; }
  else if (b === CHEST || b === CHEST_BIG || b === CHEST_OPEN) { mesh = chestModel(b === CHEST_BIG, b === CHEST_OPEN); mesh.position.set(x + 0.5, y, z + 0.5); mesh.rotation.y = h3(x, y, z) < 0.5 ? 0 : Math.PI; }
  else { mesh = glockFlowerModel(); mesh.position.set(x + 0.5, y, z + 0.5); mesh.rotation.y = h3(x, y + 1, z) * 6; }
  d.group.add(mesh); d.specials.set(k, { mesh, b, x, y, z, cd: Math.random() });
  if (b === TOILET && meta & 4) setPooMesh(d, k, true);
}
function removeSpecial(d, k) {
  const s = d.specials.get(k); if (!s) return;
  d.group.remove(s.mesh); d.specials.delete(k);
  const p = d.poo.get(k); if (p) { d.group.remove(p); d.poo.delete(k); }
}
function setPooMesh(d, k, on) {
  const s = d.specials.get(k); if (!s) return;
  if (on && !d.poo.has(k)) { const p = pooModel(); p.position.set(s.x + 0.5, s.y + 0.45, s.z + 0.5); d.group.add(p); d.poo.set(k, p); }
  if (!on && d.poo.has(k)) { d.group.remove(d.poo.get(k)); d.poo.delete(k); }
}
function setPoo(d, s, on) {
  const k = keyOf(s.x, s.y, s.z), meta = d.meta.get(k) | 0;
  setPooMesh(d, k, on);
  d.meta.set(k, on ? meta | 4 : meta & 3);
  recordEdit(d, s.x, s.y, s.z, TOILET, d.meta.get(k));
}
function blockGeo(id) {
  const pos = [], col = [], uv = [], ind = []; let vc = 0;
  for (const f of FACES) { for (const c of f.c) { pos.push(c[0] - 0.5, c[1] - 0.5, c[2] - 0.5); uv.push(tileU(id, c[f.ua]), c[f.va] ? 0.998 : 0.002); col.push(f.shade, f.shade, f.shade); } ind.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3); vc += 4; }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(ind); return g;
}
const spriteGeoCache = {};
function spriteGeo(name, pal) {
  const ck = name + JSON.stringify(pal || 0);
  if (spriteGeoCache[ck]) return spriteGeoCache[ck];
  const map = SPRITES[name], pos = [], col = [], ind = []; let vc = 0;
  const colr = (ch) => (pal && pal[ch]) || PAL[ch];
  const filled = (x, y) => y >= 0 && y < 16 && x >= 0 && x < 16 && map[y][x] !== "." && !!colr(map[y][x]);
  const tc = new THREE.Color();
  const quad = (pts, shade) => { for (const p of pts) { pos.push(p[0], p[1], p[2]); col.push(tc.r * shade, tc.g * shade, tc.b * shade); } ind.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3); vc += 4; };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!filled(x, y)) continue;
    tc.set(colr(map[y][x]));
    const X = x - 8, Y = 7 - y, z0 = -0.5, z1 = 0.5;
    quad([[X, Y, z1], [X + 1, Y, z1], [X + 1, Y + 1, z1], [X, Y + 1, z1]], 1);
    quad([[X + 1, Y, z0], [X, Y, z0], [X, Y + 1, z0], [X + 1, Y + 1, z0]], 0.7);
    if (!filled(x, y - 1)) quad([[X, Y + 1, z1], [X + 1, Y + 1, z1], [X + 1, Y + 1, z0], [X, Y + 1, z0]], 0.95);
    if (!filled(x, y + 1)) quad([[X, Y, z0], [X + 1, Y, z0], [X + 1, Y, z1], [X, Y, z1]], 0.6);
    if (!filled(x - 1, y)) quad([[X, Y, z0], [X, Y, z1], [X, Y + 1, z1], [X, Y + 1, z0]], 0.8);
    if (!filled(x + 1, y)) quad([[X + 1, Y, z1], [X + 1, Y, z0], [X + 1, Y + 1, z0], [X + 1, Y + 1, z1]], 0.8);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(ind); g.scale(1 / 16, 1 / 16, 1 / 16);
  return (spriteGeoCache[ck] = g);
}

// ---------- effects ----------
const highlight = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), new THREE.LineBasicMaterial({ color: 0x2b1240 }));
highlight.visible = false; scene.add(highlight);
const crackCanvas = document.createElement("canvas"); crackCanvas.width = crackCanvas.height = 16;
{ const g = crackCanvas.getContext("2d"), r = mulberry(5); g.fillStyle = "#1a0a26"; for (let k = 0; k < 4; k++) { let x = 8, y = 8; for (let i = 0; i < 8; i++) { g.fillRect(x, y, 1, 1); x = clamp(x + ((r() * 3) | 0) - 1, 0, 15); y = clamp(y + ((r() * 3) | 0) - 1, 0, 15); } } }
const crackTex = new THREE.CanvasTexture(crackCanvas); crackTex.magFilter = crackTex.minFilter = THREE.NearestFilter; crackTex.generateMipmaps = false;
const crack = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, opacity: 0 }));
crack.visible = false; scene.add(crack);
const debrisGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14), debrisMats = {}, debris = [];
function dmat(color) { return debrisMats[color] || (debrisMats[color] = new THREE.MeshBasicMaterial({ color })); }
function spawnDebris(x, y, z, color, n, speed, size) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(debrisGeo, dmat(color));
    m.position.set(x + Math.random() * 0.8 + 0.1, y + Math.random() * 0.8 + 0.1, z + Math.random() * 0.8 + 0.1);
    m.userData = { v: new V3((Math.random() - 0.5) * speed, Math.random() * speed * 0.7 + 1.5, (Math.random() - 0.5) * speed), life: 0.5 + Math.random() * 0.4, s: size || 1 };
    scene.add(m); debris.push(m);
  }
  while (debris.length > 260) scene.remove(debris.shift());
}
function puff(p, color, size, life) {
  const m = new THREE.Mesh(debrisGeo, dmat(color)); m.position.copy(p);
  m.userData = { v: new V3((Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6), life: life || 0.6, s: size || 2, float: true };
  scene.add(m); debris.push(m);
  while (debris.length > 260) scene.remove(debris.shift());
}
function updateDebris(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    const m = debris[i], u = m.userData;
    u.life -= dt; u.v.y -= (u.float ? -1 : 18) * dt; m.position.addScaledVector(u.v, dt); m.scale.setScalar(Math.max(0.01, u.life * 1.6 * u.s));
    if (u.life <= 0) { scene.remove(m); debris.splice(i, 1); }
  }
}
const tracers = [];
function spawnTracer(a, b, color) {
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]), new THREE.LineBasicMaterial({ color: color || 0xfff1a8, transparent: true }));
  l.userData.life = 0.07; l.frustumCulled = false; scene.add(l); tracers.push(l);
}
function updateTracers(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) { const l = tracers[i]; l.userData.life -= dt; l.material.opacity = Math.max(0, l.userData.life / 0.07); if (l.userData.life <= 0) { scene.remove(l); l.geometry.dispose(); l.material.dispose(); tracers.splice(i, 1); } }
}
const booms = [], boomGeo = new THREE.SphereGeometry(1, 16, 10);
function spawnBoomFx(p, r, color) {
  const m = new THREE.Mesh(boomGeo, new THREE.MeshBasicMaterial({ color: color || 0xff8a2a, transparent: true, opacity: 0.8, depthWrite: false }));
  m.position.copy(p); m.userData = { life: 0.45, r }; scene.add(m); booms.push(m);
}
const rings = [];
function spawnRing(p, maxR, life, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color: color || 0xfff1a8, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.copy(p); m.position.y += 0.15; m.userData = { life, max: life, maxR }; scene.add(m); rings.push(m); return m;
}
function updateBooms(dt) {
  for (let i = booms.length - 1; i >= 0; i--) {
    const m = booms[i], u = m.userData; u.life -= dt; const k = 1 - u.life / 0.45;
    m.scale.setScalar(Math.max(0.01, u.r * (0.3 + k * 1.1))); m.material.opacity = Math.max(0, 0.8 * (1 - k));
    if (u.life <= 0) { scene.remove(m); m.material.dispose(); booms.splice(i, 1); }
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const m = rings[i], u = m.userData; u.life -= dt; const k = 1 - u.life / u.max;
    m.scale.setScalar(Math.max(0.01, u.maxR * k)); m.material.opacity = 0.7 * (1 - k);
    if (u.life <= 0) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); rings.splice(i, 1); }
  }
}
function clearFx() { for (const m of debris) scene.remove(m); debris.length = 0; for (const l of tracers) scene.remove(l); tracers.length = 0; for (const m of booms) scene.remove(m); booms.length = 0; for (const m of rings) scene.remove(m); rings.length = 0; }

// ---------- audio (synthesized, starts after a click) ----------
let ac = null, noiseBuf = null, hum = null, grindSnd = null, engineSnd = null;
function audio() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
    if (ac) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  }
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
  return ac;
}
function env(g, t0, peak, dur) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); }
function noise(dur, freq, type, peak, q, delay) {
  if (!ac || peak <= 0.001) return; const t = ac.currentTime + (delay || 0), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q || 0.8; env(g, t, peak, dur); src.connect(f).connect(g).connect(ac.destination); src.start(t); src.stop(t + dur + 0.02);
}
function tone(type, f0, f1, dur, peak, delay) {
  if (!ac || peak <= 0.001) return; const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); env(g, t, peak, dur); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
function loopNoise(freq, gain, lfo) {
  if (!ac) return null;
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; src.loop = true; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = gain;
  src.connect(f).connect(g).connect(ac.destination);
  let l = null;
  if (lfo) { l = ac.createOscillator(); const lg = ac.createGain(); l.frequency.value = lfo; lg.gain.value = gain * 0.9; l.connect(lg).connect(g.gain); l.start(); }
  src.start(); return { f, g, stop() { try { src.stop(); if (l) l.stop(); } catch (e) {} } };
}
const sfx = {
  shot() { noise(0.14, 1400, "bandpass", 0.3, 0.6); noise(0.06, 5000, "highpass", 0.1); tone("sine", 110, 40, 0.12, 0.32); },
  shotgun() { noise(0.3, 900, "lowpass", 0.5, 0.5); tone("sine", 90, 30, 0.25, 0.45); },
  pump() { noise(0.05, 1800, "bandpass", 0.15, 1, 0.25); noise(0.05, 1200, "bandpass", 0.15, 1, 0.42); },
  click() { tone("square", 900, 600, 0.03, 0.06); },
  reload() { tone("square", 300, 200, 0.05, 0.08, 0.2); tone("square", 500, 380, 0.05, 0.08, 0.9); noise(0.05, 2500, "bandpass", 0.12, 1, 1.3); },
  brk() { noise(0.07, 700, "lowpass", 0.18); }, place() { noise(0.05, 400, "lowpass", 0.15); },
  hurt() { tone("square", 260, 120, 0.15, 0.1); }, pop() { tone("triangle", 500, 900, 0.08, 0.1); },
  hit(v) { v = v === undefined ? 1 : v; noise(0.06, 900, "bandpass", 0.2 * v); tone("square", 180, 90, 0.06, 0.08 * v); },
  bonk() { tone("triangle", 900, 200, 0.18, 0.3); noise(0.06, 3000, "bandpass", 0.3); },
  hookShoot() { tone("sawtooth", 200, 1200, 0.15, 0.06); }, hookHit() { noise(0.05, 3000, "bandpass", 0.15); },
  boom(v) { v = v === undefined ? 1 : v; noise(0.9, 320, "lowpass", 0.6 * v, 0.5); tone("sine", 70, 28, 0.7, 0.5 * v); },
  cannon(v) { noise(0.4, 600, "lowpass", 0.5 * v); tone("sine", 90, 35, 0.4, 0.4 * v); },
  mg(v) { noise(0.05, 1600, "bandpass", 0.18 * v, 0.8); },
  laser(v) { tone("sawtooth", 1400, 300, 0.25, 0.12 * v); },
  cluck(v) { tone("square", 820, 560, 0.07, 0.07 * v); tone("square", 900, 640, 0.07, 0.07 * v, 0.1); },
  goblin(v) { tone("square", 420, 720, 0.12, 0.08 * v); tone("square", 700, 380, 0.1, 0.06 * v, 0.13); },
  groan(v) { tone("sawtooth", 140, 90, 0.6, 0.06 * v); },
  screech(v) { tone("sawtooth", 1600, 700, 0.35, 0.08 * v); noise(0.3, 2500, "bandpass", 0.06 * v); },
  crunch() { for (let i = 0; i < 3; i++) noise(0.05, 2200, "bandpass", 0.18, 1, i * 0.07); },
  chew(v) { for (let i = 0; i < 5; i++) noise(0.05, 1500, "bandpass", 0.15 * v, 1, i * 0.18); },
  plop() { tone("sine", 320, 70, 0.25, 0.3); }, ollie() { noise(0.05, 1800, "bandpass", 0.2); },
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => tone("triangle", f, f, 0.22, 0.14, i * 0.12)); },
  rocket() { noise(0.5, 900, "bandpass", 0.25, 0.4); tone("sawtooth", 300, 120, 0.4, 0.1); },
  egg() { tone("triangle", 300, 700, 0.12, 0.2); cluckBig(); },
  glock(v) { noise(0.04, 2400, "bandpass", 0.12 * v, 1); },
  mud(v) { v = v === undefined ? 1 : v; tone("sawtooth", 260, 120, 0.5, 0.25 * v); tone("square", 520, 180, 0.45, 0.08 * v); noise(0.4, 700, "bandpass", 0.12 * v); },
  stomp(v) { noise(0.8, 160, "lowpass", 0.7 * v, 0.5); tone("sine", 50, 22, 0.8, 0.6 * v); },
  roar() { tone("sawtooth", 110, 55, 1.6, 0.25); noise(1.6, 400, "lowpass", 0.25, 0.4); },
  heartbeat(v) { tone("sine", 70, 45, 0.12, 0.3 * v); tone("sine", 70, 45, 0.12, 0.25 * v, 0.22); },
  humStart() {
    if (!ac || hum) return;
    const g = ac.createGain(); g.gain.value = 0.03; const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 500;
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(); o1.type = o2.type = "sawtooth"; o1.frequency.value = 60; o2.frequency.value = 120.6;
    o1.connect(f); o2.connect(f); f.connect(g).connect(ac.destination); o1.start(); o2.start(); hum = { o1, o2 };
  },
  humStop() { if (!hum) return; try { hum.o1.stop(); hum.o2.stop(); } catch (e) {} hum = null; },
};
function cluckBig() { tone("square", 700, 400, 0.12, 0.12, 0.05); }

// =====================================================================
// entities: mobs, vehicles, bosses, projectiles, explosions, spawning
// =====================================================================
const ents = [];
const DEF = {
  chikn: { hw: 0.25, h: 0.85, maxHp: 6, speed: 1.6, color: 0xffffff },
  goblin: { hw: 0.3, h: 1.35, maxHp: 12, speed: 1.8, color: 0x6dbb3c },
  zombie: { hw: 0.3, h: 1.9, maxHp: 20, speed: 2.7, color: 0x6a9a4a, hostile: true },
  demon: { hw: 0.4, h: 1.9, maxHp: 30, speed: 5, color: 0xc0262c, hostile: true, fly: true },
  mech: { hw: 0.9, h: 3.8, maxHp: 140, speed: 1.9, color: 0x8f8cc4, hostile: true },
  tank: { hw: 1.35, h: 2.2, maxHp: 60, speed: 2.2, color: 0x5f6b3a, hostile: true },
  clanker: { hw: 1.6, h: 1.2, maxHp: 25, speed: 20, color: 0x8f8cc4, hostile: true, fly: true },
  heli: { hw: 1.4, h: 2.3, maxHp: 50, speed: 0, color: 0x8f8cc4 },
  count: { hw: 0.4, h: 2.6, maxHp: 40, speed: 10.5, color: 0xffffff, hostile: true },
  ditch: { hw: 0.4, h: 2.0, maxHp: 320, speed: 3.8, color: 0x6b3d1e, hostile: true, boss: "Ditch" },
  guy: { hw: 0.45, h: 2.7, maxHp: 80, speed: 1.6, color: 0xd0d0d0, hostile: true },
  bigguy: { hw: 4, h: 50, maxHp: 1200, speed: 2.4, color: 0xd0d0d0, hostile: true, boss: "THE BIG GUY" },
};
const TANKS = {
  sherman: { name: "M4 Sherman", hp: 60, speed: 2.2, scale: 1, body: 0x5f6b3a, body2: 0x56613a, dmg: 9, r: 2.2, cd: [3, 4.5], hw: 1.35, h: 2.2 },
  tiger: { name: "Tiger Tonk", hp: 150, speed: 1.3, scale: 1.25, body: 0x9a9a88, body2: 0x85856f, dmg: 15, r: 3, cd: [4.5, 5.5], hw: 1.7, h: 2.7, stripes: true },
  liltonk: { name: "Lil Tonk", hp: 35, speed: 4.6, scale: 0.7, body: 0xd9c08a, body2: 0xc4ab76, dmg: 1.5, mg: true, cd: [1.8, 2.4], hw: 0.95, h: 1.55 },
};
const starTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#5f6b3a"; g.beginPath(); g.arc(32, 32, 25, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#fff"; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 9 : 23; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.fill();
  return new THREE.CanvasTexture(c);
})();
const pawTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  g.fillStyle = "#2b1240"; g.beginPath(); g.ellipse(32, 40, 14, 12, 0, 0, Math.PI * 2); g.fill();
  for (const [x, y] of [[16, 22], [27, 14], [38, 14], [49, 22]]) { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); }
  return new THREE.CanvasTexture(c);
})();
const guyData = GUY_JSON;
const guyGeo = new THREE.BufferGeometry();
guyGeo.setAttribute("position", new THREE.Float32BufferAttribute(guyData.p, 3)); guyGeo.setIndex(guyData.i); guyGeo.computeVertexNormals();

const BUILD = {
  chikn(e) {
    const g = new THREE.Group(), M = e.mats;
    part(g, 0.4, 0.36, 0.52, 0xffffff, 0, 0.46, 0, 0, 0, 0, M);
    e.head = pivot(g, 0, 0.66, 0.24);
    part(e.head, 0.26, 0.28, 0.24, 0xffffff, 0, 0.08, 0, 0, 0, 0, M); part(e.head, 0.13, 0.08, 0.12, 0xffd23f, 0, 0.06, 0.17, 0, 0, 0, M);
    part(e.head, 0.06, 0.1, 0.16, 0xe03a3a, 0, 0.26, 0.01, 0, 0, 0, M); part(e.head, 0.07, 0.09, 0.04, 0xe03a3a, 0, -0.04, 0.13, 0, 0, 0, M); part(e.head, 0.27, 0.05, 0.05, 0x111111, 0, 0.13, 0.08, 0, 0, 0, M);
    e.wl = pivot(g, -0.21, 0.58, 0); part(e.wl, 0.05, 0.24, 0.36, 0xf0f0f0, 0, -0.1, 0, 0, 0, 0, M);
    e.wr = pivot(g, 0.21, 0.58, 0); part(e.wr, 0.05, 0.24, 0.36, 0xf0f0f0, 0, -0.1, 0, 0, 0, 0, M);
    e.ll = pivot(g, -0.1, 0.28, 0); part(e.ll, 0.05, 0.28, 0.05, 0xff8c1a, 0, -0.14, 0, 0, 0, 0, M);
    e.lr = pivot(g, 0.1, 0.28, 0); part(e.lr, 0.05, 0.28, 0.05, 0xff8c1a, 0, -0.14, 0, 0, 0, 0, M);
    return g;
  },
  goblin(e) {
    const g = new THREE.Group(), M = e.mats;
    e.ll = pivot(g, -0.1, 0.5, 0); part(e.ll, 0.14, 0.5, 0.14, 0x5aa832, 0, -0.25, 0, 0, 0, 0, M);
    e.lr = pivot(g, 0.1, 0.5, 0); part(e.lr, 0.14, 0.5, 0.14, 0x5aa832, 0, -0.25, 0, 0, 0, 0, M);
    e.torso = pivot(g, 0, 0.52, 0);
    part(e.torso, 0.34, 0.16, 0.24, 0x7a4a22, 0, 0.02, 0, 0, 0, 0, M); part(e.torso, 0.34, 0.42, 0.2, 0x6dbb3c, 0, 0.3, 0, 0, 0, 0, M);
    e.al = pivot(e.torso, -0.23, 0.48, 0); part(e.al, 0.1, 0.42, 0.1, 0x6dbb3c, 0, -0.2, 0, 0, 0, 0, M);
    e.ar = pivot(e.torso, 0.23, 0.48, 0); part(e.ar, 0.1, 0.42, 0.1, 0x6dbb3c, 0, -0.2, 0, 0, 0, 0, M);
    e.head = pivot(e.torso, 0, 0.52, 0);
    part(e.head, 0.36, 0.34, 0.32, 0x6dbb3c, 0, 0.17, 0, 0, 0, 0, M);
    part(e.head, 0.3, 0.08, 0.05, 0x6dbb3c, -0.3, 0.22, 0, 0, 0, 0.35, M); part(e.head, 0.3, 0.08, 0.05, 0x6dbb3c, 0.3, 0.22, 0, 0, 0, -0.35, M);
    part(e.head, 0.09, 0.12, 0.14, 0x4f8f2a, 0, 0.12, 0.2, 0, 0, 0, M);
    part(e.head, 0.08, 0.08, 0.03, 0xff2bd6, -0.09, 0.22, 0.165, 0, 0, 0, M); part(e.head, 0.08, 0.08, 0.03, 0xff2bd6, 0.09, 0.22, 0.165, 0, 0, 0, M);
    part(e.head, 0.16, 0.03, 0.03, 0x2b1240, 0, 0.04, 0.165, 0, 0, 0, M);
    return g;
  },
  zombie(e) {
    const g = new THREE.Group(), M = e.mats, knight = e.knight;
    const skin = 0x6a9a4a, shirt = knight ? 0xc7c7d1 : 0x3d7bff, pants = knight ? 0x9a9aa6 : 0x4a3a8a;
    e.ll = pivot(g, -0.13, 0.75, 0); part(e.ll, 0.24, 0.75, 0.26, pants, 0, -0.37, 0, 0, 0, 0, M);
    e.lr = pivot(g, 0.13, 0.75, 0); part(e.lr, 0.24, 0.75, 0.26, pants, 0, -0.37, 0, 0, 0, 0, M);
    part(g, 0.5, 0.7, 0.26, shirt, 0, 1.1, 0, 0, 0, 0, M);
    if (!knight) part(g, 0.2, 0.2, 0.27, 0x2a4fa8, 0.1, 0.95, 0, 0, 0, 0, M);
    e.al = pivot(g, -0.37, 1.4, 0); part(e.al, 0.22, 0.22, 0.7, skin, 0, 0, 0.3, 0, 0, 0, M);
    e.ar = pivot(g, 0.37, 1.4, 0); part(e.ar, 0.22, 0.22, 0.7, skin, 0, 0, 0.3, 0, 0, 0, M);
    e.head = pivot(g, 0, 1.45, 0);
    part(e.head, 0.46, 0.46, 0.46, skin, 0, 0.23, 0, 0, 0, 0, M);
    part(e.head, 0.1, 0.06, 0.02, 0x1d1e21, -0.11, 0.27, 0.235, 0, 0, 0, M); part(e.head, 0.1, 0.06, 0.02, 0x1d1e21, 0.11, 0.27, 0.235, 0, 0, 0, M);
    part(e.head, 0.18, 0.05, 0.02, 0x2b1240, 0, 0.1, 0.235, 0, 0, 0, M);
    if (knight) { part(e.head, 0.52, 0.22, 0.52, 0xc7c7d1, 0, 0.42, 0, 0, 0, 0, M); part(e.head, 0.06, 0.2, 0.06, 0xe03a3a, 0, 0.6, 0, 0, 0, 0, M); }
    return g;
  },
  demon(e) {
    const g = new THREE.Group(), M = e.mats;
    part(g, 0.5, 0.8, 0.32, 0xc0262c, 0, 1.05, 0, 0, 0, 0, M);
    e.ll = pivot(g, -0.12, 0.66, 0); part(e.ll, 0.16, 0.6, 0.18, 0x8a1a22, 0, -0.3, 0, 0, 0, 0, M);
    e.lr = pivot(g, 0.12, 0.66, 0); part(e.lr, 0.16, 0.6, 0.18, 0x8a1a22, 0, -0.3, 0, 0, 0, 0, M);
    part(g, 0.14, 0.55, 0.14, 0xc0262c, -0.34, 1.05, 0.05, 0.3, 0, 0, M); part(g, 0.14, 0.55, 0.14, 0xc0262c, 0.34, 1.05, 0.05, 0.3, 0, 0, M);
    const head = pivot(g, 0, 1.5, 0);
    part(head, 0.44, 0.4, 0.4, 0xc0262c, 0, 0.2, 0, 0, 0, 0, M);
    part(head, 0.07, 0.24, 0.07, 0x2b1240, -0.15, 0.48, 0, 0, 0, 0.4, M); part(head, 0.07, 0.24, 0.07, 0x2b1240, 0.15, 0.48, 0, 0, 0, -0.4, M);
    const eye = new THREE.MeshBasicMaterial({ color: 0xffd23f });
    for (const sx of [-0.1, 0.1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.02), eye); m.position.set(sx, 0.24, 0.205); head.add(m); }
    e.wl = pivot(g, -0.2, 1.3, -0.16); part(e.wl, 0.9, 0.6, 0.04, 0x4a0f18, -0.45, 0, 0, 0, 0, 0, M);
    e.wr = pivot(g, 0.2, 1.3, -0.16); part(e.wr, 0.9, 0.6, 0.04, 0x4a0f18, 0.45, 0, 0, 0, 0, 0, M);
    part(g, 0.06, 0.06, 0.5, 0x8a1a22, 0, 0.75, -0.35, 0.6, 0, 0, M);
    return g;
  },
  mech(e) {
    const g = new THREE.Group(), M = e.mats, C = 0x8f8cc4, D2 = 0x6c69a3;
    e.legs = [];
    for (const sx of [-0.5, 0.5]) {
      const hip = pivot(g, sx, 2.0, 0); part(hip, 0.35, 1.0, 0.4, D2, 0, -0.5, 0, 0, 0, 0, M);
      const knee = pivot(hip, 0, -1.0, 0); part(knee, 0.3, 1.0, 0.35, C, 0, -0.5, 0, 0, 0, 0, M); part(knee, 0.55, 0.15, 0.75, 0x2b1240, 0, -0.98, 0.1, 0, 0, 0, M);
      e.legs.push({ hip, knee });
    }
    part(g, 1.6, 1.1, 1.3, C, 0, 2.6, 0, 0, 0, 0, M);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.05), new THREE.MeshLambertMaterial({ color: 0xa8e6ff, transparent: true, opacity: 0.7 })); glass.position.set(0, 2.8, 0.66); g.add(glass);
    part(g, 1.7, 0.12, 1.4, 0xff4fb3, 0, 2.05, 0, 0, 0, 0, M);
    e.armL = pivot(g, -0.95, 2.7, 0); part(e.armL, 0.3, 0.3, 1.2, D2, 0, 0, 0.4, 0, 0, 0, M); cylPart(e.armL, 0.08, 0.08, 0.5, 0x2b1240, 0, 0, 1.1, "z", M);
    e.armR = pivot(g, 0.95, 2.7, 0); part(e.armR, 0.3, 0.3, 1.2, D2, 0, 0, 0.4, 0, 0, 0, M); cylPart(e.armR, 0.08, 0.08, 0.5, 0x2b1240, 0, 0, 1.1, "z", M);
    part(g, 0.5, 0.4, 0.8, D2, 0.4, 3.35, -0.1, 0, 0, 0, M);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cylPart(g, 0.07, 0.07, 0.1, 0xe03a3a, 0.28 + i * 0.24, 3.25 + j * 0.2, 0.3, "z", M);
    return g;
  },
  tank(e) {
    const T = TANKS[e.variant], s = T.scale, g = new THREE.Group(), M = e.mats;
    const root = new THREE.Group(); root.scale.setScalar(s); g.add(root);
    part(root, 2.3, 0.7, 3.6, T.body, 0, 0.75, 0, 0, 0, 0, M); part(root, 2.1, 0.55, 2.4, T.body2, 0, 1.35, -0.35, 0, 0, 0, M); part(root, 2.1, 0.62, 0.95, T.body, 0, 1.22, 1.22, -0.65, 0, 0, M);
    e.wheels = [];
    for (const sx of [-1, 1]) {
      part(root, 0.46, 0.8, 3.9, 0x2a2a24, sx * 1.22, 0.42, 0, 0, 0, 0, M);
      for (let i = 0; i < 6; i++) e.wheels.push(cylPart(root, 0.24, 0.24, 0.14, 0x3a3a30, sx * 1.47, 0.34, -1.55 + i * 0.62, "x", M, 10));
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), new THREE.MeshLambertMaterial({ map: e.variant === "tiger" ? pawTex : starTex, transparent: true }));
      decal.position.set(sx * 1.16, 1.0, -0.2); decal.rotation.y = sx * Math.PI / 2; root.add(decal);
      if (T.stripes) for (let i = 0; i < 4; i++) part(root, 0.02, 0.5, 0.18, 0xff8a1c, sx * 1.16, 0.95, -1.2 + i * 0.75, 0, 0, 0.3, M);
    }
    e.turret = pivot(root, 0, 1.62, -0.1);
    if (e.variant === "tiger") part(e.turret, 1.6, 0.7, 1.9, T.body, 0, 0.35, 0.1, 0, 0, 0, M); else cylPart(e.turret, 0.82, 0.9, 0.62, T.body, 0, 0.31, 0, "y", M, 16);
    part(e.turret, 0.75, 0.48, 0.32, T.body2, 0, 0.3, 0.85, 0, 0, 0, M);
    cylPart(e.turret, 0.26, 0.26, 0.12, T.body2, 0.3, 0.68, -0.25, "y", M);
    e.barrel = pivot(e.turret, 0, 0.32, 0.95);
    if (T.mg) { cylPart(e.barrel, 0.04, 0.04, 1.6, 0x222222, 0, 0, 0.8, "z", M); cylPart(e.barrel, 0.06, 0.06, 0.4, 0x333333, 0, 0, 0.1, "z", M); }
    else { const L = e.variant === "tiger" ? 2.8 : 2.0; cylPart(e.barrel, 0.08, 0.08, L, 0x4a5530, 0, 0, L / 2, "z", M); cylPart(e.barrel, 0.12, 0.12, 0.24, 0x3a4426, 0, 0, L - 0.05, "z", M); }
    e.muzzleLen = (T.mg ? 1.6 : e.variant === "tiger" ? 2.8 : 2.0) * s;
    return g;
  },
  clanker(e) {
    const g = new THREE.Group(), M = e.mats, C = 0x9a9ab0;
    e.body = pivot(g, 0, 0.6, 0);
    cylPart(e.body, 0.35, 0.45, 4.2, C, 0, 0, 0, "z", M, 10);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 10), lam(0x6c69a3)); nose.rotation.x = Math.PI / 2; nose.position.z = 2.7; e.body.add(nose);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshLambertMaterial({ color: 0xa8e6ff, transparent: true, opacity: 0.75 })); glass.scale.set(1, 0.7, 2); glass.position.set(0, 0.32, 1.2); e.body.add(glass);
    const wing = new THREE.Shape(); wing.moveTo(0, 0.6); wing.lineTo(2.6, -0.9); wing.lineTo(2.6, -1.3); wing.lineTo(0, -1.4); wing.lineTo(0, 0.6);
    const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.06, bevelEnabled: false });
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(wg, lam(C)); w.rotation.x = Math.PI / 2; w.scale.x = sx; w.position.set(0, 0.03, -0.2); e.body.add(w); }
    part(e.body, 0.06, 0.9, 0.9, 0x6c69a3, 0.35, 0.5, -1.7, 0, 0, -0.35, M); part(e.body, 0.06, 0.9, 0.9, 0x6c69a3, -0.35, 0.5, -1.7, 0, 0, 0.35, M);
    part(e.body, 0.9, 0.06, 0.12, 0xff4fb3, 0, 0.05, -0.4, 0, 0, 0, M);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), new THREE.MeshBasicMaterial({ color: 0xff8a1c })); glow.position.z = -2.12; glow.rotation.y = Math.PI; e.body.add(glow);
    return g;
  },
  heli(e) {
    const g = new THREE.Group(), M = e.mats, L = 0x8f8cc4;
    part(g, 1.4, 1.3, 2.0, L, 0, 1.1, 0, 0, 0, 0, M); part(g, 1.42, 0.16, 2.02, 0xff4fb3, 0, 1.2, 0, 0, 0, 0, M);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.7), new THREE.MeshLambertMaterial({ color: 0xa8e6ff, transparent: true, opacity: 0.5 })); glass.position.set(0, 1.15, 1.3); g.add(glass);
    part(g, 0.36, 0.36, 2.6, L, 0, 1.4, -2.25, 0, 0, 0, M); part(g, 0.08, 0.75, 0.5, 0x6c69a3, 0, 1.78, -3.4, 0, 0, 0, M);
    e.tail = pivot(g, 0.12, 1.78, -3.4); part(e.tail, 0.04, 0.95, 0.12, 0x2b1240, 0, 0, 0, 0, 0, 0, M);
    cylPart(g, 0.08, 0.08, 0.4, 0x2b1240, 0, 1.95, 0, "y", M);
    e.rotor = pivot(g, 0, 2.16, 0); part(e.rotor, 5.4, 0.04, 0.24, 0x2b1240, 0, 0, 0, 0, 0, 0, M); part(e.rotor, 0.24, 0.04, 5.4, 0x2b1240, 0, 0, 0, 0, 0, 0, M);
    for (const sx of [-1, 1]) { part(g, 0.08, 0.08, 2.3, 0x2b1240, sx * 0.72, 0.05, 0, 0, 0, 0, M); part(g, 0.06, 0.45, 0.06, 0x2b1240, sx * 0.66, 0.28, 0.55, 0, 0, 0, M); part(g, 0.06, 0.45, 0.06, 0x2b1240, sx * 0.66, 0.28, -0.55, 0, 0, 0, M); }
    return g;
  },
  count(e) {
    const g = new THREE.Group(), M = e.mats, W = 0xf6f6f6;
    e.ll = pivot(g, -0.16, 1.0, 0); part(e.ll, 0.2, 1.0, 0.24, W, 0, -0.45, 0, 0, 0, 0, M); part(e.ll, 0.24, 0.14, 0.3, 0x2b2b33, 0, -0.95, 0.03, 0, 0, 0, M);
    e.lr = pivot(g, 0.16, 1.0, 0); part(e.lr, 0.2, 1.0, 0.24, W, 0, -0.45, 0, 0, 0, 0, M); part(e.lr, 0.24, 0.14, 0.3, 0x2b2b33, 0, -0.95, 0.03, 0, 0, 0, M);
    e.torso = pivot(g, 0, 1.0, 0);
    part(e.torso, 0.55, 1.05, 0.5, W, 0, 0.5, 0, 0, 0, 0, M);
    part(e.torso, 0.1, 0.5, 0.2, 0xdcdcdc, 0, 0.2, -0.3, 0.6, 0, 0, M);
    e.al = pivot(e.torso, -0.33, 0.85, 0.08); part(e.al, 0.16, 0.7, 0.18, W, 0, -0.3, 0.1, 0, 0, 0, M); part(e.al, 0.18, 0.12, 0.2, 0x2b2b33, 0, -0.66, 0.12, 0, 0, 0, M);
    e.ar = pivot(e.torso, 0.33, 0.85, 0.08); part(e.ar, 0.16, 0.7, 0.18, W, 0, -0.3, 0.1, 0, 0, 0, M); part(e.ar, 0.18, 0.12, 0.2, 0x2b2b33, 0, -0.66, 0.12, 0, 0, 0, M);
    e.head = pivot(e.torso, 0, 1.05, 0.05);
    part(e.head, 0.34, 0.5, 0.36, W, 0, 0.15, 0, 0.25, 0, 0, M);
    part(e.head, 0.32, 0.3, 0.55, W, 0, 0.32, 0.35, 0, 0, 0, M);
    part(e.head, 0.28, 0.1, 0.2, 0x2b2b33, 0, 0.26, 0.6, 0, 0, 0, M);
    part(e.head, 0.06, 0.08, 0.02, 0x2b1240, -0.12, 0.42, 0.33, 0, 0, 0, M); part(e.head, 0.06, 0.08, 0.02, 0x2b1240, 0.12, 0.42, 0.33, 0, 0, 0, M);
    part(e.head, 0.07, 0.16, 0.07, W, -0.1, 0.6, -0.02, 0, 0, 0.2, M); part(e.head, 0.07, 0.16, 0.07, W, 0.1, 0.6, -0.02, 0, 0, -0.2, M);
    part(e.head, 0.08, 0.5, 0.3, 0x9a9aa6, 0, 0.2, -0.18, 0.2, 0, 0, M);
    e.mouth = pivot(e.head, 0, 0.18, 0.66);
    return g;
  },
  ditch(e) {
    const g = new THREE.Group(), M = e.mats;
    const coat = 0x4a2a1e, pants = 0x5a4632, skin = 0xd99a74, beard = 0x9c4a1c, hat = 0x6b4a2e;
    e.ll = pivot(g, -0.13, 0.8, 0); part(e.ll, 0.24, 0.8, 0.26, pants, 0, -0.4, 0, 0, 0, 0, M); part(e.ll, 0.27, 0.2, 0.32, 0x2b1a12, 0, -0.75, 0.03, 0, 0, 0, M);
    e.lr = pivot(g, 0.13, 0.8, 0); part(e.lr, 0.24, 0.8, 0.26, pants, 0, -0.4, 0, 0, 0, 0, M); part(e.lr, 0.27, 0.2, 0.32, 0x2b1a12, 0, -0.75, 0.03, 0, 0, 0, M);
    part(g, 0.56, 0.75, 0.3, coat, 0, 1.18, 0, 0, 0, 0, M);
    part(g, 0.6, 0.55, 0.32, coat, 0, 0.62, -0.02, 0, 0, 0, M);
    part(g, 0.22, 0.6, 0.02, 0xe8e0d0, 0, 1.2, 0.16, 0, 0, 0, M);
    part(g, 0.6, 0.08, 0.32, 0x2b1a12, 0, 0.82, 0, 0, 0, 0, M);
    e.al = pivot(g, -0.37, 1.48, 0); part(e.al, 0.2, 0.7, 0.22, coat, 0, -0.32, 0, 0, 0, 0, M);
    e.ar = pivot(g, 0.37, 1.48, 0); part(e.ar, 0.2, 0.7, 0.22, coat, 0, -0.32, 0, 0, 0, 0, M);
    e.head = pivot(g, 0, 1.56, 0);
    // a head with a big dent in the top-left
    part(e.head, 0.44, 0.3, 0.42, skin, 0, 0.15, 0, 0, 0, 0, M);
    part(e.head, 0.22, 0.14, 0.42, skin, 0.11, 0.37, 0, 0, 0, 0, M);
    part(e.head, 0.22, 0.06, 0.42, 0xb87c5a, -0.11, 0.33, 0, 0, 0, 0, M);
    part(e.head, 0.46, 0.2, 0.08, beard, 0, 0.02, 0.19, 0, 0, 0, M); part(e.head, 0.3, 0.12, 0.06, beard, 0, -0.07, 0.2, 0, 0, 0, M);
    part(e.head, 0.07, 0.05, 0.02, 0x2b1240, -0.1, 0.22, 0.215, 0, 0, 0, M); part(e.head, 0.07, 0.05, 0.02, 0x2b1240, 0.1, 0.22, 0.215, 0, 0, 0, M);
    const hatG = pivot(e.head, 0.03, 0.47, 0); hatG.rotation.z = -0.18;
    part(hatG, 0.8, 0.05, 0.7, hat, 0, 0, 0, 0, 0, 0, M); part(hatG, 0.44, 0.2, 0.42, hat, 0.06, 0.12, 0, 0, 0, 0, M); part(hatG, 0.46, 0.05, 0.44, 0x2b1a12, 0.06, 0.03, 0, 0, 0, 0, M);
    e.gun = pivot(g, 0.1, 1.15, 0.35);
    part(e.gun, 0.07, 0.07, 1.0, 0x1d1e21, 0, 0.03, 0.35, 0, 0, 0, M); part(e.gun, 0.09, 0.12, 0.35, 0x8a4a22, 0, -0.04, -0.25, 0, 0, 0, M);
    e.pump = pivot(e.gun, 0, -0.03, 0.4); part(e.pump, 0.1, 0.08, 0.25, 0xb07a3a, 0, 0, 0, 0, 0, 0, M);
    return g;
  },
  guy(e) {
    const g = new THREE.Group();
    e.mat = new THREE.MeshLambertMaterial({ color: 0xd0d0d0, emissive: 0x141414, side: THREE.DoubleSide });
    const m = new THREE.Mesh(guyGeo, e.mat); m.scale.setScalar(2.7); g.add(m);
    e.mats = { 0: e.mat }; return g;
  },
  bigguy(e) {
    const g = new THREE.Group();
    e.mat = new THREE.MeshLambertMaterial({ color: 0xc8c8c8, emissive: 0x1a1a1a, side: THREE.DoubleSide });
    const m = new THREE.Mesh(guyGeo, e.mat); m.scale.setScalar(50); g.add(m);
    e.mats = { 0: e.mat }; e.boxes = [[-4, 0, -3, 4, 24, 3], [-7, 24, -4, 7, 44, 4], [-3, 44, -3, 3, 50, 3]];
    return g;
  },
};
function spawnEnt(type, x, y, z, extra) {
  const e = Object.assign({ type, pos: new V3(x, y, z), vel: new V3(), yaw: Math.random() * Math.PI * 2, onGround: false, t: Math.random() * 3, hurtT: 0, mats: {}, walk: false, anim: 0, flee: 0, kbT: 0, burn: 0, atkT: 0, dim }, DEF[type], extra || {});
  if (type === "tank") { const T = TANKS[e.variant || "sherman"]; e.variant = e.variant || "sherman"; e.maxHp = T.hp; e.speed = T.speed; e.hw = T.hw; e.h = T.h; }
  if (e.owned) { e.hostile = false; e.persist = true; e.maxHp = Math.max(e.maxHp, type === "tank" ? e.maxHp * 2 : e.maxHp * 2); }
  e.hp = e.maxHp; e.yawT = e.yaw;
  e.mesh = BUILD[type](e); e.matList = Object.values(e.mats);
  e.dim.group.add(e.mesh); ents.push(e);
  e.mesh.position.copy(e.pos); e.mesh.rotation.y = e.yaw;
  return e;
}
function removeEnt(e) { e.dead = true; e.dim.group.remove(e.mesh); if (e.bubble) e.bubble = null; }
function say(e, text, color, dur) {
  if (e.bubbleMesh) e.mesh.remove(e.bubbleMesh);
  const b = bubble(text, color); b.position.set(0, e.h + 0.8, 0); e.mesh.add(b); e.bubbleMesh = b; e.bubbleT = dur || 2.5;
}
function collidesBox(p, hw, h) {
  const x0 = Math.floor(p.x - hw), x1 = Math.floor(p.x + hw), y0 = Math.floor(p.y), y1 = Math.floor(p.y + h - 0.001), z0 = Math.floor(p.z - hw), z1 = Math.floor(p.z + hw);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (blocksMove(getB(x, y, z))) return true;
  return false;
}
function moveEnt(e, dt, noGravity) {
  if (!noGravity) e.vel.y = Math.max(e.vel.y - 26 * dt, -40);
  const p = e.pos; let blocked = false;
  const hgt = Math.min(e.h, 4);
  for (const ax of ["x", "z"]) {
    const old = p[ax]; p[ax] += e.vel[ax] * dt;
    if (collidesBox(p, e.hw, hgt)) {
      p.y += 1.05;
      if (e.onGround && !noGravity && !collidesBox(p, e.hw, hgt)) continue;
      p.y -= 1.05; p[ax] = old; e.vel[ax] = 0; blocked = true;
    }
  }
  p.y += e.vel.y * dt; e.onGround = false;
  if (collidesBox(p, e.hw, hgt)) { if (e.vel.y < 0) { p.y = Math.floor(p.y) + 1; e.onGround = true; } else p.y = Math.floor(p.y + hgt) - hgt - 0.001; e.vel.y = 0; }
  return blocked;
}
function turnTo(e, dt, rate) { const d = angWrap(e.yawT - e.yaw); e.yaw += clamp(d, -rate * dt, rate * dt); }
function walkVel(e, spd) { if (e.kbT > 0) return; e.vel.x = Math.sin(e.yaw) * spd; e.vel.z = Math.cos(e.yaw) * spd; }
function yawToward(from, to) { return Math.atan2(to.x - from.x, to.z - from.z); }
function groundAhead(e, dist) {
  const x = Math.floor(e.pos.x + Math.sin(e.yaw) * dist), z = Math.floor(e.pos.z + Math.cos(e.yaw) * dist), y = Math.floor(e.pos.y);
  for (let dy = 0; dy <= 3; dy++) { const b = getB(x, y - 1 - dy, z); if (blocksMove(b)) return true; if (b === LAVA) return false; }
  return false;
}
const tmpA = new V3(), tmpB = new V3(), tmpC = new V3();
function losTo(from, to) {
  tmpA.copy(to).sub(from); const L = tmpA.length(); if (L < 0.5) return true; tmpA.divideScalar(L);
  return !raycastFrom(from, tmpA, L - 0.6, true);
}
function targetPos() { return vehicle ? vehicle.pos : player.pos; }
function playerCenter(out) { const t = targetPos(); return (out || tmpB).set(t.x, t.y + (vehicle ? vehicle.h * 0.5 : 1.0), t.z); }

// ---------- damage ----------
function damageEnt(e, n, from, opts) {
  if (e.dead || n <= 0 || e.invuln) return;
  opts = opts || {};
  e.hp -= n; e.hurtT = 0.2;
  if (from && !e.boxes && e.type !== "heli") {
    const k = tmpC.set(e.pos.x - from.x, 0, e.pos.z - from.z); if (k.lengthSq() > 1e-6) k.normalize();
    const kb = opts.kb !== undefined ? opts.kb : (e.type === "tank" || e.type === "mech" ? 0.5 : 5);
    if (kb > 0) { e.vel.x += k.x * kb; e.vel.z += k.z * kb; if (!e.fly && e.type !== "tank" && e.type !== "mech") e.vel.y = Math.max(e.vel.y, opts.up !== undefined ? opts.up : 4); e.kbT = 0.35; }
  }
  if (opts.burn) e.burn = 4;
  if ((e.type === "chikn" || e.type === "goblin") && !opts.quiet) { e.flee = 3; if (e.type === "goblin" && Math.random() < 0.4) toast("the goblin is deeply offended"); }
  if (e.type === "tank" || e.type === "mech") e.angry = true;
  if (e.type === "guy" && !e.hunt) startHunt(e);
  if (e.boss) bossTarget = e;
  if (e.hp <= 0) killEnt(e);
}
function drop(id, n, p) { if (n > 0) dropItem(id, n, p); }
function killEnt(e) {
  if (e.type === "bigguy") { if (e.state !== "die") { e.state = "die"; e.st = 0; e.invuln = true; sfx.roar(); toast("THE BIG GUY IS GOING DOWN"); } return; }
  removeEnt(e);
  if (vehicle === e) exitVehicle(true);
  if (e.hostile && !e.owned) score += e.boss ? 50 : e.type === "tank" || e.type === "mech" ? 10 : e.type === "clanker" ? 8 : 2;
  const top = e.pos.clone(); top.y += Math.min(e.h, 3) * 0.6;
  spawnDebris(e.pos.x - 0.5, e.pos.y, e.pos.z - 0.5, e.color, e.type === "tank" ? 30 : 10, 6, e.type === "tank" ? 2 : 1);
  if (e.owned) { explode(top, 2.5, 0, null, false); toast("your " + (e.type === "tank" ? TANKS[e.variant].name : e.type) + " was destroyed"); return; }
  switch (e.type) {
    case "chikn": drop("nugget", 1 + (Math.random() < 0.5 ? 1 : 0), top); sfx.cluck(distVol(e.pos)); break;
    case "goblin": drop("ore", 1, top); break;
    case "zombie": if (!e.sunburn) { if (Math.random() < 0.35) drop("kole", 1 + (Math.random() * 2 | 0), top); if (Math.random() < 0.12) drop("irun", 1, top); } break;
    case "demon": drop("goald", 1 + (Math.random() * 2 | 0), top); if (Math.random() < 0.3) drop("hellrok", 2, top); break;
    case "mech": explode(top, 2.5, 0, null, true); drop("v_mech", 1, top); drop("irun", 4, top); toast("mech destroyed. it dropped... itself?"); break;
    case "tank": explode(top, 2.5, 0, null, true); drop("v_" + e.variant, 1, top); drop("rok", 6, top); drop("ore", 1, top); toast("you destroyed a " + TANKS[e.variant].name + ". it left a toy version of itself."); break;
    case "clanker": explode(top, 2.5, 0, null, false); drop("v_clanker", 1, top); break;
    case "count":
      if (e.held && e.state !== "flee") drop(e.held, 1, top);
      toast("you killed Count. somebody is going to be very upset about that.");
      setTimeout(() => { if (dim === e.dim) spawnDitch(e.pos); }, 1200);
      break;
    case "ditch": drop("shotgun", 1, top); drop("goald", 10, top); drop("blu", 4, top); toast("Ditch: tell Count... he still owes me... a horse dollar."); bossTarget = null; break;
    case "guy": drop("ipod", 2, top); if (e.hunt) huntSound(false); break;
  }
}
function hostileNear(p, r) {
  let best = null, bd = r * r;
  for (const e of ents) { if (e.dead || !e.hostile || e.dim !== dim) continue; const dx = e.pos.x - p.x, dz = e.pos.z - p.z, dy = (e.pos.y + Math.min(e.h, 3) / 2) - p.y; const d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = e; } }
  return best;
}

// ---------- projectiles ----------
const projs = [];
const PROJ = {
  shell: { grav: 0, r: 2.2, brk: true, color: 0x2a2a24 },
  rocket: { grav: 0, dmg: 26, r: 3.2, brk: true },
  missile: { grav: 0, dmg: 12, r: 2.2, brk: true },
  fireball: { grav: 0, dmg: 5, r: 1.3, brk: false, color: 0xff6a00 },
  egg: { grav: 14, dmg: 10, r: 3, brk: false, color: 0xfff4e0 },
  bomb: { grav: 20, dmg: 10, r: 3, brk: true, color: 0x1d1e21 },
  dynamite: { grav: 18, dmg: 9, r: 2.6, brk: true, color: 0xe03a3a },
  debris: { grav: 25, dmg: 5, r: 2.2, brk: false, color: 0xece6c8 },
};
function projMesh(kind) {
  if (kind === "rocket" || kind === "missile") { const g = new THREE.Group(); cylPart(g, 0.06, 0.06, 0.4, kind === "rocket" ? 0x5f6b3a : 0xb8b8c4, 0, 0, 0, "z"); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), lam(0xe03a3a)); tip.rotation.x = Math.PI / 2; tip.position.z = 0.28; g.add(tip); return g; }
  if (kind === "egg") { const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), lam(0xfff4e0)); m.scale.set(1, 1.3, 1); return m; }
  if (kind === "dynamite") { const g = new THREE.Group(); cylPart(g, 0.06, 0.06, 0.35, 0xe03a3a, 0, 0, 0, "y"); return g; }
  if (kind === "fireball") return new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a1c }));
  if (kind === "debris") return new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), lam(0xece6c8));
  return new THREE.Mesh(new THREE.SphereGeometry(kind === "bomb" ? 0.22 : 0.14, 8, 6), lam(PROJ[kind].color || 0x333333));
}
function fireProjectile(kind, from, vel, owner, dmg) {
  const mesh = projMesh(kind); mesh.position.copy(from); scene.add(mesh);
  projs.push({ kind, pos: from.clone(), vel: vel.clone(), owner, mesh, life: kind === "debris" ? 6 : 5, puffT: 0, dmg: dmg !== undefined ? dmg : PROJ[kind].dmg, d: dim });
}
function updateProjs(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const pr = projs[i], P = PROJ[pr.kind];
    if (pr.d !== dim) { scene.remove(pr.mesh); projs.splice(i, 1); continue; }
    pr.life -= dt; pr.puffT -= dt;
    pr.vel.y -= P.grav * dt;
    const steps = Math.max(1, Math.ceil((pr.vel.length() * dt) / 0.4));
    let boom = pr.life <= 0;
    const pc = playerCenter(tmpC);
    for (let s = 0; s < steps && !boom; s++) {
      pr.pos.addScaledVector(pr.vel, dt / steps);
      const b = getB(Math.floor(pr.pos.x), Math.floor(pr.pos.y), Math.floor(pr.pos.z));
      if (blocksMove(b) || b === WATER || b === LAVA) boom = true;
      if (pr.owner !== "player" && pr.pos.distanceTo(pc) < (vehicle ? vehicle.hw + 0.4 : 1.0)) boom = true;
      for (const e of ents) {
        if (e.dead || e === pr.owner || e.dim !== dim || (pr.owner === "player" && e === vehicle)) continue;
        if (pr.owner !== "player" && !e.owned && e.hostile) continue;
        if (entHitPoint(e, pr.pos, 0.15)) { boom = true; break; }
      }
    }
    pr.mesh.position.copy(pr.pos);
    if (pr.kind !== "egg" && pr.kind !== "debris") pr.mesh.lookAt(tmpA.copy(pr.pos).add(pr.vel));
    else pr.mesh.rotation.x += dt * 6;
    if (pr.puffT <= 0 && pr.kind !== "debris") { pr.puffT = 0.03; puff(pr.pos, pr.kind === "fireball" ? 0xff6a00 : pr.kind === "egg" ? 0xffffff : 0x9a9a9a, pr.kind === "rocket" ? 2.5 : 1.3, 0.4); }
    if (boom) {
      scene.remove(pr.mesh); projs.splice(i, 1);
      if (pr.kind === "egg") { for (let k = 0; k < 14; k++) spawnDebris(pr.pos.x - 0.5, pr.pos.y - 0.5, pr.pos.z - 0.5, k % 3 ? 0xffd23f : 0xffffff, 1, 8, 0.8); sfx.egg(); }
      if (pr.kind === "fireball") { const fx = Math.floor(pr.pos.x), fy = Math.floor(pr.pos.y), fz = Math.floor(pr.pos.z); if (getB(fx, fy, fz) === AIR && blocksMove(getB(fx, fy - 1, fz)) && dim === over) setBlock(fx, fy, fz, FIRE); }
      explode(pr.pos, P.r, pr.dmg, pr.owner, P.brk && !(dim === back && pr.kind !== "rocket"), pr.kind === "egg" ? 0xffe27a : pr.kind === "fireball" ? 0xff4a1c : undefined);
    }
  }
}
function entHitPoint(e, p, pad) {
  if (e.boxes) { for (const b of e.boxes) if (p.x > e.pos.x + b[0] - pad && p.x < e.pos.x + b[3] + pad && p.y > e.pos.y + b[1] - pad && p.y < e.pos.y + b[4] + pad && p.z > e.pos.z + b[2] - pad && p.z < e.pos.z + b[5] + pad) return true; return false; }
  return Math.abs(p.x - e.pos.x) < e.hw + pad && Math.abs(p.z - e.pos.z) < e.hw + pad && p.y > e.pos.y - pad && p.y < e.pos.y + e.h + pad;
}
function explode(p, r, dmg, owner, breakBlocks, color) {
  spawnBoomFx(p, r, color);
  sfx.boom(Math.max(0.25, distVol(p)));
  addNoise(25, p);
  shake = Math.max(shake, 0.06 * Math.max(0, 1 - p.distanceTo(player.pos) / 25));
  if (breakBlocks) {
    const set = new Set(); let n = 0;
    for (let x = Math.floor(p.x - r); x <= Math.ceil(p.x + r); x++) for (let y = Math.floor(p.y - r); y <= Math.ceil(p.y + r); y++) for (let z = Math.floor(p.z - r); z <= Math.ceil(p.z + r); z++) {
      const dx = x + 0.5 - p.x, dy = y + 0.5 - p.y, dz = z + 0.5 - p.z;
      if (dx * dx + dy * dy + dz * dz > r * r * 0.85) continue;
      const b = getB(x, y, z); if (!b || UNBREAK(b) || b === CEIL || b === LIGHT) continue;
      if (n++ < 10) spawnDebris(x, y, z, BLOCK_COLOR[b], 2, 8);
      rawSet(dim, x, y, z, AIR); dirtyAround(dim, x, y, z, set);
    }
    rebuildSet(dim, set);
  }
  for (let k = 0; k < 8; k++) puff(tmpA.set(p.x + rnd(-1, 1), p.y + rnd(-0.5, 1), p.z + rnd(-1, 1)), 0x555555, 4, 1.2);
  if (!dmg) return;
  const pc = new V3(player.pos.x, player.pos.y + 0.9, player.pos.z), dp = pc.distanceTo(p);
  const selfOk = owner !== "player" || dmg >= 20;
  if (selfOk && dp < r * 1.6 && owner !== vehicle) {
    hurt(dmg * (1 - dp / (r * 1.6)) * (owner === "player" ? 0.5 : 1), owner === "player" ? "boom" : owner && owner.type ? owner.type : "boom");
    if (!vehicle) { const kb = pc.sub(p).normalize().multiplyScalar(9 * (1 - dp / (r * 1.6))); player.vel.add(kb); player.vel.y += 4; fling = 0.6; }
  }
  for (const e of ents) {
    if (e.dead || e === owner || e.dim !== dim || (owner === "player" && e === vehicle)) continue;
    if (owner && owner !== "player" && e.hostile && !e.owned) continue;
    const c = new V3(e.pos.x, e.pos.y + Math.min(e.h, 4) / 2, e.pos.z);
    let de = c.distanceTo(p);
    if (e.boxes) de = Math.max(0, Math.hypot(e.pos.x - p.x, e.pos.z - p.z) - 4);
    if (de < r * 1.8) damageEnt(e, dmg * 1.2 * (1 - de / (r * 1.8)), p);
  }
}
const distVol = (p) => Math.max(0, 1 - p.distanceTo(player.pos) / 34);

// ---------- AI ----------
const GOBLIN_LINES = ["praise Cinderelly", "you smell like a non-believer", "bring Cinderelly Ore. she hungers", "no ore, no toilet", "CIN-DER-EL-LY"];
const DITCH_LINES = ["this dent? a door did it. a BIG door.", "stand still so I can shotgun you", "I ain't mad. I'm DITCH.", "Count was my best friend. and my landlord.", "you're gonna pay for that horse"];
let bossTarget = null;
function hitscanPlayer(from, chance, dmg, why, color) {
  const pc = playerCenter(tmpC).clone();
  const miss = Math.random() > chance;
  const to = pc.clone(); if (miss) to.add(new V3(rnd(-1.5, 1.5), rnd(-0.5, 1.5), rnd(-1.5, 1.5)));
  spawnTracer(from, to, color);
  if (!miss) hurt(dmg, why);
}
function aiChikn(e, dt, dp) {
  if (e.flee > 0) { e.flee -= dt; e.yawT = yawToward(player.pos, e.pos); e.walk = true; }
  else if (e.t <= 0) { e.t = rnd(2, 5); e.walk = Math.random() < 0.6; e.yawT = Math.random() * Math.PI * 2; if (dp < 14 && Math.random() < 0.4) sfx.cluck(distVol(e.pos)); }
  if (e.walk && !groundAhead(e, 0.8)) { e.yawT = e.yaw + Math.PI; e.walk = e.flee > 0; }
  turnTo(e, dt, 5); walkVel(e, e.walk && e.onGround ? (e.flee > 0 ? 4.2 : e.speed) : 0);
}
function aiGoblin(e, dt, dp) {
  const v = e.village, cx = v.x + 1, cz = v.z + 1, toC = Math.hypot(e.pos.x - cx, e.pos.z - cz);
  if (e.worship > 0) { e.worship -= dt; e.walk = false; e.yawT = Math.atan2(cx - e.pos.x, cz - e.pos.z); }
  else if (e.flee > 0) { e.flee -= dt; e.walk = true; e.yawT = yawToward(player.pos, e.pos); }
  else if (e.t <= 0) {
    e.t = rnd(2, 5);
    if (Math.random() < 0.35) { e.worship = rnd(3, 5); if (dp < 12) { sfx.goblin(distVol(e.pos)); if (Math.random() < 0.3) toast("the goblins chant: CIN-DER-EL-LY"); } }
    else { e.walk = Math.random() < 0.6; e.yawT = toC > 7 ? Math.atan2(cx - e.pos.x, cz - e.pos.z) : Math.random() * Math.PI * 2; }
  }
  if (e.walk && !groundAhead(e, 0.8)) e.yawT = e.yaw + Math.PI;
  turnTo(e, dt, 5); walkVel(e, e.walk && e.onGround ? (e.flee > 0 ? 4 : e.speed) : 0);
  const bow = e.worship > 0 ? Math.max(0, Math.sin(clock * 3)) * 0.9 : 0;
  e.torso.rotation.x = bow; e.al.rotation.x = e.ar.rotation.x = -bow * 1.6 - (e.worship > 0 ? 1.4 : 0);
}
function aiZombie(e, dt) {
  const tp = targetPos(), d = Math.hypot(tp.x - e.pos.x, tp.z - e.pos.z);
  if (!isNight() && !e.knight && dim === over) { e.burn = Math.max(e.burn, 1); e.sunburn = true; }
  if (d < 34 && !dead) {
    e.yawT = yawToward(e.pos, tp); e.walk = true;
    if (d < 1.3 + (vehicle ? vehicle.hw : 0) && e.atkT <= 0 && Math.abs(tp.y - e.pos.y) < 2.2) { e.atkT = 1; hurt(e.knight ? 4 : 3, "zombie"); e.al.rotation.x = -2.2; }
  } else if (e.t <= 0) { e.t = rnd(2, 5); e.walk = Math.random() < 0.5; e.yawT = Math.random() * Math.PI * 2; if (Math.random() < 0.3) sfx.groan(distVol(e.pos)); }
  turnTo(e, dt, 4); walkVel(e, e.walk && e.onGround ? e.speed : 0);
  e.al.rotation.x += (-1.5 - e.al.rotation.x) * Math.min(1, dt * 6); e.ar.rotation.x = -1.5 + Math.sin(clock * 3) * 0.1;
}
function aiDemon(e, dt) {
  const pc = playerCenter(tmpB);
  const d = Math.hypot(pc.x - e.pos.x, pc.z - e.pos.z);
  e.yawT = yawToward(e.pos, pc); turnTo(e, dt, 4);
  if (e.t <= 0) { e.t = rnd(2, 4); e.side = Math.random() < 0.5 ? -1 : 1; }
  const want = tmpA.set(pc.x - e.pos.x, 0, pc.z - e.pos.z).normalize();
  const dist = d > 13 ? 1 : d < 8 ? -1 : 0;
  const side = new V3(-want.z, 0, want.x).multiplyScalar(e.side || 1);
  const tv = want.multiplyScalar(dist * e.speed).add(side.multiplyScalar(2.5));
  const ground = topSolid(dim, Math.floor(e.pos.x), Math.floor(e.pos.z), Math.floor(e.pos.y) + 2);
  tv.y = clamp((Math.max(pc.y + 3, ground + 3) - e.pos.y) * 1.5, -4, 4);
  if (e.kbT <= 0) e.vel.lerp(tv, 1 - Math.exp(-dt * 2));
  e.fireT = (e.fireT === undefined ? 2 : e.fireT) - dt;
  if (e.fireT <= 0 && d < 30 && !dead) {
    const from = e.pos.clone(); from.y += 1.6;
    if (losTo(from, pc)) { const dir = pc.clone().sub(from).normalize(); fireProjectile("fireball", from.addScaledVector(dir, 0.6), dir.multiplyScalar(16), e); e.fireT = rnd(2.4, 3.4); sfx.screech(distVol(e.pos)); } else e.fireT = 0.8;
  }
  const flap = Math.sin(clock * 7 + e.t) * 0.4;
  e.wl.rotation.y = 0.6 + flap; e.wr.rotation.y = -0.6 - flap;
}
function aiMech(e, dt) {
  const tp = targetPos(), d = Math.hypot(tp.x - e.pos.x, tp.z - e.pos.z);
  if (d < 50 || e.angry) {
    e.yawT = yawToward(e.pos, tp);
    e.walk = d > 14 && groundAhead(e, 1.4);
    e.fireT = (e.fireT === undefined ? 2 : e.fireT) - dt;
    e.misT = (e.misT === undefined ? 5 : e.misT) - dt;
    const from = e.pos.clone(); from.y += 2.7;
    if (e.burst > 0) {
      e.burstT -= dt;
      if (e.burstT <= 0) { e.burst--; e.burstT = 0.15; const arm = (e.burst % 2 ? e.armL : e.armR); const m = new V3(0, 0, 1.4); arm.localToWorld(m); hitscanPlayer(m, 0.55, 3, "mech", 0xff2a2a); sfx.laser(distVol(e.pos) + 0.1); }
    } else if (e.fireT <= 0 && d < 40 && !dead) {
      if (losTo(from, playerCenter(tmpB))) { e.burst = 3; e.burstT = 0; e.fireT = 3; } else e.fireT = 0.8;
    }
    if (e.misT <= 0 && d < 45 && !dead) {
      e.misT = 7; const pc = playerCenter(tmpB);
      for (const sx of [-0.3, 0.3]) { const m = new V3(sx, 3.45, 0.4); e.mesh.localToWorld(m); const dir = pc.clone().sub(m).normalize(); dir.y += 0.05; fireProjectile("missile", m, dir.multiplyScalar(18), e); }
      sfx.rocket();
    }
    const aimP = Math.atan2(playerCenter(tmpB).y - from.y, d) * -1;
    e.armL.rotation.x = e.armR.rotation.x = aimP;
  } else if (e.t <= 0) { e.t = rnd(3, 6); e.walk = Math.random() < 0.5; e.yawT = Math.random() * Math.PI * 2; }
  turnTo(e, dt, 1.2); walkVel(e, e.walk && e.onGround ? e.speed : 0);
}
function animMech(e) {
  const sp = Math.hypot(e.vel.x, e.vel.z), s = Math.sin(e.anim) * 0.5 * Math.min(1, sp);
  if (!e.legs) return;
  e.legs[0].hip.rotation.x = s; e.legs[1].hip.rotation.x = -s;
  e.legs[0].knee.rotation.x = Math.max(0, -s) * 0.8; e.legs[1].knee.rotation.x = Math.max(0, s) * 0.8;
}
function aiTank(e, dt) {
  const T = TANKS[e.variant], tp = targetPos(), d = e.pos.distanceTo(tp);
  if (!dead && (d < 45 || e.angry)) {
    e.yawT = yawToward(e.pos, tp);
    e.walk = d > (T.mg ? 8 : 12) && groundAhead(e, 2.2 * T.scale);
    const ty = yawToward(e.pos, tp) - e.yaw;
    const dd = angWrap(ty - e.turret.rotation.y);
    e.turret.rotation.y += clamp(dd, -1.3 * dt, 1.3 * dt);
    const muzzle = new V3(0, 0, e.muzzleLen / T.scale); e.barrel.localToWorld(muzzle);
    const pc = playerCenter(tmpB);
    const aim = pc.clone().sub(muzzle);
    e.barrel.rotation.x = -Math.atan2(aim.y, Math.hypot(aim.x, aim.z)) * 0.9;
    e.fireT = (e.fireT === undefined ? 2 : e.fireT) - dt;
    if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { e.burst--; e.burstT = 0.09; hitscanPlayer(muzzle, 0.35, T.dmg, "tank"); sfx.mg(distVol(e.pos) + 0.1); } }
    else if (e.fireT <= 0 && d < 40 && Math.abs(dd) < 0.18) {
      if (losTo(muzzle, pc)) {
        if (T.mg) { e.burst = 6; e.burstT = 0; }
        else { aim.normalize(); fireProjectile("shell", muzzle, aim.multiplyScalar(32), e, T.dmg); sfx.cannon(distVol(e.pos) + 0.2); for (let k = 0; k < 6; k++) puff(muzzle, 0x9a9a9a, 3, 0.8); }
        e.fireT = rnd(T.cd[0], T.cd[1]);
      } else e.fireT = 0.6;
    }
  } else { if (e.t <= 0) { e.t = rnd(3, 7); e.walk = Math.random() < 0.5; e.yawT = Math.random() * Math.PI * 2; } if (e.walk && !groundAhead(e, 2.2)) e.walk = false; }
  turnTo(e, dt, T.mg ? 1.8 : 0.8); walkVel(e, e.walk && e.onGround ? e.speed : 0);
}
function aiClanker(e, dt) {
  const pc = playerCenter(tmpB);
  if (e.state === "emerge") {
    e.st += dt; e.vel.set(0, 7, 0); e.pos.addScaledVector(e.vel, dt);
    if (Math.random() < 0.5) spawnDebris(e.pos.x - 0.5, e.groundY, e.pos.z - 0.5, 0xb06a3f, 2, 6);
    e.mesh.position.copy(e.pos); e.body.rotation.x = -Math.PI / 2 * 0.9;
    if (e.st > 3.2) { e.state = "orbit"; e.st = 0; e.vel.set(Math.sin(e.yaw) * 14, 6, Math.cos(e.yaw) * 14); }
    return;
  }
  e.st += dt;
  let target;
  if (e.state === "orbit") {
    e.orbitA = (e.orbitA || Math.random() * 6) + dt * 0.45;
    const gY = topSolid(dim, Math.floor(pc.x), Math.floor(pc.z), 127);
    target = tmpA.set(pc.x + Math.cos(e.orbitA) * 36, Math.max(pc.y + 22, gY + 18), pc.z + Math.sin(e.orbitA) * 36);
    if (e.st > e.runAt && !dead) { e.state = "run"; e.st = 0; }
  } else {
    target = tmpA.copy(pc);
    const d = e.pos.distanceTo(pc);
    e.gunT = (e.gunT || 0) - dt;
    const fwd = e.vel.clone().normalize(), to = pc.clone().sub(e.pos).normalize();
    if (d < 60 && fwd.dot(to) > 0.95 && e.gunT <= 0) { e.gunT = 0.13; const m = e.pos.clone().addScaledVector(fwd, 2.5); hitscanPlayer(m, 0.3, 1.5, "clanker"); sfx.mg(distVol(e.pos) + 0.15); }
    if (!e.bombed && Math.hypot(e.pos.x - pc.x, e.pos.z - pc.z) < 6 && e.pos.y > pc.y + 4) { e.bombed = true; fireProjectile("bomb", e.pos.clone(), e.vel.clone().multiplyScalar(0.4), e); }
    if (d < 14 || e.st > 3.5) { e.state = "orbit"; e.st = 0; e.runAt = rnd(4, 8); e.bombed = false; e.vel.y += 12; }
  }
  const desired = target.clone().sub(e.pos).normalize().multiplyScalar(e.state === "run" ? 26 : 20);
  e.vel.lerp(desired, 1 - Math.exp(-dt * 1.4));
  // look ahead and pull up instead of flying into islands and mountains
  let blockedAhead = false;
  for (const k of [0.25, 0.5, 0.8]) { const q = tmpC.copy(e.pos).addScaledVector(e.vel, k); if (blocksMove(getB(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z)))) { blockedAhead = true; break; } }
  if (blockedAhead) { e.vel.y = Math.max(e.vel.y + 60 * dt, 14); if (e.state === "run") { e.state = "orbit"; e.st = 0; e.runAt = rnd(4, 8); } }
  e.pos.addScaledVector(e.vel, dt);
  e.air = (e.air || 0) + dt;
  const b = getB(Math.floor(e.pos.x), Math.floor(e.pos.y + 0.6), Math.floor(e.pos.z));
  if (blocksMove(b) && e.air > 2) { explode(e.pos.clone(), 2.5, 6, e, true); removeEnt(e); return; }
  const v = e.vel, sp = v.length();
  const yaw = Math.atan2(v.x, v.z), roll = angWrap(yaw - e.yaw) * 6;
  e.yaw = yaw; e.mesh.position.copy(e.pos); e.mesh.rotation.y = yaw;
  e.body.rotation.x = -Math.asin(clamp(v.y / Math.max(sp, 0.001), -1, 1)); e.body.rotation.z = clamp(-roll, -0.8, 0.8);
}
function aiCount(e, dt) {
  const tp = player.pos, d = Math.hypot(tp.x - e.pos.x, tp.z - e.pos.z);
  e.st = (e.st || 0) + dt;
  if (e.state === "run") {
    e.yawT = yawToward(e.pos, tp); e.walk = true;
    e.mudT = (e.mudT || 0) - dt;
    if (e.mudT <= 0) { e.mudT = 3; say(e, "MUD!", "#b06a3f", 2); sfx.mud(distVol(e.pos) + 0.2); }
    if (d < 1.7 && !dead) {
      const slots = []; for (let i = 0; i < 36; i++) if (inv[i]) slots.push(i);
      if (!slots.length) { e.state = "flee"; e.st = 0; say(e, "NO MUD?? NOT EVEN STUFF??", "#b06a3f", 3); }
      else {
        const i = pick(slots), id = inv[i].id; inv[i].n--; if (!inv[i].n) inv[i] = null; renderInv();
        e.held = id; e.state = "eat"; e.st = 0;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(iconCanvasFor(id)) })); sp.scale.set(0.45, 0.45, 1); e.mouth.add(sp); e.heldSprite = sp;
        toast("Count snatched your " + ITEMS[id].name + "!");
      }
    }
    if (e.st > 40) { e.state = "flee"; e.st = 0; }
  } else if (e.state === "eat") {
    e.walk = false; e.yawT = yawToward(e.pos, tp);
    e.head.rotation.x = Math.sin(e.st * 14) * 0.15;
    if (Math.random() < dt * 3) sfx.chew(distVol(e.pos));
    if (e.st > 2.2) {
      if (e.heldSprite) e.mouth.remove(e.heldSprite); e.heldSprite = null; e.eaten = e.held; e.held = null;
      say(e, "NOT MUD! THIS MIGHT DO THOUGH!!", "#b06a3f", 3.5); sfx.mud(distVol(e.pos) + 0.2);
      toast("Count: NOT MUD! THIS MIGHT DO THOUGH!!");
      e.state = "flee"; e.st = 0;
    }
  } else if (e.state === "flee") {
    e.yawT = yawToward(tp, e.pos) + Math.sin(e.st * 2) * 0.5; e.walk = true;
    if (e.st > 7) { for (let k = 0; k < 12; k++) puff(tmpA.set(e.pos.x + rnd(-0.6, 0.6), e.pos.y + rnd(0, 2.4), e.pos.z + rnd(-0.6, 0.6)), 0xffffff, 3, 0.8); removeEnt(e); return; }
  }
  if (e.walk && e.onGround) { const b = getB(Math.floor(e.pos.x + Math.sin(e.yaw)), Math.floor(e.pos.y), Math.floor(e.pos.z + Math.cos(e.yaw))); if (blocksMove(b)) e.vel.y = 8; }
  turnTo(e, dt, 8); if (e.onGround) walkVel(e, e.walk ? (e.state === "flee" ? 9 : e.speed) : 0);
  if (!e.onGround && e.walk && e.kbT <= 0) { e.vel.x = Math.sin(e.yaw) * e.speed * 0.8; e.vel.z = Math.cos(e.yaw) * e.speed * 0.8; }
  const wob = e.state === "flee" ? Math.sin(e.st * 22) * 0.32 : Math.sin(e.st * 16) * 0.12;
  e.torso.rotation.z = wob; e.torso.rotation.x = e.state === "run" ? 0.15 : 0;
  e.al.rotation.x = e.state === "eat" ? -1.4 : -0.6 + Math.sin(e.st * 16) * 0.6; e.ar.rotation.x = e.state === "eat" ? -1.4 : -0.6 - Math.sin(e.st * 16) * 0.6;
}
function spawnDitch(near) {
  const a = Math.random() * Math.PI * 2;
  const x = near.x + Math.cos(a) * 6, z = near.z + Math.sin(a) * 6;
  const y = topSolid(dim, Math.floor(x), Math.floor(z), Math.floor(near.y) + 8) + 1;
  const e = spawnEnt("ditch", x, Math.max(y, near.y), z);
  bossTarget = e;
  say(e, "YOU KILLED COUNT?!", "#c0262c", 3);
  toast("Ditch has arrived. He is upset about Count. He has a pump shotgun.");
  sfx.roar();
}
function aiDitch(e, dt) {
  const tp = player.pos, d = Math.hypot(tp.x - e.pos.x, tp.z - e.pos.z);
  e.st = (e.st || 0) + dt;
  e.yawT = yawToward(e.pos, tp); turnTo(e, dt, 6);
  if (e.t <= 0) { e.t = rnd(1.5, 3); e.side = Math.random() < 0.5 ? -1 : 1; }
  const fwd = new V3(Math.sin(e.yaw), 0, Math.cos(e.yaw)), side = new V3(fwd.z, 0, -fwd.x).multiplyScalar(e.side || 1);
  const tv = new V3();
  if (d > 14) tv.addScaledVector(fwd, e.speed); else if (d < 7) tv.addScaledVector(fwd, -e.speed * 0.8);
  tv.addScaledVector(side, 2.6);
  if (e.kbT <= 0 && e.onGround) { e.vel.x = tv.x; e.vel.z = tv.z; }
  if (e.onGround && !groundAhead(e, 1)) { e.vel.x *= -0.5; e.vel.z *= -0.5; e.side = -(e.side || 1); }
  e.gunT = (e.gunT === undefined ? 2 : e.gunT) - dt;
  e.pumpT = Math.max(0, (e.pumpT || 0) - dt);
  const from = e.pos.clone(); from.y += 1.2;
  if (e.gunT <= 0 && d < 26 && !dead) {
    if (losTo(from, playerCenter(tmpB))) {
      const chance = clamp(1.15 - d / 18, 0.08, 0.85);
      for (let i = 0; i < 7; i++) hitscanPlayer(from.clone().addScaledVector(fwd, 0.9), chance * 0.6, 2.2, "ditch");
      sfx.shotgun(); sfx.pump(); e.pumpT = 0.6; e.gunT = 1.5;
    } else e.gunT = 0.5;
  }
  e.pump.position.z = 0.4 - Math.sin((e.pumpT / 0.6) * Math.PI) * 0.18;
  e.dynT = (e.dynT === undefined ? 6 : e.dynT) - dt;
  if (e.dynT <= 0 && d < 24 && !dead) {
    e.dynT = rnd(8, 11);
    const pc = playerCenter(tmpB), flight = clamp(d / 14, 0.6, 1.4);
    const v = new V3((pc.x - from.x) / flight, (pc.y - from.y) / flight + 9 * flight, (pc.z - from.z) / flight);
    fireProjectile("dynamite", from.clone(), v, e); say(e, "catch!", "#c0262c", 1.5);
  }
  e.lineT = (e.lineT === undefined ? 8 : e.lineT) - dt;
  if (e.lineT <= 0) { e.lineT = rnd(9, 14); const l = pick(DITCH_LINES); say(e, l, "#c0262c", 3); }
  if (!e.half && e.hp < e.maxHp / 2) { e.half = true; say(e, "ok now I'm a LITTLE mad", "#c0262c", 3); e.speed = 4.6; }
  e.gun.rotation.x = -0.1;
}
// backrooms guys -----------------------------------------------------
function backCell(x, z) { return x >= 0 && z >= 0 && x < BACK_W && z < BACK_W && !backWall(x, z) && getB(x, 1, z) !== WALL; }
function bfs(sx, sz, tx, tz) {
  const W = BACK_W, prev = new Int32Array(W * W).fill(-1), q = new Int32Array(W * W);
  const s = sz * W + sx, t = tz * W + tx; let qh = 0, qt = 0; q[qt++] = s; prev[s] = s;
  while (qh < qt) {
    const c = q[qh++]; if (c === t) break;
    const cx = c % W, cz = (c / W) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= W) continue;
      const n = nz * W + nx; if (prev[n] !== -1 || !backCell(nx, nz)) continue;
      prev[n] = c; q[qt++] = n;
    }
  }
  if (prev[t] === -1) return null;
  const path = []; let c = t; while (c !== s) { path.push(c); c = prev[c]; } path.reverse();
  return path.map((c) => [c % W, (c / W) | 0]);
}
let noiseLevel = 0, huntingCount = 0, heartT = 0;
function addNoise(n, p) {
  if (dim !== back) return;
  noiseLevel = Math.min(100, noiseLevel + n);
  const src = p || player.pos;
  for (const e of ents) {
    if (e.dead || e.type !== "guy" || e.dim !== back) continue;
    const d = e.pos.distanceTo(src); if (d > 28) continue;
    e.anger = (e.anger || 0) + n * (1 - d / 28);
    if (!e.hunt && e.anger > 10 && (e.cool || 0) <= 0) startHunt(e);
  }
}
function huntSound(on) { huntingCount = Math.max(0, huntingCount + (on ? 1 : -1)); }
function startHunt(e) { e.hunt = 10; e.path = null; e.pathT = 0; e.mat.emissive.setHex(0x550000); huntSound(true); toast("a guy heard you. it is coming. (10 seconds)"); }
function aiGuy(e, dt) {
  e.anger = Math.max(0, (e.anger || 0) - 3 * dt);
  e.cool = Math.max(0, (e.cool || 0) - dt);
  const cx = Math.floor(e.pos.x), cz = Math.floor(e.pos.z);
  e.pathT -= dt;
  if (e.hunt > 0) {
    e.hunt -= dt;
    if (e.hunt <= 0) { e.hunt = 0; e.anger = 0; e.cool = 4; e.mat.emissive.setHex(0x141414); huntSound(false); toast("the guy lost interest. for now."); e.path = null; }
    else if (e.pathT <= 0) { e.pathT = 0.5; e.path = bfs(cx, cz, Math.floor(player.pos.x), Math.floor(player.pos.z)); }
    const d = e.pos.distanceTo(player.pos);
    if (d < 1.7 && e.atkT <= 0 && !dead) { e.atkT = 1.1; hurt(5, "guy"); shake = Math.max(shake, 0.03); }
  } else if (!e.path || !e.path.length) {
    if (e.pathT <= 0) { e.pathT = rnd(1, 3); for (let k = 0; k < 6; k++) { const tx = cx + ((Math.random() * 24) | 0) - 12, tz = cz + ((Math.random() * 24) | 0) - 12; if (backCell(tx, tz)) { e.path = bfs(cx, cz, tx, tz); break; } } }
  }
  let spd = 0;
  if (e.path && e.path.length) {
    const [nx, nz] = e.path[0];
    const tx = nx + 0.5, tz = nz + 0.5, dx = tx - e.pos.x, dz = tz - e.pos.z;
    if (dx * dx + dz * dz < 0.09) e.path.shift();
    else { e.yawT = Math.atan2(dx, dz); spd = e.hunt > 0 ? 5.4 : e.speed; }
  }
  turnTo(e, dt, e.hunt > 0 ? 10 : 4);
  if (e.kbT <= 0) { e.vel.x = Math.sin(e.yawT) * spd; e.vel.z = Math.cos(e.yawT) * spd; }
}
// big guy boss -------------------------------------------------------
let bigGuy = null, ceilingGone = false;
function startBigGuy() {
  if (bigGuy || ceilingGone) return;
  ceilingGone = true;
  toast("you broke the ceiling. the ceiling was holding something back.");
  shake = 0.08; sfx.stomp(1);
  const set = new Set();
  const px = Math.floor(player.pos.x), pz = Math.floor(player.pos.z);
  for (let x = 1; x < BACK_W - 1; x++) for (let z = 1; z < BACK_W - 1; z++) {
    const d = Math.hypot(x - px, z - pz);
    if (d < 44) { rawSet(back, x, 5, z, AIR); dirtyAround(back, x, 5, z, set); }
    if (d < 24) for (let y = 1; y <= 4; y++) if (getD(back, x, y, z) === WALL) { rawSet(back, x, y, z, AIR); dirtyAround(back, x, y, z, set); }
  }
  rebuildSet(back, set);
  setTimeout(() => {
    if (dim !== back) return;
    const a = Math.random() * Math.PI * 2;
    bigGuy = spawnEnt("bigguy", clamp(px + Math.cos(a) * 18, 10, 86), -52, clamp(pz + Math.sin(a) * 18, 10, 86), { state: "rise", st: 0 });
    bossTarget = bigGuy; sfx.roar();
    toast("THE BIG GUY has risen. he is about 50 blocks tall. good luck.");
  }, 1800);
}
function aiBigGuy(e, dt) {
  e.st += dt;
  const tp = player.pos, dxz = Math.hypot(tp.x - e.pos.x, tp.z - e.pos.z);
  const face = () => { e.yawT = yawToward(e.pos, tp); turnTo(e, dt, 0.7); };
  if (e.state === "rise") { e.pos.y = lerp(-52, 0, smooth(0, 1, e.st / 4)); shake = Math.max(shake, 0.03); face(); if (e.st > 4) { e.state = "walk"; e.st = 0; e.atkT = 3; } }
  else if (e.state === "walk") {
    face();
    if (dxz > 6) { e.pos.x += Math.sin(e.yaw) * e.speed * dt; e.pos.z += Math.cos(e.yaw) * e.speed * dt; }
    e.pos.y = Math.abs(Math.sin(e.st * 2.2)) * 0.5;
    e.atkT -= dt;
    if (e.atkT <= 0) {
      const r = Math.random();
      const guys = ents.filter((g) => g.type === "guy" && !g.dead).length;
      if (dxz < 20 && r < 0.45) { e.state = "stomp"; e.st = 0; }
      else if (r < 0.7) { e.state = "jump"; e.st = 0; e.from = e.pos.clone(); e.to = new V3(tp.x, 0, tp.z); }
      else if (guys < 4 && r < 0.85) { e.state = "summon"; e.st = 0; }
      else { e.state = "rain"; e.st = 0; }
    }
  } else if (e.state === "stomp") {
    face();
    if (e.st < 0.8) e.pos.y = smooth(0, 1, e.st / 0.8) * 3;
    else if (!e.slammed) { e.slammed = true; e.pos.y = 0; sfx.stomp(1); shake = 0.08; e.ring = { t: 0, max: 28, life: 1.4, hit: false }; spawnRing(e.pos, 28, 1.4, 0xfff1a8); }
    if (e.st > 2) { e.state = "walk"; e.st = 0; e.slammed = false; e.atkT = rnd(3, 5); }
  } else if (e.state === "jump") {
    if (e.st < 1) { const k = smooth(0, 1, e.st); e.pos.x = lerp(e.from.x, e.to.x, k); e.pos.z = lerp(e.from.z, e.to.z, k); e.pos.y = Math.sin(k * Math.PI * 0.5) * 20; }
    else if (e.st < 1.35) e.pos.y = 20;
    else if (e.st < 1.65) e.pos.y = lerp(20, 0, (e.st - 1.35) / 0.3);
    else if (!e.slammed) {
      e.slammed = true; e.pos.y = 0; sfx.stomp(1); sfx.boom(1); shake = 0.1;
      const d = Math.hypot(tp.x - e.pos.x, tp.z - e.pos.z); if (d < 8) hurt(12, "bigguy");
      e.ring = { t: 0, max: 34, life: 1.6, hit: d < 8 }; spawnRing(e.pos, 34, 1.6, 0xffd23f);
      for (let k = 0; k < 20; k++) spawnDebris(e.pos.x + rnd(-6, 6), 0.5, e.pos.z + rnd(-6, 6), 0x9c8a45, 1, 10, 2);
    }
    if (e.st > 2.8) { e.state = "walk"; e.st = 0; e.slammed = false; e.atkT = rnd(3, 5); }
  } else if (e.state === "rain") {
    face();
    if (!e.rained) { e.rained = true; toast("the ceiling is coming back. in pieces."); for (let k = 0; k < 10; k++) { const p = new V3(tp.x + rnd(-8, 8), 34 + rnd(0, 8), tp.z + rnd(-8, 8)); fireProjectile("debris", p, new V3(0, -2, 0), e); spawnRing(new V3(p.x, 0, p.z), 1.6, 1.8, 0xe03a3a); } }
    if (e.st > 2) { e.state = "walk"; e.st = 0; e.rained = false; e.atkT = rnd(3, 5); }
  } else if (e.state === "summon") {
    face();
    if (!e.summoned) { e.summoned = true; toast("the big guy made some little guys"); for (let k = 0; k < 2; k++) { const g = spawnEnt("guy", clamp(e.pos.x + rnd(-5, 5), 2, 93), 1.01, clamp(e.pos.z + rnd(-5, 5), 2, 93)); startHunt(g); } }
    if (e.st > 1.5) { e.state = "walk"; e.st = 0; e.summoned = false; e.atkT = rnd(3, 5); }
  } else if (e.state === "die") {
    e.mesh.rotation.x = -smooth(0, 1, e.st / 3) * 1.45; e.pos.y = -smooth(1, 4, e.st) * 8; shake = Math.max(shake, 0.04);
    if (e.st > 4.2) {
      removeEnt(e); bigGuy = null; bossTarget = null;
      const p = player.pos.clone(); p.y += 1.5;
      drop("blu", 24, p); drop("goald", 16, p); drop("ore", 8, p); drop("guymask", 1, p); drop("ipod", 16, p);
      const ex = clamp(Math.floor(player.pos.x) + 2, 2, 92), ez = clamp(Math.floor(player.pos.z) + 2, 2, 92);
      for (let i = 0; i < 2; i++) for (let y = 1; y <= 3; y++) setBlock(ex + i, y, ez, EXIT);
      toast("YOU BEAT THE BIG GUY. an exit portal opened next to you."); sfx.fanfare();
    }
    syncEnt(e); return;
  }
  if (e.ring) {
    e.ring.t += dt; const R = e.ring.max * (e.ring.t / e.ring.life);
    const d = Math.hypot(tp.x - e.pos.x, tp.z - e.pos.z);
    if (!e.ring.hit && player.onGround && Math.abs(d - R) < 1.6) { e.ring.hit = true; hurt(7, "bigguy"); player.vel.y = 7; }
    if (e.ring.t > e.ring.life) e.ring = null;
  }
  if (e.state !== "rise") {
    for (const b of e.boxes.slice(0, 1)) {
      const px = tp.x - e.pos.x, pz = tp.z - e.pos.z;
      if (px > b[0] - 0.3 && px < b[3] + 0.3 && pz > b[2] - 0.3 && pz < b[5] + 0.3 && tp.y < e.pos.y + b[4]) {
        const k = new V3(px, 0, pz).normalize(); player.vel.x = k.x * 12; player.vel.z = k.z * 12; player.vel.y = 6; fling = 0.6;
        if ((e.pushT || 0) <= 0) { hurt(3, "bigguy"); e.pushT = 0.6; }
      }
    }
    e.pushT = (e.pushT || 0) - dt;
  }
  e.mesh.rotation.z = Math.sin(e.st * 1.1) * 0.04;
  syncEnt(e);
}
function syncEnt(e) { e.mesh.position.copy(e.pos); e.mesh.rotation.y = e.yaw; }

// ---------- update all ----------
function updateEnts(dt) {
  for (let i = ents.length - 1; i >= 0; i--) {
    const e = ents[i];
    if (e.dead) { ents.splice(i, 1); continue; }
    if (e.dim !== dim) continue;
    if (!getCol(dim, Math.floor(e.pos.x) >> 4, Math.floor(e.pos.z) >> 4) && e.type !== "clanker" && e.type !== "bigguy") continue;
    const dp = e.pos.distanceTo(player.pos);
    if (!e.persist && !e.boss && dp > 120 && dim === over) { removeEnt(e); continue; }
    e.t -= dt; e.atkT -= dt; e.kbT -= dt;
    if (e.bubbleMesh) { e.bubbleT -= dt; if (e.bubbleT <= 0) { e.mesh.remove(e.bubbleMesh); e.bubbleMesh = null; } }
    if (e.owned) {
      if (e !== vehicle) { if (e.type === "heli" || e.type === "clanker") { e.vel.x *= Math.exp(-dt * 2); e.vel.z *= Math.exp(-dt * 2); e.spin = Math.max(0, (e.spin || 0) - dt * 2); } else { e.vel.x *= Math.exp(-dt * 6); e.vel.z *= Math.exp(-dt * 6); } moveEnt(e, dt, false); }
    } else {
      switch (e.type) {
        case "chikn": aiChikn(e, dt, dp); break;
        case "goblin": aiGoblin(e, dt, dp); break;
        case "zombie": aiZombie(e, dt); break;
        case "demon": aiDemon(e, dt); break;
        case "mech": aiMech(e, dt); break;
        case "tank": aiTank(e, dt); break;
        case "clanker": aiClanker(e, dt); break;
        case "count": aiCount(e, dt); break;
        case "ditch": aiDitch(e, dt); break;
        case "guy": aiGuy(e, dt); break;
        case "bigguy": aiBigGuy(e, dt); continue;
        case "heli": moveEnt(e, dt, false); break;
      }
      if (e.dead) continue;
      if (e.type !== "clanker" && e.type !== "heli") {
        const blocked = moveEnt(e, dt, !!e.fly);
        if (blocked && e.onGround && (e.type === "chikn" || e.type === "goblin" || e.type === "zombie" || e.type === "ditch")) e.vel.y = 7.5;
      }
    }
    if (e.dead) continue;
    // environment damage
    const fb = getB(Math.floor(e.pos.x), Math.floor(e.pos.y + 0.2), Math.floor(e.pos.z));
    if (fb === LAVA || fb === FIRE) e.burn = Math.max(e.burn, 3);
    if (e.burn > 0 && e.type !== "demon") { e.burn -= dt; e.burnTick = (e.burnTick || 0) - dt; if (e.burnTick <= 0) { e.burnTick = 1; damageEnt(e, fb === LAVA ? 4 : 1.5, null, { quiet: true }); puff(tmpA.set(e.pos.x, e.pos.y + Math.min(e.h, 2) * 0.6, e.pos.z), 0xff8a1c, 2, 0.5); } }
    if (e.dead) continue;
    if (e.pos.y < -60) { removeEnt(e); continue; }
    const sp = Math.hypot(e.vel.x, e.vel.z);
    e.anim += dt * sp * 4;
    if (e.ll && e.type !== "count") { e.ll.rotation.x = Math.sin(e.anim) * 0.7 * Math.min(1, sp); e.lr.rotation.x = -e.ll.rotation.x; }
    if (e.type === "count") { e.ll.rotation.x = Math.sin(e.anim * 1.5) * 0.9 * Math.min(1, sp / 4); e.lr.rotation.x = -e.ll.rotation.x; }
    if (e.wl && e.type === "chikn") { const f = e.flee > 0 || !e.onGround ? Math.sin(clock * 30) * 0.8 : 0; e.wl.rotation.z = -Math.abs(f); e.wr.rotation.z = Math.abs(f); }
    if (e.type === "goblin" && !(e.worship > 0)) { e.al.rotation.x = -e.ll.rotation.x; e.ar.rotation.x = e.ll.rotation.x; }
    if (e.type === "ditch") { e.al.rotation.x = -1.3; e.ar.rotation.x = -1.4; }
    if (e.type === "mech") animMech(e);
    if (e.type === "tank" && e.wheels) for (const w of e.wheels) w.rotation.x += sp * dt * 3;
    if (e.type === "heli") { e.rotor.rotation.y += (e.spin || 0) * dt * 25; e.tail.rotation.x += (e.spin || 0) * dt * 30; }
    if (e.hurtT > 0) { e.hurtT -= dt; for (const m of e.matList) if (m.emissive && e.type !== "guy") m.emissive.setHex(e.hurtT > 0 ? 0x660000 : 0); }
    if (e.type !== "clanker") { syncEnt(e); if (e.type === "heli" || (e.type === "tank" && e.owned)) { e.mesh.rotation.x = e.tiltX || 0; e.mesh.rotation.z = e.tiltZ || 0; } }
  }
}

// ---------- spawning (overworld) ----------
let spawnTick = 0, countNight = -1, clankerDay = -1;
function surfaceSpawn(minD, maxD, wantIsland) {
  for (let t = 0; t < 20; t++) {
    const a = Math.random() * Math.PI * 2, d = rnd(minD, maxD);
    const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
    if (!getCol(over, x >> 4, z >> 4)) continue;
    const y = topSolid(over, x, z, wantIsland ? 127 : 78);
    if (y < 1) continue;
    const b = getB(x, y, z);
    if (b === WATER || b === LAVA || !blocksMove(b)) continue;
    if (getB(x, y + 1, z) !== AIR || getB(x, y + 2, z) !== AIR) continue;
    return { x: x + 0.5, y: y + 1.01, z: z + 0.5, b, biome: colInfo(x, z).biome };
  }
  return null;
}
function updateSpawning(dt) {
  if (dim !== over) return;
  spawnTick -= dt; if (spawnTick > 0) return; spawnTick = 2.5;
  const n = (t) => ents.filter((e) => e.type === t && !e.dead && !e.owned && e.dim === over).length;
  const high = player.pos.y > 78;
  const night = isNight();
  const biome = colInfo(Math.floor(player.pos.x), Math.floor(player.pos.z)).biome;
  if (!night && n("chikn") < 8) { const s = surfaceSpawn(20, 50, high); if (s && (s.b === HAPI)) spawnEnt("chikn", s.x, s.y, s.z); }
  if (n("tank") < 2 && Math.random() < 0.25 && !high) {
    const s = surfaceSpawn(45, 75, false);
    if (s && s.biome !== OCEAN) { const r = Math.random(); spawnEnt("tank", s.x, s.y, s.z, { variant: r < 0.5 ? "sherman" : r < 0.75 ? "tiger" : "liltonk" }); }
  }
  if (night && n("zombie") < 10) { const s = surfaceSpawn(18, 45, high); if (s) spawnEnt("zombie", s.x, s.y, s.z); }
  if ((biome === HELL && n("demon") < 4) || (night && n("demon") < 2 && Math.random() < 0.3)) { const s = surfaceSpawn(20, 40, high); if (s) spawnEnt("demon", s.x, s.y + 2, s.z); }
  if (night && n("mech") < 1 && Math.random() < 0.08 && !high) { const s = surfaceSpawn(35, 60, false); if (s) spawnEnt("mech", s.x, s.y, s.z); }
  if (night && countNight !== dayNum && dayTime > DAY_LEN * 0.6 && Math.random() < 0.15) {
    const s = surfaceSpawn(26, 38, high);
    if (s) { countNight = dayNum; const c = spawnEnt("count", s.x, s.y, s.z, { state: "run", st: 0 }); say(c, "MUD!", "#b06a3f", 2.5); sfx.mud(1); toast("a white horse is standing on its back legs, yelling MUD!"); c.mudT = 3; }
  }
  if (dayNum > 0 && dayNum % 5 === 0 && clankerDay !== dayNum && dayTime > DAY_LEN * 0.05) {
    clankerDay = dayNum;
    toast("THE CLANKERS ARE RISING (it is day " + dayNum + ")"); sfx.roar();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, x = player.pos.x + Math.cos(a) * 30, z = player.pos.z + Math.sin(a) * 30;
      const gy = Math.max(topSolid(over, Math.floor(x), Math.floor(z), Math.floor(player.pos.y) + 4), 2);
      const c = spawnEnt("clanker", x, gy - 5, z, { state: "emerge", st: -i * 0.4, groundY: gy, runAt: rnd(3, 8), persist: true });
      c.yaw = a + Math.PI / 2;
    }
  }
}
function spawnVillagers() {
  if (dim !== over) return;
  for (const s of structsNear(player.pos.x, player.pos.z, 90)) {
    if (s.kind === "village" && !spawnedStructs.has(s.id) && getCol(over, s.x >> 4, s.z >> 4)) {
      spawnedStructs.add(s.id);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; spawnEnt("goblin", s.x + 1 + Math.cos(a) * 4, s.base + 1.01, s.z + 1 + Math.sin(a) * 4, { village: s, worship: 0 }); }
    }
    if (s.kind === "castle" && !spawnedStructs.has(s.id) && Math.hypot(player.pos.x - s.x, player.pos.z - s.z) < 40 && getCol(over, s.x >> 4, s.z >> 4)) {
      spawnedStructs.add(s.id);
      for (let i = 0; i < 4; i++) spawnEnt("zombie", s.x + rnd(-6, 6), s.base + 1.01, s.z + rnd(-6, 6), { knight: true, maxHp: 28, persist: true });
      if (s.style === "hell") for (let i = 0; i < 2; i++) spawnEnt("demon", s.x + rnd(-6, 6), s.base + 4, s.z + rnd(-6, 6), { persist: true });
      else if (Math.random() < 0.4) spawnEnt("mech", s.x + 0.5, s.base + 1.01, s.z + 6.5, { persist: true });
      toast("a castle! the guards noticed you.");
    }
  }
}
const spawnedStructs = new Set();

// ---------- glock flowers ----------
let glockT = 0;
function updateGlockFlowers(dt) {
  glockT -= dt; if (glockT > 0) return; glockT = 0.15;
  let sounds = 0;
  for (const s of dim.specials.values()) {
    if (s.b !== GLOCKF) continue;
    if (Math.abs(s.x - player.pos.x) > 48 || Math.abs(s.z - player.pos.z) > 48) continue;
    s.cd -= 0.15; if (s.cd > 0) continue;
    const p = tmpA.set(s.x + 0.5, s.y + 0.8, s.z + 0.5);
    const e = hostileNear(p, 5.5);
    if (!e) { s.cd = 0.3; continue; }
    s.cd = 0.55;
    const tc = new V3(e.pos.x, e.pos.y + Math.min(e.h, 3) * 0.5, e.pos.z);
    if (e.boxes) tc.y = Math.min(tc.y, 6);
    const head = s.mesh.userData.head;
    if (head) { const local = s.mesh.worldToLocal(tc.clone()); head.rotation.y = Math.atan2(local.x, local.z) - Math.PI / 2; }
    spawnTracer(p, tc, 0xfff1a8);
    damageEnt(e, 1.2, p, { kb: e.boxes ? 0 : 4, up: 2.5, quiet: true });
    if (sounds++ < 3) sfx.glock(distVol(p));
  }
}

// =====================================================================
// player: state, health, movement, vehicles, tools, weapons
// =====================================================================
const player = { pos: new V3(), vel: new V3(), yaw: 0, pitch: 0, onGround: false };
const HW = 0.3, PH = 1.8;
let eyeH = 1.62, spawn = new V3(8.5, 95, 8.5);
let hp = 20, lastHurt = -99, regenAcc = 0, dead = false, fallPeak = 0, fling = 0, shake = 0, espT = 0, onFire = 0, fireTick = 0, lavaTick = 0, portalCD = 0;
const inv = new Array(36).fill(null), armorSlots = new Array(4).fill(null), craft = new Array(25).fill(null);
let cursor = null, selected = 0;
const keys = {}, move = { x: 0, z: 0 };
let jumpQueued = false, leftDown = false, rightDown = false, touchCrouch = false, touchUp = false;
let playing = false, invOpen = false, uiKind = null, lockMode = "lock", lockEverWorked = false, inGame = false;
let clock = 0, target = null, entTarget = null, viewMode = 0, vehicle = null, riding = false, onRamp = null, inWater = false, inLava = false, climbing = false;
const eyePos = new V3(), lookDir = new V3();
const DAY_LEN = 600;
let dayTime = DAY_LEN * 0.08, dayNum = 1;
const dayPhase = () => dayTime / DAY_LEN;
const sunElev = () => Math.sin(dayPhase() * Math.PI * 2);
const isNight = () => sunElev() < -0.05;
const isCrouch = () => !riding && !vehicle && !invOpen && (keys.ShiftLeft || keys.ShiftRight || touchCrouch);
const collides = (p) => collidesBox(p, HW, PH);
let backReturn = null, score = 0;

// ---------- health ----------
const DEATH_MSG = {
  void: "you fell out of the world. impressive.", fall: "you hit the ground too hard. the ground is fine, thanks for asking.",
  guy: "a guy in the backrooms got you.", bigguy: "THE BIG GUY stepped on you. he did not notice.", tank: "a tank made you its business.", boom: "you blew yourself up. impressive, honestly.",
  bail: "you bailed so hard you died. sick trick though.", lava: "you went swimming in Hot Wet.", fire: "you were on fire for a bit too long.", zombie: "a zombie got you. it was not even trying.",
  demon: "a demon fireballed you into next week.", mech: "a mech lasered you. pew pew.", clanker: "the Clankers got you.", ditch: "Ditch shotgunned you. for Count.", count: "Count trampled you yelling MUD.",
};
function armorPoints() { return armorSlots.reduce((s, a) => s + (a ? ITEMS[a.id].pts : 0), 0); }
function hurt(n, why) {
  if (dead || n <= 0 || !inGame) return;
  if (vehicle && why !== "boom") {
    vehicle.hp -= n * 0.7; vehicle.hurtT = 0.2;
    if (vehicle.hp <= 0) { const v = vehicle; exitVehicle(true); killEnt(v); hurt(6, why); }
    return;
  }
  const dmg = Math.max(1, Math.round(n * diffMul * (1 - armorPoints() * 0.04)));
  hp = Math.max(0, hp - dmg);
  lastHurt = clock; regenAcc = 0; shake = Math.max(shake, 0.04);
  const h = $("hurt"); h.classList.add("on"); requestAnimationFrame(() => requestAnimationFrame(() => h.classList.remove("on")));
  const hr = $("hearts"); hr.classList.remove("hurt-shake"); void hr.offsetWidth; hr.classList.add("hurt-shake");
  sfx.hurt(); renderBars();
  if (hp <= 0) die(why);
}
function heal(n) { hp = Math.min(20, hp + n); renderBars(); }
function die(why) {
  dead = true; leftDown = rightDown = false;
  endGrapple(true); if (vehicle) exitVehicle(true); if (riding) setRiding(false);
  if (invOpen) closeUI(true);
  $("death-msg").textContent = DEATH_MSG[why] || "skill issue.";
  $("death-score").textContent = score;
  $("death-wrap").hidden = false;
  document.body.classList.remove("playing");
  if (document.pointerLockElement) document.exitPointerLock();
}
function respawnPlayer() {
  dead = false; hp = 20; onFire = 0; renderBars(); $("death-wrap").hidden = true;
  if (dim !== over) exitBackrooms(true);
  player.pos.copy(spawn); player.vel.set(0, 0, 0); fallPeak = player.pos.y;
  resumeGame();
}

// ---------- movement ----------
function floorSupport(p) {
  const x0 = Math.floor(p.x - HW), x1 = Math.floor(p.x + HW), z0 = Math.floor(p.z - HW), z1 = Math.floor(p.z + HW), y = Math.floor(p.y - 0.05);
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { const b = getB(x, y, z); if (blocksMove(b) || b === RAMP || getB(x, y + 1, z) === RAMP) return true; }
  return false;
}
function rampFloor(p) {
  const cx = Math.floor(p.x), cz = Math.floor(p.z);
  for (const cy of [Math.floor(p.y), Math.floor(p.y) - 1]) if (getB(cx, cy, cz) === RAMP) { const dir = dim.meta.get(keyOf(cx, cy, cz)) & 3; return { h: cy + rampH(dir, p.x - cx, p.z - cz), dir }; }
  return null;
}
function landed(fall) {
  if (inWater || climbing) return;
  if (dim === back && fall > 1.5) addNoise(3);
  if (fall > 3.5 && !riding) hurt(Math.floor(fall - 3), "fall"); else if (fall > 6 && riding) hurt(Math.floor(fall - 5), "fall");
}
function moveBody(dt, guard) {
  const p = player.pos, v = player.vel, wasGround = player.onGround;
  for (const ax of ["x", "z"]) {
    const old = p[ax]; p[ax] += v[ax] * dt;
    if (collides(p)) {
      p.y += 0.6;
      if (wasGround && !collides(p) && false) continue;
      p.y -= 0.6;
      p[ax] = v[ax] > 0 ? Math.floor(p[ax] + HW) - HW - 0.001 : Math.floor(p[ax] - HW) + 1 + HW + 0.001;
      if (riding && Math.abs(v[ax]) > 9) { trick("BAILED"); hurt(2, "bail"); }
      v[ax] = 0;
    } else if (guard && wasGround && !floorSupport(p)) { p[ax] = old; v[ax] = 0; }
  }
  p.y += v.y * dt; player.onGround = false; onRamp = null;
  if (collides(p)) {
    if (v.y < 0) { p.y = Math.floor(p.y) + 1; player.onGround = true; fling = 0; if (!wasGround) landed(fallPeak - p.y); }
    else p.y = Math.floor(p.y + PH) - PH - 0.001;
    v.y = 0;
  }
  const rf = rampFloor(p);
  if (rf && p.y <= rf.h + 0.2 && p.y >= rf.h - 1.05 && v.y <= 0.1 + (riding ? 20 : 0)) {
    if (!wasGround) landed(fallPeak - rf.h);
    p.y = rf.h; player.onGround = true; onRamp = rf; v.y = 0; fling = 0;
    if (riding) { const up = [[1, 0], [0, 1], [-1, 0], [0, -1]][rf.dir]; v.y = Math.max(0, v.x * up[0] + v.z * up[1]); }
  }
  if (player.onGround && !(riding && v.y > 0)) fallPeak = p.y; else fallPeak = Math.max(fallPeak, p.y);
  if (inWater || climbing) fallPeak = p.y;
}
let stepNoiseT = 0;
function physics(dt) {
  const p = player.pos;
  if (vehicle) { vehicleControl(dt); return; }
  const bx = Math.floor(p.x), bz = Math.floor(p.z);
  const b0 = getB(bx, Math.floor(p.y + 0.1), bz), b1 = getB(bx, Math.floor(p.y + 1.0), bz);
  inWater = b0 === WATER || b1 === WATER; inLava = b0 === LAVA || b1 === LAVA; climbing = b0 === VINE || b1 === VINE;
  if (inLava) { onFire = 4; lavaTick -= dt; if (lavaTick <= 0) { lavaTick = 0.5; hurt(4, "lava"); } }
  if (b0 === FIRE || b1 === FIRE) onFire = Math.max(onFire, 3);
  if (inWater) onFire = 0;
  if (onFire > 0) { onFire -= dt; fireTick -= dt; if (fireTick <= 0) { fireTick = 1; if (!inLava) hurt(1, "fire"); } if (Math.random() < dt * 12) puff(tmpA.set(p.x + rnd(-0.3, 0.3), p.y + rnd(0.2, 1.6), p.z + rnd(-0.3, 0.3)), 0xff8a1c, 1.6, 0.4); }
  if ((b0 === PORTAL || b1 === PORTAL) && portalCD <= 0 && dim === over) { enterBackrooms(bx, Math.floor(p.y), bz); return; }
  if ((b0 === EXIT || b1 === EXIT) && portalCD <= 0 && dim === back) { exitBackrooms(false); return; }
  let fx = 0, fz = 0;
  if (!invOpen) {
    if (keys.KeyW || keys.ArrowUp) fz -= 1; if (keys.KeyS || keys.ArrowDown) fz += 1;
    if (keys.KeyA || keys.ArrowLeft) fx -= 1; if (keys.KeyD || keys.ArrowRight) fx += 1;
    fx += move.x; fz += move.z;
  }
  const len = Math.hypot(fx, fz); if (len > 1) { fx /= len; fz /= len; }
  const crouch = isCrouch(), sprint = keys.Tab && !crouch && !invOpen;
  const jump = (keys.Space || jumpQueued || touchUp) && !invOpen;
  if (grapple.state === "pull") {
    const d = new V3(grapple.to.x - p.x, grapple.to.y - (p.y + 0.9), grapple.to.z - p.z), L = d.length();
    if (L < 1.7 || grapple.t > 3.5) endGrapple(); else { d.multiplyScalar(26 / L); player.vel.lerp(d, 1 - Math.exp(-dt * 10)); }
    fallPeak = p.y;
  } else if (riding && !inWater) {
    if (sk.grind) { updateGrind(dt); jumpQueued = false; return; }
    skateVelocity(dt, fx, fz);
  } else {
    let speed = crouch ? 1.4 : sprint ? 6.8 : 4.3;
    if (gun.ads > 0.5) speed *= 0.55;
    if (inWater) speed = 2.8; if (inLava) speed = 1.5;
    const s = Math.sin(player.yaw), c = Math.cos(player.yaw);
    const tx = (fx * c + fz * s) * speed, tz = (-fx * s + fz * c) * speed;
    const k = player.onGround || inWater || climbing ? 1 - Math.exp(-dt * 20) : fling > 0 ? 1 - Math.exp(-dt * 1.2) : 1 - Math.exp(-dt * 10);
    player.vel.x += (tx - player.vel.x) * k; player.vel.z += (tz - player.vel.z) * k;
    if (fling > 0) fling -= dt;
    if (climbing) { player.vel.y = jump || (fz < 0 && len > 0) ? 3.2 : crouch ? 0 : -2; }
    else if (inWater || inLava) { player.vel.y = Math.max(player.vel.y - 9 * dt, inLava ? -2 : -4); if (jump) player.vel.y = Math.min(player.vel.y + 24 * dt, 3.4); }
    else {
      if (jump && player.onGround) { player.vel.y = 8.6; if (dim === back) addNoise(2); }
      player.vel.y = Math.max(player.vel.y - 26 * dt, -55);
    }
    if (dim === back && player.onGround && len > 0.1) { stepNoiseT -= dt; if (stepNoiseT <= 0) { stepNoiseT = 0.5; addNoise(crouch ? 0 : sprint ? 2.2 : 0.4); } }
  }
  jumpQueued = false;
  moveBody(dt, crouch && grapple.state === "none" && !inWater);
  if (riding) tryStartGrind();
  if (p.y < -20) { respawnPlayer(); hurt(4, "void"); }
}

// ---------- vehicles ----------
function mountVehicle(v) {
  endGrapple(true); if (riding) setRiding(false);
  vehicle = v; v.spin = 1; player.vel.set(0, 0, 0); v.fireT = 0;
  const tips = { heli: "Space up · Shift down · WASD fly", tank: "W/S drive · A/D turn · mouse aims · click fires", mech: "WASD walk · Space jump · click fires lasers", clanker: "W faster · S slower · mouse steers · click fires" };
  toast(tips[v.type] + " · right click to get out · Shift + right click a parked vehicle to pick it up");
  if (ac && !engineSnd) engineSnd = loopNoise(v.type === "heli" ? 220 : v.type === "clanker" ? 600 : 120, v.type === "clanker" ? 0.07 : 0.1, v.type === "heli" ? 13 : 0);
}
function exitVehicle(silent) {
  const v = vehicle; vehicle = null;
  if (engineSnd) { engineSnd.stop(); engineSnd = null; }
  if (!v) return;
  const side = new V3(Math.cos(v.yaw), 0, -Math.sin(v.yaw)).multiplyScalar(v.hw + 1);
  player.pos.copy(v.pos).add(side); player.pos.y += 0.3;
  if (collides(player.pos)) { player.pos.copy(v.pos); player.pos.y += v.h + 0.2; }
  player.vel.copy(v.vel); fallPeak = player.pos.y;
  if (v.type === "clanker" && !silent) player.vel.y += 6;
}
function placeVehicle(it) {
  if (dim !== over) { toast("vehicles do not work in the backrooms"); return; }
  if (!target) { toast("point at the ground to place it"); return; }
  const type = it.vehicle;
  const p = new V3(target.px + 0.5, target.py + 0.01, target.pz + 0.5);
  const D = type === "tank" ? TANKS[it.variant] : DEF[type];
  let up = 0; while (up < 4 && collidesBox(p, D.hw, Math.min(D.h, 4))) { p.y += 1; up++; }
  if (up >= 4) { toast("not enough room here"); return; }
  const v = spawnEnt(type, p.x, p.y, p.z, { owned: true, variant: it.variant });
  v.yaw = player.yaw + Math.PI; consumeSelected(1);
  toast(it.name + " deployed. right click it to get in.");
}
function pickupVehicle(v) {
  const id = v.type === "tank" ? "v_" + v.variant : v.type === "heli" ? "heli" : "v_" + v.type;
  if (addItem(id, 1)) { toast("no room in your inventory"); return; }
  removeEnt(v); sfx.pop(); toast("picked up the " + ITEMS[id].name);
}
let vFireT = 0;
function vehicleControl(dt) {
  const v = vehicle;
  let fx = 0, fz = 0;
  if (!invOpen) { if (keys.KeyW || keys.ArrowUp) fz -= 1; if (keys.KeyS || keys.ArrowDown) fz += 1; if (keys.KeyA || keys.ArrowLeft) fx -= 1; if (keys.KeyD || keys.ArrowRight) fx += 1; fx += move.x; fz += move.z; }
  const up = keys.Space || jumpQueued || touchUp, down = keys.ShiftLeft || keys.ShiftRight || touchCrouch;
  vFireT -= dt;
  const firing = leftDown && !invOpen;
  if (v.type === "heli") {
    v.yawT = player.yaw + Math.PI; turnTo(v, dt, 2.2);
    const f = new V3(Math.sin(v.yaw), 0, Math.cos(v.yaw)), r = new V3(-Math.cos(v.yaw), 0, Math.sin(v.yaw));
    const tv = f.multiplyScalar(-fz * 16).add(r.multiplyScalar(fx * 9));
    const k = 1 - Math.exp(-dt * 1.8);
    v.vel.x += (tv.x - v.vel.x) * k; v.vel.z += (tv.z - v.vel.z) * k;
    v.vel.y += ((up ? 7 : 0) + (down ? -7 : 0) + Math.sin(clock * 2) * 0.3 - v.vel.y) * (1 - Math.exp(-dt * 3));
    v.spin = Math.min(1, (v.spin || 0) + dt);
    moveEnt(v, dt, true); v.tiltX = -fz * 0.18; v.tiltZ = fx * 0.15;
  } else if (v.type === "tank") {
    const T = TANKS[v.variant];
    v.yaw -= fx * dt * 1.4;
    const sp = -fz * T.speed * 2.2;
    v.vel.x = Math.sin(v.yaw) * sp; v.vel.z = Math.cos(v.yaw) * sp;
    moveEnt(v, dt, false);
    v.turret.rotation.y = angWrap(player.yaw + Math.PI - v.yaw);
    v.barrel.rotation.x = clamp(-player.pitch, -0.5, 0.3);
    if (firing && vFireT <= 0) {
      const muzzle = new V3(0, 0, v.muzzleLen / T.scale + 0.2); v.barrel.localToWorld(muzzle);
      const dir = muzzle.clone().sub(new V3(0, 0, 0).copy(v.barrel.getWorldPosition(new V3()))).normalize();
      if (T.mg) { vFireT = 0.09; shootRay(muzzle, dir, 3, 0.03); sfx.mg(1); }
      else { vFireT = v.variant === "tiger" ? 3.2 : 2.2; fireProjectile("shell", muzzle, dir.multiplyScalar(36), "player", v.variant === "tiger" ? 30 : 20); sfx.cannon(1); shake = 0.03; for (let k = 0; k < 6; k++) puff(muzzle, 0x9a9a9a, 3, 0.8); }
    }
  } else if (v.type === "mech") {
    v.yaw = player.yaw + Math.PI;
    const s = Math.sin(player.yaw), c = Math.cos(player.yaw);
    v.vel.x = (fx * c + fz * s) * 5; v.vel.z = (-fx * s + fz * c) * 5;
    if (up && v.onGround) v.vel.y = 10;
    moveEnt(v, dt, false);
    v.armL.rotation.x = v.armR.rotation.x = -player.pitch;
    if (firing && vFireT <= 0) { vFireT = 0.22; const arm = (Math.random() < 0.5 ? v.armL : v.armR); const m = new V3(0, 0, 1.4); arm.localToWorld(m); shootRay(m, lookDir.clone(), 6, 0.01, 0xff2a2a); sfx.laser(1); }
  } else if (v.type === "clanker") {
    v.throttle = clamp((v.throttle || 0) + (-fz) * dt * 18, 0, 36);
    const sp = v.throttle;
    if (sp > 9) {
      const want = lookDir.clone().multiplyScalar(sp);
      const nearGround = blocksMove(getB(Math.floor(v.pos.x), Math.floor(v.pos.y - 1.5), Math.floor(v.pos.z)));
      if (nearGround) want.y = Math.max(want.y, sp * 0.3);
      v.vel.lerp(want, 1 - Math.exp(-dt * 2.5));
    }
    else { v.vel.x *= Math.exp(-dt); v.vel.z *= Math.exp(-dt); v.vel.y = Math.max(v.vel.y - 12 * dt, -12); }
    const np = v.pos.clone().addScaledVector(v.vel, dt);
    if (collidesBox(np, 1.2, 1.2)) {
      if (v.vel.length() > 13) { const pos = v.pos.clone(); exitVehicle(true); killEnt(v); explode(pos, 3, 10, null, true); return; }
      v.vel.set(0, 0, 0); v.throttle = Math.min(v.throttle, 8);
    } else v.pos.copy(np);
    const vv = v.vel, s2 = vv.length();
    if (s2 > 1) { v.yaw = Math.atan2(vv.x, vv.z); v.body.rotation.x = -Math.asin(clamp(vv.y / s2, -1, 1)); }
    v.body.rotation.z = -fx * 0.5;
    if (firing && vFireT <= 0) { vFireT = 0.1; const fwd = new V3(Math.sin(v.yaw), 0, Math.cos(v.yaw)); const m = v.pos.clone().addScaledVector(fwd, 3); m.y += 0.6; shootRay(m, lookDir.clone(), 2.5, 0.03); sfx.mg(1); }
    if (engineSnd) engineSnd.f.frequency.value = 300 + sp * 20;
  }
  const seat = v.type === "heli" ? new V3(0, 0, 0.25) : new V3(0, v.h - 0.2, 0);
  seat.applyAxisAngle(new V3(0, 1, 0), v.yaw);
  player.pos.copy(v.pos).add(seat); player.vel.copy(v.vel); fallPeak = player.pos.y; player.onGround = false;
  jumpQueued = false;
  if (v.pos.y < -30) { exitVehicle(true); removeEnt(v); }
}

// ---------- mining / placing / using ----------
const BREAK_LINES = { [HAPI]: ["Hapi Boi has left the chat", "+1 Hapi Boi (he is still smiling)"], [ROK]: ["rok.", "the rok has no opinions"], [WAAD]: ["+1 Waad. wood? never heard of it"], [BUG]: ["+1 Bug Food. the bugs will remember this"], [ORE]: ["+1 Cinderelly Ore. the goblins felt that"], [BLU]: ["BLU ROK. you are rich now. probably."], [EVIL]: ["the evil grass hissed at you"] };
const mine = { key: "", t: 0, warned: "" };
let swing = 0, attackCD = 0;
function breakAt(t, drop) {
  const b = getB(t.x, t.y, t.z); if (!b) return;
  const k = keyOf(t.x, t.y, t.z), hadPoo = (dim.meta.get(k) | 0) & 4 && b === TOILET;
  if ((b === CEIL || b === LIGHT) && dim === back) { setBlock(t.x, t.y, t.z, AIR); startBigGuy(); return; }
  setBlock(t.x, t.y, t.z, AIR);
  spawnDebris(t.x, t.y, t.z, BLOCK_COLOR[b], drop ? 8 : 12, drop ? 4 : 7);
  addNoise(3);
  if (drop) {
    sfx.brk();
    const id = BLOCK_ITEM[b];
    if (id) { const n = b === BUG ? (Math.random() < 0.85 ? 1 : 0) : 1; if (n && addItem(id, n)) dropItem(id, n, new V3(t.x + 0.5, t.y + 0.5, t.z + 0.5)); }
    if (hadPoo) addItem("poopy", 1);
    if (Math.random() < 0.25 && BREAK_LINES[b]) toast(pick(BREAK_LINES[b]));
  }
}
const ringEl = $("mine-ring");
function ringSet(p) { ringEl.style.setProperty("--p", p.toFixed(3)); }
function heldItem() { const s = inv[selected]; return s ? ITEMS[s.id] : null; }
const GUNS = { rifle: 1, rifle2: 1, rpg: 1, shotgun: 1 };
function meleeHit(e, it) {
  attackCD = it && it.bonk ? 0.7 : 0.4;
  const dmg = it && it.dmg ? it.dmg : 1;
  if (it && it.bonk) { damageEnt(e, dmg, player.pos, { kb: 16, up: 8 }); sfx.bonk(); trick("BONK!"); }
  else { damageEnt(e, dmg, player.pos, { burn: it && it.burn }); sfx.hit(); }
  swing = 0.01;
  if (e.type === "tank" && dmg < 5 && Math.random() < 0.3) toast("you are punching a tank.");
}
function updateMining(dt, it) {
  const cancel = () => { mine.t = 0; mine.key = ""; crack.visible = false; ringSet(0); };
  attackCD -= dt;
  if (!leftDown || (it && GUNS[it.tool]) || vehicle || (lockMode === "drag" && drag.moved >= 6)) { cancel(); return; }
  swing = Math.min(1, swing + dt * 4);
  if (entTarget && entTarget.t <= 3.6 && (!target || entTarget.t < target.t)) { cancel(); if (attackCD <= 0) meleeHit(entTarget.e, it); return; }
  if (!target) { cancel(); return; }
  const b = getB(target.x, target.y, target.z), key = keyOf(target.x, target.y, target.z);
  if (key !== mine.key) { mine.key = key; mine.t = 0; }
  if (UNBREAK(b)) { if (mine.warned !== key) { toast(b === POLE ? "Cinderelly cannot be broken. Cinderelly is eternal." : b === BEDROK ? "that's bedrok. it does not break. it barely even exists." : "that cannot be broken."); mine.warned = key; } cancel(); mine.key = key; return; }
  const tier = it && it.tool === "pick" ? it.tier : 0, need = NEEDS[b] || 0;
  if (need > tier) { if (mine.warned !== key) { toast(need >= 2 ? "Blu Rok needs an Irun Pickaxe or better" : "this needs a pickaxe"); mine.warned = key; } cancel(); mine.key = key; return; }
  let time = HARD[b] || 1;
  if (it && it.tool === "pick") time *= it.speed;
  if (it && it.tool === "sword" && b === BUG) time *= 0.3;
  mine.t += dt;
  if (Math.random() < dt * 2) addNoise(1.5);
  const pr = Math.min(1, mine.t / time);
  crack.visible = true; crack.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5); crack.material.opacity = 0.2 + pr * 0.8;
  ringSet(pr);
  if (pr >= 1) { breakAt(target, true); cancel(); }
}
function forwardCardinal() { const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw); return Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 0 : 2) : (fz > 0 ? 1 : 3); }
function placeBlock() {
  const s = inv[selected];
  if (!target || !s || !ITEMS[s.id].block) return;
  const { px, py, pz } = target;
  const cur = getB(px, py, pz);
  if (cur !== AIR && cur !== WATER && cur !== FIRE) return;
  const p = player.pos, b = ITEMS[s.id].block;
  if (blocksMove(b) && px + 1 > p.x - HW && px < p.x + HW && pz + 1 > p.z - HW && pz < p.z + HW && py + 1 > p.y && py < p.y + PH) { toast("you cannot place a block inside yourself. yet."); return; }
  if (py < 0 || py >= dim.H) { toast("the edge of the world refuses your block"); return; }
  if ((b === FLOWER || b === GLOCKF) && !blocksMove(getB(px, py - 1, pz))) { toast("flowers need ground under them"); return; }
  let meta;
  if (b === RAMP) meta = forwardCardinal();
  if (b === TOILET) meta = (forwardCardinal() + 2) % 4;
  setBlock(px, py, pz, b, meta);
  sfx.place(); addNoise(2); consumeSelected(1);
  swing = 0.6;
}
function consumeSelected(n) { const s = inv[selected]; if (!s) return; s.n -= n || 1; if (s.n <= 0) inv[selected] = null; renderInv(); }
function equipFromHand() {
  const s = inv[selected]; if (!s) return;
  const it = ITEMS[s.id];
  if (it.anyArmor) { const slot = armorSlots.findIndex((a) => !a); if (slot < 0) { toast("no armor slot free"); return; } armorSlots[slot] = { id: s.id, n: 1 }; consumeSelected(1); }
  else { const old = armorSlots[it.armor]; armorSlots[it.armor] = s; inv[selected] = old; }
  sfx.pop(); toast("you put on " + it.name + ". fashion."); renderInv(); renderBars();
}
function eat() {
  const s = inv[selected], it = ITEMS[s.id];
  heal(it.heal); sfx.crunch(); swing = 0.6;
  if (it.esp) { espT = it.esp; toast(pick(["you ate an iPod. you can see through walls now.", "the iPod had 3 songs on it. you see EVERYTHING.", "crunchy. you can sense castles."])); }
  consumeSelected(1);
}
const LOOT = {
  common: [["irun", 2, 6], ["kole", 3, 8], ["goald", 1, 4], ["nugget", 2, 5], ["ipod", 1, 3], ["stick", 4, 8], ["planks", 6, 12]],
  rare: [["blu", 1, 3], ["irunsword", 1, 1], ["irunpick", 1, 1], ["irunhelm", 1, 1], ["irunchest", 1, 1], ["irunlegs", 1, 1], ["irunboots", 1, 1], ["skateboard", 1, 1], ["hook", 1, 1], ["glockf", 2, 4], ["ramp", 4, 8]],
  unique: ["chikcannon", "bonk", "hellsword", "rifle", "rpg"],
};
function rollLoot(big, hell) {
  const out = [];
  const roll = (t) => { const [id, a, b] = pick(t); out.push([id, a + Math.floor(Math.random() * (b - a + 1))]); };
  const n = big ? 5 : 3;
  for (let i = 0; i < n; i++) roll(LOOT.common);
  for (let i = 0; i < (big ? 2 : 1); i++) if (Math.random() < (big ? 0.9 : 0.5)) roll(LOOT.rare);
  if (big || Math.random() < 0.3) {
    let u = pick(LOOT.unique);
    if (hell && Math.random() < 0.5) u = "hellsword";
    if (!hell && u === "hellsword" && Math.random() < 0.6) u = "chikcannon";
    out.push([u, u === "rpg" ? 1 : 1]); if (u === "rpg") out.push(["ipod", 8]);
  }
  return out;
}
function openChest(t, b) {
  const hell = colInfo(t.x, t.z).biome === HELL;
  const loot = rollLoot(b === CHEST_BIG, hell);
  const names = [];
  for (const [id, n] of loot) { const left = addItem(id, n); if (left) dropItem(id, left, eyePos.clone()); names.push((n > 1 ? n + " " : "") + ITEMS[id].name); }
  setBlock(t.x, t.y, t.z, CHEST_OPEN);
  sfx.fanfare(); toast("loot: " + names.join(", "));
}
function onRightClick() {
  if (vehicle) { exitVehicle(false); return; }
  const s = inv[selected], it = s ? ITEMS[s.id] : null;
  if (entTarget && entTarget.t <= 4.5 && (!target || entTarget.t <= target.t + 0.5)) {
    const e = entTarget.e;
    if (e.owned) { if (isCrouchKey()) pickupVehicle(e); else mountVehicle(e); return; }
    if (e.type === "goblin") {
      if (s && s.id === "ore") {
        consumeSelected(1);
        if (addItem("toilet", 1)) dropItem("toilet", 1, player.pos.clone().setY(player.pos.y + 1));
        e.worship = 2; sfx.goblin(1); sfx.pop(); toast("the goblin bows to Cinderelly and hands you a Toilet");
      } else { toast("goblin: " + pick(GOBLIN_LINES)); sfx.goblin(1); }
      return;
    }
  }
  if (target) {
    const b = getB(target.x, target.y, target.z), k = keyOf(target.x, target.y, target.z);
    if (b === TOILET && (dim.meta.get(k) | 0) & 4) {
      const sp = dim.specials.get(k); if (sp) setPoo(dim, sp, false);
      if (addItem("poopy", 1)) dropItem("poopy", 1, eyePos.clone());
      sfx.plop(); toast("you took the Poopy out of the toilet. with your hands."); return;
    }
    if (b === CHEST || b === CHEST_BIG) { openChest(target, b); return; }
    if (b === CHEST_OPEN && !isCrouchKey()) { toast("this chest is empty. someone (you) looted it."); return; }
  }
  if (!it) return;
  if (it.tool === "chikcannon") { fireChicken(); return; }
  if (it.block) placeBlock();
  else if (it.heal) eat();
  else if (it.tool === "hook") fireHook();
  else if (it.armor !== undefined) equipFromHand();
  else if (it.vehicle) placeVehicle(it);
  else if (it.tool === "book") openBook();
  else if (it.tool === "skate") setRiding(!riding);
}
const isCrouchKey = () => keys.ShiftLeft || keys.ShiftRight || touchCrouch;

// ---------- grappling hook ----------
const grapple = { state: "none", t: 0, to: new V3(), head: new V3() };
const ropeGeo = new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]);
const rope = new THREE.Line(ropeGeo, new THREE.LineBasicMaterial({ color: 0xd8c9a3 })); rope.frustumCulled = false; rope.visible = false; scene.add(rope);
const hookHead = new THREE.Group();
{ const m = lam(0xb8b8c4); hookHead.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), m)); for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.18), m); const a = (i / 3) * Math.PI * 2; p.position.set(Math.cos(a) * 0.08, Math.sin(a) * 0.08, -0.15); p.rotation.set(Math.sin(a) * 0.7, -Math.cos(a) * 0.7, 0); hookHead.add(p); } }
hookHead.visible = false; scene.add(hookHead);
function fireHook() {
  if (grapple.state !== "none") { endGrapple(); return; }
  const hit = raycastFrom(eyePos, lookDir, 45);
  sfx.hookShoot(); swing = 0.6;
  if (!hit) { toast("missed lol"); return; }
  if (riding) setRiding(false);
  grapple.to.copy(eyePos).addScaledVector(lookDir, Math.max(0.2, hit.t - 0.05)); grapple.head.copy(eyePos); grapple.state = "fly"; grapple.t = 0;
}
function endGrapple(silent) {
  if (grapple.state === "none") return;
  const wasPull = grapple.state === "pull";
  grapple.state = "none"; rope.visible = false; hookHead.visible = false;
  if (wasPull && !silent) { fling = 0.9; player.vel.y = Math.max(player.vel.y, 5); }
  fallPeak = player.pos.y;
}
const handOff = new V3();
function updateGrapple(dt) {
  if (grapple.state === "none") return;
  grapple.t += dt;
  if (grapple.state === "fly") { const d = grapple.to.clone().sub(grapple.head), L = d.length(), step = 75 * dt; if (L <= step) { grapple.head.copy(grapple.to); grapple.state = "pull"; grapple.t = 0; sfx.hookHit(); } else grapple.head.addScaledVector(d, step / L); }
  handOff.set(0.25, -0.22, -0.45); camera.localToWorld(handOff);
  if (viewMode !== 0) handOff.set(player.pos.x, player.pos.y + 1.2, player.pos.z);
  const arr = ropeGeo.attributes.position.array;
  arr[0] = handOff.x; arr[1] = handOff.y; arr[2] = handOff.z; arr[3] = grapple.head.x; arr[4] = grapple.head.y; arr[5] = grapple.head.z;
  ropeGeo.attributes.position.needsUpdate = true;
  rope.visible = hookHead.visible = true; hookHead.position.copy(grapple.head); hookHead.lookAt(handOff);
}

// ---------- skateboard ----------
const board = new THREE.Group();
{
  part(board, 0.3, 0.04, 0.9, 0xc9a8f0, 0, 0.12, 0); part(board, 0.31, 0.012, 0.86, 0xff4fb3, 0, 0.145, 0);
  part(board, 0.26, 0.04, 0.12, 0x9a9aa6, 0, 0.08, 0.28); part(board, 0.26, 0.04, 0.12, 0x9a9aa6, 0, 0.08, -0.28);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylPart(board, 0.05, 0.05, 0.05, 0xfff4e0, sx * 0.14, 0.05, sz * 0.28, "x", null, 10);
}
board.visible = false; scene.add(board);
const sk = { grind: null, air: 0, spin: 0, grindAcc: 0, wasAir: false };
function setRiding(on) {
  if (on && !inv.some((s) => s && s.id === "skateboard")) { toast("you need a Skateboard (planks on top, rok wheels)"); return; }
  if (on && vehicle) return;
  riding = on; sk.grind = null; stopGrindSound(); board.visible = on;
  toast(on ? "skateboard: W push · S brake · A/D carve · Space ollie · land on rails to grind" : "you stepped off the skateboard");
}
function stopGrindSound() { if (grindSnd) { grindSnd.stop(); grindSnd = null; } }
function skateVelocity(dt, fx, fz) {
  const v = player.vel;
  const fX = -Math.sin(player.yaw), fZ = -Math.cos(player.yaw), rX = Math.cos(player.yaw), rZ = -Math.sin(player.yaw);
  if (player.onGround) {
    let along = v.x * fX + v.z * fZ, lat = v.x * rX + v.z * rZ;
    if (fz < 0) along += 9 * dt; if (fz > 0) along -= 14 * dt;
    if (onRamp) { const up = [[1, 0], [0, 1], [-1, 0], [0, -1]][onRamp.dir]; along += -(fX * up[0] + fZ * up[1]) * 8 * dt; }
    along = clamp(along, -3, 15) * Math.exp(-dt * 0.25); lat *= Math.exp(-dt * 10);
    player.yaw -= fx * dt * 2.4;
    const nX = -Math.sin(player.yaw), nZ = -Math.cos(player.yaw), nrX = Math.cos(player.yaw), nrZ = -Math.sin(player.yaw);
    v.x = nX * along + nrX * lat; v.z = nZ * along + nrZ * lat;
    if (sk.wasAir) { const spins = Math.round(Math.abs(sk.spin) / Math.PI); if (sk.air > 0.5) trick((spins ? spins * 180 + " " : "") + "AIR +" + (Math.round(sk.air * 60) + spins * 90)); sk.air = 0; sk.spin = 0; sk.wasAir = false; }
    if ((keys.Space || jumpQueued) && !invOpen) { v.y = 8.6; sfx.ollie(); if (Math.hypot(v.x, v.z) > 3) trick("OLLIE +10"); }
  } else { sk.air += dt; sk.wasAir = true; const turn = -fx * dt * 3; player.yaw += turn; sk.spin += turn; }
  v.y = Math.max(v.y - 26 * dt, -55);
}
function tryStartGrind() {
  if (sk.grind) return;
  const v = player.vel, p = player.pos;
  if (!sk.wasAir || v.y > 0 || Math.hypot(v.x, v.z) < 3) return;
  const bx = Math.floor(p.x), by = Math.floor(p.y - 0.05), bz = Math.floor(p.z);
  if (!blocksMove(getB(bx, by, bz)) || blocksMove(getB(bx, by + 1, bz))) return;
  if (p.y - (by + 1) > 0.35 || p.y - (by + 1) < -0.1) return;
  const axis = Math.abs(v.x) > Math.abs(v.z) ? "x" : "z";
  const side1 = axis === "x" ? getB(bx, by, bz - 1) : getB(bx - 1, by, bz), side2 = axis === "x" ? getB(bx, by, bz + 1) : getB(bx + 1, by, bz);
  if (blocksMove(side1) && blocksMove(side2)) return;
  sk.grind = { axis, dir: Math.sign(v[axis]), speed: Math.max(Math.abs(v[axis]), 6), y: by + 1, lane: (axis === "x" ? bz : bx) + 0.5 };
  sk.wasAir = false; sk.air = 0; sk.spin = 0; sk.grindAcc = 0;
  trick("GRIND!"); if (ac && !grindSnd) grindSnd = loopNoise(2600, 0.06, 0);
}
function updateGrind(dt) {
  const g = sk.grind, p = player.pos, v = player.vel, other = g.axis === "x" ? "z" : "x";
  g.speed = Math.max(4, g.speed - dt * 0.6);
  const nx = p[g.axis] + g.dir * g.speed * dt;
  const cx = g.axis === "x" ? Math.floor(nx) : Math.floor(g.lane), cz = g.axis === "z" ? Math.floor(nx) : Math.floor(g.lane);
  const rail = blocksMove(getB(cx, g.y - 1, cz)), blocked = blocksMove(getB(cx, g.y, cz)) || blocksMove(getB(cx, g.y + 1, cz));
  sk.grindAcc += dt;
  if (blocked) { sk.grind = null; stopGrindSound(); v.set(0, 0, 0); trick("BAILED"); hurt(2, "bail"); return; }
  p[g.axis] = nx; p[other] += (g.lane - p[other]) * Math.min(1, dt * 12); p.y = g.y;
  v[g.axis] = g.dir * g.speed; v[other] = 0; v.y = 0; player.onGround = true;
  if (Math.random() < 0.6) spawnDebris(p.x - 0.5, p.y - 0.5, p.z - 0.5, 0xffd23f, 1, 2, 0.4);
  trick("GRIND +" + Math.round(sk.grindAcc * 120));
  const jump = keys.Space || jumpQueued;
  if (!rail || jump) { sk.grind = null; stopGrindSound(); v.y = jump ? 8.6 : 3; player.onGround = false; sk.wasAir = true; if (jump) sfx.ollie(); }
}

// ---------- held items + guns ----------
const heldRoot = new THREE.Group(); viewScene.add(heldRoot);
const heldBlockMat = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true });
const spriteMat = new THREE.MeshBasicMaterial({ vertexColors: true });
const arm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.55), new THREE.MeshLambertMaterial({ color: 0xc4ff99 }));
arm.userData.base = { p: new V3(0.32, -0.3, -0.42), r: new THREE.Euler(0.25, 0.15, 0) };
function buildRifle(multi) {
  const g = new THREE.Group();
  const M = (c) => new THREE.MeshLambertMaterial({ color: c });
  const metal = M(0x34353b), dark = M(0x1b1c1f), wood = M(0x8a4a22), woodD = M(0x6b3818), magM = M(multi ? 0xff2bd6 : 0x9c4a1c), pink = M(0xff2bd6);
  const box = (w, h, l, mat, x, y, z, rx, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat); m.position.set(x, y, z); m.rotation.x = rx || 0; (parent || g).add(m); return m; };
  const cyl = (r, l, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 12), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  box(0.07, 0.1, 0.42, metal, 0, 0, 0); box(0.066, 0.034, 0.38, dark, 0, 0.066, 0.01); box(0.004, 0.02, 0.3, dark, 0.036, 0.03, 0);
  cyl(0.015, 0.44, dark, 0, 0.025, -0.43); cyl(0.012, 0.22, metal, 0, 0.062, -0.32);
  box(0.078, 0.062, 0.2, wood, 0, 0.004, -0.32); box(0.064, 0.032, 0.18, woodD, 0, 0.066, -0.32);
  for (let i = 0; i < 3; i++) box(0.08, 0.004, 0.012, woodD, 0, -0.02 + i * 0.016, -0.36);
  box(0.022, 0.07, 0.03, metal, 0, 0.05, -0.58); box(0.006, 0.03, 0.006, dark, 0, 0.098, -0.58); box(0.03, 0.006, 0.02, metal, 0, 0.09, -0.58);
  cyl(0.022, 0.06, dark, 0, 0.025, -0.67); cyl(0.024, 0.012, metal, 0, 0.025, -0.645);
  box(0.05, 0.02, 0.05, metal, 0, 0.09, -0.17); box(0.012, 0.022, 0.01, dark, 0.016, 0.106, -0.19); box(0.012, 0.022, 0.01, dark, -0.016, 0.106, -0.19);
  box(0.05, 0.085, 0.3, wood, 0, -0.03, 0.34, 0.12); box(0.054, 0.1, 0.02, dark, 0, -0.05, 0.49, 0.12);
  box(0.046, 0.13, 0.055, woodD, 0, -0.105, 0.13, -0.35); box(0.01, 0.008, 0.11, metal, 0, -0.085, 0.05); box(0.006, 0.035, 0.01, dark, 0, -0.06, 0.06, 0.3); box(0.004, 0.03, 0.12, metal, 0.037, 0.02, 0.07);
  if (multi) { cyl(0.012, 0.36, pink, 0.032, 0.0, -0.42); cyl(0.012, 0.36, pink, -0.032, 0.0, -0.42); box(0.1, 0.012, 0.1, pink, 0, -0.03, -0.55); }
  const bolt = new THREE.Group(); g.add(bolt); box(0.03, 0.022, 0.05, metal, 0.045, 0.042, -0.04, 0, bolt); box(0.02, 0.02, 0.02, dark, 0.065, 0.042, -0.06, 0, bolt);
  const mag = new THREE.Group(); mag.position.set(0, -0.05, -0.08); g.add(mag);
  for (let i = 0; i < 3; i++) box(0.042, 0.085, 0.075, magM, 0, -0.035 - i * 0.072, -i * 0.03 - i * i * 0.01, -(0.15 + i * 0.17), mag);
  const flash = muzzleGlow(); flash.position.set(0, 0.025, -0.72); g.add(flash);
  g.userData = { bolt, mag, flash };
  return g;
}
function muzzleGlow() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const fg = c.getContext("2d"); const rg = fg.createRadialGradient(32, 32, 2, 32, 32, 30); rg.addColorStop(0, "rgba(255,240,200,0.9)"); rg.addColorStop(0.4, "rgba(255,190,90,0.6)"); rg.addColorStop(1, "rgba(255,120,20,0)"); fg.fillStyle = rg; fg.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  const g = new THREE.Group(); g.add(m); g.visible = false; return g;
}
function buildRPG() {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.95, 14), lam(0x5f6b3a)); tube.rotation.x = Math.PI / 2; tube.position.set(0, 0, -0.1); g.add(tube);
  const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 14), lam(0x3a4426)); bk.rotation.x = Math.PI / 2; bk.position.z = 0.42; g.add(bk);
  part(g, 0.04, 0.12, 0.05, 0x2b2b2b, 0, -0.1, 0.05, -0.3); part(g, 0.04, 0.12, 0.05, 0x2b2b2b, 0, -0.1, -0.22, -0.3); part(g, 0.03, 0.05, 0.08, 0x2b2b2b, 0.06, 0.05, -0.05);
  for (let i = 0; i < 3; i++) part(g, 0.112, 0.112, 0.02, 0xeeeef3, 0, 0, -0.3 + i * 0.25);
  const war = new THREE.Group(); war.position.z = -0.6; g.add(war);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.14, 12), lam(0xeeeef3)); c.rotation.x = Math.PI / 2; war.add(c);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 12), lam(0xe03a3a)); tip.rotation.x = -Math.PI / 2; tip.position.z = -0.16; war.add(tip);
  g.userData = { war }; return g;
}
function buildShotgun() {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 10), lam(0x1d1e21)); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.03, -0.4); g.add(barrel);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.6, 10), lam(0x2b2b30)); tube.rotation.x = Math.PI / 2; tube.position.set(0, -0.01, -0.35); g.add(tube);
  part(g, 0.06, 0.08, 0.28, 0x34353b, 0, 0.01, 0); part(g, 0.05, 0.09, 0.32, 0x8a4a22, 0, -0.03, 0.27, 0.15); part(g, 0.04, 0.1, 0.05, 0x6b3818, 0, -0.08, 0.08, -0.35);
  const pump = new THREE.Group(); pump.position.set(0, -0.012, -0.3); g.add(pump); part(pump, 0.05, 0.05, 0.16, 0xb07a3a, 0, 0, 0);
  const flash = muzzleGlow(); flash.position.set(0, 0.03, -0.8); g.add(flash);
  g.userData = { pump, flash }; return g;
}
function buildChickenHeld() {
  const e = { mats: {} }; const c = BUILD.chikn(e); c.scale.setScalar(0.42);
  const g = new THREE.Group(); g.add(c); g.userData = { c, e }; return g;
}
function buildBonk() {
  const g = new THREE.Group();
  const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.02, 0.7, 10), lam(0xb07a3a)); bat.position.y = 0.2; g.add(bat);
  part(g, 0.06, 0.02, 0.06, 0x2b1240, 0, -0.12, 0);
  g.rotation.x = -0.6; return g;
}
const rifle = buildRifle(false), rifle2 = buildRifle(true), rpgModel = buildRPG(), shotgunModel = buildShotgun(), chickenHeld = buildChickenHeld(), bonkModel = buildBonk();
const HIP = new V3(0.19, -0.2, -0.36), ADSP = new V3(0, -0.108, -0.2);
const gun = { ammo: 30, cool: 0, reload: 0, ads: 0, kick: 0, flash: 0, bolt: 0, recoilAcc: 0, pump: 0, chick: 0 };
const shells = [], shellGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.028, 6), shellMat = new THREE.MeshLambertMaterial({ color: 0xd4a83a });
let heldId, heldObj = null;
function setHeld(id) {
  heldId = id;
  if (heldObj) heldRoot.remove(heldObj);
  const it = id ? ITEMS[id] : null;
  if (!id) heldObj = arm;
  else if (id === "rifle") heldObj = rifle; else if (id === "rifle2") heldObj = rifle2; else if (id === "rpg") heldObj = rpgModel; else if (id === "shotgun") heldObj = shotgunModel;
  else if (id === "chikcannon") heldObj = chickenHeld;
  else if (id === "bonk") { heldObj = bonkModel; heldObj.userData.base = { p: new V3(0.3, -0.25, -0.5), r: new THREE.Euler(-0.4, 0, -0.3) }; }
  else if (it.sprite) { heldObj = new THREE.Mesh(spriteGeo(it.sprite, it.pal), spriteMat); heldObj.scale.setScalar(0.4); heldObj.userData.base = { p: new V3(0.3, -0.22, -0.5), r: new THREE.Euler(0.1, -0.45, 0.05) }; }
  else { heldObj = new THREE.Mesh(it.block === SNEAKERS ? unitBox : blockGeo(it.block), it.block === SNEAKERS ? sneakMat : heldBlockMat); heldObj.scale.setScalar(0.22); heldObj.userData.base = { p: new V3(0.3, -0.27, -0.48), r: new THREE.Euler(0.15, 0.75, 0) }; }
  heldRoot.add(heldObj);
  updateAmmoHud();
  const nm = $("held-name"); nm.textContent = it ? it.name : "";
  nm.classList.add("show"); clearTimeout(setHeld.t); setHeld.t = setTimeout(() => nm.classList.remove("show"), 1400);
  if (!(id === "rifle" || id === "rifle2")) gun.ads = 0;
}
function updateAmmoHud() {
  const isGun = GUNS[heldId] || heldId === "chikcannon";
  $("ammo").hidden = !isGun;
  if (heldId === "rpg") { $("ammo-n").textContent = countItem("ipod"); $("ammo-sub").textContent = "iPods (each one is a rocket)"; }
  else if (heldId === "shotgun") { $("ammo-n").textContent = "∞"; $("ammo-sub").textContent = "pump shotgun · it pumps itself"; }
  else if (heldId === "chikcannon") { $("ammo-n").textContent = "∞"; $("ammo-sub").textContent = "Chicken Cannon · right click"; }
  else { $("ammo-n").textContent = gun.ammo + " / ∞"; $("ammo-sub").textContent = (heldId === "rifle2" ? "Slop-47 Multishot" : "Slop-47") + " · R to reload"; }
}
function countItem(id) { return inv.reduce((s, x) => s + (x && x.id === id ? x.n : 0), 0); }
function takeItem(id, n) { for (let i = 0; i < 36 && n; i++) if (inv[i] && inv[i].id === id) { const k = Math.min(n, inv[i].n); inv[i].n -= k; n -= k; if (!inv[i].n) inv[i] = null; } renderInv(); }
const tmpV = new V3(), tmpV2 = new V3();
function muzzleWorld() { tmpV2.set(gun.ads > 0.5 ? 0 : 0.17, gun.ads > 0.5 ? -0.07 : -0.13, -0.8); camera.localToWorld(tmpV2); if (viewMode !== 0 || vehicle) tmpV2.copy(eyePos).addScaledVector(lookDir, 0.6); return tmpV2; }
function rayEnts(o, d, max, skip) {
  let best = null;
  for (const e of ents) {
    if (e === skip || e.dead || e === vehicle || e.dim !== dim) continue;
    const boxes = e.boxes || [[-e.hw, 0, -e.hw, e.hw, e.h, e.hw]];
    for (const b of boxes) {
      tmpA.set(e.pos.x + b[0], e.pos.y + b[1], e.pos.z + b[2]); tmpC.set(e.pos.x + b[3], e.pos.y + b[4], e.pos.z + b[5]);
      const t = rayBox(o, d, tmpA, tmpC);
      if (t >= 0 && t <= max && (!best || t < best.t)) best = { e, t };
    }
  }
  return best;
}
function rayBox(o, d, mn, mx) {
  let t0 = 0, t1 = Infinity;
  for (const a of ["x", "y", "z"]) {
    if (Math.abs(d[a]) < 1e-9) { if (o[a] < mn[a] || o[a] > mx[a]) return -1; continue; }
    let ta = (mn[a] - o[a]) / d[a], tb = (mx[a] - o[a]) / d[a]; if (ta > tb) { const s = ta; ta = tb; tb = s; }
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return -1;
  }
  return t0;
}
function raycastFrom(o, dir, max, pass) {
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const sx = Math.sign(dir.x), sy = Math.sign(dir.y), sz = Math.sign(dir.z);
  const tdx = sx ? Math.abs(1 / dir.x) : Infinity, tdy = sy ? Math.abs(1 / dir.y) : Infinity, tdz = sz ? Math.abs(1 / dir.z) : Infinity;
  let tmx = sx > 0 ? (x + 1 - o.x) * tdx : sx < 0 ? (o.x - x) * tdx : Infinity;
  let tmy = sy > 0 ? (y + 1 - o.y) * tdy : sy < 0 ? (o.y - y) * tdy : Infinity;
  let tmz = sz > 0 ? (z + 1 - o.z) * tdz : sz < 0 ? (o.z - z) * tdz : Infinity;
  let px = x, py = y, pz = z, t = 0;
  while (t <= max) {
    const b = getB(x, y, z);
    if (b !== AIR && b !== WATER && !(pass && !blocksMove(b))) return { x, y, z, px, py, pz, t };
    px = x; py = y; pz = z;
    if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; } else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; } else { z += sz; t = tmz; tmz += tdz; }
  }
  return null;
}
function shootRay(from, dir, dmg, spread, color) {
  const d = dir.clone();
  if (spread) { d.x += (Math.random() - 0.5) * spread; d.y += (Math.random() - 0.5) * spread; d.z += (Math.random() - 0.5) * spread; d.normalize(); }
  const origin = vehicle ? from : eyePos;
  const hit = raycastFrom(origin, d, 120), eh = rayEnts(origin, d, 120);
  const useE = eh && (!hit || eh.t < hit.t);
  const end = origin.clone().addScaledVector(d, useE ? eh.t : hit ? hit.t : 120);
  spawnTracer(vehicle ? from : muzzleWorld().clone(), end, color);
  if (useE) { damageEnt(eh.e, dmg, origin); spawnDebris(end.x - 0.5, end.y - 0.5, end.z - 0.5, 0xff2a2a, 3, 3, 0.6); }
  else if (hit) { const b = getB(hit.x, hit.y, hit.z); if (UNBREAK(b) || b === CEIL || b === LIGHT || (dim === back)) spawnDebris(end.x - 0.5, end.y - 0.5, end.z - 0.5, 0xfff1a8, 3, 3); else breakAt(hit, false); }
}
function fire() {
  if (heldId === "rpg") {
    if (gun.cool > 0) return;
    if (!countItem("ipod")) { sfx.click(); toast("no iPods. the RPG eats iPods."); gun.cool = 0.5; return; }
    takeItem("ipod", 1); gun.cool = 1.2; gun.kick = 1.5; shake = Math.max(shake, 0.02);
    const from = eyePos.clone().addScaledVector(lookDir, 1.0); from.y -= 0.1;
    fireProjectile("rocket", from, lookDir.clone().multiplyScalar(34), "player"); sfx.rocket(); addNoise(15);
    updateAmmoHud(); return;
  }
  if (heldId === "shotgun") {
    if (gun.cool > 0) return;
    gun.cool = 0.95; gun.kick = 1.6; gun.flash = 0.12; gun.pump = 0.6;
    for (let i = 0; i < 8; i++) shootRay(null, lookDir, 3, 0.11);
    player.pitch = Math.min(1.55, player.pitch + 0.04); gun.recoilAcc += 0.04; shake = Math.max(shake, 0.015);
    sfx.shotgun(); sfx.pump(); addNoise(12); return;
  }
  if (gun.reload > 0 || gun.cool > 0) return;
  if (gun.ammo <= 0) { sfx.click(); startReload(); return; }
  const multi = heldId === "rifle2";
  gun.ammo--; gun.cool = multi ? 0.14 : 0.1; gun.kick = 1; gun.flash = 0.18; gun.bolt = 0.08;
  updateAmmoHud();
  const kick = (multi ? 0.02 : 0.014) * (1 - gun.ads * 0.5);
  player.pitch = Math.min(1.55, player.pitch + kick); gun.recoilAcc += kick; player.yaw += (Math.random() - 0.5) * 0.008;
  shake = Math.max(shake, multi ? 0.01 : 0.006);
  sfx.shot(); addNoise(8);
  const model = multi ? rifle2 : rifle;
  if (viewMode === 0) { const s = new THREE.Mesh(shellGeo, shellMat); tmpV.set(0.05, 0.045, -0.04); model.localToWorld(tmpV); s.position.copy(tmpV); s.rotation.set(Math.random() * 3, 0, Math.PI / 2); s.userData = { v: new V3(rnd(0.9, 1.4), rnd(0.7, 1.1), 0.2), spin: rnd(15, 25), life: 0.6 }; viewScene.add(s); shells.push(s); }
  const pellets = multi ? 6 : 1, spread = multi ? 0.07 : 0.012 * (1 - gun.ads);
  for (let i = 0; i < pellets; i++) shootRay(null, lookDir, multi ? 3 : 4, spread);
}
function fireChicken() {
  if (gun.chick > 0) return;
  gun.chick = 1.1;
  setTimeout(() => {
    if (heldId !== "chikcannon") return;
    const from = eyePos.clone().addScaledVector(lookDir, 0.9); from.y -= 0.15;
    const v = lookDir.clone().multiplyScalar(22); v.y += 3;
    fireProjectile("egg", from, v, "player"); sfx.egg(); addNoise(5);
  }, 180);
  sfx.cluck(1);
}
function startReload() { if (heldId !== "rifle" && heldId !== "rifle2") return; if (gun.reload > 0 || gun.ammo >= 30) return; gun.reload = 1.7; sfx.reload(); }
function updateGun(dt, active) {
  gun.cool -= dt; gun.chick = Math.max(0, gun.chick - dt);
  if (active && GUNS[heldId] && leftDown && !vehicle) fire();
  if (gun.reload > 0) { gun.reload -= dt; if (gun.reload <= 0) { gun.reload = 0; gun.ammo = 30; updateAmmoHud(); } }
  const rec = Math.min(gun.recoilAcc, dt * 0.5); player.pitch -= rec; gun.recoilAcc -= rec;
}
let bob = 0;
function animateHeld(dt, moving) {
  for (let i = shells.length - 1; i >= 0; i--) { const s = shells[i], u = s.userData; u.life -= dt; u.v.y -= 6 * dt; s.position.addScaledVector(u.v, dt); s.rotation.x += u.spin * dt; if (u.life <= 0) { viewScene.remove(s); shells.splice(i, 1); } }
  bob += dt * (moving ? 9 : 0);
  const bx = Math.sin(bob) * 0.012 * (moving ? 1 : 0), by = Math.abs(Math.cos(bob)) * 0.012 * (moving ? 1 : 0);
  heldRoot.visible = viewMode === 0 && !vehicle;
  if (!heldObj) return;
  gun.kick *= Math.exp(-dt * 12); gun.flash -= dt;
  if (heldObj === rifle || heldObj === rifle2) {
    const want = rightDown && gun.reload <= 0 && !invOpen ? 1 : 0;
    gun.ads += (want - gun.ads) * Math.min(1, dt * 12);
    gun.bolt = Math.max(0, gun.bolt - dt);
    const g = heldObj, u = g.userData;
    g.position.lerpVectors(HIP, ADSP, gun.ads); g.position.x += bx * (1 - gun.ads * 0.8); g.position.y += by * (1 - gun.ads * 0.8); g.position.z += gun.kick * 0.05;
    g.rotation.set(gun.kick * 0.08, 0.04 * (1 - gun.ads), 0);
    u.bolt.position.z = gun.bolt > 0 ? (gun.bolt / 0.08) * 0.06 : 0;
    u.flash.visible = gun.flash > 0;
    if (gun.reload > 0) {
      const p = 1 - gun.reload / 1.7;
      g.rotation.z = Math.sin(Math.min(1, p) * Math.PI) * 0.45; g.rotation.x += Math.sin(Math.min(1, p) * Math.PI) * 0.15;
      if (p < 0.25) { u.mag.position.y = -0.05 - (p / 0.25) * 0.35; u.mag.visible = true; } else if (p < 0.5) u.mag.visible = false;
      else if (p < 0.75) { u.mag.visible = true; u.mag.position.y = -0.4 + ((p - 0.5) / 0.25) * 0.35; }
      else { u.mag.position.y = -0.05; u.bolt.position.z = p < 0.92 ? Math.sin(((p - 0.75) / 0.17) * Math.PI) * 0.07 : 0; }
    } else { u.mag.visible = true; u.mag.position.y = -0.05; }
    return;
  }
  if (heldObj === rpgModel) { rpgModel.position.set(0.2 + bx, -0.16 + by, -0.35 + gun.kick * 0.08); rpgModel.rotation.set(gun.kick * 0.1, 0.05, 0); rpgModel.userData.war.visible = gun.cool <= 0.4 && countItem("ipod") > 0; return; }
  if (heldObj === shotgunModel) {
    gun.pump = Math.max(0, gun.pump - dt);
    shotgunModel.position.set(0.2 + bx, -0.19 + by, -0.36 + gun.kick * 0.07); shotgunModel.rotation.set(gun.kick * 0.12, 0.05, 0);
    const pp = gun.pump > 0 && gun.pump < 0.45 ? Math.sin(((0.45 - gun.pump) / 0.45) * Math.PI) : 0;
    shotgunModel.userData.pump.position.z = -0.3 + pp * 0.12; shotgunModel.userData.flash.visible = gun.flash > 0;
    return;
  }
  if (heldObj === chickenHeld) {
    const c = chickenHeld.userData.c, t = 1.1 - gun.chick;
    let turn = 0; if (gun.chick > 0) { if (t < 0.15) turn = t / 0.15; else if (t < 0.55) turn = 1; else if (t < 0.75) turn = 1 - (t - 0.55) / 0.2; }
    chickenHeld.position.set(0.25 + bx, -0.33 + by, -0.55);
    c.rotation.y = Math.PI + turn * Math.PI; c.rotation.x = gun.chick > 0.6 ? -0.2 : 0;
    const ce = chickenHeld.userData.e; if (ce.wl) { const f = gun.chick > 0 ? Math.sin(clock * 40) * 0.7 : 0; ce.wl.rotation.z = -Math.abs(f); ce.wr.rotation.z = Math.abs(f); }
    return;
  }
  const b = heldObj.userData.base, sw = Math.sin(swing * Math.PI);
  heldObj.position.set(b.p.x + bx - sw * 0.08, b.p.y + by + sw * 0.05, b.p.z - sw * 0.1);
  heldObj.rotation.set(b.r.x - sw * 0.9, b.r.y, b.r.z + sw * 0.3);
  if (!leftDown) swing = Math.max(0, swing - dt * 4); else if (swing >= 1) swing = 0;
}

// ---------- third-person body ----------
const pm = { root: new THREE.Group() };
{
  const R = pm.root;
  pm.body = pivot(R, 0, 0.75, 0); part(pm.body, 0.5, 0.72, 0.26, 0xff4fb3, 0, 0.36, 0);
  pm.head = pivot(pm.body, 0, 0.72, 0); part(pm.head, 0.48, 0.48, 0.48, 0xc4ff99, 0, 0.24, 0);
  part(pm.head, 0.09, 0.09, 0.02, 0x2b1240, -0.11, 0.27, 0.245); part(pm.head, 0.09, 0.09, 0.02, 0x2b1240, 0.11, 0.27, 0.245); part(pm.head, 0.2, 0.04, 0.02, 0x2b1240, 0, 0.12, 0.245);
  pm.al = pivot(pm.body, -0.37, 0.68, 0); part(pm.al, 0.22, 0.72, 0.24, 0xc4ff99, 0, -0.32, 0);
  pm.ar = pivot(pm.body, 0.37, 0.68, 0); part(pm.ar, 0.22, 0.72, 0.24, 0xc4ff99, 0, -0.32, 0);
  pm.ll = pivot(R, -0.13, 0.75, 0); part(pm.ll, 0.24, 0.75, 0.26, 0x8f8cc4, 0, -0.37, 0);
  pm.lr = pivot(R, 0.13, 0.75, 0); part(pm.lr, 0.24, 0.75, 0.26, 0x8f8cc4, 0, -0.37, 0);
  pm.armor = [[], [], [], []];
  const ap = (slot, parent, w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: 0xc9a8f0 })); m.position.set(x, y, z); parent.add(m); pm.armor[slot].push(m); };
  ap(0, pm.head, 0.56, 0.3, 0.56, 0, 0.36, 0); ap(1, pm.body, 0.58, 0.6, 0.34, 0, 0.42, 0); ap(1, pm.al, 0.28, 0.3, 0.3, 0, -0.08, 0); ap(1, pm.ar, 0.28, 0.3, 0.3, 0, -0.08, 0);
  ap(2, pm.ll, 0.3, 0.5, 0.32, 0, -0.25, 0); ap(2, pm.lr, 0.3, 0.5, 0.32, 0, -0.25, 0); ap(3, pm.ll, 0.3, 0.18, 0.34, 0, -0.66, 0.02); ap(3, pm.lr, 0.3, 0.18, 0.34, 0, -0.66, 0.02);
}
pm.root.visible = false; scene.add(pm.root);
const ARMOR_COLOR = { ipod: 0xeeeef3, guymask: 0xc7c7d1 };
function updatePlayerModel() {
  pm.root.visible = (viewMode !== 0 || !!vehicle) && !(vehicle && vehicle.type === "tank");
  if (pm.root.parent !== dim.group) dim.group.add(pm.root);
  if (!pm.root.visible) return;
  pm.root.position.copy(player.pos); if (vehicle) pm.root.position.y += vehicle.type === "heli" ? 0.3 : 0;
  pm.root.rotation.y = player.yaw + Math.PI;
  pm.head.rotation.x = -player.pitch * 0.8;
  const sp = Math.hypot(player.vel.x, player.vel.z), sw = player.onGround && !riding && !vehicle ? Math.sin(bob) * Math.min(1, sp / 4) * 0.8 : 0;
  pm.ll.rotation.x = sw; pm.lr.rotation.x = -sw; pm.al.rotation.x = -sw - (swing > 0 ? Math.sin(swing * Math.PI) * 1.4 : 0); pm.ar.rotation.x = sw;
  if (GUNS[heldId]) { pm.ar.rotation.x = -1.5 - player.pitch; pm.al.rotation.x = -1.4 - player.pitch; }
  if (climbing) { pm.al.rotation.x = pm.ar.rotation.x = -2.6 + Math.sin(clock * 8) * 0.3; }
  const crouch = isCrouch(); pm.body.rotation.x = crouch ? 0.4 : 0; pm.root.position.y -= crouch ? 0.15 : 0;
  if (vehicle) pm.ll.rotation.x = pm.lr.rotation.x = -1.4;
  for (let s = 0; s < 4; s++) { const a = armorSlots[s]; for (const m of pm.armor[s]) { m.visible = !!a; if (a) m.material.color.setHex(ARMOR_COLOR[a.id] || (a.id.startsWith("irun") ? 0xe8e8f0 : 0xc9a8f0)); } }
}

// ---------- toilets / sneakers ----------
let toiletT = 0, toiletKey = "";
function updateToiletAndSneakers(dt) {
  const p = player.pos, bx = Math.floor(p.x), by = Math.floor(p.y - 0.05), bz = Math.floor(p.z);
  if (player.onGround && !vehicle && getB(bx, by, bz) === TOILET) {
    const k = keyOf(bx, by, bz), sp = dim.specials.get(k);
    if (k !== toiletKey) { toiletKey = k; toiletT = 0; }
    if (sp && !((dim.meta.get(k) | 0) & 4)) {
      toiletT += dt; shake = Math.max(shake, 0.004 + toiletT * 0.012);
      if (toiletT >= 2.2) { setPoo(dim, sp, true); sfx.plop(); toast("the toilet shook violently. something is in the bowl now."); toiletT = 0; }
    } else if (toiletT === 0) { toiletT = 0.001; toast("this toilet is already occupied"); }
  } else { toiletKey = ""; toiletT = 0; }
  const s = inv[selected];
  if (s && s.id === "poopy") {
    for (const sp of dim.specials.values()) {
      if (sp.b !== SNEAKERS) continue;
      if (Math.hypot(sp.x + 0.5 - p.x, sp.y + 0.5 - (p.y + 0.9), sp.z + 0.5 - p.z) < 3.2) {
        consumeSelected(1);
        let filled = 0; for (let i = 0; i < 36; i++) if (!inv[i]) { inv[i] = { id: "ipod", n: 64 }; filled++; }
        sfx.fanfare(); renderInv();
        for (let k = 0; k < 20; k++) spawnDebris(sp.x, sp.y, sp.z, pick([0xeeeef3, 0xff2bd6, 0x7fb4ff]), 1, 7);
        sp.spinT = 1.5;
        toast(filled ? "THE SNEAKERS ACCEPT YOUR OFFERING. you received " + filled * 64 + " iPods." : "the sneakers accept your offering, but your pockets are full. tragic.");
        break;
      }
    }
  }
  for (const sp of dim.specials.values()) if (sp.spinT > 0) { sp.spinT -= dt; sp.mesh.rotation.y += dt * 12; if (sp.spinT <= 0) sp.mesh.rotation.y = 0; }
}

// ---------- backrooms travel ----------
function enterBackrooms(px, py, pz) {
  endGrapple(true); if (vehicle) exitVehicle(true); if (riding) setRiding(false);
  if (invOpen) closeUI(true);
  backReturn = new V3(px + 0.5, py + 0.01, pz + 2.5);
  BACK_SEED = (Math.random() * 1e6) | 0;
  let ex, ez; do { ex = 4 + Math.floor(Math.random() * 86); ez = 4 + Math.floor(Math.random() * 88); } while (Math.hypot(ex - 48, ez - 48) < 32);
  BACK_EXIT = { x: ex, z: ez };
  for (const e of ents) if (e.dim === back) removeEnt(e);
  clearDim(back); back.edits.clear(); back.meta.clear();
  ceilingGone = false; bigGuy = null; bossTarget = null; noiseLevel = 0; huntingCount = 0;
  switchDim(back);
  player.pos.set(48.5, 1.01, 48.5); player.vel.set(0, 0, 0); fallPeak = 1; portalCD = 3;
  while (!areaReady(back, 48, 48, 3)) updateChunks(back, 48, 48, 50);
  let n = 0;
  for (let t = 0; t < 200 && n < 3; t++) { const x = 4 + Math.floor(Math.random() * 88), z = 4 + Math.floor(Math.random() * 88); if (Math.hypot(x - 48, z - 48) > 22 && backCell(x, z)) { spawnEnt("guy", x + 0.5, 1.01, z + 0.5); n++; } }
  sfx.humStart();
  toast("you entered the backrooms. it smells like wet carpet. stay quiet: the guys hunt by sound.");
  toast("find the blue exit portal. or break the ceiling, if you are brave.");
}
function exitBackrooms(died) {
  for (const e of ents) if (e.dim === back) removeEnt(e);
  huntingCount = 0; bigGuy = null; bossTarget = null;
  clearDim(back); sfx.humStop();
  switchDim(over);
  if (!died) { player.pos.copy(backReturn || spawn); player.vel.set(0, 0, 0); fallPeak = player.pos.y; portalCD = 4; toast("you made it out. nobody believes you."); }
}
function switchDim(d) {
  dim = d; over.group.visible = d === over; back.group.visible = d === back;
  sunA.visible = sunB.visible = moon.visible = stars.visible = d === over;
  clearFx(); for (const pr of projs) scene.remove(pr.mesh); projs.length = 0;
  crack.visible = false; target = null;
  document.body.classList.toggle("backrooms", d === back);
}

// =====================================================================
// HUD, inventory, recipe book, ESP, drops, saving
// =====================================================================
const toastsEl = $("toasts");
function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; toastsEl.appendChild(t);
  while (toastsEl.children.length > 3) toastsEl.firstChild.remove();
  setTimeout(() => t.remove(), 3200);
}
const trickEl = $("trick");
function trick(msg) { trickEl.textContent = msg; trickEl.classList.add("show"); clearTimeout(trick.t); trick.t = setTimeout(() => trickEl.classList.remove("show"), 900); }
function renderBars() {
  let s = "";
  for (let i = 0; i < 10; i++) { const v = hp - i * 2; s += '<span style="background-image:url(' + (v >= 2 ? HEART_IMG.full : v === 1 ? HEART_IMG.half : HEART_IMG.empty) + ')"></span>'; }
  $("hearts").innerHTML = s;
  const ap = armorPoints(); let a = "";
  if (ap > 0) for (let i = 0; i < 10; i++) { const v = ap - i * 2; a += '<span style="background-image:url(' + (v >= 2 ? ARMOR_IMG.full : v === 1 ? ARMOR_IMG.half : ARMOR_IMG.empty) + ')"></span>'; }
  $("armor-bar").innerHTML = a;
}

// ---------- dropped items ----------
const drops = [], dropTex = {};
function dropItem(id, n, p) {
  if (!n) return;
  const tex = dropTex[id] || (dropTex[id] = (() => { const t = new THREE.CanvasTexture(iconCanvasFor(id)); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; })());
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sp.scale.set(0.45, 0.45, 1);
  const dr = { id, n, pos: p.clone(), vel: new V3(rnd(-2, 2), rnd(3, 5), rnd(-2, 2)), sp, age: 0, d: dim };
  dim.group.add(sp); drops.push(dr);
}
function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    if (d.d !== dim) { if (d.d === back) { back.group.remove(d.sp); drops.splice(i, 1); } continue; }
    d.age += dt; d.vel.y -= 20 * dt; d.vel.x *= Math.exp(-dt * 2); d.vel.z *= Math.exp(-dt * 2);
    const np = d.pos.clone().addScaledVector(d.vel, dt);
    if (blocksMove(getB(Math.floor(np.x), Math.floor(np.y - 0.15), Math.floor(np.z)))) { np.y = Math.floor(np.y - 0.15) + 1.15; d.vel.set(0, 0, 0); np.x = d.pos.x; np.z = d.pos.z; }
    d.pos.copy(np); d.sp.position.set(d.pos.x, d.pos.y + Math.sin(clock * 3 + i) * 0.08, d.pos.z);
    const far = d.pos.y < -30 || d.age > 240;
    if (!far && d.age > 0.5 && d.pos.distanceTo(tmpV.set(player.pos.x, player.pos.y + 0.8, player.pos.z)) < 1.9) { const left = addItem(d.id, d.n); if (left < d.n) sfx.pop(); d.n = left; }
    if (far || d.n <= 0) { d.d.group.remove(d.sp); d.sp.material.dispose(); drops.splice(i, 1); }
  }
}

// ---------- inventory ----------
function roomFor(id, n, from, to) { const max = ITEMS[id].stack; let room = 0; for (let i = from; i < to; i++) { const s = inv[i]; if (!s) room += max; else if (s.id === id) room += max - s.n; } return room >= n; }
function addToRange(id, n, from, to) {
  const max = ITEMS[id].stack;
  for (let i = from; i < to && n; i++) { const s = inv[i]; if (s && s.id === id && s.n < max) { const k = Math.min(n, max - s.n); s.n += k; n -= k; } }
  for (let i = from; i < to && n; i++) if (!inv[i]) { const k = Math.min(n, max); inv[i] = { id, n: k }; n -= k; }
  return n;
}
function addItem(id, n) { const left = addToRange(id, n, 0, 36); renderInv(); worldDirty = true; return left; }
const slotGet = (k, i) => (k === "inv" ? inv[i] : k === "armor" ? armorSlots[i] : craft[i]);
function slotSet(k, i, v) { if (k === "inv") inv[i] = v; else if (k === "armor") armorSlots[i] = v; else craft[i] = v; }
const canPut = (k, i, st) => k !== "armor" || ITEMS[st.id].armor === i || !!ITEMS[st.id].anyArmor;
let splitMode = false;
const CRAFT_LINES = { planks: "Waad Planks: two purples, one dream", book: "Recipe Book! right click it to read", pickaxe: "Waad Pickaxe! rok fears you now", irunpick: "Irun Pickaxe: now Blu Rok fears you too", sword: "Waad Sword. the chikns are nervous", hook: "a pickaxe and a stick became a grappling hook. sure.", rifle: "a grappling hook and a rok became a rifle. we do not ask questions here.", rifle2: "the rifle ate 3 iPods and now shoots 6 bullets at once", rpg: "five iPods became a rocket launcher. Apple did not approve this.", heli: "you built a helicopter out of rocks. right click the ground to park it.", skateboard: "Skateboard! press P to ride", ramp: "ramps! skate up them and fly", glockf: "a flower with a glock. plant it and it guards you.", vine: "vines! you can climb them" };
function consumeCraft() { for (let i = 0; i < 25; i++) if (craft[i]) { craft[i].n--; if (!craft[i].n) craft[i] = null; } }
const craftSeen = {};
function takeOutput(shift) {
  const r = matchRecipe(craft); if (!r) return;
  if (shift) {
    let made = 0;
    for (let g = 0; g < 64; g++) { const r2 = matchRecipe(craft); if (!r2 || r2.id !== r.id || !roomFor(r2.id, r2.n, 0, 36)) break; addToRange(r2.id, r2.n, 0, 36); consumeCraft(); made++; }
    if (!made) return;
  } else {
    if (cursor && (cursor.id !== r.id || cursor.n + r.n > ITEMS[r.id].stack)) return;
    if (cursor) cursor.n += r.n; else cursor = { id: r.id, n: r.n };
    consumeCraft();
  }
  sfx.pop(); worldDirty = true;
  if (CRAFT_LINES[r.id] && !craftSeen[r.id]) { craftSeen[r.id] = 1; toast(CRAFT_LINES[r.id]); }
}
function quickMove(k, i) {
  const s = slotGet(k, i); if (!s) return;
  if (k === "inv") {
    const it = ITEMS[s.id];
    if (it.armor !== undefined && !armorSlots[it.armor]) { armorSlots[it.armor] = s; inv[i] = null; return; }
    if (it.anyArmor) { const f = armorSlots.findIndex((a) => !a); if (f >= 0) { armorSlots[f] = { id: s.id, n: 1 }; s.n--; if (!s.n) inv[i] = null; return; } }
    const [from, to] = i < 9 ? [9, 36] : [0, 9];
    inv[i] = null; const left = addToRange(s.id, s.n, from, to); if (left) inv[i] = { id: s.id, n: left };
  } else { slotSet(k, i, null); const left = addToRange(s.id, s.n, 0, 36); if (left) slotSet(k, i, { id: s.id, n: left }); }
}
function clickSlot(k, i, btn, shift) {
  if (k === "out") { takeOutput(shift); renderInv(); return; }
  const s = slotGet(k, i);
  if (shift && s && !cursor) { quickMove(k, i); renderInv(); renderBars(); return; }
  if (k === "armor" && cursor && canPut(k, i, cursor) && cursor.n > 1 && !s) { slotSet(k, i, { id: cursor.id, n: 1 }); cursor.n--; renderInv(); renderBars(); return; }
  if (btn === 0) {
    if (!cursor) { if (s) { cursor = s; slotSet(k, i, null); } }
    else if (!s) { if (canPut(k, i, cursor)) { slotSet(k, i, cursor); cursor = null; } }
    else if (s.id === cursor.id && k !== "armor") { const max = ITEMS[s.id].stack, kk = Math.min(cursor.n, max - s.n); s.n += kk; cursor.n -= kk; if (!cursor.n) cursor = null; }
    else if (canPut(k, i, cursor) && !(k === "armor" && cursor.n > 1)) { slotSet(k, i, cursor); cursor = s; }
  } else {
    if (!cursor) { if (s) { const h = Math.ceil(s.n / 2); cursor = { id: s.id, n: h }; s.n -= h; if (!s.n) slotSet(k, i, null); } }
    else if (!s) { if (canPut(k, i, cursor)) { slotSet(k, i, { id: cursor.id, n: 1 }); cursor.n--; if (!cursor.n) cursor = null; } }
    else if (s.id === cursor.id && s.n < ITEMS[s.id].stack && k !== "armor") { s.n++; cursor.n--; if (!cursor.n) cursor = null; }
  }
  worldDirty = true; renderInv(); renderBars();
}
function makeSlot(k, i, cls) {
  const el = document.createElement("div");
  el.className = "islot" + (cls ? " " + cls : ""); el.dataset.k = k; el.dataset.i = i;
  el.innerHTML = '<img class="ico" alt="" src=""><span class="cnt"></span>';
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); const btn = e.pointerType === "touch" ? (splitMode ? 2 : 0) : e.button; if (btn !== 0 && btn !== 2) return; clickSlot(k, i, btn, e.shiftKey); });
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  return el;
}
const slotEls = [];
{
  const armorCol = $("armor-col"); for (let i = 0; i < 4; i++) { const e = makeSlot("armor", i); armorCol.appendChild(e); slotEls.push(e); }
  const cg = $("craft-grid"); for (let i = 0; i < 25; i++) { const e = makeSlot("craft", i); cg.appendChild(e); slotEls.push(e); }
  const oe = makeSlot("out", 0, "out"); $("out-wrap").appendChild(oe); slotEls.push(oe);
  const mg = $("main-grid"); for (let i = 9; i < 36; i++) { const e = makeSlot("inv", i); mg.appendChild(e); slotEls.push(e); }
  const hb = $("inv-hotbar"); for (let i = 0; i < 9; i++) { const e = makeSlot("inv", i); hb.appendChild(e); slotEls.push(e); }
}
const hotbarEl = $("hotbar"), hudSlots = [];
for (let i = 0; i < 9; i++) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "hslot"; b.id = "hslot-" + i; b.setAttribute("aria-label", "Hotbar slot " + (i + 1));
  b.innerHTML = '<img class="ico" alt="" src=""><span class="cnt"></span>';
  b.addEventListener("click", (e) => { e.stopPropagation(); select(i); });
  b.addEventListener("mousedown", (e) => e.stopPropagation());
  b.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  hotbarEl.appendChild(b); hudSlots.push(b);
}
function fillSlot(el, st) {
  const img = el.querySelector(".ico"), cnt = el.querySelector(".cnt"), src = st ? iconFor(st.id) : "";
  if (img.getAttribute("src") !== src) img.setAttribute("src", src);
  cnt.textContent = st && st.n > 1 ? st.n : ""; el.title = st ? ITEMS[st.id].name : "";
}
const curEl = $("cursor-stack"); curEl.innerHTML = '<img class="ico" alt="" src=""><span class="cnt"></span>';
function renderInv() {
  hudSlots.forEach((el, i) => { fillSlot(el, inv[i]); el.classList.toggle("sel", i === selected); });
  if (heldId === "rpg") updateAmmoHud();
  if (uiKind !== "inv") return;
  for (const el of slotEls) { const k = el.dataset.k, i = +el.dataset.i; fillSlot(el, k === "out" ? matchRecipe(craft) : slotGet(k, i)); }
  fillSlot(curEl, cursor); curEl.hidden = !cursor;
  const held = inv[selected], atk = held && ITEMS[held.id].dmg ? ITEMS[held.id].dmg : 1;
  $("inv-stats").textContent = "HP " + hp + "/20 · Armor " + armorPoints() + " · Attack " + atk;
  drawPreview();
}
function drawPreview() {
  const c = $("preview"), g = c.getContext("2d"); g.clearRect(0, 0, 16, 32);
  const f = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const col = (s, normal) => { const a = armorSlots[s]; if (!a) return normal; return a.id === "ipod" ? "#eeeef3" : a.id === "guymask" ? "#c7c7d1" : a.id.startsWith("irun") ? "#e8e8f0" : "#c9a8f0"; };
  f("#c4ff99", 4, 0, 8, 8); f("#2b1240", 5, 3, 2, 2); f("#2b1240", 9, 3, 2, 2); f("#2b1240", 6, 6, 4, 1);
  if (armorSlots[0]) { f(col(0), 3, 0, 10, 2); f(col(0), 3, 2, 1, 4); f(col(0), 12, 2, 1, 4); }
  f(col(1, "#ff4fb3"), 4, 8, 8, 12); f("#c4ff99", 0, 8, 4, 12); f("#c4ff99", 12, 8, 4, 12);
  if (armorSlots[1]) { f(col(1), 0, 8, 4, 4); f(col(1), 12, 8, 4, 4); }
  f(col(2, "#8f8cc4"), 4, 20, 8, 10); f(col(3, "#2b1240"), 4, 29, 8, 3);
}
function select(i) { selected = (i + 9) % 9; renderInv(); }
function openUI(kind) {
  if (invOpen || dead) return;
  invOpen = true; uiKind = kind; leftDown = rightDown = false;
  for (const k in keys) keys[k] = false;
  document.body.classList.add("inv-open");
  $(kind === "inv" ? "inv-wrap" : "book-wrap").hidden = false;
  if (document.pointerLockElement) document.exitPointerLock();
  renderInv();
}
const openInv = () => openUI("inv");
const openBook = () => openUI("book");
function closeUI(noRelock) {
  if (!invOpen) return;
  invOpen = false;
  let lost = 0;
  for (let i = 0; i < 25; i++) if (craft[i]) { const left = addToRange(craft[i].id, craft[i].n, 0, 36); if (left) dropItem(craft[i].id, left, eyePos.clone()); lost += left; craft[i] = null; }
  if (cursor) { const left = addToRange(cursor.id, cursor.n, 0, 36); if (left) dropItem(cursor.id, left, eyePos.clone()); cursor = null; }
  $("inv-wrap").hidden = true; $("book-wrap").hidden = true; curEl.hidden = true; uiKind = null;
  document.body.classList.remove("inv-open");
  renderInv(); renderBars();
  if (!noRelock && !dead) resumeGame();
}
function buildBook() {
  const list = $("book-list");
  for (const r of RECIPES) {
    const cells = new Array(25).fill(null);
    if (r.shapeless) r.shapeless.forEach((id, i) => (cells[i] = id));
    else r.shape.forEach((row, y) => row.split("").forEach((ch, x) => { if (ch !== ".") cells[y * 5 + x] = r.key[ch][0]; }));
    const card = document.createElement("div"); card.className = "rec";
    const grid = document.createElement("div"); grid.className = "g";
    for (const id of cells) { const i = document.createElement("i"); if (id) { const im = document.createElement("img"); im.alt = ITEMS[id].name; im.title = ITEMS[id].name; im.src = iconFor(id); i.appendChild(im); } grid.appendChild(i); }
    const out = document.createElement("div"); out.className = "o";
    const im = document.createElement("img"); im.alt = ""; im.src = iconFor(r.out[0]);
    const tx = document.createElement("span"); tx.textContent = ITEMS[r.out[0]].name + (r.out[1] > 1 ? " ×" + r.out[1] : "") + (r.shapeless ? " (any layout)" : "");
    out.append(im, tx); card.append(grid, out); list.appendChild(card);
  }
  const extra = [["Toilet", "trade 1 Cinderelly Ore with a goblin (right click them)"], ["Poopy", "stand on a toilet, then right click it"], ["iPods", "hold Poopy near a Sneakers block"],
    ["Vehicles", "destroy a tank, mech or Clanker and it drops a rideable toy version of itself"], ["Chicken Cannon, Bonk Bat, Hell Sword", "only found in castle chests"], ["Pump Shotgun", "Ditch drops it. Ditch appears when you kill Count."], ["Guy Mask", "beat THE BIG GUY in the backrooms (break the ceiling)"]];
  for (const [n, how] of extra) { const card = document.createElement("div"); card.className = "rec"; const s = document.createElement("span"); s.style.fontSize = "11px"; s.textContent = n + ": " + how; card.appendChild(s); list.appendChild(card); }
}

// ---------- ESP ----------
const espLayer = $("esp"), espTags = [], espBoxes = [];
const espBoxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
for (let i = 0; i < 16; i++) {
  const el = document.createElement("div"); el.className = "esp-tag"; el.hidden = true; espLayer.appendChild(el); espTags.push(el);
  const bx = new THREE.LineSegments(espBoxGeo, new THREE.LineBasicMaterial({ color: 0xff2bd6 })); bx.visible = false; xrayScene.add(bx); espBoxes.push(bx);
}
const projV = new V3();
function updateESP(dt) {
  espT = Math.max(0, espT - (playing && !dead ? dt : 0));
  $("stat-esp").textContent = espT > 0 ? "iPod vision: " + Math.ceil(espT) + "s" : "";
  if (!(espT > 0 && playing)) { for (const t of espTags) t.hidden = true; for (const b of espBoxes) b.visible = false; return; }
  const pois = [];
  if (dim === over) {
    for (const s of structsNear(player.pos.x, player.pos.z, 320)) {
      if (s.kind === "village") pois.push({ p: new V3(s.x + 1, s.base + 1, s.z + 1), s: new V3(2.2, 21, 2.2), label: "Cinderelly village", c: "#ff2bd6", hex: 0xff2bd6 });
      else if (s.kind === "castle") pois.push({ p: new V3(s.x, s.base + 1, s.z), s: new V3(27, 12, 27), label: (s.style === "hell" ? "Hell castle" : "Castle"), c: "#ffd23f", hex: 0xffd23f });
      else pois.push({ p: new V3(s.x + 2, s.base, s.z + 0.5), s: new V3(4, 5, 1), label: "Backrooms portal", c: "#ffe27a", hex: 0xffe27a });
    }
  } else {
    pois.push({ p: new V3(BACK_EXIT.x + 1, 1, BACK_EXIT.z + 0.5), s: new V3(2, 3, 1), label: "EXIT", c: "#7ff0ff", hex: 0x7ff0ff });
    for (const e of ents) if (e.dim === back && !e.dead && e.type === "guy") pois.push({ p: e.pos.clone(), s: new V3(1, 2.7, 1), label: e.hunt ? "guy (hunting)" : "guy", c: "#ff4a4a", hex: 0xff4a4a });
  }
  for (const s of dim.specials.values()) {
    if (s.b === SNEAKERS) pois.push({ p: new V3(s.x + 0.5, s.y, s.z + 0.5), s: new V3(1.1, 1.1, 1.1), label: "Sneakers", c: "#ffd23f", hex: 0xffd23f });
    else if (s.b === TOILET) pois.push({ p: new V3(s.x + 0.5, s.y, s.z + 0.5), s: new V3(1.1, 1.1, 1.1), label: (dim.meta.get(keyOf(s.x, s.y, s.z)) | 0) & 4 ? "Toilet (occupied)" : "Toilet", c: "#7fd4ff", hex: 0x7fd4ff });
    else if (s.b === CHEST || s.b === CHEST_BIG) pois.push({ p: new V3(s.x + 0.5, s.y, s.z + 0.5), s: new V3(1.1, 1.1, 1.1), label: s.b === CHEST_BIG ? "Big chest" : "Chest", c: "#ffb02e", hex: 0xffb02e });
  }
  pois.forEach((q) => (q.d = q.p.distanceTo(player.pos)));
  pois.sort((a, b) => a.d - b.d);
  const W = window.innerWidth, H = window.innerHeight;
  for (let i = 0; i < espTags.length; i++) {
    const q = pois[i], el = espTags[i], bx = espBoxes[i];
    if (!q) { el.hidden = true; bx.visible = false; continue; }
    bx.visible = true; bx.scale.copy(q.s); bx.position.set(q.p.x, q.p.y + q.s.y / 2, q.p.z); bx.material.color.setHex(q.hex);
    projV.set(q.p.x, q.p.y + q.s.y + 0.3, q.p.z).project(camera);
    if (projV.z > 1 || projV.z < -1) { el.hidden = true; continue; }
    el.hidden = false; el.style.left = ((projV.x + 1) / 2) * W + "px"; el.style.top = ((1 - projV.y) / 2) * H + "px";
    el.style.setProperty("--c", q.c); el.textContent = q.label + " · " + Math.round(q.d) + "m";
  }
}

// ---------- HUD bits ----------
function updateHud(dt) {
  const bb = $("boss");
  if (bossTarget && !bossTarget.dead && bossTarget.dim === dim) {
    bb.hidden = false; $("boss-name").textContent = DEF[bossTarget.type].boss || bossTarget.type;
    $("boss-fill").style.width = Math.max(0, (bossTarget.hp / bossTarget.maxHp) * 100).toFixed(1) + "%";
  } else bb.hidden = true;
  const nm = $("noise");
  noiseLevel = Math.max(0, noiseLevel - 14 * dt);
  nm.hidden = dim !== back;
  if (dim === back) { $("noise-fill").style.width = noiseLevel.toFixed(0) + "%"; $("noise-lbl").textContent = huntingCount > 0 ? "a guy is hunting you" : "noise"; nm.classList.toggle("hunted", huntingCount > 0); }
  if (huntingCount > 0 && dim === back) { heartT -= dt; if (heartT <= 0) { heartT = 0.8; sfx.heartbeat(0.8); } }
  const ph = dayPhase(), hours = (ph * 24 + 6) % 24, hh = Math.floor(hours), mm = Math.floor((hours - hh) * 60);
  $("stat-clock").textContent = dim === over ? "Day " + dayNum + " · " + String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + (isNight() ? " · night" : "") + (dayNum % 5 === 4 ? " · Clankers tomorrow" : dayNum % 5 === 0 ? " · Clanker day" : "") : "the backrooms · day ???";
}

// =====================================================================
// saving: private per-person storage in the Claude account, browser storage as the fallback
// =====================================================================
const store = { mode: "none", db: null, uid: null };
async function initStore() {
  try {
    if (window.claude && window.claude.use) {
      const t = new Promise((r) => setTimeout(() => r(null), 8000));
      const db = await Promise.race([window.claude.use("db"), t]);
      const user = db ? await Promise.race([window.claude.use("user"), t]) : null;
      const uid = user ? await Promise.race([user.id(), t]) : null;
      if (db && uid) { store.mode = "cloud"; store.db = db; store.uid = uid; return; }
    }
  } catch (e) {}
  try { localStorage.setItem("daderp.test", "1"); localStorage.removeItem("daderp.test"); store.mode = "local"; } catch (e) { store.mode = "none"; }
}
const coll = () => store.db.collection("data/users/" + store.uid);
async function listWorlds() {
  if (store.mode === "cloud") {
    try { const snap = await coll().where("kind", "==", "world").get(); return snap.docs.map((d) => d.data()).sort((a, b) => (b.played || 0) - (a.played || 0)); } catch (e) { return []; }
  }
  if (store.mode === "local") { try { return JSON.parse(localStorage.getItem("daderp.index") || "[]").sort((a, b) => (b.played || 0) - (a.played || 0)); } catch (e) { return []; } }
  return [];
}
function encodeEdits() {
  const parts = [];
  for (const [k, m] of over.edits) {
    const cx = Math.floor(k / 65536) - 32768, cz = (k % 65536) - 32768;
    const items = []; for (const [i, v] of m) items.push(i.toString(36) + "." + v.toString(36));
    parts.push(cx + "," + cz + ":" + items.join(","));
  }
  return parts.join(";");
}
function decodeEdits(s) {
  over.edits.clear(); if (!s) return;
  for (const part of s.split(";")) {
    const [c, items] = part.split(":"); if (!items) continue;
    const [cx, cz] = c.split(",").map(Number), m = new Map();
    for (const it of items.split(",")) { const [i, v] = it.split("."); m.set(parseInt(i, 36), parseInt(v, 36)); }
    over.edits.set(colKey(cx, cz), m);
  }
}
let world = null, saving = null, lastSave = 0;
function snapshot() {
  const inOver = dim === over, pos = inOver ? player.pos : (backReturn || spawn);
  return {
    v: 4, id: world.id, name: world.name, seed: world.seed, created: world.created, played: Date.now(), day: dayNum, mode: world.mode,
    state: JSON.stringify({ t: dayTime, day: dayNum, pos: [pos.x, pos.y, pos.z], yaw: player.yaw, pitch: player.pitch, hp, inv, armor: armorSlots, sel: selected,
      spawned: [...spawnedStructs], countNight, clankerDay, seen: craftSeen,
      vehicles: ents.filter((e) => e.owned && !e.dead && e.dim === over && e !== vehicle).map((e) => ({ type: e.type, variant: e.variant, x: e.pos.x, y: e.pos.y, z: e.pos.z, yaw: e.yaw })).concat(vehicle && vehicle.dim === over ? [{ type: vehicle.type, variant: vehicle.variant, x: vehicle.pos.x, y: vehicle.pos.y, z: vehicle.pos.z, yaw: vehicle.yaw }] : []) }),
  };
}
function setSaveStatus(t) { const el = $("save-status"); el.textContent = t; el.classList.add("show"); clearTimeout(setSaveStatus.t); setSaveStatus.t = setTimeout(() => el.classList.remove("show"), 1800); }
function saveWorld(reason) {
  if (!world || store.mode === "none") return Promise.resolve(false);
  const job = (saving || Promise.resolve()).then(async () => {
    const snap = snapshot(), edits = encodeEdits();
    const CH = 200000, chunks = [];
    for (let i = 0; i < edits.length; i += CH) chunks.push(edits.slice(i, i + CH));
    snap.parts = chunks.length;
    try {
      if (store.mode === "cloud") {
        const c = coll();
        for (let i = 0; i < chunks.length; i++) await c.doc("w-" + world.id + "-p" + i).set({ kind: "part", world: world.id, s: chunks[i] });
        for (let i = chunks.length; i < (world.parts || 0); i++) await c.doc("w-" + world.id + "-p" + i).delete();
        await c.doc("w-" + world.id).set(Object.assign({ kind: "world" }, snap));
      } else {
        localStorage.setItem("daderp.w." + world.id, JSON.stringify(Object.assign({ edits }, snap)));
        const idx = JSON.parse(localStorage.getItem("daderp.index") || "[]").filter((w) => w.id !== world.id);
        idx.push({ id: world.id, name: world.name, seed: world.seed, created: world.created, played: snap.played, day: snap.day, mode: world.mode });
        localStorage.setItem("daderp.index", JSON.stringify(idx));
      }
      world.parts = chunks.length; worldDirty = false; lastSave = performance.now();
      if (reason !== "auto") setSaveStatus("Saved"); else setSaveStatus("Autosaved");
      return true;
    } catch (e) {
      setSaveStatus(e && e.code === "quota_exceeded" ? "Save failed: storage full" : "Save failed");
      return false;
    }
  });
  saving = job.catch(() => {});
  return job;
}
async function loadWorldData(id) {
  if (store.mode === "cloud") {
    const c = coll(); const main = await c.doc("w-" + id).get(); if (!main.exists) return null;
    const d = Object.assign({}, main.data()); let edits = "";
    for (let i = 0; i < (d.parts || 0); i++) { const p = await c.doc("w-" + id + "-p" + i).get(); if (p.exists) edits += p.data().s; }
    d.edits = edits; return d;
  }
  if (store.mode === "local") { try { return JSON.parse(localStorage.getItem("daderp.w." + id)); } catch (e) { return null; } }
  return null;
}
async function deleteWorldData(w) {
  if (store.mode === "cloud") { const c = coll(); for (let i = 0; i < (w.parts || 0); i++) await c.doc("w-" + w.id + "-p" + i).delete(); await c.doc("w-" + w.id).delete(); }
  else if (store.mode === "local") { try { localStorage.removeItem("daderp.w." + w.id); localStorage.setItem("daderp.index", JSON.stringify(JSON.parse(localStorage.getItem("daderp.index") || "[]").filter((x) => x.id !== w.id))); } catch (e) {} }
}


// =====================================================================
// Minecraft-ish (but wrong) menus, options and the title panorama
// =====================================================================
const SCREENS = ["title-screen", "worlds-screen", "create-screen", "delete-screen", "msg-screen", "options-screen"];
let optionsReturn = "title-screen", selWorld = null, worldCache = [], firstTitle = true;
function showScreen(id) { for (const s of SCREENS) $(s).hidden = s !== id; if (id) { const f = $(id).querySelector("input"); if (f && f.focus && !document.body.classList.contains("touch")) try { f.focus({ preventScroll: true }); } catch (e) {} } }
function hideMenuScreens() { for (const s of SCREENS) $(s).hidden = true; document.body.classList.remove("in-menu"); pano.on = false; }
const SPLASHES = ["Now with ground!", "Count is not your friend!", "MUD!", "Contains iPods!", "Tiger Tonk approved!", "Do not break the ceiling!", "100% Hapi Boi!", "Also try Minecraft!", "The Clankers are coming!", "Ditch's dent is fine!", "Bug Food is technically salad!", "Sneakers accept offerings!", "Cinderelly is eternal!", "Waad is not wood!", "Made of slop!", "Has a 5x5 crafting grid!", "Shredder flowers!", "Bedrok barely exists!", "Not affiliated with anything!", "Hot Wet is lava!", "Kole!", "The guy is listening!"];
const LOGO_COLORS = [["#c4ff99", "#6f9e4c"], ["#d98a58", "#6b3d1e"], ["#b8b5ee", "#5e5b8f"], ["#d9bdf7", "#7e5aaf"], ["#ff7cc8", "#a3266c"], ["#ffe08a", "#a8802a"], ["#7ff0ff", "#2b8fa8"], ["#ff8a6a", "#9e2a1c"], ["#eeeef3", "#7a7a88"], ["#c4ff99", "#6f9e4c"]];
function buildLogo() {
  const el = $("logo"); el.innerHTML = "";
  "DaDerpGame".split("").forEach((ch, i) => {
    const s = document.createElement("span"); s.textContent = ch;
    const [c, d] = LOGO_COLORS[i % LOGO_COLORS.length];
    s.style.setProperty("--c", c); s.style.setProperty("--d", d);
    s.style.setProperty("--r", (Math.random() * 8 - 4).toFixed(1) + "deg"); s.style.setProperty("--y", (Math.random() * 8 - 4).toFixed(0) + "px");
    s.style.setProperty("--dl", (i * -0.23).toFixed(2) + "s");
    el.appendChild(s);
  });
}
function showMenu() {
  inGame = false; playing = false;
  document.body.classList.add("in-menu"); document.body.classList.remove("playing");
  $("card-wrap").hidden = true; $("death-wrap").hidden = true; $("loading").hidden = true;
  $("splash").textContent = firstTitle ? "AI Slop but funni 😂🎉" : pick(SPLASHES.concat(["AI Slop but funni 😂🎉"]));
  firstTitle = false;
  buildLogo();
  showScreen("title-screen");
  startPanorama();
}
// ---------- worlds list ----------
const WORLD_ICONS = ["hapi", "sneakers", "toilet", "ipod", "chikcannon", "waad", "ore", "blu", "heli", "evil", "poopy", "v_sherman"];
async function openWorlds() {
  showScreen("worlds-screen");
  $("store-note").textContent = store.mode === "cloud" ? "Worlds save privately to your Claude account, so they follow you to other devices." : store.mode === "local" ? "Worlds save in this browser. Clearing your browser data deletes them." : "Saving is not available here, so worlds only last until you close the page.";
  $("world-list").innerHTML = '<p class="mc-empty">Loading worlds...</p>';
  worldCache = await listWorlds();
  selWorld = null; renderWorldList();
}
function renderWorldList() {
  const list = $("world-list"), q = ($("world-search").value || "").toLowerCase();
  list.innerHTML = "";
  const ws = worldCache.filter((w) => !q || (w.name || "").toLowerCase().includes(q));
  if (!ws.length) { const p = document.createElement("p"); p.className = "mc-empty"; p.textContent = worldCache.length ? "No worlds match. The search did not help, as promised." : "No worlds yet. Make one. The void is lonely."; list.appendChild(p); }
  for (const w of ws) {
    const b = document.createElement("button"); b.type = "button"; b.className = "mc-entry" + (selWorld && selWorld.id === w.id ? " sel" : ""); b.setAttribute("role", "option");
    const im = document.createElement("img"); im.alt = ""; im.src = iconFor(WORLD_ICONS[Math.abs(w.seed | 0) % WORLD_ICONS.length]);
    const t = document.createElement("div"); t.className = "t";
    const nm = document.createElement("b"); nm.textContent = w.name;
    const l1 = document.createElement("span"); l1.textContent = "Derp-" + String(w.id).slice(-6) + " (" + new Date(w.played || w.created).toLocaleString() + ")";
    const l2 = document.createElement("span"); l2.textContent = (w.mode || "Slurvival") + " Mode, Day " + (w.day || 1) + " · seed " + w.seed;
    t.append(nm, l1, l2); b.append(im, t);
    b.addEventListener("click", () => { selWorld = w; renderWorldList(); updateWorldButtons(); });
    b.addEventListener("dblclick", () => joinWorld(w.id));
    list.appendChild(b);
  }
  updateWorldButtons();
}
function updateWorldButtons() { $("w-play").disabled = !selWorld; $("w-delete").disabled = !selWorld; }
$("world-search").addEventListener("input", renderWorldList);
$("w-play").addEventListener("click", () => { if (selWorld) joinWorld(selWorld.id); });
$("w-new").addEventListener("click", () => { $("new-name").value = ""; $("new-seed").value = ""; showScreen("create-screen"); });
$("w-delete").addEventListener("click", () => { if (!selWorld) return; $("del-name").textContent = selWorld.name; showScreen("delete-screen"); });
$("w-cancel").addEventListener("click", () => showScreen("title-screen"));
$("d-no").addEventListener("click", () => showScreen("worlds-screen"));
$("d-yes").addEventListener("click", async () => { const w = selWorld; $("d-yes").disabled = true; try { await deleteWorldData(w); } catch (e) {} $("d-yes").disabled = false; openWorlds(); });
// ---------- create ----------
const MODES = [["Slurvival", "Gather stuff, craft stuff, get stolen from by a horse."], ["Hardcore (not really)", "Exactly the same as Slurvival, but you feel tougher."], ["Creative (lies)", "You do not get infinite blocks. We lied. It is still Slurvival."], ["Spectator (blinks a lot)", "Still Slurvival. Please blink responsibly."]];
let modeI = 0;
$("c-mode").addEventListener("click", () => { modeI = (modeI + 1) % MODES.length; $("c-mode").textContent = "Game Mode: " + MODES[modeI][0]; $("c-mode-note").textContent = MODES[modeI][1]; });
$("c-cancel").addEventListener("click", () => openWorlds());
// ---------- title buttons ----------
$("m-single").addEventListener("click", () => { audio(); openWorlds(); });
function message(title, text) { $("msg-title").textContent = title; $("msg-text").textContent = text; showScreen("msg-screen"); }
$("m-multi").addEventListener("click", () => message("Play Multiplayer", "There are no other players. There have never been other players. It is just you, and a horse named Count."));
$("m-realms").addEventListener("click", () => message("DaDerp Realms", "Your Realm subscription costs $0.00 per month and gives you absolutely nothing. Thank you for your support."));
$("msg-back").addEventListener("click", () => showScreen("title-screen"));
$("m-quit").addEventListener("click", () => { const b = $("m-quit"); b.querySelector(".main").textContent = "you can't. it's a browser tab."; b.querySelector(".alt").textContent = "you can't. it's a browser tab."; setTimeout(() => { b.querySelector(".main").textContent = "Quit Game"; b.querySelector(".alt").textContent = "don't"; }, 2500); });
$("m-options").addEventListener("click", () => { optionsReturn = "title-screen"; showScreen("options-screen"); });
// ---------- options ----------
const OPT = { rd: window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 3 : 5, fov: 75, mud: 0, music: 0, sens: 1, diff: 1 };
try { Object.assign(OPT, JSON.parse(localStorage.getItem("daderp.opts") || "{}")); } catch (e) {}
const RDS = [2, 3, 4, 5, 6, 8], FOVS = [60, 70, 75, 90, 110], MUDS = ["Yes", "Absolutely", "Maybe", "MUD!"], MUSIC = ["None", "Still None", "(you hum)"];
const SENS = [["Slow", 0.6], ["Normal", 1], ["Fast", 1.6], ["Caffeinated", 2.4]], DIFFS = [["Peaceful-ish", 0.6], ["Derp", 1], ["Derpier", 1.4], ["Derpiest", 2]];
let fovBase = 75, lookSens = 1, diffMul = 1;
function applyOpts() {
  if (!RDS.includes(OPT.rd)) OPT.rd = renderDist;
  renderDist = OPT.rd; over.queueKey = ""; fovBase = OPT.fov; lookSens = SENS[OPT.sens % SENS.length][1]; diffMul = DIFFS[OPT.diff % DIFFS.length][1];
  $("o-rd").textContent = "Render Distance: " + OPT.rd + " chunks";
  $("o-fov").textContent = "FOV: " + (OPT.fov === 110 ? "Quake Pro" : OPT.fov);
  $("o-mud").textContent = "Mud: " + MUDS[OPT.mud % MUDS.length];
  $("o-music").textContent = "Music: " + MUSIC[OPT.music % MUSIC.length];
  $("o-sens").textContent = "Mouse: " + SENS[OPT.sens % SENS.length][0];
  $("o-diff").textContent = "Difficulty: " + DIFFS[OPT.diff % DIFFS.length][0];
  try { localStorage.setItem("daderp.opts", JSON.stringify(OPT)); } catch (e) {}
}
const optNote = (t) => ($("o-note").textContent = t);
$("o-rd").addEventListener("click", () => { OPT.rd = RDS[(RDS.indexOf(OPT.rd) + 1) % RDS.length]; applyOpts(); optNote("Render distance makes far-away things exist. Higher is prettier and slower."); });
$("o-fov").addEventListener("click", () => { OPT.fov = FOVS[(FOVS.indexOf(OPT.fov) + 1) % FOVS.length]; applyOpts(); optNote(OPT.fov === 110 ? "Quake Pro. You can see your own ears." : "How much of the slop you can see at once."); });
$("o-mud").addEventListener("click", () => { OPT.mud++; applyOpts(); optNote("This setting does nothing. Count is still looking for mud."); });
$("o-music").addEventListener("click", () => { OPT.music++; applyOpts(); optNote("We could not afford a composer."); });
$("o-sens").addEventListener("click", () => { OPT.sens++; applyOpts(); optNote("How fast the camera turns when you move the mouse."); });
$("o-diff").addEventListener("click", () => { OPT.diff++; applyOpts(); optNote("Changes how much damage you take. Derp is normal."); });
$("o-done").addEventListener("click", () => { if (optionsReturn === "card-wrap") { $("options-screen").hidden = true; $("card-wrap").hidden = false; } else showScreen(optionsReturn); });
$("p-options").addEventListener("click", (e) => { e.stopPropagation(); optionsReturn = "card-wrap"; $("card-wrap").hidden = true; $("options-screen").hidden = false; });
$("p-controls").addEventListener("click", (e) => { e.stopPropagation(); $("controls-list").hidden = !$("controls-list").hidden; });
$("death-title").addEventListener("click", () => { dead = false; hp = 20; onFire = 0; $("death-wrap").hidden = true; if (dim !== over) exitBackrooms(true); player.pos.copy(spawn); player.vel.set(0, 0, 0); quitToMenu(); });
// ---------- title panorama: a real, slowly turning world behind the menu ----------
const pano = { on: false, yaw: 0 };
function startPanorama() {
  resetWorldState();
  SEED = (Math.random() * 0x7fffffff) | 0;
  HOME_VINE = computeHomeVine();
  switchDim(over);
  dayTime = DAY_LEN * rnd(0.03, 0.42);
  pano.on = true; pano.yaw = Math.random() * Math.PI * 2;
  player.pos.set(8, 99, 8);
}
function panoramaFrame(dt) {
  updateChunks(over, 8, 8, 10);
  if (!reduceMotion) pano.yaw += dt * 0.035;
  camera.position.set(8, 99, 8); eyePos.copy(camera.position);
  camera.rotation.set(-0.12, pano.yaw, 0);
  if (Math.abs(camera.fov - fovBase) > 0.05) { camera.fov = fovBase; camera.updateProjectionMatrix(); }
  environment(dt);
  camera.updateMatrixWorld();
  renderer.clear(); renderer.render(scene, camera);
}
const TIPS = ["Tip: Count is not your friend.", "Tip: crouching stops you from falling off edges. Usually.", "Tip: the guys in the backrooms hunt by sound. Shh.", "Tip: a pickaxe and a stick make a grappling hook, for some reason.", "Tip: eat an iPod to see through walls.", "Tip: every 5 days, the Clankers rise.", "Tip: castles have chests. Chests have Chicken Cannons.", "Tip: Glock Flowers planted close together make a shredder.", "Tip: there is a vine on the edge of the spawn island.", "Tip: Blu Rok needs an Irun Pickaxe."];
applyOpts();

// =====================================================================
// input, world lifecycle, main loop
// =====================================================================
const isTouch = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
if (isTouch) { document.body.classList.add("touch"); lockMode = "touch"; }
const cardWrap = $("card-wrap");
function startPlaying() { playing = true; cardWrap.hidden = true; document.body.classList.add("playing"); }
function pausePlaying() {
  playing = false; cardWrap.hidden = false; leftDown = rightDown = false;
  document.body.classList.remove("playing"); $("play").textContent = "Back to Game"; $("options-screen").hidden = true; $("controls-list").hidden = true;
  for (const k in keys) keys[k] = false;
  if (inGame && worldDirty) saveWorld("pause");
}
function onLockFail() { if (!lockEverWorked) { lockMode = "drag"; startPlaying(); toast("drag to look around, click to break"); } else pausePlaying(); }
function resumeGame() {
  if (!inGame) return;
  if (lockMode !== "lock") { startPlaying(); return; }
  try { const r = canvas.requestPointerLock && canvas.requestPointerLock(); if (r && r.catch) r.catch(onLockFail); if (!canvas.requestPointerLock) onLockFail(); } catch (err) { onLockFail(); }
}
$("play").addEventListener("click", (e) => { e.stopPropagation(); audio(); resumeGame(); });
$("quit").addEventListener("click", (e) => { e.stopPropagation(); quitToMenu(); });
$("respawn-btn").addEventListener("click", () => respawnPlayer());
$("inv-close").addEventListener("click", () => closeUI());
$("book-close").addEventListener("click", () => closeUI());
$("split-btn").addEventListener("click", () => { splitMode = !splitMode; $("split-btn").textContent = "Split: " + (splitMode ? "on" : "off"); $("split-btn").classList.toggle("on", splitMode); });
document.addEventListener("pointermove", (e) => { if (invOpen) { curEl.style.left = e.clientX + "px"; curEl.style.top = e.clientY + "px"; } });
for (const id of ["inv-wrap", "book-wrap"]) $(id).addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === canvas) { lockEverWorked = true; lockMode = "lock"; if (!invOpen && !dead) startPlaying(); }
  else if (lockMode === "lock" && playing && !invOpen && !dead) pausePlaying();
});
document.addEventListener("pointerlockerror", onLockFail);
function look(dx, dy, k) { const z = (gun.ads > 0.5 ? 0.6 : 1) * lookSens; player.yaw -= dx * k * z; player.pitch = clamp(player.pitch - dy * k * z, -1.55, 1.55); }
const drag = { down: false, lx: 0, ly: 0, moved: 0 };
document.addEventListener("mousemove", (e) => {
  if (!playing || invOpen || dead) return;
  if (lockMode === "lock" && document.pointerLockElement === canvas) look(e.movementX, e.movementY, 0.0024);
  else if (lockMode === "drag" && drag.down) { look(e.clientX - drag.lx, e.clientY - drag.ly, 0.005); drag.moved += Math.abs(e.clientX - drag.lx) + Math.abs(e.clientY - drag.ly); drag.lx = e.clientX; drag.ly = e.clientY; }
});
canvas.addEventListener("mousedown", (e) => {
  if (!playing || invOpen || dead || lockMode === "touch") return;
  if (e.button === 0) { leftDown = true; attackCD = Math.min(attackCD, 0); if (!target) swing = 0.01; if (lockMode === "drag") { drag.down = true; drag.lx = e.clientX; drag.ly = e.clientY; drag.moved = 0; } }
  else if (e.button === 2) { rightDown = true; onRightClick(); }
});
window.addEventListener("mouseup", (e) => { if (e.button === 0) { leftDown = false; drag.down = false; } if (e.button === 2) rightDown = false; });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
function cycleView() { viewMode = (viewMode + 1) % 3; toast(["first person", "third person (back)", "third person (front, cursed)"][viewMode]); }
window.addEventListener("keydown", (e) => {
  if (!inGame) return;
  if (e.code === "F5" || e.code === "Tab") e.preventDefault();
  if (e.code === "KeyE" && playing && !dead) { e.preventDefault(); if (invOpen) closeUI(); else openInv(); return; }
  if (e.code === "Escape" && invOpen) { closeUI(); return; }
  if (invOpen || dead) return;
  if (!e.repeat && (e.code === "F5" || e.code === "KeyV") && playing) cycleView();
  if (!e.repeat && e.code === "KeyP" && playing && !vehicle) setRiding(!riding);
  keys[e.code] = true;
  if (e.code.startsWith("Digit")) { const n = +e.code.slice(5); if (n >= 1 && n <= 9) select(n - 1); }
  if (e.code === "KeyR") startReload();
  if (e.code === "Space" && grapple.state === "pull") endGrapple();
  if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
  if (e.code === "Escape" && lockMode === "drag" && playing) pausePlaying();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; if (e.code === "F5" || e.code === "Tab") e.preventDefault(); });
window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; leftDown = rightDown = false; });
window.addEventListener("wheel", (e) => { if (playing && !invOpen) select(selected + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });
document.addEventListener("visibilitychange", () => { if (document.hidden && inGame && worldDirty) saveWorld("auto"); });

const stick = $("stick"), knob = $("knob");
let stickId = null, lookId = null, lookLast = null;
stick.addEventListener("touchstart", (e) => { e.preventDefault(); stickId = e.changedTouches[0].identifier; updStick(e.changedTouches[0]); }, { passive: false });
function updStick(t) { const r = stick.getBoundingClientRect(); let dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } move.x = dx; move.z = dy; knob.style.transform = "translate(" + dx * 35 + "px," + dy * 35 + "px)"; }
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); if (lookId === null) { const t = e.changedTouches[0]; lookId = t.identifier; lookLast = [t.clientX, t.clientY]; } }, { passive: false });
window.addEventListener("touchmove", (e) => { for (const t of e.changedTouches) { if (t.identifier === stickId) updStick(t); else if (t.identifier === lookId && playing && !invOpen) { look(t.clientX - lookLast[0], t.clientY - lookLast[1], 0.006); lookLast = [t.clientX, t.clientY]; } } }, { passive: true });
window.addEventListener("touchend", (e) => { for (const t of e.changedTouches) { if (t.identifier === stickId) { stickId = null; move.x = move.z = 0; knob.style.transform = ""; } if (t.identifier === lookId) lookId = null; } });
const tb = (id, down, up) => {
  const el = $(id);
  el.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); down(); }, { passive: false });
  if (up) el.addEventListener("touchend", (e) => { e.preventDefault(); up(); }, { passive: false });
};
tb("t-break", () => { leftDown = true; }, () => { leftDown = false; });
tb("t-use", () => { rightDown = true; onRightClick(); }, () => { rightDown = false; });
tb("t-jump", () => { if (grapple.state === "pull") endGrapple(); else jumpQueued = true; touchUp = true; }, () => { touchUp = false; });
tb("t-bag", () => openInv());
tb("t-crouch", () => { touchCrouch = !touchCrouch; $("t-crouch").textContent = touchCrouch ? "Stand" : "Crouch"; });
tb("t-skate", () => { if (!vehicle) setRiding(!riding); });
tb("t-view", () => cycleView());
tb("t-pause", () => pausePlaying());

// ---------- world lifecycle ----------
function resetWorldState() {
  for (const e of ents) removeEnt(e); ents.length = 0;
  for (const d of drops) d.d.group.remove(d.sp); drops.length = 0;
  for (const pr of projs) scene.remove(pr.mesh); projs.length = 0;
  if (vehicle) exitVehicle(true); vehicle = null; if (riding) setRiding(false); endGrapple(true);
  clearDim(over); clearDim(back); over.meta.clear(); back.meta.clear(); over.edits.clear(); back.edits.clear();
  structCache.clear(); spawnedStructs.clear(); infoCache.clear();
  inv.fill(null); armorSlots.fill(null); craft.fill(null); cursor = null; selected = 0;
  hp = 20; dead = false; onFire = 0; espT = 0; bossTarget = null; bigGuy = null; ceilingGone = false; huntingCount = 0; noiseLevel = 0;
  dayTime = DAY_LEN * 0.08; dayNum = 1; countNight = -1; clankerDay = -1; viewMode = 0; backReturn = null; score = 0;
  for (const k in craftSeen) delete craftSeen[k];
  sfx.humStop();
}
function startWorld(data) {
  hideMenuScreens();
  resetWorldState();
  world = { id: data.id, name: data.name, seed: data.seed, created: data.created, parts: data.parts || 0, mode: data.mode || "Slurvival" };
  SEED = data.seed | 0;
  HOME_VINE = computeHomeVine();
  decodeEdits(data.edits || "");
  switchDim(over);
  let st = null; try { st = data.state ? JSON.parse(data.state) : null; } catch (e) { st = null; }
  $("loading").hidden = false; $("loading-msg").textContent = "Growing the islands…"; $("loading-fill").style.width = "0%"; $("loading-tip").textContent = pick(TIPS);
  while (!areaReady(over, 8, 8, 1)) updateChunks(over, 8, 8, 200);
  let sy = topSolid(over, 8, 8, 100); let sx = 8, sz = 8;
  for (let r = 0; r < 6 && !(sy > 60 && getB(sx, sy + 1, sz) === AIR && getB(sx, sy + 2, sz) === AIR && blocksMove(getB(sx, sy, sz))); r++) { sx = 8 + r; sz = 8 - r; sy = topSolid(over, sx, sz, 100); }
  spawn.set(sx + 0.5, sy + 1.01, sz + 0.5);
  if (st) {
    dayTime = st.t || dayTime; dayNum = st.day || 1;
    player.pos.set(st.pos[0], st.pos[1], st.pos[2]); player.yaw = st.yaw || 0; player.pitch = st.pitch || 0; hp = st.hp || 20;
    (st.inv || []).forEach((s, i) => (inv[i] = s && ITEMS[s.id] ? { id: s.id, n: s.n } : null));
    (st.armor || []).forEach((s, i) => (armorSlots[i] = s && ITEMS[s.id] ? { id: s.id, n: 1 } : null));
    selected = st.sel || 0; (st.spawned || []).forEach((s) => spawnedStructs.add(s));
    countNight = st.countNight ?? -1; clankerDay = st.clankerDay ?? -1; Object.assign(craftSeen, st.seen || {});
  } else { player.pos.copy(spawn); player.yaw = Math.PI * 0.75; player.pitch = -0.1; }
  player.vel.set(0, 0, 0); fallPeak = player.pos.y;
  const px = player.pos.x, pz = player.pos.z, need = Math.min(3, renderDist);
  const t0 = performance.now();
  const step = () => {
    for (let i = 0; i < 4; i++) updateChunks(over, px, pz, 40);
    const tot = (2 * need + 1) ** 2; let done = 0;
    const pcx = Math.floor(px / 16), pcz = Math.floor(pz / 16);
    for (let dz = -need; dz <= need; dz++) for (let dx = -need; dx <= need; dx++) { const c = over.cols.get(colKey(pcx + dx, pcz + dz)); if (c && c.meshed) done++; }
    $("loading-msg").textContent = "Generating terrain… " + Math.round((done / tot) * 100) + "%"; $("loading-fill").style.width = Math.round((done / tot) * 100) + "%";
    if (done < tot && performance.now() - t0 < 30000) { requestAnimationFrame(step); return; }
    if (st && st.vehicles) for (const v of st.vehicles) spawnEnt(v.type, v.x, v.y, v.z, { owned: true, variant: v.variant, yaw: v.yaw });
    while (collides(player.pos) && player.pos.y < 126) player.pos.y += 1;
    $("loading").hidden = true;
    inGame = true; setHeld(null); renderInv(); renderBars();
    $("world-title").textContent = world.name;
    $("play").textContent = st ? "Back to Game" : "Start Derping";
    cardWrap.hidden = false;
    if (!st) { toast("you spawned on a floating island. there is a vine on its edge going down."); saveWorld("first"); }
  };
  requestAnimationFrame(step);
}
function createWorld() {
  const name = ($("new-name").value || "").trim() || "Slop World " + Math.floor(Math.random() * 900 + 100);
  const sraw = ($("new-seed").value || "").trim();
  const seed = sraw ? (/^-?\d+$/.test(sraw) ? parseInt(sraw, 10) | 0 : strHash(sraw) | 0) : (Math.random() * 0x7fffffff) | 0;
  const id = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  audio();
  startWorld({ id, name, seed, created: Date.now(), parts: 0, edits: "", state: null, mode: MODES[modeI][0] });
}
$("create").addEventListener("click", createWorld);
$("new-name").addEventListener("keydown", (e) => { if (e.key === "Enter") createWorld(); });
async function joinWorld(id) {
  audio();
  for (const s of SCREENS) $(s).hidden = true; $("loading").hidden = false; $("loading-msg").textContent = "Loading your world…"; $("loading-fill").style.width = "0%"; $("loading-tip").textContent = pick(TIPS);
  let data = null; try { data = await loadWorldData(id); } catch (e) { data = null; }
  if (!data) { $("loading").hidden = true; showMenu(); toast("could not load that world"); return; }
  startWorld(data);
}
async function quitToMenu() {
  $("quit").disabled = true; $("quit").textContent = "Saving…";
  await saveWorld("quit");
  $("quit").disabled = false; $("quit").textContent = "Save and Quit to Title";
  inGame = false; playing = false;
  if (document.pointerLockElement) document.exitPointerLock();
  resetWorldState(); world = null;
  showMenu();
}

// ---------- main loop ----------
const statPos = $("stat-pos"), statLook = $("stat-look"), crossEl = $("crosshair"), hintEl = $("hint");
let last = performance.now(), villageT = 0;
const camOff = new V3(), tmpCol = new THREE.Color();
function environment(dt) {
  if (dim === over) {
    if (playing && !dead) { dayTime += dt; if (dayTime >= DAY_LEN) { dayTime -= DAY_LEN; dayNum++; toast("Day " + dayNum + (dayNum % 5 === 0 ? ". the ground is rumbling..." : "")); worldDirty = true; } }
    const elev = sunElev(), day = smooth(-0.12, 0.2, elev);
    const under = player.pos.y < 70 && eyePos.y < (getCol(over, Math.floor(player.pos.x) >> 4, Math.floor(player.pos.z) >> 4)?.top[(Math.floor(player.pos.z) & 15) * 16 + (Math.floor(player.pos.x) & 15)] ?? 0) - 3;
    tmpCol.copy(SKY_NIGHT).lerp(SKY_DAY, day);
    if (under) tmpCol.multiplyScalar(0.35);
    scene.background.copy(tmpCol); scene.fog.color.copy(tmpCol);
    const R = renderDist * 16; scene.fog.near = under ? 8 : R * 0.45; scene.fog.far = under ? 42 : R * 1.05;
    const L = 0.3 + 0.7 * day;
    MAT.world.color.setScalar(L); MAT.cross.color.setScalar(L); MAT.water.color.setScalar(L); rampMat.color.setScalar(L);
    amb.intensity = 0.25 + 0.35 * day; sunL.intensity = 0.2 + 0.55 * day;
    const ang = dayPhase() * Math.PI * 2;
    const sd = new V3(Math.cos(ang) * 0.75, Math.sin(ang), -0.45).normalize();
    sunA.position.copy(camera.position).addScaledVector(sd, 420); sunA.lookAt(camera.position);
    sunB.position.copy(camera.position).addScaledVector(new V3(sd.x + 0.35, sd.y + 0.12, sd.z - 0.2).normalize(), 410); sunB.lookAt(camera.position);
    moon.position.copy(camera.position).addScaledVector(sd.clone().negate(), 420); moon.lookAt(camera.position);
    if (!reduceMotion) { sunA.rotateZ(clock * 0.2); sunB.rotateZ(-clock * 0.7); }
    stars.position.copy(camera.position); stars.material.opacity = 1 - day;
  } else {
    const c = ceilingGone ? BOSS_FOG : BACK_FOG;
    scene.background.copy(c); scene.fog.color.copy(c);
    scene.fog.near = ceilingGone ? 10 : 3; scene.fog.far = ceilingGone ? 110 : 24;
    MAT.world.color.setScalar(ceilingGone ? 0.75 : 1); MAT.cross.color.setScalar(1); MAT.water.color.setScalar(1); rampMat.color.setScalar(1);
    amb.intensity = 0.55; sunL.intensity = 0.6;
  }
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; clock += dt;
  if (!inGame) { if (pano.on) panoramaFrame(dt); else renderer.clear(); return; }
  const held = inv[selected], hid = held ? held.id : null;
  if (hid !== heldId) setHeld(hid);
  if (riding && !inv.some((s) => s && s.id === "skateboard")) setRiding(false);
  updateChunks(dim, player.pos.x, player.pos.z, 6);
  const active = playing && !dead;
  const crouch = isCrouch();
  eyeH += ((crouch ? 1.32 : 1.62) - eyeH) * Math.min(1, dt * 12);
  lookDir.set(-Math.sin(player.yaw) * Math.cos(player.pitch), Math.sin(player.pitch), -Math.cos(player.yaw) * Math.cos(player.pitch));
  if (active) {
    portalCD = Math.max(0, portalCD - dt);
    physics(dt);
    eyePos.set(player.pos.x, player.pos.y + eyeH, player.pos.z);
    updateGrapple(dt);
    const free = !invOpen;
    if (free) updateMining(dt, held && ITEMS[held.id]);
    updateGun(dt, free);
    updateEnts(dt);
    updateProjs(dt);
    updateToiletAndSneakers(dt);
    updateGlockFlowers(dt);
    updateSpawning(dt);
    villageT -= dt; if (villageT <= 0) { villageT = 1; spawnVillagers(); }
    if (hp < 20 && !dead && clock - lastHurt > 6) { regenAcc += dt; if (regenAcc > 2.5) { regenAcc = 0; hp++; renderBars(); } }
    if (world && performance.now() - lastSave > 45000) { lastSave = performance.now(); saveWorld("auto"); }
  }
  eyePos.set(player.pos.x, player.pos.y + eyeH, player.pos.z);
  updateDrops(dt); updateDebris(dt); updateTracers(dt); updateBooms(dt);
  const moving = player.onGround && Math.hypot(player.vel.x, player.vel.z) > 0.5 && !riding;
  animateHeld(dt, moving && active);
  updatePlayerModel();
  if (riding) { if (board.parent !== dim.group) dim.group.add(board); board.position.set(player.pos.x, player.pos.y - 0.02, player.pos.z); board.rotation.set(0, player.yaw, 0); }

  shake *= Math.exp(-dt * 8);
  const sh = () => (Math.random() - 0.5) * shake;
  if (vehicle) {
    const dist = vehicle.type === "clanker" ? 11 : vehicle.type === "mech" ? 7 : vehicle.type === "tank" ? 8 + TANKS[vehicle.variant].scale * 2 : 9;
    const focus = vehicle.pos.clone(); focus.y += vehicle.h + 0.8;
    let d = dist;
    for (let s = 0.5; s <= dist; s += 0.5) { camOff.copy(focus).addScaledVector(lookDir, -s); if (blocksMove(getB(Math.floor(camOff.x), Math.floor(camOff.y), Math.floor(camOff.z)))) { d = Math.max(1, s - 0.5); break; } }
    camera.position.copy(focus).addScaledVector(lookDir, -d);
    camera.rotation.set(player.pitch + sh(), player.yaw + sh(), sh());
  } else if (viewMode === 0) { camera.position.copy(eyePos); camera.rotation.set(player.pitch + sh(), player.yaw + sh(), sh()); }
  else {
    const dist = 4.2, sign = viewMode === 1 ? -1 : 1;
    let d = dist;
    for (let s = 0.2; s <= dist; s += 0.2) { camOff.copy(eyePos).addScaledVector(lookDir, sign * s); if (getB(Math.floor(camOff.x), Math.floor(camOff.y), Math.floor(camOff.z)) !== AIR) { d = Math.max(0.3, s - 0.3); break; } }
    camera.position.copy(eyePos).addScaledVector(lookDir, sign * d);
    if (viewMode === 1) camera.rotation.set(player.pitch + sh(), player.yaw + sh(), sh());
    else camera.rotation.set(-player.pitch + sh(), player.yaw + Math.PI + sh(), sh());
  }
  const fovT = fovBase - gun.ads * 22 + (keys.Tab && !riding && !vehicle ? 6 : 0) + (grapple.state === "pull" ? 10 : 0) + (riding ? Math.min(10, Math.hypot(player.vel.x, player.vel.z) * 0.6) : 0) + (vehicle && vehicle.type === "clanker" ? Math.min(14, (vehicle.throttle || 0) * 0.4) : 0);
  if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov += (fovT - camera.fov) * Math.min(1, dt * 10); camera.updateProjectionMatrix(); }
  crossEl.style.visibility = gun.ads > 0.5 ? "hidden" : "visible";
  environment(dt);
  camera.updateMatrixWorld();
  target = vehicle ? null : raycastFrom(eyePos, lookDir, 5.5);
  entTarget = rayEnts(eyePos, lookDir, 6, null);
  if (target) { highlight.visible = true; highlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5); } else highlight.visible = false;
  if (highlight.parent !== scene) scene.add(highlight);
  let hint = "";
  if (vehicle) hint = "right click: get out" + (vehicle.type !== "heli" ? " · hp " + Math.max(0, Math.ceil(vehicle.hp)) : "");
  else if (entTarget && entTarget.t < 4.5 && (!target || entTarget.t < target.t)) {
    const e = entTarget.e, t = e.type;
    if (e.owned) hint = "right click: get in · shift + right click: pick up";
    else hint = t === "goblin" ? (held && held.id === "ore" ? "right click: trade ore for a toilet" : "goblin (wants Cinderelly Ore)") : t === "tank" ? TANKS[e.variant].name + " · " + Math.max(0, Math.ceil(e.hp)) + " hp" : t === "chikn" ? "chikn" : t + " · " + Math.max(0, Math.ceil(e.hp)) + " hp";
  } else if (target) {
    const b = getB(target.x, target.y, target.z);
    if (b === TOILET && (dim.meta.get(keyOf(target.x, target.y, target.z)) | 0) & 4) hint = "right click: take it out";
    else if (b === CHEST || b === CHEST_BIG) hint = "right click: open " + BLOCK_NAME[b].toLowerCase();
    else if ((b === CEIL || b === LIGHT) && dim === back && !ceilingGone) hint = "break the ceiling? (starts a boss fight)";
  }
  if (hintEl.textContent !== hint) hintEl.textContent = hint;
  updateESP(dt); updateHud(dt);
  if ((clock * 10 | 0) % 2 === 0) {
    const p = player.pos;
    statPos.textContent = "x " + p.x.toFixed(0) + " · y " + p.y.toFixed(0) + " · z " + p.z.toFixed(0) + (dim === over ? " · " + BIOME_NAME[colInfo(Math.floor(p.x), Math.floor(p.z)).biome] : "");
    statLook.textContent = "looking at: " + (target ? BLOCK_NAME[getB(target.x, target.y, target.z)] : "the void");
  }
  renderer.clear();
  renderer.render(scene, camera);
  renderer.clearDepth(); renderer.render(xrayScene, camera);
  if (heldRoot.visible) { renderer.clearDepth(); renderer.render(viewScene, viewCam); }
}
buildBook();
renderBars();
requestAnimationFrame(frame);
document.body.classList.add("in-menu"); buildLogo(); showScreen("title-screen");
initStore().then(showMenu);

})();
