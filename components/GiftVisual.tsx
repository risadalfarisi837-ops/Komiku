'use client';

import { useEffect, useState } from 'react';
import { WALLPAPER_CATALOG, RARITY_STYLE, wpBg } from '@/lib/wallpapers';
import { EFFECT_CATALOG } from '@/lib/effects';

// Gambar barang untuk animasi hadiah, supaya jelas apa yang didapat.
// type: koin | level | exp | poin | border | wallpaper | effect | premium
export default function GiftVisual({ type, itemKey, photo }: { type: string; itemKey?: string; photo?: string }) {
  const [borders, setBorders] = useState<any>(null);
  useEffect(() => {
    if (type !== 'border') return;
    let alive = true;
    import('@/components/BorderSheet').then((m) => { if (alive) setBorders((m as any).BORDER_CATALOG); }).catch(() => {});
    return () => { alive = false; };
  }, [type]);

  const glow = (c: string) => ({ filter: 'drop-shadow(0 0 14px ' + c + ')' });

  if (type === 'premium') {
    return (
      <svg width={150} height={150} viewBox="0 0 64 64" style={glow('rgba(251,191,36,.8)')} aria-label="Premium">
        <defs><linearGradient id="gvc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff3b0" /><stop offset="1" stopColor="#f59e0b" /></linearGradient></defs>
        <path d="M8 46 L4 18 L20 30 L32 12 L44 30 L60 18 L56 46Z" fill="url(#gvc)" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
        <rect x="8" y="46" width="48" height="8" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
        <circle cx="32" cy="12" r="4" fill="#fff" /><circle cx="4" cy="18" r="3" fill="#fff" /><circle cx="60" cy="18" r="3" fill="#fff" />
        <circle cx="20" cy="50" r="2.4" fill="#ef4444" /><circle cx="32" cy="50" r="2.4" fill="#38bdf8" /><circle cx="44" cy="50" r="2.4" fill="#34d399" />
      </svg>
    );
  }
  if (type === 'koin') {
    return (
      <svg width={140} height={140} viewBox="0 0 64 64" style={glow('rgba(34,211,238,.8)')} aria-label="Crystal">
        <defs><linearGradient id="gvk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e0faff" /><stop offset=".5" stopColor="#38bdf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs>
        <polygon points="32,4 56,22 46,58 18,58 8,22" fill="url(#gvk)" stroke="#e0faff" strokeWidth="2" strokeLinejoin="round" />
        <polyline points="8,22 24,22 32,4 40,22 56,22" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".8" />
        <polyline points="24,22 18,58 32,26 46,58 40,22" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".6" />
      </svg>
    );
  }
  if (type === 'level' || type === 'exp' || type === 'poin') {
    const cfg: any = {
      level: { c1: '#34d399', c2: '#059669', label: 'LEVEL', icon: <path d="M32 14 L46 32 H37 V50 H27 V32 H18Z" fill="#fff" /> },
      exp: { c1: '#a78bfa', c2: '#6d28d9', label: 'EXP', icon: <polygon points="32,12 38,26 54,28 42,39 45,55 32,47 19,55 22,39 10,28 26,26" fill="#fff" /> },
      poin: { c1: '#fbbf24', c2: '#d97706', label: 'POIN', icon: <path d="M20 14h24v10c0 9-6 15-12 16-6-1-12-7-12-16zM20 18h-8c0 8 4 12 10 13M44 18h8c0 8-4 12-10 13M28 42h8v6h6v6H22v-6h6z" fill="#fff" /> },
    }[type];
    return (
      <div style={{ textAlign: 'center' }}>
        <svg width={130} height={130} viewBox="0 0 64 64" style={glow(cfg.c1)} aria-label={cfg.label}>
          <defs><linearGradient id={'gvl' + type} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={cfg.c1} /><stop offset="1" stopColor={cfg.c2} /></linearGradient></defs>
          <circle cx="32" cy="32" r="29" fill={'url(#gvl' + type + ')'} stroke="#fff" strokeWidth="2.5" />
          {cfg.icon}
        </svg>
      </div>
    );
  }
  if (type === 'wallpaper') {
    const w: any = itemKey ? (WALLPAPER_CATALOG as any)[itemKey] : null;
    const st: any = w ? (RARITY_STYLE as any)[w.rarity] : null;
    const bg = w ? (wpBg(itemKey) || w.grad) : 'linear-gradient(135deg,#4c1d95,#1e1b4b)';
    return (
      <div style={{ width: 210, height: 128, borderRadius: 18, background: bg, border: '3px solid ' + (st ? st.border : '#a78bfa'), boxShadow: st && st.glow !== 'none' ? st.glow : '0 8px 30px rgba(0,0,0,.5)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 45%,rgba(0,0,0,.65))' }} />
        {w && <span style={{ position: 'absolute', left: 10, bottom: 8, right: 10, color: st ? st.color : '#fff', fontWeight: 800, fontSize: 14, textShadow: '0 1px 4px #000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.rarity} · {w.nama}</span>}
      </div>
    );
  }
  if (type === 'border') {
    const b: any = itemKey && borders ? borders[itemKey] : null;
    return (
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo || 'https://placehold.co/120/1a1d24/fff?text=?'} alt="" referrerPolicy="no-referrer" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', background: '#1a1d24' }} />
        {b && b.url && <div style={{ position: 'absolute', top: '50%', left: '50%', width: '135%', height: '135%', transform: 'translate(-50%,-50%)', backgroundImage: "url('" + b.url + "')", backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />}
      </div>
    );
  }
  if (type === 'effect') {
    const e: any = itemKey ? (EFFECT_CATALOG as any)[itemKey] : null;
    const c = e ? e.color : '#e0e7ff';
    const c2 = e && e.color2 ? e.color2 : c;
    const icon = e ? { sparkle: '✨', petal: '🌸', firefly: '✦', ember: '🔥', snow: '❄️', rain: '💧' }[e.kind as string] || '✨' : '✨';
    return (
      <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,' + c + ',' + c2 + ' 55%,rgba(0,0,0,.2))', boxShadow: '0 0 40px ' + c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58 }}>{icon}</div>
    );
  }
  return null;
}
