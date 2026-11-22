import { rankFor } from './season';

export type TrackName = 'Noble' | 'Murim' | 'Demon';
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface Lencana { id: string; name: string; track: TrackName; tier: number; rarity: Rarity }

export const RARITY_COLOR: Record<Rarity, string> = {
  Common: '#8E8D96', Rare: '#3B82F6', Epic: '#8B5CF6', Legendary: '#E5A82B', Mythic: '#EF4444',
};
export const TRACK_COLOR: Record<TrackName, string> = { Noble: '#27479E', Murim: '#0F6B55', Demon: '#8A1F34' };

const R: Rarity[] = ['Common', 'Common', 'Rare', 'Rare', 'Epic', 'Epic', 'Legendary', 'Legendary', 'Mythic', 'Mythic'];
const NAMES: Record<TrackName, string[]> = {
  Noble: ['Villager', 'Squire', 'Knight', 'Baron', 'Viscount', 'Count', 'Marquess', 'Duke', 'Prince', 'Emperor'],
  Murim: ['Outer Disciple', 'Inner Disciple', 'Core Disciple', 'Martial Artist', 'Martial Master', 'Grandmaster', 'Supreme Elder', 'Martial Saint', 'Martial Emperor', 'Heavenly Demon'],
  Demon: ['Imp', 'Fiend', 'Hellion', 'Baron of Embers', 'Archfiend', 'Infernal Duke', 'Overlord', 'Archdemon', 'Demon King', 'Abyssal Monarch'],
};

export const TRACKS: TrackName[] = ['Noble', 'Murim', 'Demon'];

// 3 jalur × 10 tingkat. Indeks 0 = Tingkat 10 (paling bawah), indeks 9 = Tingkat 1.
export const CATALOG: Lencana[] = TRACKS.flatMap((track) =>
  NAMES[track].map((name, i) => ({ id: `${track}:${name}`, name, track, tier: 10 - i, rarity: R[i] }))
);
export const byTrack = (t: TrackName) => CATALOG.filter((l) => l.track === t);
export const findLencana = (id?: string | null) => CATALOG.find((l) => l.id === id) || null;

export const TRACK_INFO: Record<TrackName, { first: string; last: string; desc: string }> = {
  Noble: { first: 'Villager', last: 'Emperor', desc: 'Gelar bangsawan' },
  Murim: { first: 'Outer Disciple', last: 'Heavenly Demon', desc: 'Jalan bela diri' },
  Demon: { first: 'Imp', last: 'Abyssal Monarch', desc: 'Istana iblis' },
};

// Lencana yang sedang dipegang musim ini (berdasarkan poin)
export function heldLencana(points: number): Lencana {
  const { rank } = rankFor(points);
  return CATALOG.find((l) => l.name === rank.name) || CATALOG.find((l) => l.name === 'Outer Disciple')!;
}

// ── Penyimpanan lokal ─────────────────────────────────────────────────────────
const K_BEST = 'komiku-lencana-best';   // tingkat terbaik per jalur (angka kecil = tinggi, 11 = belum ada)
const K_EQUIP = 'komiku-lencana-equip'; // id lencana yang dipakai

export function loadBest(): Record<TrackName, number> {
  const base = { Noble: 11, Murim: 11, Demon: 11 } as Record<TrackName, number>;
  try { Object.assign(base, JSON.parse(localStorage.getItem(K_BEST) || '{}')); } catch {}
  return base;
}
// Catat lencana yang dipegang sekarang; lencana musim lalu tetap terbuka.
export function recordHeld(held: Lencana): Record<TrackName, number> {
  const best = loadBest();
  if (held.tier < best[held.track]) best[held.track] = held.tier;
  try { localStorage.setItem(K_BEST, JSON.stringify(best)); } catch {}
  return best;
}
// Gabungkan tingkat terbaik dari server (users/{uid}/lencanaBest, mis. diberi developer) ke data lokal.
export function mergeBest(remote: unknown): Record<TrackName, number> {
  const best = loadBest();
  const r = (remote && typeof remote === 'object' ? remote : {}) as Record<string, unknown>;
  (['Noble', 'Murim', 'Demon'] as TrackName[]).forEach((t) => {
    const n = Number(r[t]);
    if (Number.isFinite(n) && n >= 1 && n <= 10 && n < best[t]) best[t] = Math.floor(n);
  });
  try { localStorage.setItem(K_BEST, JSON.stringify(best)); } catch {}
  return best;
}
export const isUnlocked = (l: Lencana, best: Record<TrackName, number>) => best[l.track] <= 10 && l.tier >= best[l.track];

export function loadEquipped(): string | null { try { return localStorage.getItem(K_EQUIP); } catch { return null; } }
export function saveEquipped(id: string) { try { localStorage.setItem(K_EQUIP, id); } catch {} }
