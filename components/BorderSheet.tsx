'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { X, Check, Bell, Pencil, Crown, Gift, Bug, ChevronRight, BookOpen, Flame, Moon, Lock, ShoppingBag } from 'lucide-react';
import { useFavorites, useHistory, useUserStats } from '@/lib/store';
import { currentSeason, RANKS, rankFor, fmt, TARGETS, Track } from '@/lib/season';
import { pushSeasonScore } from '@/lib/leaderboard';

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
          background: '#2A2931', borderRadius: '24px 24px 0 0',
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
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f1c40f' }}>{koin.toLocaleString()} Crystal</span>
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
                background: !preview ? '#2A2931' : 'rgba(255,255,255,0.07)',
                border: 'none', borderRadius: 20, padding: '6px 14px',
                color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer',
              }}
            >
              Tanpa Border
            </button>
            {preview && (
              <button
                onClick={() => onEquip(preview)}
                style={{ background: '#2A2931', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
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
                      <p style={{ color: '#f1c40f', fontSize: 11, fontWeight: 800 }}>{item.harga.toLocaleString()} Crystal</p>
                    </div>
                    <button
                      onClick={() => setConfirm({ key, harga: item.harga })}
                      disabled={!canAfford}
                      style={{
                        background: canAfford ? '#2A2931' : '#2a2d36',
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
            style={{ background: '#2A2931', borderRadius: 24, padding: '28px 24px', width: 300, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Konfirmasi Pembelian</p>
            <p style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>{BORDER_CATALOG[confirm.key]?.nama}</p>
            <p style={{ color: '#f1c40f', fontWeight: 900, fontSize: 18, marginBottom: 20 }}>{confirm.harga.toLocaleString()} Crystal</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)}
                style={{ flex: 1, background: '#2a2d36', border: 'none', borderRadius: 14, padding: '12px 0', color: '#aaa', fontWeight: 800, cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => { onBuy(confirm.key, confirm.harga); setConfirm(null); setTab('owned'); setPreview(confirm.key); }}
                style={{ flex: 1, background: '#2A2931', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 0', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
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

export { BORDER_CATALOG };
export default BorderShopModal;
