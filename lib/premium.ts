// Status Premium yang disimpan di perangkat supaya poin musim bisa langsung dihitung saat baca chapter.
// Sumber aslinya tetap Firebase (users/{uid}/role dan premiumUntil); cache ini diperbarui setiap
// halaman Premium dibuka dan setiap skor dikirim ke leaderboard.
export const PREMIUM_POINT_MULT = 1.3; // poin musim +30%
const KEY = 'komiku-premium-until';

// until: 0 = aktif tanpa batas waktu, >0 = aktif sampai waktu itu (ms)
export function setPremiumCache(active: boolean, until = 0) {
  try {
    if (!active) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(until || -1));
  } catch {}
}

export function isPremiumCached(): boolean {
  try {
    const v = Number(localStorage.getItem(KEY));
    if (!v) return false;
    return v === -1 || v > Date.now();
  } catch { return false; }
}

export const premiumMult = () => (isPremiumCached() ? PREMIUM_POINT_MULT : 1);

// Role premium yang tampil sebagai centang biru
export const isPremiumRole = (role?: string) => role === 'Komikita Premium' || role === 'Wibu Premium';
