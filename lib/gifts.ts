import { currentSeason, fmt } from './season';
import { pushSeasonScore } from './leaderboard';

export type GiftType = 'koin' | 'level' | 'exp' | 'poin' | 'border' | 'wallpaper' | 'effect';

export interface Gift {
  id: string; type: GiftType; amount?: number; itemKey?: string; itemName: string;
  from: string; message?: string; timestamp: number; claimed?: boolean;
}

export const GIFT_TYPE_LABEL: Record<GiftType, string> = {
  koin: 'Crystal', level: 'Level', exp: 'EXP', poin: 'Poin musim',
  border: 'Border profil', wallpaper: 'Wallpaper komentar', effect: 'Efek profil',
};

export function giftTitle(type: GiftType, n: number): string {
  if (type === 'koin') return `+${fmt(n)} Crystal`;
  if (type === 'level') return `+${fmt(n)} Level`;
  if (type === 'exp') return `+${fmt(n)} EXP`;
  return `+${fmt(n)} Poin musim`;
}

// Kirim hadiah ke satu atau banyak user. Hadiah masuk ke Notifikasi > Hadiah dan belum diterapkan sampai diklaim.
export async function sendGifts(
  db: any, uids: string[],
  g: { type: GiftType; amount?: number; itemKey?: string; itemName: string; from: string; message?: string },
): Promise<void> {
  const upd: Record<string, any> = {};
  const now = Date.now();
  uids.forEach((u) => {
    const id = db.ref(`users/${u}/gifts`).push().key as string;
    const rec: Record<string, any> = { type: g.type, itemName: g.itemName, from: g.from || 'Developer', timestamp: now, claimed: false };
    if (g.amount !== undefined) rec.amount = g.amount;
    if (g.itemKey) rec.itemKey = g.itemKey;
    if (g.message) rec.message = g.message;
    upd[`users/${u}/gifts/${id}`] = rec;
  });
  await db.ref().update(upd);
}

// Klaim hadiah: terapkan ke akun sendiri lalu tandai sudah diklaim. Return false kalau sudah pernah diklaim.
export async function claimGift(db: any, uid: string, g: Gift): Promise<boolean> {
  const gref = db.ref(`users/${uid}/gifts/${g.id}`);
  const fresh = (await gref.get()).val();
  if (!fresh || fresh.claimed) return false;
  const cur = (await db.ref(`users/${uid}`).get()).val() || {};
  const amt = Number(g.amount) || 0;
  const upd: Record<string, any> = {};
  if (g.type === 'koin') upd[`users/${uid}/koin`] = (Number(cur.koin) || 0) + amt;
  else if (g.type === 'level') {
    const nl = (Number(cur.level) || 1) + amt;
    upd[`users/${uid}/level`] = nl;
    upd[`users/${uid}/exp`] = (nl - 1) * 200;
  } else if (g.type === 'exp') {
    const lvl = Number(cur.level) || 1;
    const e = (Number.isFinite(Number(cur.exp)) ? Number(cur.exp) : (lvl - 1) * 200) + amt;
    upd[`users/${uid}/exp`] = e;
    upd[`users/${uid}/level`] = Math.floor(e / 200) + 1;
  } else if (g.type === 'border' && g.itemKey) upd[`users/${uid}/ownedBorders/${g.itemKey}`] = true;
  else if (g.type === 'effect' && g.itemKey) upd[`users/${uid}/ownedEffects/${g.itemKey}`] = true;
  else if (g.type === 'wallpaper' && g.itemKey) upd[`users/${uid}/ownedWallpapers/${g.itemKey}`] = (Number(cur.ownedWallpapers?.[g.itemKey]) || 0) + 1;
  upd[`users/${uid}/gifts/${g.id}/claimed`] = true;
  upd[`users/${uid}/gifts/${g.id}/claimedAt`] = Date.now();
  await db.ref().update(upd);

  if (g.type === 'poin') {
    try {
      await db.ref(`leaderboard/s${currentSeason().id}/${uid}`).transaction((c: any) => {
        const base = c || { name: cur.displayName || 'User', photo: cur.photoURL || '', points: 0, chapters: 0, streak: 0, night: 0 };
        return { ...base, name: base.name || cur.displayName || 'User', photo: base.photo ?? (cur.photoURL || ''), bonus: (Number(base.bonus) || 0) + amt, points: (Number(base.points) || 0) + amt, t: Date.now() };
      });
      await pushSeasonScore();
    } catch (e) {
      await gref.update({ claimed: false }); // gagal menambah poin: buka lagi supaya bisa diklaim ulang
      throw e;
    }
  }
  return true;
}
