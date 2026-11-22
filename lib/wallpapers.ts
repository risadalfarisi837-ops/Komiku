import type { EffectItem } from './effects';

export type Rarity = 'Normal' | 'Rare' | 'Epic' | 'Legendary';

export interface WallpaperItem {
  nama: string;
  rarity: Rarity;
  grad: string;   // background gradient (dipakai kalau url kosong)
  url?: string;   // opsional: gambar sendiri, taruh di /public/wallpapers/xxx.jpg lalu isi '/wallpapers/xxx.jpg'
}

export const COST_1 = 100;
export const COST_10 = 1000;
export const RARITIES: Rarity[] = ['Normal', 'Rare', 'Epic', 'Legendary'];
export const RATES: Record<Rarity, number> = { Normal: 70, Rare: 22, Epic: 7, Legendary: 1 }; // persen

export const RARITY_STYLE: Record<Rarity, { color: string; border: string; glow: string; shimmer: boolean; pulse: boolean; sparkle?: EffectItem }> = {
  Normal:    { color: '#cbd5e1', border: 'rgba(255,255,255,.10)', glow: 'none', shimmer: false, pulse: false },
  Rare:      { color: '#38bdf8', border: '#38bdf8', glow: '0 0 12px rgba(56,189,248,.35)', shimmer: false, pulse: false },
  Epic:      { color: '#c084fc', border: '#a855f7', glow: '0 0 16px rgba(168,85,247,.45)', shimmer: true, pulse: false },
  Legendary: { color: '#fcd34d', border: '#fbbf24', glow: '0 0 20px rgba(251,191,36,.55)', shimmer: true, pulse: true,
    sparkle: { nama: '', harga: 0, tier: 'Premium', kind: 'sparkle', color: '#fde68a', color2: '#fbbf24' } },
};

export const WALLPAPER_CATALOG: Record<string, WallpaperItem> = {
  'senja':        { nama: 'Senja',          rarity: 'Normal', grad: 'linear-gradient(135deg,#f97316,#9d174d)' },
  'laut-dalam':   { nama: 'Laut Dalam',     rarity: 'Normal', grad: 'linear-gradient(135deg,#0c4a6e,#1e3a8a)' },
  'hutan-malam':  { nama: 'Hutan Malam',    rarity: 'Normal', grad: 'linear-gradient(135deg,#064e3b,#0f172a)' },
  'pasir':        { nama: 'Pasir Gurun',    rarity: 'Normal', grad: 'linear-gradient(135deg,#b45309,#78350f)' },
  'kabut':        { nama: 'Kabut Pagi',     rarity: 'Normal', grad: 'linear-gradient(135deg,#64748b,#334155)' },
  'lavender':     { nama: 'Lavender',       rarity: 'Normal', grad: 'linear-gradient(135deg,#7c3aed,#4c1d95)' },
  'aurora':       { nama: 'Aurora',         rarity: 'Rare',   grad: 'linear-gradient(135deg,#059669,#0ea5e9 55%,#7c3aed)' },
  'sakura-malam': { nama: 'Sakura Malam',   rarity: 'Rare',   grad: 'linear-gradient(135deg,#be185d,#1e1b4b)' },
  'neon-kota':    { nama: 'Neon Kota',      rarity: 'Rare',   grad: 'linear-gradient(135deg,#06b6d4,#a21caf)' },
  'samudra-biru': { nama: 'Samudra Biru',   rarity: 'Rare',   grad: 'linear-gradient(135deg,#1d4ed8,#0e7490)' },
  'galaxy-ungu':  { nama: 'Galaxy Ungu',    rarity: 'Epic',   grad: 'radial-gradient(circle at 30% 25%,#c084fc,transparent 45%),radial-gradient(circle at 75% 70%,#6366f1,transparent 50%),#1e1b4b' },
  'lava-core':    { nama: 'Lava Core',      rarity: 'Epic',   grad: 'radial-gradient(circle at 70% 30%,#fb923c,transparent 45%),radial-gradient(circle at 25% 75%,#dc2626,transparent 50%),#450a0a' },
  'cyber-grid':   { nama: 'Cyber Grid',     rarity: 'Epic',   grad: 'radial-gradient(circle at 20% 20%,#22d3ee,transparent 40%),radial-gradient(circle at 80% 80%,#e879f9,transparent 45%),#0f172a' },
  'dewa-emas':    { nama: 'Dewa Emas',      rarity: 'Legendary', grad: 'radial-gradient(circle at 50% 20%,#fde68a,transparent 50%),linear-gradient(160deg,#b45309,#451a03)' },
  'eclipse':      { nama: 'Eclipse',        rarity: 'Legendary', grad: 'radial-gradient(circle at 50% 45%,#000 0 22%,#f59e0b 24%,transparent 48%),linear-gradient(160deg,#1e1b4b,#000)' },
};

const byRarity = (r: Rarity) => Object.keys(WALLPAPER_CATALOG).filter((k) => WALLPAPER_CATALOG[k].rarity === r);

export function rollRarity(): Rarity {
  const x = Math.random() * 100;
  let acc = 0;
  for (const r of RARITIES) { acc += RATES[r]; if (x < acc) return r; }
  return 'Normal';
}

/** n pull. Kalau n >= 10, pull terakhir dijamin minimal Rare. */
export function rollMany(n: number): string[] {
  const out: string[] = [];
  let sawRare = false;
  for (let i = 0; i < n; i++) {
    let r = rollRarity();
    if (n >= 10 && i === n - 1 && !sawRare && r === 'Normal') r = 'Rare';
    if (r !== 'Normal') sawRare = true;
    const pool = byRarity(r);
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return out;
}
