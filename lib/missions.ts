import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKey, isNight } from './season';
import { isPremiumCached } from './premium';
import { getFirebase } from './firebase-client';

// Premium: tiap komentar langsung +1 Token, tanpa batas harian
function grantPremiumToken() {
  getFirebase().then(({ auth, db }: any) => {
    const u = auth.currentUser;
    if (u) db.ref('users/' + u.uid + '/token').transaction((cur: any) => (Number(cur) || 0) + 1);
  }).catch(() => {});
}

// ─── Misi harian & mingguan ──────────────────────────────────────────────────
export interface Mission {
  id: string;
  scope: 'd' | 'w';          // d = harian, w = mingguan
  title: string;
  sub: string;
  stat: 'read' | 'comment' | 'night' | 'days';
  target: number;
  crystal?: number;
  token?: number;
}

export const MISSIONS: Mission[] = [
  { id: 'd_read1',    scope: 'd', title: 'Baca 1 chapter',          sub: 'Chapter baru, bukan baca ulang', stat: 'read',    target: 1,  crystal: 10 },
  { id: 'd_read3',    scope: 'd', title: 'Baca 3 chapter',          sub: 'Maraton kecil hari ini',         stat: 'read',    target: 3,  crystal: 30 },
  { id: 'd_comment',  scope: 'd', title: 'Tulis 1 komentar',        sub: 'Di chapter mana saja',           stat: 'comment', target: 1,  token: 1 },
  { id: 'd_night',    scope: 'd', title: 'Baca 1 chapter malam',    sub: 'Antara 22.00 dan 04.59',         stat: 'night',   target: 1,  crystal: 15 },
  { id: 'w_read20',   scope: 'w', title: 'Baca 20 chapter',         sub: 'Minggu ini',                     stat: 'read',    target: 20, crystal: 150 },
  { id: 'w_days5',    scope: 'w', title: 'Aktif 5 hari berbeda',    sub: 'Baca minimal 1 chapter per hari', stat: 'days',   target: 5,  token: 3 },
  { id: 'w_comment5', scope: 'w', title: 'Tulis 5 komentar',        sub: 'Minggu ini',                     stat: 'comment', target: 5,  crystal: 100 },
];

// Awal minggu = Senin
export const weekKey = (d: Date = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dayKey(x);
};
export const periodKey = (scope: 'd' | 'w', d: Date = new Date()) => (scope === 'd' ? dayKey(d) : weekKey(d));

interface Counters { read: number; comment: number; night: number; days: string[] }
interface MissionStore {
  day: string; week: string;
  d: Counters; w: Counters;
  claimed: Record<string, true>;   // kunci: `${periode}:${idMisi}`
  addRead: () => void;
  addComment: () => void;
  markClaimed: (m: Mission) => void;
  progress: (m: Mission) => number;
}

const empty = (): Counters => ({ read: 0, comment: 0, night: 0, days: [] });

// Reset otomatis saat hari/minggu berganti
function rolled(s: MissionStore) {
  const now = new Date();
  const day = dayKey(now), week = weekKey(now);
  const out: Partial<MissionStore> = {};
  if (s.day !== day) { out.day = day; out.d = empty(); }
  if (s.week !== week) { out.week = week; out.w = empty(); }
  if (out.day || out.week) {
    const keep: Record<string, true> = {};
    Object.keys(s.claimed).forEach((k) => { if (k.startsWith(day + ':') || k.startsWith(week + ':')) keep[k] = true; });
    out.claimed = keep;
  }
  return out;
}

export const useMissions = create<MissionStore>()(
  persist(
    (set, get) => ({
      day: '', week: '', d: empty(), w: empty(), claimed: {},
      addRead: () => {
        set(rolled(get()));
        const s = get(); const today = dayKey(); const night = isNight();
        set({
          d: { ...s.d, read: s.d.read + 1, night: s.d.night + (night ? 1 : 0), days: s.d.days },
          w: { ...s.w, read: s.w.read + 1, night: s.w.night + (night ? 1 : 0), days: s.w.days.includes(today) ? s.w.days : [...s.w.days, today] },
        });
      },
      addComment: () => {
        set(rolled(get()));
        const s = get();
        set({ d: { ...s.d, comment: s.d.comment + 1 }, w: { ...s.w, comment: s.w.comment + 1 } });
        if (isPremiumCached()) grantPremiumToken();
      },
      markClaimed: (m) => {
        set(rolled(get()));
        set({ claimed: { ...get().claimed, [periodKey(m.scope) + ':' + m.id]: true } });
      },
      progress: (m) => {
        const s = get();
        const c = m.scope === 'd' ? (s.day === dayKey() ? s.d : empty()) : (s.week === weekKey() ? s.w : empty());
        return m.stat === 'days' ? c.days.length : c[m.stat];
      },
    }),
    { name: 'komiku-missions' }
  )
);
