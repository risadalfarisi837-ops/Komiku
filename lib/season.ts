// Musim peringkat: tiap 2 bulan (Nov–Des 2026 = Season 7)
export const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BASE = 2026 * 12 + 10; // Nov 2026

export function currentSeason(now: Date = new Date()) {
  const off = now.getFullYear() * 12 + now.getMonth() - BASE;
  const startOff = off - (((off % 2) + 2) % 2);
  const startIdx = BASE + startOff;
  const sy = Math.floor(startIdx / 12);
  const sm = ((startIdx % 12) + 12) % 12;
  const end = new Date(sy, sm + 2, 1);
  const last = new Date(end.getTime() - 86400000);
  return {
    id: 7 + startOff / 2,
    daysLeft: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)),
    label: `1 ${MONTHS_ID[sm]} – ${last.getDate()} ${MONTHS_ID[last.getMonth()]}`,
  };
}

// Aturan poin
export const POINTS_PER_CHAPTER = 10;
export const NIGHT_BONUS = 5;   // baca jam 22.00–04.59
export const DAILY_BONUS = 10;  // chapter pertama tiap hari
export const TARGETS = { chapter: 700, streak: 36, night: 720 };

export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const isNight = (d: Date = new Date()) => d.getHours() >= 22 || d.getHours() < 5;
export const fmt = (n: number) => n.toLocaleString('id-ID');
// Ringkas untuk angka besar supaya tidak meleber: 1.000.039 -> "1 jt"
export const fmtC = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1e9).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' M';
  if (n >= 1_000_000) return (n / 1e6).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' jt';
  return fmt(n);
};

export type Track = 'Murim' | 'Noble' | 'Demon';
// ch/streak/night = target Chapter, Streak (hari), dan Malam menuju pangkat ini. Naik pangkat = target ikut naik.
export interface RankDef { name: string; min: number; track: Track; bg: string; ch: number; streak: number; night: number }
export const RANKS: RankDef[] = [
  { name: 'Outer Disciple', min: 0,    track: 'Murim', bg: '#0F6B55', ch: 0,   streak: 0,  night: 0 },
  { name: 'Inner Disciple', min: 300,  track: 'Murim', bg: '#0F6B55', ch: 25,  streak: 3,  night: 8 },
  { name: 'Knight',         min: 700,  track: 'Noble', bg: '#27479E', ch: 60,  streak: 7,  night: 20 },
  { name: 'Duke',           min: 1500, track: 'Noble', bg: '#27479E', ch: 130, streak: 12, night: 45 },
  { name: 'Imp',            min: 3000, track: 'Demon', bg: '#8A1F34', ch: 260, streak: 20, night: 90 },
  { name: 'Demon King',     min: 5000, track: 'Demon', bg: '#9A1740', ch: 430, streak: 28, night: 150 },
  { name: 'Heavenly Demon', min: 8000, track: 'Demon', bg: '#B01238', ch: 700, streak: 36, night: 350 },
];
export function rankFor(points: number) {
  let i = 0;
  RANKS.forEach((r, k) => { if (points >= r.min) i = k; });
  return { rank: RANKS[i], next: RANKS[i + 1] || null };
}

// Target Chapter/Streak/Malam mengikuti pangkat berikutnya (atau pangkat tertinggi kalau sudah mentok)
export function targetsFor(points: number) {
  const { rank, next } = rankFor(points);
  const t = next || rank;
  return { chapter: t.ch, streak: t.streak, night: t.night };
}
