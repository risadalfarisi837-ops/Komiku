import { RATES, RARITIES, type Rarity } from './wallpapers';

export interface BgItem { nama: string; rarity: Rarity; css: string; anim?: boolean }

const star = (x: number, y: number, s = 1.4, c = '#fff') => `radial-gradient(${s}px ${s}px at ${x}% ${y}%, ${c}, transparent)`;
const sky = (pts: [number, number, number?][]) => pts.map((p) => star(p[0], p[1], p[2] || 1.4)).join(',');
const S1: [number, number, number?][] = [[8, 12], [22, 38, 1.8], [35, 8], [48, 26, 1.2], [61, 14, 2], [74, 36], [88, 10, 1.6], [93, 48], [14, 62, 1.2], [42, 55], [67, 68, 1.6], [84, 78], [28, 84, 1.4], [55, 90]];
const S2: [number, number, number?][] = [...S1, [5, 30, 1.2], [18, 22], [30, 70, 1.8], [52, 40, 1.2], [70, 22, 1.4], [80, 58], [96, 28, 1.2], [10, 88], [60, 80, 1.8], [38, 18, 1.2]];

export const BG_CATALOG: Record<string, BgItem> = {
  // Normal
  'senja-jingga':  { nama: 'Senja Jingga',  rarity: 'Normal', css: 'linear-gradient(180deg,#2d1b4e 0%,#b5476b 55%,#ffb36b 100%)' },
  'malam-biru':    { nama: 'Malam Biru',    rarity: 'Normal', css: sky(S1) + ',linear-gradient(180deg,#050a24,#1d3a73)' },
  'hutan-lumut':   { nama: 'Hutan Lumut',   rarity: 'Normal', css: 'radial-gradient(120% 80% at 50% 110%,#3f8f5a,transparent 60%),linear-gradient(180deg,#0e2a26,#1c4f44)' },
  'ungu-halus':    { nama: 'Ungu Halus',    rarity: 'Normal', css: 'linear-gradient(135deg,#2b1a5e,#6d3fb5 60%,#c58bd9)' },
  // Rare
  'aurora':        { nama: 'Aurora',        rarity: 'Rare', css: 'radial-gradient(60% 40% at 30% 45%,rgba(52,211,153,.55),transparent 70%),radial-gradient(50% 35% at 70% 35%,rgba(34,211,238,.5),transparent 70%),' + sky(S1) + ',linear-gradient(180deg,#030a1c,#0b2a3f)' },
  'kota-neon':     { nama: 'Kota Neon',     rarity: 'Rare', css: 'radial-gradient(80% 50% at 50% 100%,rgba(236,72,153,.7),transparent 70%),radial-gradient(60% 40% at 15% 90%,rgba(34,211,238,.5),transparent 70%),linear-gradient(180deg,#0a0620,#2a0f4a)' },
  'samudra-dalam': { nama: 'Samudra Dalam', rarity: 'Rare', css: 'radial-gradient(70% 45% at 50% 0%,rgba(125,211,252,.45),transparent 70%),linear-gradient(180deg,#0b5a8c,#052a52 60%,#020d24)' },
  'sakura-muda':   { nama: 'Sakura Muda',   rarity: 'Rare', css: 'radial-gradient(40% 30% at 20% 30%,rgba(255,214,232,.55),transparent 70%),radial-gradient(35% 28% at 80% 55%,rgba(255,182,213,.45),transparent 70%),linear-gradient(180deg,#5b2a5e,#c0558a 60%,#f7a8c4)' },
  // Epic
  'nebula-ungu':   { nama: 'Nebula Ungu',   rarity: 'Epic', css: 'radial-gradient(55% 40% at 25% 35%,rgba(168,85,247,.6),transparent 70%),radial-gradient(50% 35% at 75% 60%,rgba(236,72,153,.5),transparent 70%),radial-gradient(40% 30% at 55% 15%,rgba(59,130,246,.45),transparent 70%),' + sky(S2) + ',linear-gradient(180deg,#05020e,#1b0b3a)' },
  'matahari-terbenam': { nama: 'Matahari Terbenam', rarity: 'Epic', css: 'radial-gradient(45% 30% at 50% 78%,#fff3b0,#ff9f43 40%,transparent 75%),linear-gradient(180deg,#1b1240,#8a2f7a 45%,#ff7a59 80%,#ffc46b)' },
  'badai-petir':   { nama: 'Badai Petir',   rarity: 'Epic', css: 'linear-gradient(115deg,transparent 45%,rgba(186,230,253,.95) 46.5%,transparent 48%),radial-gradient(60% 40% at 70% 20%,rgba(125,211,252,.35),transparent 70%),linear-gradient(180deg,#0a0f1f,#1f2a44 60%,#0b1020)' },
  // Legendary (bergerak)
  'galaksi-emas':  { nama: 'Galaksi Emas',  rarity: 'Legendary', anim: true, css: 'radial-gradient(70% 40% at 50% 30%,rgba(251,191,36,.55),transparent 70%),radial-gradient(50% 35% at 20% 60%,rgba(168,85,247,.5),transparent 70%),' + sky(S2) + ',linear-gradient(180deg,#02010a,#1a0b3d)' },
  'fajar-kosmik':  { nama: 'Fajar Kosmik',  rarity: 'Legendary', anim: true, css: 'radial-gradient(60% 40% at 30% 40%,rgba(45,212,191,.6),transparent 70%),radial-gradient(55% 40% at 75% 50%,rgba(244,114,182,.55),transparent 70%),radial-gradient(45% 25% at 50% 95%,rgba(251,191,36,.6),transparent 70%),' + sky(S2) + ',linear-gradient(180deg,#040818,#10244a)' },
  'bulan-darah':   { nama: 'Bulan Darah',   rarity: 'Legendary', anim: true, css: 'radial-gradient(14% 10% at 70% 22%,#ffd6d6,#e11d48 55%,transparent 72%),radial-gradient(70% 45% at 70% 22%,rgba(225,29,72,.45),transparent 70%),' + sky(S1) + ',linear-gradient(180deg,#0a0108,#3b0a1a)' },
};

export const bgKeysOf = (r: Rarity) => Object.keys(BG_CATALOG).filter((k) => BG_CATALOG[k].rarity === r);

function rollOne(minRank = 0): string {
  let r = Math.random() * 100, pick: Rarity = 'Normal';
  for (const x of RARITIES) { r -= RATES[x]; if (r < 0) { pick = x; break; } }
  if (RARITIES.indexOf(pick) < minRank) pick = RARITIES[minRank];
  const keys = bgKeysOf(pick);
  return keys[Math.floor(Math.random() * keys.length)];
}
// Summon 10x dijamin minimal 1 Rare
export function rollBg(n: number): string[] {
  const out = Array.from({ length: n }, () => rollOne());
  if (n >= 10 && !out.some((k) => RARITIES.indexOf(BG_CATALOG[k].rarity) >= 1)) out[out.length - 1] = rollOne(1);
  return out;
}
