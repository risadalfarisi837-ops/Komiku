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
// Wallpaper yang sudah dimiliki tidak bertambah lagi: duplikat jadi token (sesuai rarity), token ditukar di toko.
export const TOKEN_DUP: Record<Rarity, number> = { Normal: 10, Rare: 30, Epic: 80, Legendary: 200 };
export const TOKEN_PRICE: Record<Rarity, number> = { Normal: 60, Rare: 180, Epic: 480, Legendary: 1200 };
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
  // Semua wallpaper di sini punya gambar (file di /public/wallpapers). Yang tanpa gambar sudah dibuang dari summon.
  // Normal: pemandangan sederhana
  'senja-kota':      { nama: 'Senja Kota',       rarity: 'Normal', grad: 'linear-gradient(180deg,#3b2a6e,#c2477d 40%,#ffd08a)', url: '/wallpapers/senja-kota.svg' },
  'padang-hijau':    { nama: 'Padang Hijau',     rarity: 'Normal', grad: 'linear-gradient(180deg,#3a8fe0,#d9f3ff 60%,#3f9a55)', url: '/wallpapers/padang-hijau.svg' },
  'malam-bintang':   { nama: 'Malam Berbintang', rarity: 'Normal', grad: 'linear-gradient(180deg,#050a24,#2a4a86)',              url: '/wallpapers/malam-bintang.svg' },
  'pantai-siang':    { nama: 'Pantai Siang',     rarity: 'Normal', grad: 'linear-gradient(180deg,#2f9bf0,#bfeaff 55%,#1fb5d6)',  url: '/wallpapers/pantai-siang.svg' },
  'hutan-kabut':     { nama: 'Hutan Kabut',      rarity: 'Normal', grad: 'linear-gradient(180deg,#9fb7b0,#2a4a42)',              url: '/wallpapers/hutan-kabut.svg' },
  'langit-ungu':     { nama: 'Langit Ungu',      rarity: 'Normal', grad: 'linear-gradient(180deg,#1a1146,#5b2f9e 45%,#ffb3b0)',  url: '/wallpapers/langit-ungu.svg' },
  // Rare: lebih detail, banyak lapisan (+ suasana anime populer)
  'torii-fajar':     { nama: 'Torii Fajar',      rarity: 'Rare', grad: 'linear-gradient(180deg,#2a2d6e,#ff8d6a 55%,#ffe0a0)',   url: '/wallpapers/torii-fajar.svg' },
  'danau-bulan':     { nama: 'Danau Bulan',      rarity: 'Rare', grad: 'linear-gradient(180deg,#050b2a,#3d6aa8)',                url: '/wallpapers/danau-bulan.svg' },
  'kota-neon-hujan': { nama: 'Kota Neon Hujan',  rarity: 'Rare', grad: 'linear-gradient(180deg,#0a0620,#7a1f86)',                url: '/wallpapers/kota-neon-hujan.svg' },
  'bukit-sakura':    { nama: 'Bukit Sakura',     rarity: 'Rare', grad: 'linear-gradient(180deg,#7aa8f0,#f3b8d8 50%,#6fae6b)',    url: '/wallpapers/bukit-sakura.svg' },
  'pantai-bintang':  { nama: 'Pantai Bintang',   rarity: 'Rare', grad: 'linear-gradient(180deg,#03051c,#5a3a8e)',                url: '/wallpapers/pantai-bintang.svg' },
  'jembatan-senja':  { nama: 'Jembatan Senja',   rarity: 'Rare', grad: 'linear-gradient(180deg,#35296e,#ff9a5a 60%,#ffd98a)',    url: '/wallpapers/jembatan-senja.svg' },
  'komet-senja':     { nama: 'Komet Senja',      rarity: 'Rare', grad: 'linear-gradient(180deg,#0a0f33,#c0457f 66%,#ffd0a0)', url: '/wallpapers/komet-senja.svg' },
  'layar-fajar':     { nama: 'Layar Fajar',      rarity: 'Rare', grad: 'linear-gradient(180deg,#3d95e8,#ffe8bf 60%,#1fa3d8)', url: '/wallpapers/layar-fajar.svg' },
  'bambu-bulan':     { nama: 'Rimba Bambu',      rarity: 'Rare', grad: 'linear-gradient(180deg,#06141a,#1f6a58)',             url: '/wallpapers/bambu-bulan.svg' },
  // Epic: adegan dramatis bergaya anime shonen/fantasi
  'tembok-raksasa':   { nama: 'Tembok Raksasa',   rarity: 'Epic', grad: 'linear-gradient(180deg,#1b2350,#e08a6a 60%,#8a7a6a)', url: '/wallpapers/tembok-raksasa.svg' },
  'ninja-bulan':      { nama: 'Ninja Bulan',      rarity: 'Epic', grad: 'linear-gradient(180deg,#07072a,#b35a8a)',             url: '/wallpapers/ninja-bulan.svg' },
  'pasukan-bayangan': { nama: 'Pasukan Bayangan', rarity: 'Epic', grad: 'linear-gradient(180deg,#05020e,#41197a)',             url: '/wallpapers/pasukan-bayangan.svg' },
  // Legendary: animasi (bergerak)
  'sakura-gugur':     { nama: 'Sakura Gugur',     rarity: 'Legendary', grad: 'linear-gradient(180deg,#0c0a2e,#a8508f)', url: '/wallpapers/sakura-gugur.svg' },
  'galaksi-bergerak': { nama: 'Galaksi Bergerak', rarity: 'Legendary', grad: 'linear-gradient(180deg,#03030f,#4a1fb0)', url: '/wallpapers/galaksi-bergerak.svg' },
  'lentera-langit':   { nama: 'Lentera Langit',   rarity: 'Legendary', grad: 'linear-gradient(180deg,#050a2a,#8a3a7a)', url: '/wallpapers/lentera-langit.svg' },
  'laut-purnama':     { nama: 'Laut Purnama',     rarity: 'Legendary', grad: 'linear-gradient(180deg,#04061c,#2f4f8e)', url: '/wallpapers/laut-purnama.svg' },
  'bayangan-penguasa': { nama: 'Bayangan Penguasa', rarity: 'Legendary', grad: 'linear-gradient(180deg,#02010a,#2b1560)', url: '/wallpapers/bayangan-penguasa.svg' },
  'komet-takdir':      { nama: 'Komet Takdir',      rarity: 'Legendary', grad: 'linear-gradient(180deg,#050818,#a8357f)', url: '/wallpapers/komet-takdir.svg' },
};

/** Gambar diam (ringan) untuk wallpaper Legendary. SVG beranimasinya berat kalau banyak tampil sekaligus. */
export const wpPoster = (key: string) => '/wallpapers/poster/' + key + '.webp';

/**
 * Nilai CSS `background` untuk wallpaper.
 * Legendary memakai gambar diam, kecuali animated=true (pakai SVG beranimasi; cukup 1 per layar, mis. banner profil).
 */
export function wpBg(key: string | undefined | null, animated = false): string {
  const w = key ? WALLPAPER_CATALOG[key] : undefined;
  if (!w) return '';
  if (!w.url) return w.grad;
  const src = w.rarity === 'Legendary' && !animated ? wpPoster(key as string) : w.url;
  return 'url(' + src + ') center/cover, ' + w.grad;
}

/** Info yang ditampilkan di panel "Info Rarity" (urut dari terbaik). */
export const RARITY_INFO: Record<Rarity, { label: string; stars: number; desc: string }> = {
  Legendary: { label: 'TERBAIK', stars: 4, desc: 'Banner profil bergerak (animasi) dan bingkai emas berkilau di komentar. Paling langka.' },
  Epic:      { label: 'LANGKA',  stars: 3, desc: 'Adegan dramatis bergaya anime, bingkai ungu berkilau di komentar.' },
  Rare:      { label: 'BAGUS',   stars: 2, desc: 'Ilustrasi berlapis dengan detail lebih banyak, bingkai biru bercahaya.' },
  Normal:    { label: 'UMUM',    stars: 1, desc: 'Pemandangan sederhana tanpa efek tambahan. Paling mudah didapat.' },
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
    let pool = byRarity(r);
    if (!pool.length) pool = byRarity('Normal');
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return out;
}
