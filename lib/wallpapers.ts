import type { EffectItem } from './effects';

export type Rarity = 'Normal' | 'Rare' | 'Epic' | 'Legendary';

export interface WallpaperItem {
  nama: string;
  rarity: Rarity;
  grad: string;   // background gradient (dipakai kalau url kosong)
  url?: string;   // gambar sendiri: taruh di /public/wallpapers/ lalu isi '/wallpapers/nama.jpg' (SVG animasi juga bisa)
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

  // ── Ilustrasi bergaya anime (file di /public/wallpapers) ──
  // Normal: pemandangan sederhana
  'senja-kota':      { nama: 'Senja Kota',       rarity: 'Normal', grad: 'linear-gradient(180deg,#3b2a6e,#c2477d 40%,#ffd08a)', url: '/wallpapers/senja-kota.svg' },
  'padang-hijau':    { nama: 'Padang Hijau',     rarity: 'Normal', grad: 'linear-gradient(180deg,#3a8fe0,#d9f3ff 60%,#3f9a55)', url: '/wallpapers/padang-hijau.svg' },
  'malam-bintang':   { nama: 'Malam Berbintang', rarity: 'Normal', grad: 'linear-gradient(180deg,#050a24,#2a4a86)',              url: '/wallpapers/malam-bintang.svg' },
  'pantai-siang':    { nama: 'Pantai Siang',     rarity: 'Normal', grad: 'linear-gradient(180deg,#2f9bf0,#bfeaff 55%,#1fb5d6)',  url: '/wallpapers/pantai-siang.svg' },
  'hutan-kabut':     { nama: 'Hutan Kabut',      rarity: 'Normal', grad: 'linear-gradient(180deg,#9fb7b0,#2a4a42)',              url: '/wallpapers/hutan-kabut.svg' },
  'langit-ungu':     { nama: 'Langit Ungu',      rarity: 'Normal', grad: 'linear-gradient(180deg,#1a1146,#5b2f9e 45%,#ffb3b0)',  url: '/wallpapers/langit-ungu.svg' },
  // Rare: lebih detail, banyak lapisan
  'torii-fajar':     { nama: 'Torii Fajar',      rarity: 'Rare', grad: 'linear-gradient(180deg,#2a2d6e,#ff8d6a 55%,#ffe0a0)',   url: '/wallpapers/torii-fajar.svg' },
  'danau-bulan':     { nama: 'Danau Bulan',      rarity: 'Rare', grad: 'linear-gradient(180deg,#050b2a,#3d6aa8)',                url: '/wallpapers/danau-bulan.svg' },
  'kota-neon-hujan': { nama: 'Kota Neon Hujan',  rarity: 'Rare', grad: 'linear-gradient(180deg,#0a0620,#7a1f86)',                url: '/wallpapers/kota-neon-hujan.svg' },
  'bukit-sakura':    { nama: 'Bukit Sakura',     rarity: 'Rare', grad: 'linear-gradient(180deg,#7aa8f0,#f3b8d8 50%,#6fae6b)',    url: '/wallpapers/bukit-sakura.svg' },
  'pantai-bintang':  { nama: 'Pantai Bintang',   rarity: 'Rare', grad: 'linear-gradient(180deg,#03051c,#5a3a8e)',                url: '/wallpapers/pantai-bintang.svg' },
  'jembatan-senja':  { nama: 'Jembatan Senja',   rarity: 'Rare', grad: 'linear-gradient(180deg,#35296e,#ff9a5a 60%,#ffd98a)',    url: '/wallpapers/jembatan-senja.svg' },
  // Legendary: animasi (bergerak)
  'sakura-gugur':     { nama: 'Sakura Gugur',     rarity: 'Legendary', grad: 'linear-gradient(180deg,#0c0a2e,#a8508f)', url: '/wallpapers/sakura-gugur.svg' },
  'galaksi-bergerak': { nama: 'Galaksi Bergerak', rarity: 'Legendary', grad: 'linear-gradient(180deg,#03030f,#4a1fb0)', url: '/wallpapers/galaksi-bergerak.svg' },
  'lentera-langit':   { nama: 'Lentera Langit',   rarity: 'Legendary', grad: 'linear-gradient(180deg,#050a2a,#8a3a7a)', url: '/wallpapers/lentera-langit.svg' },
  'laut-purnama':     { nama: 'Laut Purnama',     rarity: 'Legendary', grad: 'linear-gradient(180deg,#04061c,#2f4f8e)', url: '/wallpapers/laut-purnama.svg' },
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
