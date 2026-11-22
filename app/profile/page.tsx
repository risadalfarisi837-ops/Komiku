'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { X, Check, Bell, Pencil, Crown, Gift, Bug, ChevronRight, BookOpen, Flame, Moon, Lock, ShoppingBag } from 'lucide-react';
import { useFavorites, useHistory, useUserStats } from '@/lib/store';
import { currentSeason, RANKS, rankFor, fmt, TARGETS, Track } from '@/lib/season';
import { pushSeasonScore } from '@/lib/leaderboard';

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

// ─── Border Shop Modal ────────────────────────────────────────────────────────
function DevPanel({ open, onClose, uid, db, userData, onUpdate }: {
  open: boolean; onClose: () => void;
  uid: string; db: any; userData: any; onUpdate: (d: any) => void;
}) {
  const [tab, setTab]       = useState<'user'|'global'>('user');
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<{msg:string; type:'success'|'error'}|null>(null);
  const [confirmGlobal, setConfirmGlobal] = useState(false);

  // Tab: Manajemen User
  const [targetUid, setTargetUid] = useState('');
  const [uLvl,  setULvl]  = useState('');
  const [uExp,  setUExp]  = useState('');
  const [uKoin, setUKoin] = useState('');
  const [uRole, setURole] = useState('');

  // Tab: Global Gift
  const [giftType,   setGiftType]   = useState<'koin'|'level'>('koin');
  const [giftVal,    setGiftVal]    = useState('');
  const [giftSender, setGiftSender] = useState('Sistem Komiku');
  const [giftMsg,    setGiftMsg]    = useState('Kompensasi Spesial');

  useEffect(() => { if (!open) setConfirmGlobal(false); }, [open]);

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const applyToUser = async () => {
    const uidInput = targetUid.trim().replace('#','').toUpperCase();
    if (!uidInput) { showToast('UID target harus diisi.', 'error'); return; }
    const nKoin = parseInt(uKoin), nLvl = parseInt(uLvl), nExp = parseInt(uExp);
    if ((uKoin !== '' && isNaN(nKoin)) || (uLvl !== '' && isNaN(nLvl)) || (uExp !== '' && isNaN(nExp))) {
      showToast('Angka tidak valid.', 'error'); return;
    }
    setSaving(true);
    try {
      const snap = await db.ref('users').get();
      const keys: string[] = [];
      snap.forEach((child: any) => { keys.push(child.key); });
      const matches = keys.filter(k => k.toUpperCase() === uidInput || k.substring(0,6).toUpperCase() === uidInput);
      if (matches.length === 0) { showToast('User tidak ditemukan.', 'error'); setSaving(false); return; }
      if (matches.length > 1)  { showToast('UID ambigu, pakai UID lengkap.', 'error'); setSaving(false); return; }
      const targetFullUid = matches[0];

      const updates: any = {};
      if (uKoin !== '') updates.koin = nKoin;
      if (uRole !== '') updates.role = uRole;
      if (uLvl  !== '') { updates.level = nLvl; if (uExp === '') updates.exp = (nLvl - 1) * 200; }
      if (uExp  !== '') { updates.exp = nExp;   if (uLvl === '') updates.level = Math.floor(nExp / 200) + 1; }
      if (Object.keys(updates).length === 0) { showToast('Isi minimal 1 data.', 'error'); setSaving(false); return; }

      await db.ref(`users/${targetFullUid}`).update(updates);
      if (targetFullUid === uid) onUpdate(updates);
      showToast('Berhasil diterapkan.', 'success');
      setTargetUid(''); setULvl(''); setUExp(''); setUKoin(''); setURole('');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  const askGlobal = () => {
    const val = parseInt(giftVal);
    if (!val || val <= 0) { showToast('Masukkan angka yang benar.', 'error'); return; }
    setConfirmGlobal(true);
  };

  const sendGlobal = async () => {
    const val = parseInt(giftVal);
    setConfirmGlobal(false);
    setSaving(true);
    try {
      const snap = await db.ref('users').get();
      const updates: any = {};
      let count = 0;
      let mine: any = null;
      snap.forEach((child: any) => {
        const u = child.key; const d = child.val();
        if (giftType === 'koin') updates[`users/${u}/koin`] = (d.koin || 0) + val;
        else {
          const newLvl = (d.level || 1) + val;
          updates[`users/${u}/level`] = newLvl;
          updates[`users/${u}/exp`]   = (newLvl - 1) * 200;
        }
        updates[`users/${u}/newGift`] = { from: giftSender, itemName: giftType === 'koin' ? `${val} Crystal` : `+${val} Level`, cat: giftType, isKompensasi: true, timestamp: Date.now() };
        if (u === uid) mine = giftType === 'koin' ? { koin: (d.koin || 0) + val } : { level: (d.level || 1) + val, exp: ((d.level || 1) + val - 1) * 200 };
        count++;
      });
      await db.ref().update(updates);
      if (mine) onUpdate(mine);
      showToast(`Terkirim ke ${count} user.`, 'success');
      setGiftVal('');
    } catch (e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  const FIELD: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#1F1E24', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '13px 14px', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', outline: 'none' };
  const LABEL: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 800, color: '#8F8D9B', letterSpacing: -0.2, textTransform: 'uppercase', margin: '0 0 6px 2px' };
  const BTN: React.CSSProperties = { width: '100%', border: 0, borderRadius: 16, padding: '14px 0', fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <Sheet open={open} onClose={onClose} title="Panel Developer">
      {toast && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 14, textAlign: 'center', fontSize: 15, fontWeight: 800, background: toast.type === 'success' ? 'rgba(14,138,106,.18)' : 'rgba(255,92,92,.12)', color: toast.type === 'success' ? '#3FD6AE' : '#FF7A7A' }}>
          {toast.msg}
        </div>
      )}

      {/* Tab */}
      <div style={{ display: 'flex', gap: 4, background: '#1F1E24', borderRadius: 14, padding: 4, marginBottom: 14 }}>
        {([['user', 'Manajemen user'], ['global', 'Hadiah global']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, border: 0, borderRadius: 11, padding: '10px 0', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', background: tab === k ? '#2A2931' : 'transparent', color: tab === k ? '#fff' : '#8F8D9B' }}>{l}</button>
        ))}
      </div>

      {tab === 'user' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={LABEL}>UID target</label>
            <input style={{ ...FIELD, fontFamily: 'monospace', letterSpacing: 3 }} value={targetUid} onChange={e => setTargetUid(e.target.value)} placeholder="#XXXXXX" autoCapitalize="characters" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={LABEL}>Set crystal</label>
              <input style={FIELD} value={uKoin} onChange={e => setUKoin(e.target.value)} type="number" inputMode="numeric" placeholder="0" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={LABEL}>Set level</label>
              <input style={FIELD} value={uLvl} onChange={e => setULvl(e.target.value)} type="number" inputMode="numeric" placeholder="1" />
            </div>
          </div>
          <div>
            <label style={LABEL}>Set EXP</label>
            <input style={FIELD} value={uExp} onChange={e => setUExp(e.target.value)} type="number" inputMode="numeric" placeholder="0" />
          </div>
          <div>
            <label style={LABEL}>Ubah role</label>
            <select style={FIELD} value={uRole} onChange={e => setURole(e.target.value)}>
              <option value="">Biarkan tetap</option>
              <option value="Member">Member</option>
              <option value="Komiku Premium">Komiku Premium</option>
              <option value="Developer">Developer</option>
            </select>
          </div>
          <button onClick={applyToUser} disabled={saving} style={{ ...BTN, background: '#0E8A6A', color: '#fff', opacity: saving ? 0.5 : 1, marginTop: 4 }}>
            {saving ? 'Memproses...' : 'Terapkan ke user'}
          </button>
        </div>
      )}

      {tab === 'global' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#8F8D9B', lineHeight: 1.4 }}>Hadiah ini dikirim ke semua user sekaligus dan tidak bisa dibatalkan.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={LABEL}>Pengirim</label>
              <input style={FIELD} value={giftSender} onChange={e => setGiftSender(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={LABEL}>Jenis</label>
              <select style={FIELD} value={giftType} onChange={e => setGiftType(e.target.value as 'koin'|'level')}>
                <option value="koin">Crystal</option>
                <option value="level">Level up</option>
              </select>
            </div>
          </div>
          <div>
            <label style={LABEL}>{giftType === 'koin' ? 'Jumlah crystal' : 'Naik berapa level'}</label>
            <input style={FIELD} value={giftVal} onChange={e => setGiftVal(e.target.value)} type="number" inputMode="numeric" placeholder={giftType === 'koin' ? 'Cth: 500' : 'Cth: 5'} />
          </div>
          <div>
            <label style={LABEL}>Pesan / alasan</label>
            <input style={FIELD} value={giftMsg} onChange={e => setGiftMsg(e.target.value)} placeholder="Cth: Server down" />
          </div>

          {!confirmGlobal ? (
            <button onClick={askGlobal} disabled={saving} style={{ ...BTN, background: 'rgba(255,92,92,.12)', color: '#FF7A7A', opacity: saving ? 0.5 : 1, marginTop: 4 }}>
              {saving ? 'Mengirim...' : 'Kirim ke semua user'}
            </button>
          ) : (
            <div style={{ background: '#2E2615', border: '1.5px solid #7A6322', borderRadius: 18, padding: 14, marginTop: 4 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: GOLD, letterSpacing: -0.4 }}>
                Kirim {giftType === 'koin' ? `${giftVal} crystal` : `+${giftVal} level`} ke SEMUA user?
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, opacity: 0.8, marginTop: 2 }}>{giftMsg}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => setConfirmGlobal(false)} style={{ ...BTN, flex: 1, width: 'auto', background: '#2A2931', color: '#fff' }}>Batal</button>
                <button onClick={sendGlobal} style={{ ...BTN, flex: 1, width: 'auto', background: GOLD, color: '#2E2615' }}>Ya, kirim</button>
              </div>
            </div>
          )}
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

function getShortUid(uid: string) { return '#' + uid.substring(0, 6).toUpperCase(); }
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: MUTED, fontSize: 15, fontWeight: 800 }}>{icon}{label}</div>
      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800, letterSpacing: -0.8 }}>
        {fmt(value)}<span style={{ fontSize: 14, color: MUTED, letterSpacing: -0.2 }}>/ {fmt(target)}{unit ? ` ${unit}` : ''}</span>
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
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15, color: '#fff' }}>{title}</div>
        {sub && <div style={{ fontSize: 17, fontWeight: 700, color: MUTED, letterSpacing: -0.5, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      {right && <span style={{ fontSize: 20, fontWeight: 800, color: MUTED, letterSpacing: -0.6 }}>{right}</span>}
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
  <div style={{ fontSize: 16, fontWeight: 800, color: '#B5B3C0', letterSpacing: -0.3, margin: '26px 16px 10px', textTransform: 'uppercase' }}>{children}</div>
);

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARD, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: '12px 16px 36px', border: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ width: 40, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>{title}</div>
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

  const pts      = mounted && mine.id === season.id ? mine.points : 0;
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
  const isPremium    = role === 'Komiku Premium';
  const level        = userData?.level ?? 1;
  const koin         = userData?.koin ?? 0;
  const freeRenameUsed = userData?.freeRenameUsed ?? false;
  const activeBorder = userData?.activeBorder ?? '';
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
          <h2 className="text-xl font-black text-white">Akses Akun Komiku</h2>
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
      <div style={{ position: 'relative', padding: '24px 16px 0', textAlign: 'center' }}>
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

        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.15, marginTop: 22 }}>
          {userData?.displayName || user.displayName || 'User'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: rank.bg, padding: '3px 14px 3px 5px', borderRadius: 99, fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>
            <Emblem t={rank.track} fill={rank.bg} size={18} />{rank.name}
          </span>
          {isPremium && !isDev && (
            <span style={{ background: GOLD, color: '#2E2615', padding: '3px 12px', borderRadius: 99, fontSize: 14, fontWeight: 800 }}>PREMIUM</span>
          )}
        </div>
      </div>

      {/* Ringkasan: peringkat / tingkat / poin */}
      <div style={{ margin: '16px 26px 0', background: CARD, borderRadius: 18, display: 'flex', padding: '14px 0' }}>
        {[
          { v: seasonRank != null ? `#${fmt(seasonRank)}` : '–', l: 'Peringkat musim' },
          { v: String(level), l: 'Tingkat' },
          { v: fmt(pts), l: 'Poin' },
        ].map((x, i) => (
          <div key={x.l} style={{ flex: 1, textAlign: 'center', borderLeft: i ? '1px solid rgba(255,255,255,.08)' : 'none', margin: '2px 0', minWidth: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.2 }}>{x.v}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: MUTED, letterSpacing: -0.4, whiteSpace: 'nowrap', padding: '0 4px' }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Kartu musim */}
      <div style={{ margin: '32px 16px 0', background: CARD, borderRadius: 22, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {next ? <LockedEmblem size={46} /> : <Emblem t={rank.track} fill={rank.bg} size={46} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: MUTED, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>
              Musim {season.id} · {next ? 'Lencana berikutnya' : 'Lencana tertinggi'}
            </div>
            <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {next ? next.name : rank.name}
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, whiteSpace: 'nowrap' }}>
            {fmt(pts)}{next && <span style={{ fontSize: 16, color: MUTED, letterSpacing: -0.3 }}> / {fmt(next.min)}</span>}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>
              <Crown size={16} fill={GOLD} color={GOLD} /> KOMIKU PREMIUM
            </div>
            <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.9, lineHeight: 1.2, marginTop: 4 }}>Baca tanpa iklan</div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.4, marginTop: 2 }}>Plus unduh massal dan cincin profil emas.</div>
          </div>
          <button onClick={() => { window.location.assign("/premium"); }} style={{ background: GOLD, color: '#2E2615', border: 0, borderRadius: 99, padding: '0 22px', height: 38, fontSize: 19, fontWeight: 800, letterSpacing: -0.5, flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
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
        <MenuRow icon={<ShoppingBag size={20} color={ICON} />} title="KomikStore" sub="Menu spesial Komiku" href="/komikstore" />
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
                  <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>{r.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: MUTED }}>{fmt(r.min)} poin</div>
                </div>
                {current ? <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(255,255,255,.1)', padding: '3px 10px', borderRadius: 99 }}>Dipakai</span> : !open && <Lock size={16} color={MUTED} />}
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
