'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { X, Check, Bell, Pencil, Crown, Gift, Bug, ChevronRight, BookOpen, Flame, Moon, Lock, ShoppingBag, Target } from 'lucide-react';
import { useFavorites, useHistory, useUserStats } from '@/lib/store';
import { numericId } from '@/lib/utils';
import VerifiedBadge from '@/components/VerifiedBadge';
import DevBadge from '@/components/DevBadge';
import PremiumName from '@/components/PremiumName';
import { currentSeason, RANKS, rankFor, fmt, fmtC, TARGETS, Track } from '@/lib/season';
import { pushSeasonScore, ACTIVE_DAYS } from '@/lib/leaderboard';
import { sendGifts, giftTitle, GiftType } from '@/lib/gifts';
import ProfileEffect from '@/components/ProfileEffect';
import ProfileBg from '@/components/ProfileBg';
import GiftEffect from '@/components/GiftEffect';
import GiftVisual from '@/components/GiftVisual';
import { WALLPAPER_CATALOG } from '@/lib/wallpapers';
import { EFFECT_CATALOG } from '@/lib/effects';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAptqYUJWJ-bfadEA5Oa3d5c8YBl8qGzd0",
  authDomain: "komiku-d8788.firebaseapp.com",
  databaseURL: "https://komiku-d8788-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "komiku-d8788",
  storageBucket: "komiku-d8788.firebasestorage.app",
  messagingSenderId: "186745171350",
  appId: "1:186745171350:web:92cd160ed67e25de8801b7",
  measurementId: "G-5FS22L934V"
};

declare global {
  interface Window { firebase: any; _fbReady: boolean; }
}

// Load scripts berurutan agar auth-compat tidak load sebelum app-compat
function loadFirebaseCDN(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window._fbReady) return Promise.resolve();
  const scripts = [
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-database-compat.js',
  ];
  return scripts.reduce((chain, src) => chain.then(() => new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Gagal load: ${src}`));
    document.head.appendChild(s);
  })), Promise.resolve()).then(() => { window._fbReady = true; });
}

let _fbInit = false;
let _fbPromise: Promise<{ auth: any; db: any }> | null = null;
async function getFirebase() {
  if (_fbPromise) return _fbPromise;
  _fbPromise = (async () => {
    await loadFirebaseCDN();
    if (!_fbInit) {
      if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
      _fbInit = true;
    }
    return { auth: window.firebase.auth(), db: window.firebase.database() };
  })();
  return _fbPromise;
}

// ─── Rename Modal ─────────────────────────────────────────────────────────────
function RenameModal({ open, onClose, currentName, freeRenameUsed, koin, onRename }: {
  open: boolean; onClose: () => void; currentName: string;
  freeRenameUsed: boolean; koin: number;
  onRename: (newName: string) => Promise<void>;
}) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const RENAME_COST = 500;
  const canAfford = koin >= RENAME_COST;

  useEffect(() => { if (open) setName(currentName); }, [open, currentName]);

  if (!open) return null;
  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) { onClose(); return; }
    if (trimmed.length < 2 || trimmed.length > 20) { alert('Nama harus 2–20 karakter.'); return; }
    if (freeRenameUsed && !canAfford) { alert('Crystal tidak cukup! Butuh 500 koin.'); return; }
    setLoading(true);
    try { await onRename(trimmed); onClose(); }
    catch (e: any) { alert('Gagal: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-[#2A2931] rounded-t-3xl px-5 pt-5 pb-10 border-t border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <h3 className="text-base font-black text-white text-center mb-1">Ganti Nama</h3>
        <p className="text-[11px] text-gray-500 text-center mb-4">
          {freeRenameUsed ? `Gratis sudah dipakai • Biaya: ${RENAME_COST} crystal` : '1x gratis tersedia'}
        </p>
        <input
          className="w-full bg-[#1B1A20] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-blue-500 mb-4"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          placeholder="Nama baru..."
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold text-sm">Batal</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || (freeRenameUsed && !canAfford)}
            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm disabled:opacity-40"
          >
            {loading ? '...' : freeRenameUsed ? `Bayar ${RENAME_COST} crystal` : 'Simpan Gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Border Catalog ───────────────────────────────────────────────────────────
const BORDER_CATALOG: Record<string, { nama: string; harga: number; url: string }> = {
  'glitch_merah':    { nama: 'Glitch Merah',    harga: 1000, url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1436367668897775757/animated' },
  'blue_premium':    { nama: 'Blue Premium',    harga: 500,  url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1373015260507930664/animated' },
  'phoenix':         { nama: 'Phoenix',         harga: 750,  url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1298033986622328842/animated' },
  'venom':           { nama: 'Venom',           harga: 800,  url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1481388474673139855/animated' },
  'black-mana':      { nama: 'Black Mana',      harga: 1000, url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1379220459026911342/animated' },
  'the-haxcore':     { nama: 'The Hacxcore',    harga: 2000, url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1303490165171294268/animated' },
  'fishbones':       { nama: 'FISHBONES!',      harga: 1500, url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1303490165150322698/animated' },
  'hologram-dragon': { nama: 'Hologram Dragon', harga: 3000, url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1366494385583165630/animated' },
  'dark-hood':       { nama: 'Dark Hood',       harga: 500,  url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1287835633615765524/animated' },
  'spider-man':      { nama: 'Spider Man',      harga: 1000, url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1481384635886862397/animated' },
  'purple-animation':{ nama: 'Purple Animation',harga: 1000, url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1303490165192265799/animated' },
  'infinite-swirl':  { nama: 'Infinite Swirl',  harga: 800,  url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1427463138634109027/animated' },
  'dark-hood-crimson':{ nama: 'Dark Hood Crimson', harga: 500, url: 'https://cdn.discordapp.com/media/v1/collectibles-shop/1287835633645125653/animated' },
};

// ─── Avatar with Border Overlay ───────────────────────────────────────────────
function AvatarWithBorder({
  src, size, borderKey, onClick, showEditHint = false
}: {
  src: string; size: number; borderKey?: string; onClick?: () => void; showEditHint?: boolean;
}) {
  const borderUrl = borderKey ? BORDER_CATALOG[borderKey]?.url : '';
  return (
    <div
      onClick={onClick}
      className={onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}
      style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}
    >
      <img
        src={src || `https://placehold.co/${size}/1a1d24/fff?text=?`}
        alt="avatar"
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        referrerPolicy="no-referrer"
      />
      {borderUrl && (
        <div
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '130%', height: '130%',
            transform: 'translate(-50%,-50%)',
            backgroundImage: `url('${borderUrl}')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}
      {/* Edit hint overlay */}
      {showEditHint && onClick && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.55)', borderRadius: '0 0 50% 50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '38%', zIndex: 20, pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 900, letterSpacing: 0.3 }}>BORDER</span>
        </div>
      )}
    </div>
  );
}

// ─── Panel Developer ──────────────────────────────────────────────────────────
// Semua aksi pakai pilihan (chip / dropdown / daftar user) biar nggak perlu ngetik UID manual.
const DEV_ITEMS = {
  border:    { label: 'Border', owned: 'ownedBorders',    active: 'activeBorder',    items: Object.entries(BORDER_CATALOG).map(([key, v]) => ({ key, nama: v.nama })) },
  wallpaper: { label: 'Wallpaper', owned: 'ownedWallpapers', active: 'activeWallpaper', items: Object.entries(WALLPAPER_CATALOG).map(([key, v]) => ({ key, nama: v.nama + ' · ' + v.rarity })) },
  effect:    { label: 'Effect', owned: 'ownedEffects',    active: 'activeEffect',    items: Object.entries(EFFECT_CATALOG).map(([key, v]) => ({ key, nama: v.nama })) },
} as const;
type ItemCat = keyof typeof DEV_ITEMS;
type DevUser = { uid: string; name: string; photo: string; level: number; koin: number; role: string };
const DEV_ACTS = [['koin', 'Crystal'], ['level', 'Level'], ['exp', 'EXP'], ['poin', 'Poin'], ['role', 'Role'], ['item', 'Item'], ['reset', 'Reset']] as const;
type DevAct = typeof DEV_ACTS[number][0];
const DEV_MODES = [['add', 'Tambah'], ['sub', 'Kurangi'], ['set', 'Set jadi']] as const;
type DevMode = typeof DEV_MODES[number][0];
const DEV_PRESETS: Record<'koin' | 'level' | 'exp' | 'poin', number[]> = { koin: [100, 500, 1000, 5000, 10000], level: [1, 5, 10, 50], exp: [100, 200, 1000, 5000], poin: [100, 300, 700, 1500, 5000, 8000] };
const DEV_UNIT: Record<'koin' | 'level' | 'exp' | 'poin', string> = { koin: 'Crystal', level: 'level', exp: 'EXP', poin: 'poin musim ini' };
const DEV_ROLES = ['Member', 'Komikita Premium', 'Developer'];
const DEV_RESETS = [['poin', 'Poin musim'], ['level', 'Level & EXP'], ['koin', 'Crystal'], ['hapus', 'Hapus data user']] as const;
type DevReset = typeof DEV_RESETS[number][0];
type GType = 'koin' | 'level' | 'exp' | 'poin' | 'border' | 'wallpaper' | 'effect';
const GIFT_TYPES: [GType, string][] = [['koin', 'Crystal'], ['level', 'Level up'], ['exp', 'EXP'], ['poin', 'Poin musim'], ['border', 'Border'], ['wallpaper', 'Wallpaper'], ['effect', 'Efek']];
const GIFT_PRESETS: Record<GType, number[]> = { koin: [100, 500, 1000, 5000], level: [1, 3, 5, 10], exp: [100, 200, 1000, 5000], poin: [50, 100, 300, 700], border: [], wallpaper: [], effect: [] };
// crystal = bonus Crystal yang diterima user saat pesanan disetujui
const DEV_PLAN_DAYS: Record<string, { nama: string; days: number; crystal: number }> = { mingguan: { nama: 'Mingguan', days: 7, crystal: 150 }, bulanan: { nama: 'Bulanan', days: 30, crystal: 500 }, tahunan: { nama: 'Tahunan', days: 365, crystal: 6000 } };
const GIFT_UNIT: Record<GType, string> = { koin: 'Crystal', level: 'Level', exp: 'EXP', poin: 'Poin', border: 'Border', wallpaper: 'Wallpaper', effect: 'Efek' };
const DEV_REASONS = ['Kompensasi', 'Server down', 'Hadiah event', 'Bonus spesial'];

function DevPanel({ open, onClose, uid, db, userData, onUpdate }: {
  open: boolean; onClose: () => void;
  uid: string; db: any; userData: any; onUpdate: (d: any) => void;
}) {
  const [tab, setTab]       = useState<'user'|'global'|'bayar'>('user');
  const [orders, setOrders]     = useState<any[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [gift, setGift]     = useState<{ title: string; sub?: string; visual?: React.ReactNode } | null>(null);
  const [toast, setToast]   = useState<{msg:string; type:'success'|'error'}|null>(null);

  // Tab: User
  const [users, setUsers]               = useState<DevUser[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [q, setQ]                       = useState('');
  const [target, setTarget]             = useState<DevUser | null>(null);
  const [tData, setTData]               = useState<any>(null);
  const [act, setAct]                   = useState<DevAct>('koin');
  const [mode, setMode]                 = useState<DevMode>('add');
  const [amount, setAmount]             = useState('');
  const [rolePick, setRolePick]         = useState('Member');
  const [itemCat, setItemCat]           = useState<ItemCat>('border');
  const [itemKey, setItemKey]           = useState('');

  // Tab: Semua user
  const [gType, setGType]   = useState<GType>('koin');
  const [resetPick, setResetPick] = useState<DevReset>('poin');
  const [gVal, setGVal]     = useState('');
  const [gItemKey, setGItemKey] = useState('');
  const [gSender, setGSender] = useState('Sistem Komikita');
  const [gMsg, setGMsg]     = useState('Kompensasi');
  const [confirmGlobal, setConfirmGlobal] = useState(false);

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await db.ref('users').get();
      const arr: DevUser[] = [];
      snap.forEach((c: any) => {
        const v = c.val() || {};
        arr.push({ uid: String(c.key), name: v.displayName || 'User', photo: v.photoURL || '', level: Number(v.level) || 1, koin: Number(v.koin) || 0, role: v.role || 'Member' });
      });
      setUsers(arr);
    } catch (e: any) { showToast('Gagal memuat user: ' + e.message, 'error'); }
    setLoadingUsers(false);
  };

  const pick = async (u: DevUser) => {
    setTarget(u); setQ('');
    try { setTData((await db.ref('users/' + u.uid).get()).val() || {}); } catch { setTData({}); }
  };

  useEffect(() => { if (open && !users && !loadingUsers) loadUsers(); if (!open) setConfirmGlobal(false); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (users && !target) { const me = users.find(u => u.uid === uid); if (me) pick(me); } }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  // Jalankan perubahan ke user terpilih: baca data terbaru -> hitung -> simpan -> muat ulang.
  const run = async (fn: (cur: any) => any, okMsg: string, fx?: { title: string; sub?: string }) => {
    if (!target) { showToast('Pilih user dulu.', 'error'); return; }
    setSaving(true);
    try {
      const cur = (await db.ref('users/' + target.uid).get()).val() || {};
      const patch = fn(cur);
      await db.ref('users/' + target.uid).update(patch);
      const fresh = (await db.ref('users/' + target.uid).get()).val() || {};
      setTData(fresh);
      if (target.uid === uid) onUpdate(fresh);
      setUsers(prev => prev && prev.map(x => x.uid === target.uid ? { ...x, name: fresh.displayName || x.name, level: Number(fresh.level) || 1, koin: Number(fresh.koin) || 0, role: fresh.role || 'Member' } : x));
      showToast(okMsg, 'success');
      if (fx) setGift(fx);
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  // Poin musim: disimpan di leaderboard/s<musim>/<uid>, field "bonus" = poin hadiah dev (tidak tertimpa saat user baca chapter)
  const applyPoints = async (n: number) => {
    if (!target) { showToast('Pilih user dulu.', 'error'); return; }
    setSaving(true);
    try {
      const ref = db.ref(`leaderboard/s${currentSeason().id}/${target.uid}`);
      const res = await ref.transaction((cur: any) => {
        const base = cur || { name: target.name, photo: target.photo, points: 0, chapters: 0, streak: 0, night: 0 };
        const bonus = Number(base.bonus) || 0;
        const raw = (Number(base.points) || 0) - bonus; // poin asli dari baca chapter
        const total = Math.max(0, mode === 'add' ? raw + bonus + n : mode === 'sub' ? raw + bonus - n : n);
        return { ...base, name: base.name || target.name, photo: base.photo || target.photo || '', bonus: total - raw, points: total, t: Date.now() };
      });
      const total = Number(res.snapshot.val()?.points) || 0;
      if (target.uid === uid) await pushSeasonScore(); // sinkronkan ke tampilan lokal
      showToast(`Poin ${target.name} sekarang ${fmt(total)}.`, 'success');
      if (mode === 'add') setGift({ title: 'Gift terkirim!', sub: '+' + n + ' poin untuk ' + target.name, visual: <GiftVisual type="poin" /> });
    } catch (e: any) { showToast('Gagal: ' + e.message + ' (cek aturan database leaderboard)', 'error'); }
    setSaving(false);
  };

  // ── Pembayaran Premium manual ──
  const loadOrders = async () => {
    try {
      const snap = await db.ref('premiumOrders').orderByChild('status').equalTo('pending').get();
      const arr: any[] = [];
      snap.forEach((c: any) => { arr.push({ id: String(c.key), ...(c.val() || {}) }); });
      setOrders(arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (e: any) { showToast('Gagal memuat pesanan: ' + e.message + ' (cek aturan premiumOrders)', 'error'); setOrders([]); }
  };
  useEffect(() => { if (tab === 'bayar') loadOrders(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const approveOrder = async (o: any) => {
    const plan = DEV_PLAN_DAYS[o.plan];
    if (!plan) { showToast('Paket tidak dikenal.', 'error'); return; }
    if (!window.confirm(`Setujui ${o.name} · Rp ${Number(o.amount).toLocaleString('id-ID')}? Pastikan dana sudah masuk di DANA.`)) return;
    setSaving(true);
    try {
      const u = (await db.ref('users/' + o.uid).get()).val() || {};
      const now = Date.now();
      const from = u.role === 'Komikita Premium' && Number(u.premiumUntil) > now ? Number(u.premiumUntil) : now;
      const until = from + plan.days * 86400000;
      const upd: Record<string, any> = {};
      upd[`users/${o.uid}/premiumUntil`] = until;
      upd[`users/${o.uid}/premiumPlan`] = o.plan;
      if (u.role !== 'Developer') upd[`users/${o.uid}/role`] = 'Komikita Premium';
      upd[`users/${o.uid}/koin`] = (Number(u.koin) || 0) + plan.crystal;
      upd[`premiumOrders/${o.id}/status`] = 'approved';
      upd[`premiumOrders/${o.id}/approvedAt`] = now;
      upd[`premiumOrders/${o.id}/until`] = until;
      const ikey = db.ref(`users/${o.uid}/inbox`).push().key;
      upd[`users/${o.uid}/inbox/${ikey}`] = {
        jenis: 'premium_ok', judul: 'Premium aktif!', waktu: now,
        isi: `Pembayaran Rp ${Number(o.amount).toLocaleString('id-ID')} diterima. Premium ${plan.nama} aktif sampai ${new Date(until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Kamu juga dapat bonus ${plan.crystal.toLocaleString('id-ID')} Crystal. Terima kasih sudah mendukung Komikita!`,
      };
      await db.ref().update(upd);
      setOrders(prev => prev && prev.filter(x => x.id !== o.id));
      showToast(`Premium ${o.name} aktif sampai ${new Date(until).toLocaleDateString('id-ID')} (+${plan.crystal} Crystal).`, 'success');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  const rejectOrder = async (o: any) => {
    if (!window.confirm(`Tolak pesanan ${o.name}?`)) return;
    setSaving(true);
    try {
      const now = Date.now();
      const ikey = db.ref(`users/${o.uid}/inbox`).push().key;
      await db.ref().update({
        [`premiumOrders/${o.id}/status`]: 'rejected',
        [`premiumOrders/${o.id}/rejectedAt`]: now,
        [`users/${o.uid}/inbox/${ikey}`]: {
          jenis: 'premium_no', judul: 'Pembayaran belum ditemukan', waktu: now,
          isi: `Pesanan Rp ${Number(o.amount).toLocaleString('id-ID')} tidak kami temukan di mutasi. Kalau kamu sudah bayar, hubungi admin atau buat pesanan baru.`,
        },
      });
      setOrders(prev => prev && prev.filter(x => x.id !== o.id));
      showToast('Pesanan ditolak.', 'success');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  // Turunkan Premium yang masa aktifnya sudah habis (Premium manual tanpa batas waktu tidak disentuh)
  const sweepPremium = async () => {
    setSaving(true);
    try {
      const snap = await db.ref('users').get();
      const now = Date.now();
      const upd: Record<string, string> = {};
      snap.forEach((c: any) => {
        const v = c.val() || {};
        if (v.role === 'Komikita Premium' && Number(v.premiumUntil) > 0 && Number(v.premiumUntil) < now) upd[`users/${c.key}/role`] = 'Member';
      });
      const n = Object.keys(upd).length;
      if (n) await db.ref().update(upd);
      showToast(n ? `${n} Premium habis diturunkan jadi Member.` : 'Tidak ada Premium yang habis.', 'success');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  // Hadiah masuk ke Notifikasi penerima (tab Hadiah) dan baru diterapkan setelah dia klaim
  const sendToTarget = async (g: { type: GiftType; amount?: number; itemKey?: string; itemName: string }) => {
    if (!target) { showToast('Pilih user dulu.', 'error'); return; }
    setSaving(true);
    try {
      await sendGifts(db, [target.uid], { ...g, from: gSender || 'Developer', message: gMsg });
      showToast('Hadiah terkirim ke notifikasi ' + target.name + '.', 'success');
      setGift({ title: 'Gift terkirim!', sub: g.itemName + ' untuk ' + target.name, visual: <GiftVisual type={g.type} itemKey={g.itemKey} /> });
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  const applyNumber = () => {
    if (act !== 'koin' && act !== 'level' && act !== 'exp' && act !== 'poin') return;
    const n = parseInt(amount);
    if (isNaN(n) || n < 0) { showToast('Isi angka yang benar.', 'error'); return; }
    if ((mode as string) === 'add') {
      if (n <= 0) { showToast('Isi angka lebih dari 0.', 'error'); return; }
      sendToTarget({ type: act as GiftType, amount: n, itemName: giftTitle(act as GiftType, n) });
      return;
    }
    if (act === 'poin') { applyPoints(n); return; }
    const calc = (c: number) => (mode === 'add' ? c + n : mode === 'sub' ? c - n : n);
    run((cur) => {
      const lvl = Number(cur.level) || 1;
      if (act === 'koin') return { koin: Math.max(0, calc(Number(cur.koin) || 0)) };
      if (act === 'level') { const l = Math.max(1, calc(lvl)); return { level: l, exp: (l - 1) * 200 }; }
      const e = Math.max(0, calc(Number.isFinite(Number(cur.exp)) ? Number(cur.exp) : (lvl - 1) * 200));
      return { exp: e, level: Math.floor(e / 200) + 1 };
    }, 'Berhasil diterapkan.', mode === 'add' ? { title: 'Gift terkirim!', sub: '+' + n + ' ' + (act === 'koin' ? 'Crystal' : act === 'level' ? 'Level' : 'EXP') + ' untuk ' + (target?.name || 'user') } : undefined);
  };

  const applyReset = async () => {
    if (!target) { showToast('Pilih user dulu.', 'error'); return; }
    const lbRef = db.ref(`leaderboard/s${currentSeason().id}/${target.uid}`);
    if (resetPick === 'level') { run(() => ({ level: 1, exp: 0 }), 'Level & EXP direset.'); return; }
    if (resetPick === 'koin') { run(() => ({ koin: 0 }), 'Crystal direset.'); return; }
    if (resetPick === 'poin') {
      setSaving(true);
      try {
        await lbRef.remove();
        if (target.uid === uid) useUserStats.setState((st) => ({ season: { ...st.season, points: 0, chapters: 0, night: 0, read: [], bonus: 0 } }));
        showToast('Poin musim ' + target.name + ' direset.', 'success');
      } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
      setSaving(false);
      return;
    }
    // hapus data user
    if (target.uid === uid) { showToast('Data akun developer sendiri nggak bisa dihapus dari sini.', 'error'); return; }
    if (!window.confirm('Hapus SEMUA data ' + target.name + ' (level, crystal, item, peringkat)? Tidak bisa dibatalkan.')) return;
    setSaving(true);
    try {
      await db.ref('users/' + target.uid).remove();
      await lbRef.remove();
      setUsers(prev => prev && prev.filter(x => x.uid !== target.uid));
      setTarget(null); setTData(null);
      showToast('Data user dihapus.', 'success');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  // Isi peringkat musim ini dari akun lama: poin awal = EXP (disimpan sebagai bonus supaya tidak tertimpa saat user baca chapter)
  const seedBoard = async () => {
    setSaving(true);
    try {
      const sid = currentSeason().id;
      const [usersSnap, lbSnap] = await Promise.all([db.ref('users').get(), db.ref(`leaderboard/s${sid}`).get()]);
      const upd: Record<string, any> = {};
      let n = 0;
      usersSnap.forEach((c: any) => {
        const v = c.val() || {};
        const exp = Math.floor(Number(v.exp) || 0);
        if (exp <= 0 || lbSnap.hasChild(String(c.key))) return;
        upd[`leaderboard/s${sid}/${c.key}`] = { name: v.displayName || 'User', photo: v.photoURL || '', points: exp, bonus: exp, chapters: 0, streak: 0, night: 0, t: Date.now() };
        n++;
      });
      if (n) await db.ref().update(upd);
      showToast(n ? `${n} akun dimasukkan ke peringkat.` : 'Tidak ada akun baru untuk dimasukkan.', 'success');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  // Hapus entri peringkat akun yang tidak aktif (lebih dari ACTIVE_DAYS hari)
  const cleanBoard = async () => {
    setSaving(true);
    try {
      const sid = currentSeason().id;
      const snap = await db.ref(`leaderboard/s${sid}`).get();
      const cutoff = Date.now() - ACTIVE_DAYS * 86400000;
      const upd: Record<string, null> = {};
      let n = 0;
      snap.forEach((c: any) => { if ((Number(c.val()?.t) || 0) < cutoff) { upd[`leaderboard/s${sid}/${c.key}`] = null; n++; } });
      if (n) await db.ref().update(upd);
      showToast(n ? `${n} akun tidak aktif dihapus dari peringkat.` : 'Tidak ada akun tidak aktif.', 'success');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  const applyRole = () => {
    if (target?.uid === uid && rolePick !== 'Developer') { showToast('Role Developer akun sendiri nggak bisa dicabut dari sini.', 'error'); return; }
    run(() => ({ role: rolePick }), 'Role diubah jadi ' + rolePick + '.');
  };

  const applyItem = (give: boolean) => {
    if (!itemKey) { showToast('Pilih item dulu.', 'error'); return; }
    const c = DEV_ITEMS[itemCat];
    const nama = c.items.find(i => i.key === itemKey)?.nama || itemKey;
    if (give) { sendToTarget({ type: itemCat as GiftType, itemKey, itemName: nama }); return; }
    run((cur) => {
      const p: any = {};
      if (give) p[c.owned + '/' + itemKey] = itemCat === 'wallpaper' ? (Number(cur.ownedWallpapers?.[itemKey]) || 0) + 1 : true;
      else { p[c.owned + '/' + itemKey] = null; if (cur[c.active] === itemKey) p[c.active] = ''; }
      return p;
    }, give ? nama + ' diberikan.' : nama + ' dicabut.', give ? { title: 'Gift terkirim!', sub: nama + ' untuk ' + (target?.name || 'user') } : undefined);
  };

  const askGlobal = () => {
    if (isItemGift) {
      if (!gItemKey) { showToast('Pilih itemnya dulu.', 'error'); return; }
      setConfirmGlobal(true);
      return;
    }
    const val = parseInt(gVal);
    if (!val || val <= 0) { showToast('Masukkan angka yang benar.', 'error'); return; }
    setConfirmGlobal(true);
  };

  const sendGlobal = async () => {
    const isItem = gType === 'border' || gType === 'wallpaper' || gType === 'effect';
    const val = isItem ? 0 : parseInt(gVal);
    const nama = isItem ? (DEV_ITEMS[gType as ItemCat].items.find(i => i.key === gItemKey)?.nama || gItemKey) : giftTitle(gType, val);
    setConfirmGlobal(false);
    setSaving(true);
    try {
      const snap = await db.ref('users').get();
      const uids: string[] = [];
      snap.forEach((c: any) => { uids.push(String(c.key)); });
      await sendGifts(db, uids, isItem
        ? { type: gType, itemKey: gItemKey, itemName: nama, from: gSender || 'Sistem Komikita', message: gMsg }
        : { type: gType, amount: val, itemName: nama, from: gSender || 'Sistem Komikita', message: gMsg });
      showToast(`Terkirim ke ${uids.length} user. Mereka klaim lewat Notifikasi.`, 'success');
      setGift({ title: 'Gift terkirim!', sub: nama + ' ke ' + uids.length + ' user' });
      setGVal(''); setGItemKey('');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  const FIELD: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#1F1E24', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '13px 14px', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', outline: 'none' };
  const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 800, color: '#8F8D9B', letterSpacing: -0.2, textTransform: 'uppercase', margin: '0 0 6px 2px' };
  const BTN: React.CSSProperties = { width: '100%', border: 0, borderRadius: 16, padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
  const ROW: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
  const chip = (on: boolean): React.CSSProperties => ({ border: 0, borderRadius: 99, padding: '9px 14px', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', background: on ? '#0E8A6A' : '#1F1E24', color: on ? '#fff' : '#B5B3C0' });

  const ql = q.trim().replace('#', '').toLowerCase();
  const matches = (users || []).filter(u => !ql || u.name.toLowerCase().includes(ql) || u.uid.toLowerCase().startsWith(ql) || numericId(u.uid).includes(ql.replace(/^#/, ''))).slice(0, 6);
  const cnt = (o: any) => Object.keys(o || {}).length;
  const numAct = act === 'koin' || act === 'level' || act === 'exp' || act === 'poin';
  const modeLabel = DEV_MODES.find(m => m[0] === mode)![1];
  const catDef = DEV_ITEMS[itemCat];
  const nameOf = (cat: ItemCat, key: string) => DEV_ITEMS[cat].items.find(i => i.key === key)?.nama || '';
  const isItemGift = gType === 'border' || gType === 'wallpaper' || gType === 'effect';
  const Avatar = ({ src, size }: { src: string; size: number }) => src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: '#2A2931', flexShrink: 0 }} />;

  return (
    <Sheet open={open} onClose={onClose} title="Panel Developer">
      <GiftEffect show={!!gift} title={gift?.title} sub={gift?.sub} visual={gift?.visual} onDone={() => setGift(null)} />
      {toast && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 14, textAlign: 'center', fontSize: 14, fontWeight: 800, background: toast.type === 'success' ? 'rgba(14,138,106,.18)' : 'rgba(255,92,92,.12)', color: toast.type === 'success' ? '#3FD6A0' : '#FF7A7A' }}>
          {toast.msg}
        </div>
      )}

      {/* Tab */}
      <div style={{ display: 'flex', gap: 4, background: '#1F1E24', borderRadius: 14, padding: 4, marginBottom: 14 }}>
        {([['user', 'Kelola user'], ['global', 'Hadiah semua'], ['bayar', 'Pembayaran']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, border: 0, borderRadius: 11, padding: '10px 0', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', background: tab === k ? '#2A2931' : 'transparent', color: tab === k ? '#fff' : '#8F8D9B' }}>{l}</button>
        ))}
      </div>

      {tab === 'user' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 1. Pilih user */}
          <div>
            <label style={LABEL}>1 · Pilih user</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={FIELD} value={q} onChange={e => setQ(e.target.value)} placeholder={loadingUsers ? 'Memuat user...' : 'Cari nama atau ID'} />
              <button onClick={() => { const me = (users || []).find(u => u.uid === uid); if (me) pick(me); }} style={{ ...chip(false), borderRadius: 14, padding: '0 16px' }}>Saya</button>
            </div>

            {q && (
              <div style={{ marginTop: 8, background: '#1F1E24', borderRadius: 14, overflow: 'hidden' }}>
                {matches.length === 0 && <div style={{ padding: 14, fontSize: 14, fontWeight: 700, color: '#8F8D9B' }}>{loadingUsers ? 'Memuat...' : 'User tidak ditemukan.'}</div>}
                {matches.map(u => (
                  <button key={u.uid} onClick={() => pick(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 0, borderTop: '1px solid rgba(255,255,255,.06)', background: 'none', color: '#fff', padding: '10px 12px', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
                    <Avatar src={u.photo} size={34} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8F8D9B' }}>{getShortUid(u.uid)} · Lv {u.level} · {u.role}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!q && target && tData && (
              <div style={{ marginTop: 8, background: '#1F1E24', borderRadius: 16, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={tData.photoURL || target.photo} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tData.displayName || target.name}{target.uid === uid ? ' (kamu)' : ''}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#8F8D9B', fontFamily: 'monospace', letterSpacing: 1 }}>{getShortUid(target.uid)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', marginTop: 10, textAlign: 'center' }}>
                  {[['Crystal', (Number(tData.koin) || 0).toLocaleString('id-ID')], ['Level', String(Number(tData.level) || 1)], ['EXP', (Number(tData.exp) || 0).toLocaleString('id-ID')], ['Role', tData.role || 'Member']].map(([l, v], i) => (
                    <div key={l} style={{ flex: 1, minWidth: 0, borderLeft: i ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{v}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8F8D9B' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#8F8D9B', lineHeight: 1.5 }}>
                  Punya: {cnt(tData.ownedBorders)} border · {cnt(tData.ownedWallpapers)} wallpaper · {cnt(tData.ownedEffects)} effect<br />
                  Dipakai: {tData.activeBorder ? nameOf('border', tData.activeBorder) || tData.activeBorder : '–'} · {tData.activeWallpaper ? nameOf('wallpaper', tData.activeWallpaper) || tData.activeWallpaper : '–'} · {tData.activeEffect ? nameOf('effect', tData.activeEffect) || tData.activeEffect : '–'}
                </div>
              </div>
            )}
          </div>

          {/* 2. Pilih aksi */}
          <div>
            <label style={LABEL}>2 · Mau ngapain?</label>
            <div style={ROW}>
              {DEV_ACTS.map(([k, l]) => <button key={k} onClick={() => { setAct(k); setAmount(''); }} style={chip(act === k)}>{l}</button>)}
            </div>
          </div>

          {/* 3. Detail aksi */}
          {numAct && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={ROW}>
                {DEV_MODES.map(([k, l]) => <button key={k} onClick={() => setMode(k)} style={chip(mode === k)}>{l}</button>)}
              </div>
              <div style={ROW}>
                {DEV_PRESETS[act as 'koin' | 'level' | 'exp' | 'poin'].map(n => (
                  <button key={n} onClick={() => setAmount(String(n))} style={chip(amount === String(n))}>{n.toLocaleString('id-ID')}</button>
                ))}
              </div>
              <input style={FIELD} value={amount} onChange={e => setAmount(e.target.value)} type="number" inputMode="numeric" placeholder="Atau ketik jumlah sendiri" />
              <button onClick={applyNumber} disabled={saving || !target} style={{ ...BTN, background: '#0E8A6A', color: '#fff', opacity: saving || !target ? 0.5 : 1 }}>
                {saving ? 'Memproses...' : `${modeLabel} ${amount || '…'} ${DEV_UNIT[act as 'koin' | 'level' | 'exp' | 'poin']}`}
              </button>
            </div>
          )}

          {act === 'role' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={ROW}>
                {DEV_ROLES.map(r => <button key={r} onClick={() => setRolePick(r)} style={chip(rolePick === r)}>{r}</button>)}
              </div>
              <button onClick={applyRole} disabled={saving || !target} style={{ ...BTN, background: '#0E8A6A', color: '#fff', opacity: saving || !target ? 0.5 : 1 }}>
                {saving ? 'Memproses...' : `Jadikan ${rolePick}`}
              </button>
            </div>
          )}

          {(act === 'item' || (numAct && mode === 'add')) && (
            <div style={{ marginTop: 10 }}>
              <label style={LABEL}>Pesan untuk penerima (opsional)</label>
              <input style={FIELD} value={gMsg} onChange={e => setGMsg(e.target.value)} placeholder="Contoh: Selamat ya!" />
            </div>
          )}

          {act === 'reset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={ROW}>
                {DEV_RESETS.map(([k, l]) => <button key={k} onClick={() => setResetPick(k)} style={chip(resetPick === k)}>{l}</button>)}
              </div>
              <button onClick={applyReset} disabled={saving || !target} style={{ ...BTN, background: 'rgba(255,92,92,.12)', color: '#FF7A7A', opacity: saving || !target ? 0.5 : 1 }}>
                {saving ? 'Memproses...' : resetPick === 'hapus' ? 'Hapus data user' : `Reset ${DEV_RESETS.find(r => r[0] === resetPick)![1]}`}
              </button>
            </div>
          )}

          {act === 'item' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={ROW}>
                {(Object.keys(DEV_ITEMS) as ItemCat[]).map(k => <button key={k} onClick={() => { setItemCat(k); setItemKey(''); }} style={chip(itemCat === k)}>{DEV_ITEMS[k].label}</button>)}
              </div>
              <select style={FIELD} value={itemKey} onChange={e => setItemKey(e.target.value)}>
                <option value="">Pilih {catDef.label.toLowerCase()}...</option>
                {catDef.items.map(i => <option key={i.key} value={i.key}>{i.nama}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => applyItem(true)} disabled={saving || !target} style={{ ...BTN, flex: 1, width: 'auto', background: '#0E8A6A', color: '#fff', opacity: saving || !target ? 0.5 : 1 }}>Beri</button>
                <button onClick={() => applyItem(false)} disabled={saving || !target} style={{ ...BTN, flex: 1, width: 'auto', background: 'rgba(255,92,92,.12)', color: '#FF7A7A', opacity: saving || !target ? 0.5 : 1 }}>Cabut</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'bayar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={LABEL}>Pesanan menunggu{orders ? ` (${orders.length})` : ''}</label>
            <button onClick={loadOrders} style={{ ...chip(false), padding: '6px 14px' }}>Muat ulang</button>
          </div>
          {orders === null && <div style={{ color: '#8F8D9B', fontWeight: 700, padding: 10 }}>Memuat...</div>}
          {orders && orders.length === 0 && <div style={{ color: '#8F8D9B', fontWeight: 700, lineHeight: 1.4, padding: 10 }}>Belum ada pesanan. Pesanan muncul di sini saat user memilih paket Premium.</div>}
          {orders && orders.map(o => {
            const kembar = orders.filter(x => x.amount === o.amount).length > 1;
            const mnt = Math.max(0, Math.round((Date.now() - (o.createdAt || 0)) / 60000));
            return (
              <div key={o.id} style={{ background: '#1F1E24', borderRadius: 18, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name || 'User'}</div>
                  {o.claimed && <span style={{ background: 'rgba(111,214,178,.15)', color: '#6FD6B2', fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>Sudah bayar ✓</span>}
                </div>
                <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -1, color: '#F5C84B', marginTop: 4 }}>Rp {Number(o.amount).toLocaleString('id-ID')}</div>
                <div style={{ color: '#8F8D9B', fontSize: 13, fontWeight: 700, marginTop: 2 }}>{DEV_PLAN_DAYS[o.plan]?.nama || o.plan} · {mnt < 60 ? `${mnt} menit lalu` : `${Math.floor(mnt / 60)} jam lalu`}</div>
                {kembar && <div style={{ color: '#FF7A7A', fontSize: 12.5, fontWeight: 800, marginTop: 6 }}>Ada pesanan lain dengan nominal sama. Cocokkan dengan nama pengirim di DANA.</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => approveOrder(o)} disabled={saving} style={{ ...BTN, flex: 1, width: 'auto', background: '#0E8A6A', color: '#fff', opacity: saving ? 0.5 : 1 }}>Setujui</button>
                  <button onClick={() => rejectOrder(o)} disabled={saving} style={{ ...BTN, flex: 1, width: 'auto', background: 'rgba(255,92,92,.12)', color: '#FF7A7A', opacity: saving ? 0.5 : 1 }}>Tolak</button>
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 14, marginTop: 6 }}>
            <label style={LABEL}>Perawatan Premium</label>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8F8D9B', lineHeight: 1.4, marginBottom: 10 }}>Turunkan semua Premium yang masa aktifnya sudah habis jadi Member. Premium dari Panel Developer tanpa batas waktu tidak ikut diturunkan.</div>
            <button onClick={sweepPremium} disabled={saving} style={{ ...BTN, background: '#1F1E24', color: '#fff', opacity: saving ? 0.5 : 1 }}>Turunkan Premium yang habis</button>
          </div>
        </div>
      )}

      {tab === 'global' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8F8D9B', lineHeight: 1.4 }}>Hadiah ini dikirim ke semua user sekaligus dan tidak bisa dibatalkan.</div>
          <div>
            <label style={LABEL}>Jenis hadiah</label>
            <div style={ROW}>
              {GIFT_TYPES.map(([k, l]) => <button key={k} onClick={() => { setGType(k); setGVal(''); setGItemKey(''); setConfirmGlobal(false); }} style={chip(gType === k)}>{l}</button>)}
            </div>
          </div>
          {isItemGift ? (
            <div>
              <label style={LABEL}>Pilih {DEV_ITEMS[gType as ItemCat].label.toLowerCase()}</label>
              <select style={FIELD} value={gItemKey} onChange={e => { setGItemKey(e.target.value); setConfirmGlobal(false); }}>
                <option value="">Pilih...</option>
                {DEV_ITEMS[gType as ItemCat].items.map(i => <option key={i.key} value={i.key}>{i.nama}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label style={LABEL}>{gType === 'koin' ? 'Jumlah crystal' : gType === 'level' ? 'Naik berapa level' : gType === 'exp' ? 'Jumlah EXP' : 'Jumlah poin musim ini'}</label>
              <div style={{ ...ROW, marginBottom: 8 }}>
                {GIFT_PRESETS[gType].map(n => <button key={n} onClick={() => { setGVal(String(n)); setConfirmGlobal(false); }} style={chip(gVal === String(n))}>{n.toLocaleString('id-ID')}</button>)}
              </div>
              <input style={FIELD} value={gVal} onChange={e => { setGVal(e.target.value); setConfirmGlobal(false); }} type="number" inputMode="numeric" placeholder="Atau ketik jumlah sendiri" />
            </div>
          )}
          <div>
            <label style={LABEL}>Alasan</label>
            <div style={{ ...ROW, marginBottom: 8 }}>
              {DEV_REASONS.map(r => <button key={r} onClick={() => setGMsg(r)} style={chip(gMsg === r)}>{r}</button>)}
            </div>
            <input style={FIELD} value={gMsg} onChange={e => setGMsg(e.target.value)} placeholder="Atau tulis sendiri" />
          </div>
          <div>
            <label style={LABEL}>Pengirim</label>
            <input style={FIELD} value={gSender} onChange={e => setGSender(e.target.value)} />
          </div>

          {!confirmGlobal ? (
            <button onClick={askGlobal} disabled={saving} style={{ ...BTN, background: 'rgba(255,92,92,.12)', color: '#FF7A7A', opacity: saving ? 0.5 : 1, marginTop: 4 }}>
              {saving ? 'Mengirim...' : 'Kirim ke semua user'}
            </button>
          ) : (
            <div style={{ background: '#2E2615', border: '1.5px solid #7A6322', borderRadius: 18, padding: 14, marginTop: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: GOLD, letterSpacing: -0.4 }}>
                {isItemGift ? `Kirim ${DEV_ITEMS[gType as ItemCat].items.find(i => i.key === gItemKey)?.nama || ''} ke SEMUA user?` : `Kirim +${gVal} ${GIFT_UNIT[gType]} ke SEMUA user?`}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, opacity: 0.8, marginTop: 2 }}>{gMsg}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => setConfirmGlobal(false)} style={{ ...BTN, flex: 1, width: 'auto', background: '#2A2931', color: '#fff' }}>Batal</button>
                <button onClick={sendGlobal} style={{ ...BTN, flex: 1, width: 'auto', background: GOLD, color: '#2E2615' }}>Ya, kirim</button>
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 14, marginTop: 6 }}>
            <label style={LABEL}>Perawatan peringkat</label>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8F8D9B', lineHeight: 1.4, marginBottom: 10 }}>Hapus akun yang tidak aktif lebih dari {ACTIVE_DAYS} hari dari peringkat musim ini.</div>
            <button onClick={cleanBoard} disabled={saving} style={{ ...BTN, background: '#1F1E24', color: '#fff', opacity: saving ? 0.5 : 1 }}>Bersihkan akun tidak aktif</button>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8F8D9B', lineHeight: 1.4, margin: '14px 0 10px' }}>Masukkan semua akun lama yang punya EXP ke peringkat musim ini (poin awal = EXP). Akun yang sudah ada di peringkat dilewati.</div>
            <button onClick={seedBoard} disabled={saving} style={{ ...BTN, background: '#0E8A6A', color: '#fff', opacity: saving ? 0.5 : 1 }}>{saving ? 'Memproses...' : 'Isi peringkat dari akun lama'}</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ─── Tampilan profil (musim) ──────────────────────────────────────────────────
const CARD = '#2A2931';
const MUTED = '#8F8D9B';
const GREEN = '#0E8A6A';
const MAROON = '#4A2A33';
const GOLD = '#F2C14E';
const ICON = '#C8C6D2';

function getShortUid(uid: string) { return numericId(uid); }
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const uuidOf = (l: string) => (l || '').match(UUID_RE)?.[0].toLowerCase() || l;
const numOf = (v: string) => { const m = String(v || '').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };

function Emblem({ t, fill, size = 20 }: { t: Track; fill: string; size?: number }) {
  const outline = { stroke: 'rgba(255,255,255,.45)', strokeWidth: 1.2, strokeLinejoin: 'round' as const };
  const mark = '#fff';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {t === 'Noble' && <><path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6l8-3z" fill={fill} {...outline} /><path d="M7.5 14.5V9.5l2.2 2L12 8l2.3 3.5 2.2-2v5z" fill={mark} /></>}
      {t === 'Murim' && <><path d="M8.5 2.5h7l6 6v7l-6 6h-7l-6-6v-7z" fill={fill} {...outline} /><circle cx={12} cy={9.3} r={1.9} fill={mark} /><path d="M7.8 16.5c0-2.6 1.9-4.2 4.2-4.2s4.2 1.6 4.2 4.2z" fill={mark} /></>}
      {t === 'Demon' && <><path d="M3.5 3l4.5 3h8l4.5-3-1.2 8c0 5.5-3.2 9.2-7.3 10.5C7.9 20.2 4.7 16.5 4.7 11z" fill={fill} {...outline} /><circle cx={9} cy={11} r={1.5} fill={mark} /><circle cx={15} cy={11} r={1.5} fill={mark} /></>}
    </svg>
  );
}

function LockedEmblem({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8.5 2.5h7l6 6v7l-6 6h-7l-6-6v-7z" fill="#2D2C33" stroke="#4A4953" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M8.9 4.2h6.2l4.7 4.7v6.2l-4.7 4.7H8.9l-4.7-4.7V8.9z" fill="none" stroke="#3B3A42" strokeWidth={0.8} strokeDasharray="1.2 1.6" />
      <rect x={9} y={11.2} width={6} height={5} rx={1.2} fill="#8F8D9B" />
      <path d="M10.2 11.2V9.9a1.8 1.8 0 013.6 0v1.3" stroke="#8F8D9B" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </svg>
  );
}

function MiniStat({ icon, label, value, target, unit }: { icon: React.ReactNode; label: string; value: number; target: number; unit?: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#1F1E24', borderRadius: 14, padding: '12px 12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: MUTED, fontSize: 14, fontWeight: 800 }}>{icon}{label}</div>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, letterSpacing: -0.8 }}>
        {fmt(value)}<span style={{ fontSize: 13, color: MUTED, letterSpacing: -0.2 }}>/ {fmt(target)}{unit ? ` ${unit}` : ''}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: MAROON, marginTop: 10 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: GREEN }} />
      </div>
    </div>
  );
}

function HexIcon({ size = 22, color = ICON }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round">
      <path d="M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4z" /><circle cx={12} cy={12} r={3.2} />
    </svg>
  );
}

function MenuRow({ icon, title, sub, right, onClick, href, border }: {
  icon: React.ReactNode; title: string; sub?: string; right?: string;
  onClick?: () => void; href?: string; border?: boolean;
}) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px 10px 18px', minHeight: 57, borderTop: border ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
      <span style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15, color: '#fff' }}>{title}</div>
        {sub && <div style={{ fontSize: 15, fontWeight: 700, color: MUTED, letterSpacing: -0.5, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      {right && <span style={{ fontSize: 18, fontWeight: 800, color: MUTED, letterSpacing: -0.6 }}>{right}</span>}
      <ChevronRight size={20} color={MUTED} style={{ flexShrink: 0 }} />
    </div>
  );
  if (href) return <Link href={href} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>{inner}</Link>;
  return (
    <button onClick={onClick} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}>
      {inner}
    </button>
  );
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 14, fontWeight: 800, color: '#B5B3C0', letterSpacing: -0.3, margin: '26px 16px 10px', textTransform: 'uppercase' }}>{children}</div>
);

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARD, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: '12px 16px 36px', border: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ width: 40, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ fontSize: 16, fontWeight: 800, textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface UserState { uid: string; displayName: string | null; photoURL: string | null; }

export default function ProfilePage() {
  const season = currentSeason();
  const mine = useUserStats((st) => st.season);
  const { favorites } = useFavorites();
  const { history } = useHistory();
  const [mounted, setMounted]           = useState(false);
  const [user, setUser]                 = useState<UserState | null>(null);
  const [userData, setUserData]         = useState<any>(null);
  const [loadingAuth, setLoadingAuth]   = useState(true);

  // Refresh: browser mengembalikan posisi scroll lama saat konten belum siap -> halaman nyangkut di tengah.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (!loadingAuth) window.scrollTo(0, 0);
  }, [loadingAuth]);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [borderShopOpen, setBorderShopOpen]   = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [sheet, setSheet] = useState<null | 'edit' | 'badges'>(null);
  const [devOpen, setDevOpen] = useState(false);
  const [seasonRank, setSeasonRank] = useState<number | null>(null);
  const [newChapters, setNewChapters] = useState(0);
  const dbRef = useRef<any>(null);

  useEffect(() => { setMounted(true); }, []);

  // Halaman Pengaturan membuka Panel Developer lewat /profile?dev=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('dev') === '1') {
      setDevOpen(true);
      window.history.replaceState(null, '', '/profile');
    }
  }, []);

  useEffect(() => {
    let unsub: any = null;
    getFirebase().then(async ({ auth, db }) => {
      dbRef.current = db;
      try { await auth.getRedirectResult(); } catch (_) { /* abaikan error redirect */ }
      unsub = auth.onAuthStateChanged(async (fu: any) => {
        setLoadingAuth(false);
        if (!fu) { setUser(null); setUserData(null); return; }
        setUser({ uid: fu.uid, displayName: fu.displayName, photoURL: fu.photoURL });
        const snap = await db.ref(`users/${fu.uid}`).get();
        if (snap.exists()) {
          setUserData(snap.val());
        } else {
          const nd = { displayName: fu.displayName || 'User', photoURL: fu.photoURL || '', email: fu.email || '', role: 'Member', level: 1, exp: 0, koin: 0, menitMenonton: 0, joinedAt: Date.now(), activeBorder: '', ownedBorders: [] };
          await db.ref(`users/${fu.uid}`).set(nd);
          setUserData(nd);
        }
      });
    }).catch(() => setLoadingAuth(false));
    return () => { if (unsub) unsub(); };
  }, []);

  const pts      = mounted && mine.id === season.id ? mine.points + (mine.bonus || 0) : 0;
  const chapters = mounted && mine.id === season.id ? mine.chapters : 0;
  const night    = mounted && mine.id === season.id ? mine.night : 0;
  const streak   = mounted ? mine.streak : 0;
  const { rank, next } = rankFor(pts);

  // Peringkat musim = jumlah pemain dengan poin lebih tinggi + 1
  useEffect(() => {
    if (!user || !mounted || pts <= 0) { setSeasonRank(null); return; }
    let alive = true;
    (async () => {
      try {
        await pushSeasonScore();
        const { db } = await getFirebase();
        const snap = await db.ref(`leaderboard/s${season.id}`).orderByChild('points').startAt(pts + 1).get();
        if (alive) setSeasonRank(snap.numChildren() + 1);
      } catch { /* biarkan tampil "–" */ }
    })();
    return () => { alive = false; };
  }, [user, mounted, pts, season.id]);

  // Jumlah favorit yang punya chapter baru (data cache dari halaman Koleksi)
  useEffect(() => {
    if (!mounted) return;
    try {
      const meta = JSON.parse(localStorage.getItem('komiku-fav-meta') || '{}');
      let n = 0;
      for (const f of favorites) {
        const m = meta[f.link];
        if (!m || m.latestNum == null) continue;
        const id = uuidOf(f.link);
        let readNum: number | null = null;
        for (const h of history) {
          if ((h.mangaLink && uuidOf(h.mangaLink) === id) || h.mangaTitle === f.title) {
            const v = numOf(h.chapterNumber);
            if (v != null) readNum = readNum == null ? v : Math.max(readNum, v);
          }
        }
        if (readNum != null && Math.floor(m.latestNum) > Math.floor(readNum)) n++;
      }
      setNewChapters(n);
    } catch { /* abaikan */ }
  }, [mounted, favorites, history]);

  const handleLogin = useCallback(async () => {
    setLoadingLogin(true);
    try {
      const { auth } = await getFirebase();
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      // Coba popup dulu, kalau gagal (mobile/browser block) pakai redirect
      try {
        await auth.signInWithPopup(provider);
      } catch (popupErr: any) {
        const blocked = ['popup-blocked', 'popup-closed-by-user', 'cancelled-popup-request', 'web-storage-unsupported'];
        if (blocked.some(c => popupErr.code?.includes(c))) {
          await auth.signInWithRedirect(provider);
        } else {
          throw popupErr;
        }
      }
    } catch (e: any) {
      if (!e.code?.includes('redirect')) alert('Login gagal: ' + (e.message || e.code));
    } finally {
      setLoadingLogin(false);
    }
  }, []);

  const handleEquipBorder = useCallback(async (key: string) => {
    if (!user || !dbRef.current) return;
    await dbRef.current.ref(`users/${user.uid}`).update({ activeBorder: key });
    setUserData((prev: any) => ({ ...prev, activeBorder: key }));
  }, [user]);

  const handleBuyBorder = useCallback(async (key: string, harga: number) => {
    if (!user || !dbRef.current) return;
    const snap = await dbRef.current.ref(`users/${user.uid}`).get();
    const d = snap.val();
    const currentKoin = d.koin || 0;
    if (currentKoin < harga) { alert('Crystal tidak cukup!'); return; }
    const owned = d.ownedBorders ? Object.keys(d.ownedBorders) : [];
    if (owned.includes(key)) { alert('Sudah dimiliki!'); return; }
    await dbRef.current.ref(`users/${user.uid}`).update({
      koin: currentKoin - harga,
      [`ownedBorders/${key}`]: true,
      activeBorder: key,
    });
    setUserData((prev: any) => ({
      ...prev,
      koin: currentKoin - harga,
      ownedBorders: { ...(prev.ownedBorders || {}), [key]: true },
      activeBorder: key,
    }));
  }, [user]);

  const handleRename = useCallback(async (newName: string) => {
    if (!user || !dbRef.current) return;
    const snap = await dbRef.current.ref(`users/${user.uid}`).get();
    const d = snap.val() || {};
    const freeUsed = d.freeRenameUsed || false;
    const currentKoin = d.koin || 0;
    const COST = 500;
    if (freeUsed) {
      if (currentKoin < COST) throw new Error('Crystal tidak cukup!');
      await dbRef.current.ref(`users/${user.uid}`).update({ displayName: newName, koin: currentKoin - COST });
      setUserData((prev: any) => ({ ...prev, displayName: newName, koin: currentKoin - COST }));
    } else {
      await dbRef.current.ref(`users/${user.uid}`).update({ displayName: newName, freeRenameUsed: true });
      setUserData((prev: any) => ({ ...prev, displayName: newName, freeRenameUsed: true }));
    }
  }, [user]);

  const role         = userData?.role ?? 'Member';
  const isDev        = role === 'Developer';
  const isPremium    = role === 'Komikita Premium';
  const level        = userData?.level ?? 1;
  const koin         = userData?.koin ?? 0;
  const freeRenameUsed = userData?.freeRenameUsed ?? false;
  const activeBorder = userData?.activeBorder ?? '';
  const activeEffect = userData?.activeEffect ?? '';
  const ownedBorders = userData?.ownedBorders ? Object.keys(userData.ownedBorders) : [];
  const photoURL = (userData?.photoURL ?? user?.photoURL) || '';
  const unlocked     = RANKS.filter(r => pts >= r.min).length;
  const target       = next ? next.min : Math.max(pts, 1);
  const barPct       = Math.min(100, (pts / target) * 100);
  const soon = () => alert('Fitur Premium segera hadir.');

  if (loadingAuth) return (
    <div className="min-h-screen bg-[#1B1A20] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#1B1A20] flex flex-col pb-2">
      <div className="bg-[#1B1A20]/90 backdrop-blur-md px-6 pt-12 pb-4 sticky top-0 z-30 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">Akun<span className="text-gray-300">.</span></h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="w-24 h-24 rounded-full bg-[#2A2931] border-2 border-white/10 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Akses Akun Komikita</h2>
          <p className="text-gray-400 text-sm font-medium mt-2 leading-relaxed">Login untuk membuka fitur Level, ikut berdiskusi di kolom Komentar, dan menyimpan progress kamu.</p>
        </div>
        <button onClick={handleLogin} disabled={loadingLogin}
          className="flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-2xl font-bold text-sm w-full justify-center active:scale-95 transition-transform disabled:opacity-60">
          {loadingLogin
            ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M23.52 12.2727C23.52 11.4218 23.4436 10.6036 23.3018 9.81818H12V14.4545H18.4582C18.18 15.9491 17.3345 17.2145 16.0691 18.0655V21.0545H19.9473C22.2164 18.96 23.52 15.8945 23.52 12.2727Z" fill="#4285F4" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 24C15.24 24 17.9673 22.92 19.9473 21.0545L16.0691 18.0655C15.0055 18.7855 13.6255 19.2218 12 19.2218C8.85273 19.2218 6.18545 17.0945 5.21455 14.2364H1.22182V17.3345C3.20182 21.2727 7.27636 24 12 24Z" fill="#34A853" />
                <path fillRule="evenodd" clipRule="evenodd" d="M5.21455 14.2364C4.96364 13.4836 4.82182 12.6764 4.82182 11.8473C4.82182 11.0182 4.96364 10.2109 5.21455 9.45818V6.36H1.22182C0.447273 7.90909 0 9.81818 0 11.8473C0 13.8764 0.447273 15.7855 1.22182 17.3345L5.21455 14.2364Z" fill="#FBBC05" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 4.47273C13.7673 4.47273 15.3491 5.08364 16.5927 6.27273L20.0345 2.83091C17.9564 0.894545 15.2291 0 12 0C7.27636 0 3.20182 2.72727 1.22182 6.36L5.21455 9.45818C6.18545 6.6 8.85273 4.47273 12 4.47273Z" fill="#EA4335" />
              </svg>
          }
          Lanjutkan dengan Google
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#1B1A20', color: '#fff', minHeight: '100vh', paddingBottom: 130 }}>

      {/* Header */}
      <div style={{ position: 'relative', isolation: 'isolate', padding: userData?.activeBackground ? '24px 16px 22px' : '24px 16px 0', textAlign: 'center', overflow: 'hidden' }}>
        <ProfileBg k={userData?.activeBackground} fade />
        {activeEffect && <ProfileEffect effectKey={activeEffect} />}
        <div style={{ position: 'absolute', top: 14, right: 10, display: 'flex', gap: 2 }}>
          <Link href="/notifikasi" aria-label="Notifikasi" style={{ position: 'relative', padding: 8, color: '#fff', display: 'flex' }}>
            <Bell size={26} strokeWidth={1.8} />
            {newChapters > 0 && <span style={{ position: 'absolute', top: 7, right: 9, width: 11, height: 11, borderRadius: '50%', background: '#FF5C5C' }} />}
          </Link>
          <Link href="/settings" aria-label="Pengaturan" style={{ padding: 8, display: 'flex' }}>
            <HexIcon size={26} color="#fff" />
          </Link>
        </div>

        <AvatarWithBorder src={photoURL} size={72} borderKey={activeBorder || undefined} onClick={() => void 0} />

        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.15, marginTop: 22 }}>
          <PremiumName premium={isPremium && !isDev} dev={isDev}>{userData?.displayName || user.displayName || 'User'}</PremiumName>
          {isPremium && !isDev && <span style={{ marginLeft: 8 }}><VerifiedBadge size={22} /></span>}
          {isDev && <span style={{ marginLeft: 8 }}><DevBadge size={26} /></span>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: rank.bg, padding: '3px 14px 3px 5px', borderRadius: 99, fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>
            <Emblem t={rank.track} fill={rank.bg} size={18} />{rank.name}
          </span>
          {isDev && (
            <span style={{ background: 'linear-gradient(90deg,#22d3ee,#818cf8,#e879f9)', color: '#0b0b14', padding: '3px 12px', borderRadius: 99, fontSize: 13, fontWeight: 800 }}>DEVELOPER</span>
          )}
          {isPremium && !isDev && (
            <span style={{ background: GOLD, color: '#2E2615', padding: '3px 12px', borderRadius: 99, fontSize: 13, fontWeight: 800 }}>PREMIUM</span>
          )}
        </div>
      </div>

      {/* Ringkasan: peringkat / tingkat / poin */}
      <div style={{ margin: '16px 26px 0', background: CARD, borderRadius: 18, display: 'flex', padding: '14px 0' }}>
        {[
          { v: seasonRank != null ? `#${fmt(seasonRank)}` : '–', l: 'Peringkat musim' },
          { v: String(level), l: 'Tingkat' },
          { v: fmtC(pts), l: 'Poin' },
        ].map((x, i) => (
          <div key={x.l} style={{ flex: 1, textAlign: 'center', borderLeft: i ? '1px solid rgba(255,255,255,.08)' : 'none', margin: '2px 0', minWidth: 0 }}>
            <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.2 }}>{x.v}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: -0.4, whiteSpace: 'nowrap', padding: '0 4px' }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Kartu musim */}
      <div style={{ margin: '32px 16px 0', background: CARD, borderRadius: 22, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {next ? <LockedEmblem size={46} /> : <Emblem t={rank.track} fill={rank.bg} size={46} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: MUTED, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>
              Musim {season.id} · {next ? 'Lencana berikutnya' : 'Lencana tertinggi'}
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {next ? next.name : rank.name}
            </div>
          </div>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -1, whiteSpace: 'nowrap' }}>
            {fmtC(pts)}{next && <span style={{ fontSize: 14, color: MUTED, letterSpacing: -0.3 }}> / {fmt(next.min)}</span>}
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: MAROON, marginTop: 14 }}>
          <div style={{ width: `${barPct}%`, height: '100%', borderRadius: 4, background: GREEN }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <MiniStat icon={<BookOpen size={16} color={ICON} />} label="Chapter" value={chapters} target={TARGETS.chapter} />
          <MiniStat icon={<Flame size={16} color={ICON} />} label="Streak" value={streak} target={TARGETS.streak} unit="hari" />
          <MiniStat icon={<Moon size={16} color={ICON} />} label="Malam" value={night} target={TARGETS.night} />
        </div>
      </div>

      {/* Premium */}
      {!isPremium && (
        <div style={{ margin: '16px 16px 0', background: '#2E2615', border: '1.5px solid #7A6322', borderRadius: 22, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, color: GOLD }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, letterSpacing: -0.2 }}>
              <Crown size={16} fill={GOLD} color={GOLD} /> KOMIKITA PREMIUM
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.9, lineHeight: 1.2, marginTop: 4 }}>Baca tanpa iklan</div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.4, marginTop: 2 }}>Plus unduh massal dan cincin profil emas.</div>
          </div>
          <button onClick={() => { window.location.assign("/premium"); }} style={{ background: GOLD, color: '#2E2615', border: 0, borderRadius: 99, padding: '0 22px', height: 38, fontSize: 17, fontWeight: 800, letterSpacing: -0.5, flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
            Upgrade
          </button>
        </div>
      )}

      {/* Menu: Kamu */}
      <SectionLabel>Kamu</SectionLabel>
      <div style={{ margin: '0 16px', background: CARD, borderRadius: 18, overflow: 'hidden' }}>
        <MenuRow icon={<Pencil size={20} color={ICON} />} title="Edit profil" sub="Nama dan avatar" onClick={() => { window.location.assign('/profile/edit'); }} />
        <MenuRow border icon={<Crown size={21} color={ICON} />} title="Lencana" sub={`${unlocked} terbuka · ${rank.name} dipakai`} onClick={() => window.location.assign('/ranking/lencana')} />
        <MenuRow border icon={<Bell size={20} color={ICON} />} title="Notifikasi" right={newChapters > 0 ? `${newChapters} baru` : undefined} href="/notifikasi" />
        {!isPremium && <MenuRow border icon={<Gift size={20} color={ICON} />} title="Jadi Premium" sub="Bebas iklan, unduh massal" onClick={() => { window.location.assign("/premium"); }} />}
      </div>

      {/* Menu: Aplikasi */}
      <SectionLabel>Aplikasi</SectionLabel>
      <div style={{ margin: '0 16px', background: CARD, borderRadius: 18, overflow: 'hidden' }}>
        <MenuRow icon={<Target size={20} color={ICON} />} title="Misi" sub="Harian dan mingguan, hadiah Crystal" href="/misi" />
        <MenuRow border icon={<ShoppingBag size={20} color={ICON} />} title="KomikStore" sub="Menu spesial Komikita" href="/komikstore" />
        <MenuRow border icon={<HexIcon size={21} />} title="Pengaturan" sub="Akun, data, dan notifikasi" href="/settings" />
        <MenuRow border icon={<Bug size={20} color={ICON} />} title="Laporkan bug" onClick={() => window.open('https://wa.me/6281315059849?text=Halo%2C%20saya%20mau%20lapor%20bug%20Komiku.%0A%0AHalaman%2Fmenu%3A%20%0AYang%20terjadi%3A%20%0AYang%20seharusnya%3A%20%0AHP%2Fbrowser%3A%20', '_blank')} />
      </div>

      {/* Sheets */}
      <Sheet open={sheet === 'edit'} onClose={() => setSheet(null)} title="Edit profil">
        <div style={{ background: '#1F1E24', borderRadius: 16, overflow: 'hidden' }}>
          <MenuRow icon={<Pencil size={20} color={ICON} />} title="Ganti nama" sub={freeRenameUsed ? 'Biaya 500 koin' : '1x gratis tersedia'} onClick={() => { setSheet(null); setRenameModalOpen(true); }} />
        </div>
      </Sheet>

      <Sheet open={sheet === 'badges'} onClose={() => setSheet(null)} title="Lencana musim">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RANKS.map(r => {
            const open = pts >= r.min;
            const current = r.name === rank.name;
            return (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1F1E24', borderRadius: 16, padding: '10px 14px', border: current ? '1px solid rgba(255,255,255,.3)' : '1px solid transparent', opacity: open ? 1 : 0.6 }}>
                <Emblem t={r.track} fill={open ? r.bg : '#3A3940'} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>{r.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: MUTED }}>{fmt(r.min)} poin</div>
                </div>
                {current ? <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,.1)', padding: '3px 10px', borderRadius: 99 }}>Dipakai</span> : !open && <Lock size={16} color={MUTED} />}
              </div>
            );
          })}
        </div>
      </Sheet>

      {isDev && dbRef.current && (
        <DevPanel
          open={devOpen}
          onClose={() => setDevOpen(false)}
          uid={user.uid}
          db={dbRef.current}
          userData={userData}
          onUpdate={(patch) => setUserData((prev: any) => ({ ...prev, ...patch }))}
        />
      )}


      <RenameModal
        open={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        currentName={userData?.displayName || user.displayName || 'User'}
        freeRenameUsed={freeRenameUsed}
        koin={koin}
        onRename={handleRename}
      />
    </div>
  );
}
