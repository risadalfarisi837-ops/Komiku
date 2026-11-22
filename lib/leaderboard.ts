import { useUserStats } from './store';
import { currentSeason } from './season';

declare global { interface Window { firebase: any; _fbReady: boolean; } }

import { getFirebase } from './firebase-client';
export { getFirebase };

export async function getUser(): Promise<any> {
  const { auth } = await getFirebase();
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    const un = auth.onAuthStateChanged((u: any) => { un(); resolve(u); });
  });
}

export interface Row { lencana?: string; uid: string; name: string; photo: string; points: number; chapters: number; streak: number; night: number }

// Kirim skor musim ini ke Firebase (hanya kalau sudah login)
export async function pushSeasonScore(): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;
    const { db } = await getFirebase();
    const s = useUserStats.getState().season;
    if (s.id !== currentSeason().id || s.points <= 0) return;
    let name: string = user.displayName || 'User';
    let photo: string = user.photoURL || '';
    try {
      const prof = (await db.ref(`users/${user.uid}`).get()).val();
      if (prof?.displayName) name = prof.displayName;
      if (prof?.photoURL) photo = prof.photoURL;
    } catch {}
    await db.ref(`leaderboard/s${s.id}/${user.uid}`).set({
      name, photo, points: s.points, chapters: s.chapters, streak: s.streak, night: s.night, t: Date.now(),
    });
  } catch {}
}

// 100 teratas musim ini
export async function fetchTop(seasonId: number): Promise<Row[]> {
  const { db } = await getFirebase();
  const snap = await db.ref(`leaderboard/s${seasonId}`).orderByChild('points').limitToLast(100).get();
  const rows: Row[] = [];
  snap.forEach((c: any) => {
    const v = c.val() || {};
    rows.push({ uid: String(c.key), name: v.name || 'User', photo: v.photo || '', points: Number(v.points) || 0, chapters: Number(v.chapters) || 0, streak: Number(v.streak) || 0, night: Number(v.night) || 0 });
  });
  return rows.sort((a, b) => b.points - a.points).slice(0, 100);
}

// Tambah EXP ke profil Firebase (users/<uid>) supaya Level di Profil ikut naik saat baca chapter.
// Rumus level sama dengan Profil: 200 EXP per level.
const EXP_PER_LEVEL = 200;
export async function addProfileExp(amount: number): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;
    const { db } = await getFirebase();
    await db.ref(`users/${user.uid}`).transaction((cur: any) => {
      if (cur === null) return cur; // data belum terbaca, Firebase akan mengulang dengan data asli
      const exp = (Number(cur.exp) || 0) + amount;
      return { ...cur, exp, level: Math.floor(exp / EXP_PER_LEVEL) + 1 };
    });
  } catch {}
}
