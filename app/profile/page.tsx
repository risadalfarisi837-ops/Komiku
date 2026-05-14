'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, LogOut, BookOpen, ShoppingBag, X, Check } from 'lucide-react';
import { useFavorites, useHistory } from '@/lib/store';

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

// ─── Rank System ──────────────────────────────────────────────────────────────
const RANK_TIERS = [
  { name: 'Mortal',      minLvl: 0,     maxLvl: 49,      color: '#9ca3af', icon: '' },
  { name: 'Disciple',    minLvl: 50,    maxLvl: 149,     color: '#cd7f32', icon: '' },
  { name: 'Warrior',     minLvl: 150,   maxLvl: 499,     color: '#bdc3c7', icon: '' },
  { name: 'Cultivator',  minLvl: 500,   maxLvl: 2499,    color: '#f1c40f', icon: '' },
  { name: 'Sword Master',minLvl: 2500,  maxLvl: 4999,    color: '#2ecc71', icon: '' },
  { name: 'Grand Elder', minLvl: 5000,  maxLvl: 9999,    color: '#3498db', icon: '' },
  { name: 'Sect Leader', minLvl: 10000, maxLvl: 19999,   color: '#9b59b6', icon: '' },
  { name: 'Immortal',    minLvl: 20000, maxLvl: Infinity, color: '#ef4444', icon: '' },
];
function getRankInfo(level: number) {
  return RANK_TIERS.find(r => level >= r.minLvl && level <= r.maxLvl) || RANK_TIERS[0];
}
function getShortUid(uid: string) { return '#' + uid.substring(0, 6).toUpperCase(); }
function joinMonthsAgo(ts: number) { return Math.max(1, Math.floor((Date.now() - ts) / (1000*60*60*24*30))); }

// ─── Level Badge (animated, inline styles so Tailwind JIT won't strip) ────────
const LEVEL_BADGE_STYLES: Record<string, React.CSSProperties> = {
  mortal:         { background: 'rgba(168,162,158,0.15)', color: '#a8a29e', border: '1px solid rgba(168,162,158,0.3)' },
  disciple:       { background: 'rgba(180,83,9,0.15)',    color: '#d97706', border: '1px solid rgba(180,83,9,0.3)' },
  warrior:        { background: 'rgba(226,232,240,0.15)', color: '#e2e8f0', border: '1px solid rgba(226,232,240,0.3)' },
  cultivator:     { background: 'rgba(251,191,36,0.15)',  color: '#facc15', border: '1px solid rgba(251,191,36,0.4)' },
  'sword master': { background: 'rgba(16,185,129,0.15)',  color: '#10b981', border: '1px solid rgba(16,185,129,0.4)' },
  'grand elder':  { background: 'rgba(6,182,212,0.25)',   color: '#22d3ee', border: '1px solid #06b6d4', animation: 'pulseGlowCyan 2s infinite alternate' },
  'sect leader':  { background: 'rgba(236,72,153,0.25)',  color: '#f472b6', border: '1px solid #ec4899', animation: 'pulseGlowPink 1.5s infinite alternate' },
  immortal:       { background: 'linear-gradient(90deg,#ef4444,#eab308,#ef4444)', backgroundSize: '200% 100%', color: '#fff', border: 'none', animation: 'shimmerPremium 2s infinite linear, mythicPulse 1s infinite alternate' },
};

function LevelBadge({ level, rank, onClick }: { level: number; rank: typeof RANK_TIERS[0]; onClick: () => void }) {
  const key = rank.name.toLowerCase();
  const style: React.CSSProperties = {
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    letterSpacing: '0.2px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    ...(LEVEL_BADGE_STYLES[key] || LEVEL_BADGE_STYLES.mortal),
  };
  return (
    <button onClick={onClick} style={style}>
      Lvl. {level}
    </button>
  );
}

// ─── Rank Tiers Modal ─────────────────────────────────────────────────────────
function RankModal({ open, onClose, currentLevel }: { open: boolean; onClose: () => void; currentLevel: number }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-[#1A1D24] rounded-t-3xl px-5 pt-5 pb-28 border-t border-white/10 overflow-y-auto"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <h3 className="text-base font-black text-white text-center mb-4">Rank Tiers</h3>
        <div className="space-y-2">
          {RANK_TIERS.map(tier => {
            const isActive = currentLevel >= tier.minLvl && currentLevel <= tier.maxLvl;
            return (
              <div key={tier.name}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${isActive ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/2'}`}
              >
                <div>
                  <p className="text-sm font-black" style={{ color: tier.color }}>{tier.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold">
                    Lvl {tier.minLvl.toLocaleString()} – {tier.maxLvl === Infinity ? '∞' : tier.maxLvl.toLocaleString()}
                  </p>
                </div>
                {isActive && <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded-full">Kamu</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
    if (freeRenameUsed && !canAfford) { alert('Koin tidak cukup! Butuh 500 koin.'); return; }
    setLoading(true);
    try { await onRename(trimmed); onClose(); }
    catch (e: any) { alert('Gagal: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-[#1A1D24] rounded-t-3xl px-5 pt-5 pb-10 border-t border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <h3 className="text-base font-black text-white text-center mb-1">Ganti Nama</h3>
        <p className="text-[11px] text-gray-500 text-center mb-4">
          {freeRenameUsed ? `Gratis sudah dipakai • Biaya: ${RENAME_COST} koin` : '1x gratis tersedia'}
        </p>
        <input
          className="w-full bg-[#0D0D10] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-blue-500 mb-4"
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
            {loading ? '...' : freeRenameUsed ? `Bayar ${RENAME_COST} koin` : 'Simpan Gratis'}
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
function BorderShopModal({
  open, onClose, photoURL, activeBorder, ownedBorders, koin, uid,
  onEquip, onBuy,
}: {
  open: boolean; onClose: () => void;
  photoURL: string; activeBorder: string; ownedBorders: string[]; koin: number; uid: string;
  onEquip: (key: string) => void;
  onBuy: (key: string, harga: number) => void;
}) {
  const [tab, setTab] = useState<'owned'|'shop'>('owned');
  const [confirm, setConfirm] = useState<{ key: string; harga: number } | null>(null);
  const [preview, setPreview] = useState(activeBorder);

  useEffect(() => { setPreview(activeBorder); }, [activeBorder, open]);

  if (!open) return null;

  const shopItems = Object.entries(BORDER_CATALOG).filter(([k]) => !ownedBorders.includes(k));
  const ownedItems = Object.entries(BORDER_CATALOG).filter(([k]) => ownedBorders.includes(k));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1A1D24', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 480, maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
          <span style={{ fontWeight: 900, fontSize: 16, color: '#fff' }}>Ganti Border</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f1c40f' }}>{koin.toLocaleString()} Koin</span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#fff" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0 16px' }}>
          <AvatarWithBorder src={photoURL} size={88} borderKey={preview || undefined} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => { setPreview(''); onEquip(''); }}
              style={{
                background: !preview ? '#1C1F26' : 'rgba(255,255,255,0.07)',
                border: 'none', borderRadius: 20, padding: '6px 14px',
                color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer',
              }}
            >
              Tanpa Border
            </button>
            {preview && (
              <button
                onClick={() => onEquip(preview)}
                style={{ background: '#1C1F26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={12} /> Pakai Ini
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '0 20px' }}>
          {(['owned', 'shop'] as const).map(t => (
            <button
              key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0', fontWeight: 800, fontSize: 13,
                color: tab === t ? '#fff' : '#555',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: tab === t ? '2px solid #9ca3af' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {t === 'owned' ? `Dimiliki (${ownedItems.length})` : `Shop (${shopItems.length})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 32px' }}>
          {tab === 'owned' && (
            ownedItems.length === 0
              ? <p style={{ color: '#555', textAlign: 'center', fontSize: 13, padding: '24px 0' }}>Belum punya border. Beli di Shop!</p>
              : ownedItems.map(([key, item]) => {
                const isActive = activeBorder === key;
                const isPreviewing = preview === key;
                return (
                  <div
                    key={key}
                    onClick={() => setPreview(isPreviewing ? '' : key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: isPreviewing ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isPreviewing ? '#9ca3af' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 16, padding: '12px 14px', marginBottom: 10, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <AvatarWithBorder src={photoURL} size={48} borderKey={key} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{item.nama}</p>
                      <p style={{ color: '#666', fontSize: 11, fontWeight: 700 }}>{item.harga.toLocaleString()}</p>
                    </div>
                    {isActive && (
                      <span style={{ background: 'rgba(59,130,246,0.2)', color: '#9ca3af', fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.4)' }}>AKTIF</span>
                    )}
                  </div>
                );
              })
          )}

          {tab === 'shop' && (
            shopItems.length === 0
              ? <p style={{ color: '#555', textAlign: 'center', fontSize: 13, padding: '24px 0' }}>Semua border sudah dimiliki!</p>
              : shopItems.map(([key, item]) => {
                const canAfford = koin >= item.harga;
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 16, padding: '12px 14px', marginBottom: 10,
                    }}
                  >
                    <AvatarWithBorder src={photoURL} size={48} borderKey={key} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{item.nama}</p>
                      <p style={{ color: '#f1c40f', fontSize: 11, fontWeight: 800 }}>{item.harga.toLocaleString()} Koin</p>
                    </div>
                    <button
                      onClick={() => setConfirm({ key, harga: item.harga })}
                      disabled={!canAfford}
                      style={{
                        background: canAfford ? '#1C1F26' : '#2a2d36',
                        color: canAfford ? '#fff' : '#555',
                        border: 'none', borderRadius: 20, padding: '8px 16px',
                        fontSize: 12, fontWeight: 800, cursor: canAfford ? 'pointer' : 'not-allowed',
                        flexShrink: 0,
                      }}
                    >
                      Beli
                    </button>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Confirm buy modal */}
      {confirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setConfirm(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#1A1D24', borderRadius: 24, padding: '28px 24px', width: 300, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Konfirmasi Pembelian</p>
            <p style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>{BORDER_CATALOG[confirm.key]?.nama}</p>
            <p style={{ color: '#f1c40f', fontWeight: 900, fontSize: 18, marginBottom: 20 }}>{confirm.harga.toLocaleString()} Koin</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)}
                style={{ flex: 1, background: '#2a2d36', border: 'none', borderRadius: 14, padding: '12px 0', color: '#aaa', fontWeight: 800, cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => { onBuy(confirm.key, confirm.harga); setConfirm(null); setTab('owned'); setPreview(confirm.key); }}
                style={{ flex: 1, background: '#1C1F26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 0', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                Beli!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dev Panel ────────────────────────────────────────────────────────────────
function DevPanel({ uid, db, userData, onUpdate }: {
  uid: string; db: any; userData: any; onUpdate: (d: any) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState<'user'|'global'>('user');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{msg:string; type:'success'|'error'}|null>(null);

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

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const applyToUser = async () => {
    const uidInput = targetUid.trim().replace('#','').toUpperCase();
    if (!uidInput) { showToast('UID Target harus diisi!', 'error'); return; }
    setSaving(true);
    try {
      const snap = await db.ref('users').get();
      let targetFullUid: string | null = null;
      snap.forEach((child: any) => {
        if (child.key.toUpperCase() === uidInput || child.key.substring(0,6).toUpperCase() === uidInput) {
          targetFullUid = child.key;
        }
      });
      if (!targetFullUid) { showToast('User tidak ditemukan!', 'error'); setSaving(false); return; }

      const updates: any = {};
      if (uKoin !== '') updates.koin  = parseInt(uKoin);
      if (uRole !== '') updates.role  = uRole;
      if (uLvl  !== '') { updates.level = parseInt(uLvl); if (uExp === '') updates.exp = (parseInt(uLvl)-1)*200; }
      if (uExp  !== '') { updates.exp   = parseInt(uExp);  if (uLvl === '') updates.level = Math.floor(parseInt(uExp)/200)+1; }
      if (Object.keys(updates).length === 0) { showToast('Isi minimal 1 data!', 'error'); setSaving(false); return; }

      await db.ref(`users/${targetFullUid}`).update(updates);
      showToast('Berhasil diterapkan!', 'success');
      setTargetUid(''); setULvl(''); setUExp(''); setUKoin(''); setURole('');
    } catch(e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  const sendGlobal = async () => {
    const val = parseInt(giftVal);
    if (!val || val <= 0) { showToast('Masukkan angka yang benar!', 'error'); return; }
    if (!confirm(`PERINGATAN GLOBAL!\nKirim ${giftType === 'koin' ? val+' Koin' : '+'+val+' Level'} ke SELURUH USER?\n(${giftMsg})`)) return;
    setSaving(true);
    try {
      const snap = await db.ref('users').get();
      const updates: any = {};
      let count = 0;
      snap.forEach((child: any) => {
        const u = child.key; const d = child.val();
        if (giftType === 'koin') updates[`users/${u}/koin`] = (d.koin||0) + val;
        else {
          const newLvl = (d.level||1) + val;
          updates[`users/${u}/level`] = newLvl;
          updates[`users/${u}/exp`]   = (newLvl-1)*200;
        }
        updates[`users/${u}/newGift`] = { from: giftSender, itemName: giftType==='koin'?`${val} Koin`:`+${val} Level`, cat: giftType, isKompensasi: true, timestamp: Date.now() };
        count++;
      });
      await db.ref().update(updates);
      showToast(`Terkirim ke ${count} user!`, 'success');
      setGiftVal('');
    } catch(e: any) { showToast('Gagal: ' + e.message, 'error'); }
    setSaving(false);
  };

  const inputCls = "w-full bg-[#0a0a0a] border border-[#333] rounded-2xl px-4 py-3.5 text-white font-bold focus:outline-none focus:border-blue-500 text-sm box-border";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="badge-dev-anim text-[10px] font-black px-2.5 py-1 rounded-md uppercase active:scale-95 transition-transform"
      >
        DEV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-[#0a0a0a] rounded-t-3xl border-t-2 border-blue-500 flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Toast */}
            {toast && (
              <div className={`absolute top-4 left-4 right-4 z-10 px-4 py-3 rounded-2xl text-sm font-black text-center ${toast.type==='success' ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-white/5 text-gray-400 border border-white/20/30'}`}>
                {toast.msg}
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1a1a1a] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-xl">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.7a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.7z"/></svg>
                </div>
                <h3 className="text-white font-black text-lg">Panel Developer</h3>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-5 pt-4 pb-3 flex-shrink-0">
              <button onClick={() => setTab('user')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${tab==='user' ? 'bg-blue-600 text-white' : 'bg-[#1c1c1e] text-gray-400'}`}
              >Manajemen User</button>
              <button onClick={() => setTab('global')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${tab==='global' ? 'bg-blue-600 text-white' : 'bg-[#1c1c1e] text-gray-400'}`}
              >Global Gift</button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 pb-28">
              {tab === 'user' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-gray-500 font-black uppercase mb-2 ml-1">Target UID</label>
                    <input className={inputCls} value={targetUid} onChange={e=>setTargetUid(e.target.value)} placeholder="#XXXXXX" style={{ fontFamily:'monospace', letterSpacing:'3px', fontSize:'15px' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 font-black uppercase mb-2 ml-1">Set Koin</label>
                      <input className={inputCls} style={{ color:'#facc15' }} value={uKoin} onChange={e=>setUKoin(e.target.value)} type="number" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-400 font-black uppercase mb-2 ml-1">Set Level</label>
                      <input className={inputCls} style={{ color:'#60a5fa' }} value={uLvl} onChange={e=>setULvl(e.target.value)} type="number" placeholder="1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 font-black uppercase mb-2 ml-1">Set EXP</label>
                    <input className={inputCls} value={uExp} onChange={e=>setUExp(e.target.value)} type="number" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 font-black uppercase mb-2 ml-1">Ubah Role</label>
                    <select className={inputCls} value={uRole} onChange={e=>setURole(e.target.value)}>
                      <option value="">-- Biarkan Tetap --</option>
                      <option value="Member">Member (Komiku Biasa)</option>
                      <option value="Komiku Premium">Komiku Premium</option>
                      <option value="Developer">Developer</option>
                    </select>
                  </div>
                  <button onClick={applyToUser} disabled={saving}
                    className="w-full py-4 rounded-2xl font-black text-sm text-white disabled:opacity-50 mt-2"
                    style={{ background:'linear-gradient(135deg,#1C1F26,#2a2d35)', boxShadow:'0 10px 20px rgba(59,130,246,0.3)' }}
                  >{saving ? 'Memproses...' : 'TERAPKAN KE USER'}</button>
                </div>
              )}

              {tab === 'global' && (
                <div className="space-y-3">
                  <div className="bg-blue-500/5 border border-dashed border-blue-500/40 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-gray-500 font-black uppercase mb-2 ml-1">Nama Pengirim</label>
                        <input className={inputCls} value={giftSender} onChange={e=>setGiftSender(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 font-black uppercase mb-2 ml-1">Jenis Hadiah</label>
                        <select className={inputCls} value={giftType} onChange={e=>setGiftType(e.target.value as any)}>
                          <option value="koin">Koin</option>
                          <option value="level">Level Up</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 font-black uppercase mb-2 ml-1">
                        {giftType === 'koin' ? 'Jumlah Koin' : 'Naik Berapa Level'}
                      </label>
                      <input className={inputCls} style={{ color:'#facc15', fontSize:'16px' }} value={giftVal} onChange={e=>setGiftVal(e.target.value)} type="number" placeholder={giftType==='koin'?"Cth: 500":"Cth: 5"} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-400 font-black uppercase mb-2 ml-1">Pesan / Alasan</label>
                      <input className={inputCls} style={{ color:'#60a5fa' }} value={giftMsg} onChange={e=>setGiftMsg(e.target.value)} placeholder="Cth: Server Down" />
                    </div>
                    <button onClick={sendGlobal} disabled={saving}
                      className="w-full py-4 rounded-2xl font-black text-sm text-white disabled:opacity-50"
                      style={{ background:'linear-gradient(135deg,#1C1F26,#2a2d35)', boxShadow:'0 10px 20px rgba(59,130,246,0.3)' }}
                    >{saving ? 'Mengirim...' : 'KIRIM KOMPENSASI GLOBAL'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Tab = 'all' | 'comments' | 'history';
interface UserState { uid: string; displayName: string | null; photoURL: string | null; }

export default function ProfilePage() {
  const { favorites } = useFavorites();
  const { history } = useHistory();
  const [mounted, setMounted]           = useState(false);
  const [user, setUser]                 = useState<UserState | null>(null);
  const [userData, setUserData]         = useState<any>(null);
  const [comments, setComments]         = useState<any[]>([]);
  const [activeTab, setActiveTab]       = useState<Tab>('all');
  const [loadingAuth, setLoadingAuth]   = useState(true);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [borderShopOpen, setBorderShopOpen] = useState(false);
  const [rankModalOpen, setRankModalOpen]   = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const dbRef = useRef<any>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let unsub: any = null;
    getFirebase().then(async ({ auth, db }) => {
      dbRef.current = db;

      // Handle hasil redirect login (misal dari signInWithRedirect)
      try {
        const result = await auth.getRedirectResult();
        // Jika ada result, onAuthStateChanged di bawah akan otomatis terpanggil
        if (result?.user) { /* sudah ditangani oleh listener */ }
      } catch (_) { /* abaikan error redirect */ }

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
        const cSnap = await db.ref('mangaComments').get();
        if (cSnap.exists()) {
          const all: any[] = [];
          cSnap.forEach((mangaNode: any) => {
            mangaNode.forEach((c: any) => {
              const v = c.val();
              if (v.uid === fu.uid) all.push({ id: c.key, ...v });
            });
          });
          setComments(all.sort((a, b) => (b.waktu || 0) - (a.waktu || 0)));
        }
      });
    }).catch(() => setLoadingAuth(false));
    return () => { if (unsub) unsub(); };
  }, []);

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

  const handleLogout = useCallback(async () => {
    if (!confirm('Yakin mau keluar?')) return;
    const { auth } = await getFirebase();
    await auth.signOut();
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
    if (currentKoin < harga) { alert('Koin tidak cukup!'); return; }
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
      if (currentKoin < COST) throw new Error('Koin tidak cukup!');
      await dbRef.current.ref(`users/${user.uid}`).update({ displayName: newName, koin: currentKoin - COST });
      setUserData((prev: any) => ({ ...prev, displayName: newName, koin: currentKoin - COST }));
    } else {
      await dbRef.current.ref(`users/${user.uid}`).update({ displayName: newName, freeRenameUsed: true });
      setUserData((prev: any) => ({ ...prev, displayName: newName, freeRenameUsed: true }));
    }
  }, [user]);

  const level      = userData?.level ?? 1;
  const role       = userData?.role ?? 'Member';
  const rank       = getRankInfo(level);
  const isDev      = role === 'Developer';
  const isPremium  = role === 'Komiku Premium';
  const totalMenit = userData?.menitMenonton ?? 0;
  const joinMonths = userData?.joinedAt ? joinMonthsAgo(userData.joinedAt) : 0;
  const favCount   = mounted ? favorites.length : 0;
  const histCount  = mounted ? history.length : 0;
  const koin       = userData?.koin ?? 0;
  const freeRenameUsed = userData?.freeRenameUsed ?? false;
  const activeBorder = userData?.activeBorder ?? '';
  const ownedBorders = userData?.ownedBorders ? Object.keys(userData.ownedBorders) : [];
  const photoURL   = user?.photoURL || '';

  const renderTab = () => {
    if (activeTab === 'comments') {
      if (!comments.length) return <p className="text-center text-gray-500 text-sm mt-8">Belum ada aktivitas komentar.</p>;
      return comments.map(c => (
        <div key={c.id} className="bg-[#1A1D24] rounded-2xl p-4 border border-white/5 flex gap-3">
          <img src={photoURL || ''} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-semibold mb-1">{c.mangaTitle || 'Komik'}</p>
            <p className="text-sm text-white font-medium leading-snug">{c.teks || c.text}</p>
          </div>
        </div>
      ));
    }
    if (activeTab === 'history') {
      if (!mounted || !history.length) return <p className="text-center text-gray-500 text-sm mt-8">Belum ada riwayat baca.</p>;
      return history.slice(0, 20).map((h, i) => (
        <div key={i} className="bg-[#1A1D24] rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
          <img src={h.mangaThumb} alt="" className="w-16 h-22 rounded-xl object-cover flex-shrink-0" style={{height:'88px', width:'64px'}} />
          <div className="flex-1 min-w-0">
            <p className="text-base text-white font-bold leading-tight line-clamp-2">{h.mangaTitle}</p>
            <p className="text-sm text-gray-300 font-semibold mt-1.5">{h.chapterTitle}</p>
          </div>
        </div>
      ));
    }
    const histItems = mounted ? history.slice(0, 5) : [];
    const favItems  = mounted ? favorites.slice(0, 5) : [];
    if (!histItems.length && !favItems.length) return <p className="text-center text-gray-500 text-sm mt-8">Belum ada aktivitas.</p>;
    return (
      <>
        {histItems.map((h, i) => (
          <div key={i} className="bg-[#1A1D24] rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
            <img src={h.mangaThumb} alt="" className="w-16 rounded-xl object-cover flex-shrink-0" style={{height:'88px', width:'64px'}} />
            <div className="flex-1 min-w-0">
              <p className="text-base text-white font-bold leading-tight line-clamp-2">{h.mangaTitle}</p>
              <p className="text-sm text-gray-300 font-semibold mt-1.5">{h.chapterTitle}</p>
            </div>
          </div>
        ))}
        {favItems.map((f, i) => (
          <div key={i} className="bg-[#1A1D24] rounded-2xl p-3 border border-white/5 flex gap-3 items-center">
            <img src={f.thumb} alt="" className="w-12 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-bold leading-tight line-clamp-2">{f.title}</p>
              <p className="text-xs text-gray-300 font-semibold mt-1">❤ Favorit</p>
            </div>
          </div>
        ))}
      </>
    );
  };

  if (loadingAuth) return (
    <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#0D0D10] flex flex-col pb-28">
      <div className="bg-[#0D0D10]/90 backdrop-blur-md px-6 pt-12 pb-4 sticky top-0 z-30 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">Akun<span className="text-gray-300">.</span></h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="w-24 h-24 rounded-full bg-[#1A1D24] border-2 border-white/10 flex items-center justify-center">
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
    <div className="min-h-screen bg-[#0D0D10] pb-28">
      <style>{`
        @keyframes pulseGlowCyan { 0% { box-shadow:0 0 4px rgba(6,182,212,0.4); } 100% { box-shadow:0 0 14px rgba(6,182,212,0.9); } }
        @keyframes pulseGlowPink { 0% { box-shadow:0 0 4px rgba(236,72,153,0.4); } 100% { box-shadow:0 0 16px rgba(236,72,153,0.9); } }
        @keyframes mythicPulse   { 0% { transform:scale(1);    box-shadow:0 0 8px rgba(239,68,68,0.5); } 100% { transform:scale(1.05); box-shadow:0 0 18px rgba(239,68,68,1); } }
        @keyframes shimmerPremium{ 0% { background-position:100% 0; } 100% { background-position:-100% 0; } }
        @keyframes devPulse      { 0%,100% { transform:scale(1);    box-shadow:0 0 8px rgba(220,38,38,0.6); } 50% { transform:scale(1.06); box-shadow:0 0 16px rgba(239,68,68,1); } }
        .badge-dev-anim { background:linear-gradient(90deg,#9ca3af,#7f1d1d,#9ca3af); background-size:200% 100%; color:#fff; border:1px solid #fca5a5; animation:devPulse 2s infinite ease-in-out, shimmerPremium 3s infinite linear; box-shadow:0 0 10px rgba(220,38,38,0.8); text-shadow:0 0 4px rgba(255,255,255,0.5); padding:3px 10px; border-radius:6px; font-size:10px; font-weight:800; display:inline-flex; align-items:center; letter-spacing:0.2px; text-transform:uppercase; cursor:pointer; }
        .badge-premium-anim { background:linear-gradient(90deg,#2563eb,#06b6d4,#2563eb); background-size:200% 100%; color:#fff; border:none; animation:shimmerPremium 2.5s infinite linear; box-shadow:0 0 8px rgba(59,130,246,0.5); padding:3px 10px; border-radius:6px; font-size:10px; font-weight:800; display:inline-flex; align-items:center; letter-spacing:0.2px; text-transform:uppercase; }
      `}</style>
      {/* Header */}
      <div className="pt-12 pb-6 px-6 flex flex-col items-center text-center relative">
        <button onClick={handleLogout} className="absolute top-12 right-5 p-2 rounded-xl bg-[#1A1D24] border border-white/5 text-gray-400 active:scale-95 transition-all">
          <LogOut className="w-4 h-4" />
        </button>

        {/* Clickable Avatar with border */}
        <div className="mb-1">
          <AvatarWithBorder
            src={photoURL}
            size={90}
            borderKey={activeBorder || undefined}
            onClick={() => setBorderShopOpen(true)}
            showEditHint
          />
        </div>
        <button
          onClick={() => setBorderShopOpen(true)}
          className="flex items-center gap-1.5 text-[11px] text-gray-300 font-bold mb-3 active:opacity-70"
        >
          <ShoppingBag size={11} /> Ganti Border
        </button>

        {/* Name — clickable to rename */}
        <button
          onClick={() => setRenameModalOpen(true)}
          className="mb-2 active:opacity-70"
        >
          <h2 className="text-xl font-black text-white tracking-tight">{userData?.displayName || user.displayName || 'User'}</h2>
        </button>

        {/* Badges */}
        <div className="flex gap-2 justify-center flex-wrap mb-3">
          {isDev && dbRef.current ? (
            <DevPanel
              uid={user.uid}
              db={dbRef.current}
              userData={userData}
              onUpdate={(patch) => setUserData((prev: any) => ({ ...prev, ...patch }))}
            />
          ) : isDev ? (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/20/30 uppercase">DEV</span>
          ) : null}
          {isPremium && !isDev && (
            <span className="badge-premium-anim text-[10px] font-black px-2.5 py-1 rounded-md uppercase">Komiku Premium</span>
          )}
          {!isDev && !isPremium && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10 uppercase">Komiku Biasa</span>
          )}
          <LevelBadge level={level} rank={rank} onClick={() => setRankModalOpen(true)} />
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10 uppercase">{getShortUid(user.uid)}</span>
        </div>

        {/* Stats */}
        <div className="flex w-full justify-around border-t border-b border-white/5 py-4">
          <div className="text-center">
            <p className="text-lg font-black text-white">{totalMenit.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight">menit<br />menonton</p>
          </div>
          <div className="text-center border-l border-r border-white/5 px-4">
            <p className="text-lg font-black text-white">{comments.length}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight">jumlah<br />komentar</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-white">{joinMonths}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight">bulan<br />bergabung</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex border-b border-white/5 mb-4">
          {(['all', 'comments', 'history'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-bold transition-all ${activeTab === tab ? 'text-white border-b-2 border-white/20' : 'text-gray-500'}`}>
              {tab === 'all' ? 'All' : tab === 'comments' ? 'Comments' : 'History'}
            </button>
          ))}
        </div>
        <div className="space-y-3 pb-4">{renderTab()}</div>
      </div>

      {/* Border Shop Modal */}
      <BorderShopModal
        open={borderShopOpen}
        onClose={() => setBorderShopOpen(false)}
        photoURL={photoURL}
        activeBorder={activeBorder}
        ownedBorders={ownedBorders}
        koin={koin}
        uid={user.uid}
        onEquip={handleEquipBorder}
        onBuy={handleBuyBorder}
      />

      {/* Rank Tiers Modal */}
      <RankModal open={rankModalOpen} onClose={() => setRankModalOpen(false)} currentLevel={level} />

      {/* Rename Modal */}
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
