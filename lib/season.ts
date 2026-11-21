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

export type Track = 'Murim' | 'Noble' | 'Demon';
export interface RankDef { name: string; min: number; track: Track; bg: string }
export const RANKS: RankDef[] = [
  { name: 'Outer Disciple', min: 0,    track: 'Murim', bg: '#0F6B55' },
  { name: 'Inner Disciple', min: 300,  track: 'Murim', bg: '#0F6B55' },
  { name: 'Knight',         min: 700,  track: 'Noble', bg: '#27479E' },
  { name: 'Duke',           min: 1500, track: 'Noble', bg: '#27479E' },
  { name: 'Imp',            min: 3000, track: 'Demon', bg: '#8A1F34' },
  { name: 'Demon King',     min: 5000, track: 'Demon', bg: '#9A1740' },
  { name: 'Heavenly Demon', min: 8000, track: 'Demon', bg: '#B01238' },
];
export function rankFor(points: number) {
  let i = 0;
  RANKS.forEach((r, k) => { if (points >= r.min) i = k; });
  return { rank: RANKS[i], next: RANKS[i + 1] || null };
}
